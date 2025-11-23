import dotenv from "dotenv";
dotenv.config({ path: "config.env", quiet: true });

import { createClient } from "redis";

const { REDIS_URL, REDIS_CONNECT_TIMEOUT = "5000", NODE_ENV } = process.env;

// Create Redis client (Cloud URL)
const client = createClient({
  url: REDIS_URL,
  socket: { connectTimeout: Number(REDIS_CONNECT_TIMEOUT) },
});

// 🔔 Handle Redis events
client.on("ready", () =>
  console.log(`🟢 Redis Connected (${NODE_ENV.toUpperCase()} environment)`)
);

client.on("error", (err) => console.error("💥 Redis Error:", err.message));

/**
 * Connect Redis safely (non-blocking)
 */
const connectRedis = async () => {
  try {
    if (!REDIS_URL) {
      console.warn("⚠️ Skipping Redis connection (REDIS_URL not provided)");
      return;
    }

    if (!client.isOpen) {
      await client.connect();
    }
  } catch (err) {
    console.error("⚠️ Redis connection failed:", err.message);
    console.warn("🚀 Continuing without Redis cache...");
  }
};

/**
 * Graceful disconnect (used on shutdown)
 */
const disconnectRedis = async () => {
  try {
    if (client.isOpen) {
      await client.quit();
      console.log(`🧹 Redis disconnected gracefully (${NODE_ENV})`);
    }
  } catch (err) {
    console.error("💥 Error during Redis disconnect:", err.message);
    try {
      client.destroy();
      console.warn("⚠️ Redis force-disconnected");
    } catch (e) {
      console.error("💥 Force disconnect failed:", e.message);
    }
  }
};

// Safe non-blocking export
export default client;
export { connectRedis, disconnectRedis };
