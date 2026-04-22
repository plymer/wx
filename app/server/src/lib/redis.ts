import { createClient } from "redis";

export const redisClient = async () => {
  const client = createClient()
    .on("error", (err: Error) => console.error("[API] Redis Client Error\n\n", err.stack))
    .on("connect", () => console.log("[API] Redis client connected"))
    .on("ready", () => console.log("[API] Redis client ready"))
    .on("end", () => console.log("[API] Redis client disconnected"));

  if (!client.isOpen) {
    await client.connect();
  }

  return client;
};
