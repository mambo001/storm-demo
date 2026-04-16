import { Effect, Layer } from "effect";

import {
  PasswordHasher,
  type PasswordHasher as PasswordHasherService,
} from "@/domain/ports";

const encoder = new TextEncoder();

const toBase64 = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes));

const fromBase64 = (value: string) =>
  Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

const digestPassword = async (password: string, salt: Uint8Array) => {
  const payload = `${toBase64(salt)}:${password}`;
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(payload));

  return new Uint8Array(digest);
};

const passwordHasherLive: PasswordHasherService = {
  hash: (password: string) =>
    Effect.tryPromise({
      try: async () => {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const bits = await digestPassword(password, salt);

        return `${toBase64(salt)}:${toBase64(bits)}`;
      },
      catch: (error) => new Error(String(error)),
    }),
  verify: (password: string, hash: string) =>
    Effect.tryPromise({
      try: async () => {
        const [saltPart, hashPart] = hash.split(":");
        if (!saltPart || !hashPart) {
          return false;
        }

        const salt = fromBase64(saltPart);
        const expected = await digestPassword(password, salt);
        const actual = fromBase64(hashPart);

        if (expected.length !== actual.length) {
          return false;
        }

        let mismatch = 0;
        for (let index = 0; index < expected.length; index += 1) {
          mismatch |= expected[index]! ^ actual[index]!;
        }

        return mismatch === 0;
      },
      catch: (error) => new Error(String(error)),
    }),
};

export const PasswordHasherLive = Layer.succeed(PasswordHasher, passwordHasherLive);
