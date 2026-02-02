import redisClient from '../config/redis.js';

const CACHE_TTL = 60; // 60 seconds

export const getCache = async (key) => {
  if (!redisClient.isConnected) {
    return null;
  }
  try {
    const cached = await redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    // Silently fail - Redis might not be available
    return null;
  }
};

export const setCache = async (key, value, ttl = CACHE_TTL) => {
  if (!redisClient.isConnected) {
    return;
  }
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    // Silently fail - Redis might not be available
  }
};

export const deleteCache = async (pattern) => {
  if (!redisClient.isConnected) {
    return;
  }
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    // Silently fail - Redis might not be available
  }
};

// Generate cache key for user dashboard
export const getDashboardCacheKey = (userId) => `dashboard:${userId}`;
