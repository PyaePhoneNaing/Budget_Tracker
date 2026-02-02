import { createClient } from 'redis';

let redisClient = null;
let isRedisConnected = false;

// Only create Redis client if REDIS_URL is provided
if (process.env.REDIS_URL) {
  redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 3) {
          console.log('Redis: Max reconnection attempts reached. Continuing without Redis.');
          isRedisConnected = false;
          return new Error('Redis connection failed');
        }
        return Math.min(retries * 100, 3000);
      },
    },
  });

  redisClient.on('error', (err) => {
    // Only log if it's not a connection refused error (Redis not running)
    if (err.code !== 'ECONNREFUSED') {
      console.error('Redis Client Error:', err.message);
    }
    isRedisConnected = false;
  });

  redisClient.on('connect', () => {
    console.log('Redis Client Connected');
    isRedisConnected = true;
  });

  redisClient.on('ready', () => {
    isRedisConnected = true;
  });

  redisClient.on('end', () => {
    isRedisConnected = false;
  });

  // Try to connect, but don't fail if Redis is not available
  redisClient.connect().catch((err) => {
    if (err.code === 'ECONNREFUSED') {
      console.log('Redis not available. Continuing without cache...');
    } else {
      console.error('Failed to connect to Redis:', err.message);
    }
    isRedisConnected = false;
  });
} else {
  console.log('Redis URL not configured. Running without cache...');
}

// Export a wrapper that checks connection status
export default {
  get client() {
    return redisClient;
  },
  get isConnected() {
    return isRedisConnected && redisClient?.isOpen;
  },
  async get(key) {
    if (!this.isConnected) return null;
    try {
      return await redisClient.get(key);
    } catch (error) {
      return null;
    }
  },
  async setEx(key, ttl, value) {
    if (!this.isConnected) return;
    try {
      await redisClient.setEx(key, ttl, value);
    } catch (error) {
      // Silently fail
    }
  },
  async keys(pattern) {
    if (!this.isConnected) return [];
    try {
      return await redisClient.keys(pattern);
    } catch (error) {
      return [];
    }
  },
  async del(keys) {
    if (!this.isConnected) return;
    try {
      await redisClient.del(keys);
    } catch (error) {
      // Silently fail
    }
  },
  async incr(key) {
    if (!this.isConnected) return 0;
    try {
      return await redisClient.incr(key);
    } catch (error) {
      return 0;
    }
  },
  async expire(key, ttl) {
    if (!this.isConnected) return;
    try {
      await redisClient.expire(key, ttl);
    } catch (error) {
      // Silently fail
    }
  },
};
