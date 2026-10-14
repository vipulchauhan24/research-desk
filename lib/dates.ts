// Today as YYYY-MM-DD in the user's local calendar. Not toISOString(), which is UTC and would
// date an evening IST entry as yesterday.
export function todayIso(now = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
