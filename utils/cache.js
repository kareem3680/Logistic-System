import LoggerService from "./loggerService.js";
import client from "../config/redisClient.js";

const logger = new LoggerService("cache");

const DEFAULT_TTL = 60 * 60;
const DEFAULT_NAMESPACE = "";

const ENV_PREFIX = process.env.NODE_ENV === "production" ? "prod" : "dev";

const buildKey = (key, namespace = DEFAULT_NAMESPACE) => {
  const nsPart = namespace ? `${namespace}:` : "";
  return `${ENV_PREFIX}:${nsPart}${key}`;
};

const safeStringify = (v) => {
  try {
    return JSON.stringify(v);
  } catch (err) {
    logger.error("JSON stringify error", { message: err.message });
    return null;
  }
};

export const cacheWrapper = async (
  key,
  fetchFn,
  ttl = DEFAULT_TTL,
  options = {}
) => {
  const ns = options.namespace ?? DEFAULT_NAMESPACE;
  const finalKey = buildKey(key, ns);

  try {
    if (!client || !client.isOpen) {
      logger.info("Redis not connected - bypassing cache", { key: finalKey });
      const fresh = await fetchFn();
      return fresh;
    }

    const cached = await client.get(finalKey);
    if (cached) {
      logger.info(`Cache HIT: ${finalKey}`);
      try {
        return JSON.parse(cached);
      } catch (err) {
        logger.error("Cache parse error - deleting corrupt key", {
          key: finalKey,
          message: err.message,
        });
        await client.del(finalKey);
        const fresh = await fetchFn();
        if (fresh !== undefined) {
          await client.setEx(finalKey, ttl, safeStringify(fresh));
        }
        return fresh;
      }
    }

    logger.info(`Cache MISS: ${finalKey}`);
    const result = await fetchFn();

    if (result !== undefined && result !== null) {
      const str = safeStringify(result);
      if (str !== null) {
        await client.setEx(finalKey, ttl, str);
        logger.info(`Cache SET: ${finalKey} (TTL: ${ttl}s)`);
      }
    }

    return result;
  } catch (err) {
    logger.error("Cache wrapper error", {
      key: finalKey,
      message: err.message,
    });

    return fetchFn();
  }
};

export const setCache = async (key, value, ttl = DEFAULT_TTL, options = {}) => {
  const ns = options.namespace ?? DEFAULT_NAMESPACE;
  const finalKey = buildKey(key, ns);

  try {
    if (!client || !client.isOpen) {
      logger.info("Redis not connected - setCache bypassed", { key: finalKey });
      return false;
    }
    const str = safeStringify(value);
    if (str === null) return false;
    await client.setEx(finalKey, ttl, str);
    logger.info(`Cache SET (manual): ${finalKey}`);
    return true;
  } catch (err) {
    logger.error("setCache error", { key: finalKey, message: err.message });
    return false;
  }
};

export const delCache = async (keyPattern, options = {}) => {
  const ns = options.namespace ?? DEFAULT_NAMESPACE;
  const pattern = buildKey(keyPattern, ns);

  try {
    if (!client || !client.isOpen) {
      logger.info("Redis not connected - delCache bypassed", { pattern });
      return 0;
    }

    // Direct delete if no wildcard
    if (!pattern.includes("*")) {
      const res = await client.del(String(pattern));
      logger.info(`Cache DELETED: ${pattern}`);
      return res;
    }

    // Wildcard delete using SCAN + pipeline
    let cursor = "0";
    let totalDeleted = 0;

    do {
      const reply = await client.scan(cursor, { MATCH: pattern, COUNT: 1000 });
      cursor = String(reply.cursor);
      const keys = reply.keys || [];
      if (keys.length) {
        const pipeline = client.multi();
        keys.forEach((k) => pipeline.del(String(k)));
        const results = await pipeline.exec();
        totalDeleted += results.reduce((sum, val) => sum + (val ?? 0), 0);
      }
    } while (cursor !== "0");

    logger.info(`Cache DELETED (pattern): ${pattern}`, {
      deleted: totalDeleted,
    });
    return totalDeleted;
  } catch (err) {
    logger.error("delCache error", { pattern, message: err.message });
    return 0;
  }
};

export const flushCache = async () => {
  try {
    if (!client || !client.isOpen) {
      logger.info("Redis not connected - flushCache bypassed");
      return false;
    }
    await client.flushAll();
    return true;
  } catch (err) {
    logger.error("flushCache error", { message: err.message });
    return false;
  }
};
