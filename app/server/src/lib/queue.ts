export type DataTask = {
  name: string;
  run: () => Promise<void>;
  schedule: string;
  dependsOn?: string[];
  enabled: boolean;
};

type QueuedTask = {
  id: number;
  name: string;
  run: () => Promise<void>;
  dependsOn?: string[];
};

export class TaskQueue {
  private concurrency: number;
  private queue: QueuedTask[];
  private activeCount: number;
  private nextTaskId: number;
  private blockers: Map<string, string[]> | undefined;
  private running = new Set<string>();

  constructor(concurrency: number = 1) {
    this.concurrency = concurrency;
    this.queue = [];
    this.activeCount = 0;
    this.nextTaskId = 1;
  }

  push(name: string, task: () => Promise<void>, enabled: boolean, dependsOn?: string[]) {
    if (!enabled) {
      console.log(`[QUEUE] Skipping disabled task: ${name}`);
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      const taskId = this.nextTaskId++;
      if (dependsOn) {
        if (!this.blockers) this.blockers = new Map<string, string[]>();
        this.blockers.set(name, dependsOn);
      }

      this.queue.push({
        id: taskId,
        name,
        dependsOn,
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
    while (this.activeCount < this.concurrency && this.queue.length > 0) {
      let runnableIndex = -1;

      for (let i = 0; i < this.queue.length; i++) {
        const candidate = this.queue[i];
        const blockers = new Set(this.blockers?.get(candidate.name) ?? []);
        const blocked = [...blockers].some(
          (name) => this.running.has(name) || this.queue.some((t, idx) => idx !== i && t.name === name),
        );

        if (!blocked) {
          runnableIndex = i;
          break;
        }
      }

      if (runnableIndex === -1) {
        return;
      }

      const [task] = this.queue.splice(runnableIndex, 1);
      if (!task) return;

      this.activeCount++;
      this.running.add(task.name);

      task
        .run()
        .catch(() => {
          // task-specific errors are logged in task.run; continue draining queue
        })
        .finally(() => {
          this.activeCount--;
          this.running.delete(task.name);
          this.next();
        });
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
  } else if (Number(min) === 0 && hour.startsWith("*/")) {
    const interval = parseInt(hour.substring(2));
    if (isNaN(interval) || interval <= 0) throw new Error(`Invalid minute interval in cron schedule: ${cron}`);
    return currentHour % interval === 0; // every N hours
  } else if (Number(min) === 0 && Number(hour) === 0) {
    return currentHour === 0 && currentMinute === 0; // every day at midnight
  } else {
    throw new Error(`Unsupported cron schedule: ${cron}`);
  }
}
