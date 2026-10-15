import { z } from "zod";

// Typed as "Q3 FY27"; FY27 is the year ending March 2027.
export const fiscalQuarterSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^Q[1-4] FY\d{2}$/, "Use a quarter like Q3 FY27")
  .transform((value) => ({ quarter: Number(value[1]), fiscalYear: 2000 + Number(value.slice(-2)) }));
