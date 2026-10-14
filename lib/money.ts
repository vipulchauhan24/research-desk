// Prices are stored as integer paise. These helpers convert to and from what the user types,
// working on the decimal string so no floating-point rounding can touch a stored amount.

const MAX_PAISE_DIGITS_AFTER_POINT = 2;

export function rupeesToPaise(rupees: string): number {
  const [whole = "0", fraction = ""] = rupees.replaceAll(",", "").trim().split(".");
  const paise = fraction.padEnd(MAX_PAISE_DIGITS_AFTER_POINT, "0").slice(0, MAX_PAISE_DIGITS_AFTER_POINT);
  return Number(whole) * 100 + Number(paise);
}

// Plain "1284.50" (no grouping) so it can sit in an editable input and re-parse unchanged.
export function paiseToRupeesInput(paise: number | null): string {
  if (paise == null) return "";
  const whole = Math.floor(paise / 100);
  const fraction = String(paise % 100).padStart(2, "0");
  return `${whole}.${fraction}`;
}
