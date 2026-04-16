import { Effect } from "effect";

import { AlertRepository, Mailer, StormEventRepository, UserRepository } from "@/domain/ports";

export const triggerManualAlert = (userId: string, stormEventId: string) =>
  Effect.gen(function* () {
    const userRepository = yield* UserRepository;
    const stormEventRepository = yield* StormEventRepository;
    const alertRepository = yield* AlertRepository;
    const mailer = yield* Mailer;
    const user = yield* userRepository.findById(userId);
    const storm = yield* stormEventRepository.findById(stormEventId);

    if (!storm) {
      throw new Error("Storm event not found");
    }

    const message = `${storm.eventType.toUpperCase()} ${storm.severity} event near ${storm.city}, ${storm.region} on ${storm.occurredAt}`;

    yield* mailer.send({
      to: user.email,
      subject: `Storm alert for ${user.companyName}`,
      text: message,
    });

    const alert = {
      id: crypto.randomUUID(),
      userId: user.id,
      stormEventId: storm.id,
      channel: "email" as const,
      status: "sent" as const,
      message,
      createdAt: new Date().toISOString(),
    };

    yield* alertRepository.create(alert);

    return alert;
  });
