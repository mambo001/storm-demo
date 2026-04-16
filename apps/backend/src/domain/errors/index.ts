export class DatabaseError extends Error {
  readonly _tag = "DatabaseError";
}

export class AuthenticationError extends Error {
  readonly _tag = "AuthenticationError";
}

export class ConflictError extends Error {
  readonly _tag = "ConflictError";
}

export class NotFoundError extends Error {
  readonly _tag = "NotFoundError";
}
