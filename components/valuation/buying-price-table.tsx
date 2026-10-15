import { DataTable, type Column } from "@/components/ui/data-table";
import { cn } from "@/lib/cn";
import { formatPercent, formatRupees, formatSignedPercent, PLACEHOLDER } from "@/lib/format";
import {
  COMPARISON_HORIZON,
  EXIT_HORIZONS,
  type BuyingPriceRow,
} from "@/lib/valuation-base-case";

const price = (rupees: number | null) => (rupees === null ? PLACEHOLDER : formatRupees(rupees));

const COLUMNS: Column<BuyingPriceRow>[] = [
  {
    key: "cagr",
    header: "Expected CAGR",
    cell: (row) => <span className="font-medium text-slate-900">{formatPercent(row.cagr)}</span>,
  },
  ...EXIT_HORIZONS.map((years) => ({
    key: `buy-${years}`,
    header: `Buy below, ${years} yrs`,
    align: "right" as const,
    cell: (row: BuyingPriceRow) => price(row.buyBelow[years]),
  })),
  {
    key: "versus",
    header: `${COMPARISON_HORIZON}-yr price vs CMP`,
    align: "right",
    // Positive means today's price already clears the target return; text carries the sign, colour only reinforces it.
    cell: (row) =>
      row.versusPricePct === null ? (
        PLACEHOLDER
      ) : (
        <span className={cn(row.versusPricePct >= 0 ? "text-green-600" : "text-red-600")}>
          {formatSignedPercent(row.versusPricePct)}
        </span>
      ),
  },
];

export function BuyingPriceTable({ rows }: { rows: BuyingPriceRow[] }) {
  return <DataTable aria-label="Buying price for expected CAGR" columns={COLUMNS} rows={rows} getRowKey={(row) => String(row.cagr)} />;
}
