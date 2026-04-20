// Simple Cache Helper (Currently in-memory, can be replaced with Redis)
const cache = new Map<string, { value: any; expiry: number }>();

export const cacheService = {
  get: async (key: string) => {
    const cached = cache.get(key);
    if (!cached) return null;
    if (Date.now() > cached.expiry) {
      cache.delete(key);
      return null;
    }
    return cached.value;
  },
  
  set: async (key: string, value: any, ttlSeconds: number = 3600) => {
    cache.set(key, {
      value,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  },
  
  del: async (key: string) => {
    cache.delete(key);
  },
  
  clearStore: async (storeId: string) => {
    // In a real Redis implementation, we'd use keys with storeId prefix
    for (const key of cache.keys()) {
      if (key.includes(storeId)) cache.delete(key);
    }
  }
};
