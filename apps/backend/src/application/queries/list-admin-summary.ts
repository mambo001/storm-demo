import { Effect } from "effect";

import { AlertRepository, CoverageAreaRepository, StormEventRepository, UserRepository } from "@/domain/ports";

export const listAdminSummary = () =>
  Effect.gen(function* () {
    const userRepository = yield* UserRepository;
    const coverageAreaRepository = yield* CoverageAreaRepository;
    const stormEventRepository = yield* StormEventRepository;
    const alertRepository = yield* AlertRepository;
    const users = yield* userRepository.listAll();
    const coverageAreas = yield* coverageAreaRepository.listAll();
    const storms = yield* stormEventRepository.listRecent(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    );
    const alerts = yield* alertRepository.listRecent();

    return {
      metrics: {
        clients: users.filter((user) => user.role === "client").length,
        admins: users.filter((user) => user.role === "admin").length,
        coverageAreas: coverageAreas.length,
        recentStorms: storms.length,
        alerts: alerts.length,
      },
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        companyName: user.companyName,
        contactName: user.contactName,
        role: user.role,
      })),
      alerts,
      storms,
    };
  });
