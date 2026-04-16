import { Context, Effect } from "effect";

export interface MailerPayload {
  readonly to: string;
  readonly subject: string;
  readonly text: string;
}

export interface Mailer {
  readonly send: (payload: MailerPayload) => Effect.Effect<void, Error>;
}

export const Mailer = Context.GenericTag<Mailer>("Mailer");
