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

// Valuation amounts are typed in ₹ Cr (1 Cr = 1,00,00,000 rupees = 1,000,000,000 paise) and stored as integer paise.
const PAISE_PER_CRORE = 1_000_000_000;
const PAISE_PER_CRORE_HUNDREDTH = PAISE_PER_CRORE / 100;

// Signed ("-24.5"), up to 2 decimals. Parsed from the string so no float rounding touches the stored amount.
export function croreToPaise(crore: string): number {
  const text = crore.replaceAll(",", "").trim();
  const negative = text.startsWith("-");
  const [whole = "0", fraction = ""] = text.replace(/^[-+]/, "").split(".");
  const hundredths = fraction.padEnd(2, "0").slice(0, 2);
  const paise = Number(whole) * PAISE_PER_CRORE + Number(hundredths) * PAISE_PER_CRORE_HUNDREDTH;
  return negative ? -paise : paise;
}

// "118.5" rather than "118.50": editable text that re-parses to the same paise.
export function paiseToCroreInput(paise: number): string {
  const sign = paise < 0 ? "-" : "";
  const hundredths = Math.round(Math.abs(paise) / PAISE_PER_CRORE_HUNDREDTH);
  const whole = Math.floor(hundredths / 100);
  const fraction = String(hundredths % 100).padStart(2, "0").replace(/0+$/, "");
  return `${sign}${whole}${fraction ? `.${fraction}` : ""}`;
}

// Maths on valuation inputs works in ₹ Cr; this is the only place the stored paise leave their integer form.
export function paiseToCrore(paise: number): number {
  return paise / PAISE_PER_CRORE;
}

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

// Percentages in the tracker (OPM and the like) are stored as integer basis points, hundredths of a percent:
// 18.4% -> 1840. Same reason as paise: no float ever holds a stored value.
const BASIS_POINTS_PER_PERCENT = 100;

// Signed ("-3.5"), up to 2 decimals.
export function percentToBasisPoints(percent: string): number {
  const text = percent.replaceAll(",", "").trim();
  const negative = text.startsWith("-");
  const [whole = "0", fraction = ""] = text.replace(/^[-+]/, "").split(".");
  const basisPoints = Number(whole) * BASIS_POINTS_PER_PERCENT + Number(fraction.padEnd(2, "0").slice(0, 2));
  return negative ? -basisPoints : basisPoints;
}

export function basisPointsToPercentInput(basisPoints: number): string {
  const sign = basisPoints < 0 ? "-" : "";
  const abs = Math.abs(basisPoints);
  const whole = Math.floor(abs / BASIS_POINTS_PER_PERCENT);
  const fraction = String(abs % BASIS_POINTS_PER_PERCENT).padStart(2, "0").replace(/0+$/, "");
  return `${sign}${whole}${fraction ? `.${fraction}` : ""}`;
}

export function basisPointsToPercent(basisPoints: number): number {
  return basisPoints / BASIS_POINTS_PER_PERCENT;
}
