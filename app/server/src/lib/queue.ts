export type DataTask = {
  name: string;
  run: () => Promise<void>;
  schedule: string;
};

type QueuedTask = {
  id: number;
  name: string;
  run: () => Promise<void>;
};

export class TaskQueue {
  private concurrency: number;
  private queue: QueuedTask[];
  private activeCount: number;
  private nextTaskId: number;

  constructor(concurrency: number = 1) {
    this.concurrency = concurrency;
    this.queue = [];
    this.activeCount = 0;
    this.nextTaskId = 1;
  }

  push(name: string, task: () => Promise<void>) {
    return new Promise<void>((resolve, reject) => {
      const taskId = this.nextTaskId++;

      this.queue.push({
        id: taskId,
        name,
        run: async () => {
          const startedAt = Date.now();

          try {
            await task();
            resolve();
          } catch (error) {
            const elapsedMs = Date.now() - startedAt;
            console.error(`[QUEUE] FAIL  #${taskId} ${name} | ${elapsedMs}ms | ${(error as Error).message}`);
            reject(error);
          }
        },
      });

      this.next();
    });
  }

  private async next() {
    if (this.activeCount >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const task = this.queue.shift();
    if (!task) {
      return;
    }

    this.activeCount++;
    try {
      await task.run();
    } catch {
      // task-specific errors are logged in task.run; continue draining queue
    } finally {
      this.activeCount--;
      this.next();
    }
  }
}

export function runFromCron(cron: string, currentMinute: number, currentHour: number): boolean {
  const parts = cron.trim().split(" ");
  if (parts.length !== 5) throw new Error(`Invalid cron schedule: ${cron}`);

  const [min, hour] = parts;

  if (min === "*" && hour === "*") {
    return true; // every minute
  } else if (min.startsWith("*/") && hour === "*") {
    const interval = parseInt(min.substring(2));
    if (isNaN(interval) || interval <= 0) throw new Error(`Invalid minute interval in cron schedule: ${cron}`);
    return currentMinute % interval === 0; // every N minutes
  } else if (min === "0" && hour.startsWith("*/")) {
    const interval = parseInt(hour.substring(2));
    if (isNaN(interval) || interval <= 0) throw new Error(`Invalid minute interval in cron schedule: ${cron}`);
    return currentHour % interval === 0; // every N hours
  } else if (min === "0" && hour === "0") {
    return currentHour === 0 && currentMinute === 0; // every day at midnight
  } else {
    throw new Error(`Unsupported cron schedule: ${cron}`);
  }
}
