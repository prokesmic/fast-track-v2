let store: Record<string, string> = {};

const AsyncStorageMock = {
  setItem: jest.fn(async (key: string, value: string) => {
    store[key] = value;
    return Promise.resolve();
  }),
  getItem: jest.fn(async (key: string) => {
    return Promise.resolve(store[key] || null);
  }),
  removeItem: jest.fn(async (key: string) => {
    delete store[key];
    return Promise.resolve();
  }),
  clear: jest.fn(async () => {
    store = {};
    return Promise.resolve();
  }),
  getAllKeys: jest.fn(async () => {
    return Promise.resolve(Object.keys(store));
  }),
  multiGet: jest.fn(async (keys: string[]) => {
    return Promise.resolve(keys.map((key) => [key, store[key] || null]));
  }),
  multiSet: jest.fn(async (keyValuePairs: [string, string][]) => {
    keyValuePairs.forEach(([key, value]) => {
      store[key] = value;
    });
    return Promise.resolve();
  }),
  multiRemove: jest.fn(async (keys: string[]) => {
    keys.forEach((key) => {
      delete store[key];
    });
    return Promise.resolve();
  }),
  // Helper for tests to reset the store
  __resetStore: () => {
    store = {};
  },
  // Helper for tests to get the store
  __getStore: () => store,
};

export default AsyncStorageMock;
