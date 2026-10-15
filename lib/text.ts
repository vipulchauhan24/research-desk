// Optional text fields are stored as null, never as an empty string.
export function emptyToNull(value: string): string | null {
  return value === "" ? null : value;
}
