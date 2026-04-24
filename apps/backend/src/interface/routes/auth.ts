import { Effect, Schema } from "effect";
import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";

import { login, LoginInput, logout, signUp, SignUpInput } from "@/application/commands";
import { getCurrentUser } from "@/application/queries";
import { runEffect, type AppEnv } from "@/app";
import { getSessionToken, requireAuth } from "@/interface/middleware/auth";

const decodeSignUpInput = Schema.decodeUnknown(SignUpInput);
const decodeLoginInput = Schema.decodeUnknown(LoginInput);

const setSessionCookie = (c: any, token: string) => {
  const isSecure = new URL(c.req.url).protocol === "https:";
  setCookie(c, "stormdemo_session", token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? "None" : "Lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
};

export const authRoutes = new Hono<AppEnv>();

authRoutes.post("/signup", async (c) => {
  const rawBody = await c.req.json();
  const program = Effect.gen(function* () {
    const body = yield* decodeSignUpInput(rawBody);
    return yield* signUp(body);
  });

  const result = await runEffect(c, program);
  setSessionCookie(c, result.token);

  return c.json({ user: result.user, token: result.token }, 201);
});

authRoutes.post("/login", async (c) => {
  const rawBody = await c.req.json();
  const program = Effect.gen(function* () {
    const body = yield* decodeLoginInput(rawBody);
    return yield* login(body);
  });

  const result = await runEffect(c, program);
  setSessionCookie(c, result.token);

  return c.json({ user: result.user, token: result.token });
});

authRoutes.post("/logout", requireAuth, async (c) => {
  const token = getSessionToken(c);

  if (!token) {
    return c.json({ message: "Unauthorized: missing session token" }, 401);
  }

  await runEffect(c, logout(token));
  deleteCookie(c, "stormdemo_session", { path: "/" });

  return c.json({ ok: true });
});

authRoutes.get("/me", requireAuth, async (c) => {
  const token = c.get("sessionToken");
  const user = await runEffect(c, getCurrentUser(token));

  return c.json({ user });
});

authRoutes.get("/debug-session", async (c) => {
  const token = getSessionToken(c) ?? getCookie(c, "stormdemo_session");

  if (!token) {
    return c.json({
      cookiePresent: false,
      bearerPresent: false,
      sessionValid: false,
      user: null,
    });
  }

  try {
    const user = await runEffect(c, getCurrentUser(token));

    return c.json({
      cookiePresent: Boolean(getCookie(c, "stormdemo_session")),
      bearerPresent: Boolean(getSessionToken(c)),
      sessionValid: true,
      user,
    });
  } catch {
    return c.json({
      cookiePresent: Boolean(getCookie(c, "stormdemo_session")),
      bearerPresent: Boolean(getSessionToken(c)),
      sessionValid: false,
      user: null,
    });
  }
});
