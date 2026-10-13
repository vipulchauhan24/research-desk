const PLACEHOLDER = "—";

// Prices are stored in paise (integers); convert only here, at the display edge.
export function formatPrice(paise: number | null | undefined): string {
  if (paise == null) return PLACEHOLDER;
  return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export { PLACEHOLDER };
