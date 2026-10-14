const PLACEHOLDER = "—";

// Prices are stored in paise (integers); convert only here, at the display edge.
export function formatPrice(paise: number | null | undefined): string {
  if (paise == null) return PLACEHOLDER;
  return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-10-05" -> "5 Oct 2026". Built from the string parts so the date can't shift with the time zone.
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return PLACEHOLDER;
  const [year, month, day] = iso.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

export { PLACEHOLDER };
