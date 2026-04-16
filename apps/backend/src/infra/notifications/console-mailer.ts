import { Effect, Layer } from "effect";

import { Mailer, type MailerPayload } from "@/domain/ports";

export const ConsoleMailerLive = Layer.succeed(Mailer, {
  send: (payload: MailerPayload) =>
    Effect.sync(() => {
      console.log("[mailer]", payload);
    }),
});
