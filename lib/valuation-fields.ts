import { z } from "zod";
import { croreToPaise, paiseToCroreInput, paiseToRupeesInput, rupeesToPaise } from "@/lib/money";

// How a valuation input is typed, validated and stored. Money is stored as integer paise; ratios as plain numbers.
export type FieldKind = "percent" | "multiple" | "crore" | "rupees" | "shares" | "years";

const NUMBER_MESSAGE = "Enter a number";

function withoutCommas(value: string): string {
  return value.replaceAll(",", "");
}

// Validates the typed text, then converts it to what is stored.
function numeric(pattern: RegExp, message: string) {
  return z
    .string()
    .trim()
    .min(1, NUMBER_MESSAGE)
    .transform(withoutCommas)
    .pipe(z.string().regex(pattern, message));
}

const percent = numeric(/^-?\d{1,4}(\.\d{1,4})?$/, NUMBER_MESSAGE)
  .transform(Number)
  .pipe(z.number().min(-100, "Use a percentage from −100 to 1,000").max(1000, "Use a percentage from −100 to 1,000"));

const multiple = numeric(/^\d{1,4}(\.\d{1,2})?$/, "Enter a multiple like 22.4")
  .transform(Number)
  .pipe(z.number().positive("Enter a multiple above zero"));

const signedCrore = numeric(/^-?\d{1,8}(\.\d{1,2})?$/, "Enter an amount in ₹ Cr, up to 2 decimals").transform(croreToPaise);

const positiveCrore = signedCrore.pipe(z.number().positive("Enter an amount above zero"));

const rupees = numeric(/^\d{1,9}(\.\d{1,2})?$/, "Enter a price like 84.50")
  .transform(rupeesToPaise)
  .pipe(z.number().positive("Enter an amount above zero"));

const shares = numeric(/^\d{1,6}(\.\d{1,4})?$/, "Enter a share count in Cr, like 1.80")
  .transform(Number)
  .pipe(z.number().positive("Enter a count above zero"));

const years = numeric(/^\d{1,2}$/, "Enter a whole number of years")
  .transform(Number)
  .pipe(z.number().int().min(1, "Use 1 to 30 years").max(30, "Use 1 to 30 years"));

// Typed text in, number out (integer paise for money), so every field schema can sit in one record.
export function fieldSchema(kind: FieldKind, options: { positive?: boolean } = {}): z.ZodType<number, string> {
  switch (kind) {
    case "percent":
      return percent;
    case "multiple":
      return multiple;
    case "crore":
      return options.positive ? positiveCrore : signedCrore;
    case "rupees":
      return rupees;
    case "shares":
      return shares;
    case "years":
      return years;
  }
}

// Stored value -> text for an input.
export function storedToDraft(kind: FieldKind, stored: number): string {
  switch (kind) {
    case "crore":
      return paiseToCroreInput(stored);
    case "rupees":
      return paiseToRupeesInput(stored);
    default:
      return String(stored);
  }
}

// Text typed so far -> number, or null while it isn't a complete valid value. For live previews, not for saving.
export function draftToLoose(kind: FieldKind, draft: string, options: { positive?: boolean } = {}): number | null {
  const parsed = fieldSchema(kind, options).safeParse(draft);
  return parsed.success ? parsed.data : null;
}
