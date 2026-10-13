// Validators produce plain strings (custom/async) or Standard Schema issues (Zod) — show the first message of either.
export function firstErrorMessage(errors: readonly unknown[]): string | undefined {
  for (const error of errors) {
    if (typeof error === "string" && error) return error;
    if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
      return error.message;
    }
  }
  return undefined;
}
