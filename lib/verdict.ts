// Tracker verdicts: how far an actual landed from what was predicted. The one place the bands are defined.
//   variance = (actual − predicted) ÷ predicted
//   Match ±5%, Slight miss 5–10%, Miss beyond 10%

export type Verdict = "Match" | "Slight miss" | "Miss";

export const MATCH_BAND_PCT = 5;
export const SLIGHT_MISS_BAND_PCT = 10;

// In percent. The divisor is the size of the prediction, so a loss predicted at −100 and booked at −90 reads
// as +10% (better than predicted) instead of flipping sign. Null when nothing was predicted.
export function variancePct(predicted: number, actual: number): number | null {
  return predicted === 0 ? null : ((actual - predicted) / Math.abs(predicted)) * 100;
}

// Works on the stored integers (paise or basis points) and compares without dividing, so a variance of exactly
// 5% is a Match and 5.01% is not, whatever float rounding would have said.
export function verdictFor(predicted: number, actual: number): Verdict | null {
  if (predicted === 0) return null;
  const gap = Math.abs(actual - predicted) * 100;
  const size = Math.abs(predicted);
  if (gap <= MATCH_BAND_PCT * size) return "Match";
  if (gap <= SLIGHT_MISS_BAND_PCT * size) return "Slight miss";
  return "Miss";
}
