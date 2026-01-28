# Home Screen Widgets

This document describes how to implement home screen widgets for FastTrack.

## Overview

The app provides a widget data layer (`client/lib/widgetData.ts`) that prepares fasting data for widgets. Native widget implementations need to be added separately.

## Data Structure

Widgets receive the following data:

```typescript
interface WidgetData {
  isActiveFast: boolean;
  fastStartTime: number | null;
  targetDuration: number | null;
  planName: string | null;
  elapsedHours: number;
  progressPercent: number;
  remainingHours: number;
  currentStreak: number;
  totalFasts: number;
  lastFastDate: string | null;
  lastUpdated: number;
}
```

## iOS Implementation

### Requirements

1. **App Groups**: Already configured in `app.json`:
   ```json
   "com.apple.security.application-groups": ["group.com.fasttrack.app"]
   ```

2. **Widget Extension**: Create a new Widget target in Xcode

### Steps

1. Create a new Widget Extension target in Xcode
2. Use SwiftUI for the widget UI
3. Read data from the shared App Groups container:

```swift
// Widget/FastTrackWidget.swift
import WidgetKit
import SwiftUI

struct FastTrackEntry: TimelineEntry {
    let date: Date
    let isActiveFast: Bool
    let progressPercent: Int
    let remainingHours: Double
    let streak: Int
}

struct Provider: TimelineProvider {
    func getSnapshot(in context: Context, completion: @escaping (FastTrackEntry) -> Void) {
        let entry = readWidgetData() ?? defaultEntry()
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<FastTrackEntry>) -> Void) {
        let entry = readWidgetData() ?? defaultEntry()
        // Refresh every 15 minutes during active fast
        let refreshDate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(refreshDate))
        completion(timeline)
    }

    private func readWidgetData() -> FastTrackEntry? {
        let defaults = UserDefaults(suiteName: "group.com.fasttrack.app")
        guard let data = defaults?.string(forKey: "fast_track_widget_data"),
              let jsonData = data.data(using: .utf8),
              let widget = try? JSONDecoder().decode(WidgetData.self, from: jsonData) else {
            return nil
        }
        return FastTrackEntry(
            date: Date(),
            isActiveFast: widget.isActiveFast,
            progressPercent: widget.progressPercent,
            remainingHours: widget.remainingHours,
            streak: widget.currentStreak
        )
    }
}

struct FastTrackWidgetView: View {
    let entry: FastTrackEntry

    var body: some View {
        VStack {
            if entry.isActiveFast {
                // Circular progress
                ZStack {
                    Circle()
                        .stroke(lineWidth: 8)
                        .opacity(0.3)
                        .foregroundColor(.teal)

                    Circle()
                        .trim(from: 0.0, to: CGFloat(entry.progressPercent) / 100)
                        .stroke(style: StrokeStyle(lineWidth: 8, lineCap: .round))
                        .foregroundColor(.teal)
                        .rotationEffect(Angle(degrees: -90))

                    VStack {
                        Text("\(entry.progressPercent)%")
                            .font(.title2)
                            .bold()
                        Text("\(String(format: "%.1f", entry.remainingHours))h left")
                            .font(.caption)
                    }
                }
            } else {
                Image(systemName: "fork.knife")
                    .font(.largeTitle)
                Text("Start a fast")
                    .font(.caption)
            }

            HStack {
                Image(systemName: "flame.fill")
                Text("\(entry.streak) day streak")
                    .font(.caption2)
            }
        }
        .padding()
    }
}

@main
struct FastTrackWidget: Widget {
    let kind: String = "FastTrackWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            FastTrackWidgetView(entry: entry)
        }
        .configurationDisplayName("Fasting Progress")
        .description("Track your current fast at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
```

## Android Implementation

### Requirements

1. **AppWidgetProvider**: Create widget receiver
2. **SharedPreferences**: Access widget data

### Steps

1. Create `app/src/main/java/com/fasttrack/app/FastTrackWidget.kt`:

```kotlin
// FastTrackWidget.kt
package com.fasttrack.app

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import org.json.JSONObject

class FastTrackWidget : AppWidgetProvider() {
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val prefs = context.getSharedPreferences("fast_track_widget", Context.MODE_PRIVATE)
        val dataStr = prefs.getString("fast_track_widget_data", null)

        val views = RemoteViews(context.packageName, R.layout.fast_track_widget)

        if (dataStr != null) {
            val data = JSONObject(dataStr)
            val isActive = data.getBoolean("isActiveFast")
            val progress = data.getInt("progressPercent")
            val streak = data.getInt("currentStreak")

            if (isActive) {
                views.setTextViewText(R.id.progress_text, "$progress%")
                views.setProgressBar(R.id.progress_bar, 100, progress, false)
            }
            views.setTextViewText(R.id.streak_text, "$streak day streak")
        }

        appWidgetManager.updateAppWidget(appWidgetId, views)
    }
}
```

2. Create widget layout `app/src/main/res/layout/fast_track_widget.xml`

3. Register in `AndroidManifest.xml`:

```xml
<receiver android:name=".FastTrackWidget">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
    </intent-filter>
    <meta-data
        android:name="android.appwidget.provider"
        android:resource="@xml/fast_track_widget_info" />
</receiver>
```

## Native Module Bridge

To call widget updates from React Native, create a native module:

### iOS

```swift
// FastTrackWidgetModule.swift
import WidgetKit

@objc(FastTrackWidgetModule)
class FastTrackWidgetModule: NSObject {
    @objc
    func updateWidgetData(_ data: String) {
        let defaults = UserDefaults(suiteName: "group.com.fasttrack.app")
        defaults?.set(data, forKey: "fast_track_widget_data")

        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }
    }

    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
}
```

### Android

```kotlin
// FastTrackWidgetModule.kt
class FastTrackWidgetModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "FastTrackWidgetModule"

    @ReactMethod
    fun updateWidgetData(data: String) {
        val prefs = reactApplicationContext
            .getSharedPreferences("fast_track_widget", Context.MODE_PRIVATE)
        prefs.edit().putString("fast_track_widget_data", data).apply()

        // Trigger widget update
        val intent = Intent(reactApplicationContext, FastTrackWidget::class.java)
        intent.action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
        reactApplicationContext.sendBroadcast(intent)
    }
}
```

## Usage in React Native

Once native modules are implemented:

```typescript
import { NativeModules } from 'react-native';

const { FastTrackWidgetModule } = NativeModules;

export async function updateNativeWidget(data: WidgetData) {
  if (FastTrackWidgetModule) {
    FastTrackWidgetModule.updateWidgetData(JSON.stringify(data));
  }
}
```

## Building with EAS

To include widgets in your builds:

1. Use EAS Build with custom native code:
   ```bash
   eas build --platform ios
   eas build --platform android
   ```

2. Or eject to bare workflow:
   ```bash
   npx expo prebuild
   ```
   Then add widget targets manually in Xcode/Android Studio.
