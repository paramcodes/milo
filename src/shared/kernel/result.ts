export type ResultError = {
  code: string;
  message: string;
  details?: unknown;
};

export type Result<T, E = ResultError> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: E };

export const Result = {
  success<T>(data: T): Result<T> {
    return { success: true, data };
  },
  failure<T = never>(code: string, message: string, details?: unknown): Result<T> {
    return { success: false, error: { code, message, details } };
  },
};
