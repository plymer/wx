import { publicProcedure, router } from "../lib/trpc.js";
import * as fs from "fs/promises";
import * as path from "path";
import { HOUR } from "../lib/constants.js";

export const globalMessageRouter = router({
  get: publicProcedure.query(async () => {
    if (!process.env.STATIC_DATA_DIR) {
      throw new Error("STATIC_DATA_DIR environment variable is not set");
    }

    console.log("[API] Fetching global messages from directory:", process.env.STATIC_DATA_DIR);

    const messagesDir = path.join(process.env.STATIC_DATA_DIR, "messages");
    const messageFiles = (await fs.readdir(messagesDir)).reverse();
    const messages = [];
    for (const file of messageFiles) {
      const filePath = path.join(messagesDir, file);
      const content = await fs.readFile(filePath, "utf-8");
      try {
        const messageData = JSON.parse(content) as {
          title: string;
          message: string;
          timestamp: string;
        };
        messages.push(messageData);
      } catch (e) {
        console.error(`Error parsing message file ${file}:`, e);
      }
    }

    const currentMessage = messages.length > 0 ? messages[0] : null;

    const messageNotExpired = currentMessage && new Date(currentMessage.timestamp).getTime() + 4 * HOUR > Date.now();

    const output = messageNotExpired
      ? {
          title: currentMessage.title,
          message: currentMessage.message,
          timestamp: new Date(currentMessage.timestamp),
        }
      : null;

    // for now we just return the first message, but we could easily extend this to support multiple messages or some kind of prioritization logic
    return output;
  }),
});
