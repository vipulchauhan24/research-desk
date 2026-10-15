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

// Real minus sign (U+2212) instead of the hyphen toLocaleString produces.
function trueMinus(text: string): string {
  return text.replace("-", "−");
}

// Indian grouping (12,34,567) with a fixed number of decimals.
export function formatNumber(value: number, decimals: number): string {
  return trueMinus(value.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }));
}

export function formatRupees(rupees: number, decimals = 2): string {
  const text = formatNumber(Math.abs(rupees), decimals);
  return `${rupees < 0 ? "−" : ""}₹${text}`;
}

// "₹ 1,420 Cr", for headline amounts in notes. Table columns say ₹ Cr in the header and use formatNumber.
export function formatCrore(crore: number, decimals = 0): string {
  const text = formatNumber(Math.abs(crore), decimals);
  return `${crore < 0 ? "−" : ""}₹ ${text} Cr`;
}

export function formatPercent(value: number): string {
  return `${formatNumber(value, 1)}%`;
}

// Explicit sign so a gain or loss reads at a glance: +12.4%, −3.2%.
export function formatSignedPercent(value: number): string {
  const text = formatNumber(Math.abs(value), 1);
  return `${value < 0 ? "−" : "+"}${text}%`;
}

export function formatMultiple(value: number): string {
  return `${formatNumber(value, 1)}×`;
}

// 2027 -> "FY27", or "FY27E" for a year still to be reported.
export function formatFiscalYear(year: number, estimate = false): string {
  return `FY${String(year % 100).padStart(2, "0")}${estimate ? "E" : ""}`;
}

// "2026-06-01" -> "Jun 2026", for dates that are only known to the month.
export function formatMonth(iso: string | null | undefined): string {
  if (!iso) return PLACEHOLDER;
  const [year, month] = iso.split("-").map(Number);
  return `${MONTHS[month - 1]} ${year}`;
}

// (2027, 3) -> "Q3 FY27": the fiscal year is named for the year it ends in.
export function formatFiscalQuarter(fiscalYear: number, quarter: number): string {
  return `Q${quarter} ${formatFiscalYear(fiscalYear)}`;
}

// A headline total: whole crores when it is one, otherwise one decimal (₹ 1,420 Cr, ₹ 110.5 Cr).
export function formatCroreHeadline(crore: number): string {
  return formatCrore(crore, Number.isInteger(crore) ? 0 : 1);
}
