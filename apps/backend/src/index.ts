import app from "@/app";
import { handleQueue } from "@/interface/queue/send-alert";
import { handleScheduled } from "@/interface/scheduled/ingest-storms";

export default {
  fetch: app.fetch,
  scheduled: async (_controller: ScheduledController, env: Parameters<typeof handleScheduled>[0]) => {
    await handleScheduled(env);
  },
  queue: async (_batch: MessageBatch<unknown>, _env: unknown, _ctx: ExecutionContext) => {
    await handleQueue();
  },
};
