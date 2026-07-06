import { createClient } from "redis";

export const redisClient = async (context: string) => {
  const client = createClient()
    .on("error", (err: Error) => console.error(`[${context.toUpperCase()}] Redis Client Error\n\n`, err.stack))
    .on("connect", () => console.log(`[${context.toUpperCase()}] Redis client connected`))
    .on("ready", () => console.log(`[${context.toUpperCase()}] Redis client ready`))
    .on("end", () => console.log(`[${context.toUpperCase()}] Redis client disconnected`));

  if (!client.isOpen) {
    await client.connect();
  }

  return client;
};
