import { useIsDesktop } from "@/components/layout/use-is-desktop";
import { Card, CardHeader } from "@/components/ui/card";
import { formatRupees } from "@/lib/format";
import { paiseToRupees } from "@/lib/money";
import {
  buyingPriceRows,
  EXIT_HORIZONS,
  type ExitHorizon,
  type StoredExitPrices,
} from "@/lib/valuation-base-case";
import { BuyingPriceTable } from "./buying-price-table";
import { BuyingPriceTitle } from "./buying-price-title";
import { ExitPricesEditor } from "./exit-prices-editor";

interface BuyingPriceCardProps {
  companyId: string;
  saved: StoredExitPrices | null;
  pricePaise: number | null;
}

export function BuyingPriceCard({ companyId, saved, pricePaise }: BuyingPriceCardProps) {
  const isDesktop = useIsDesktop();
  const currentPriceRupees = pricePaise === null ? null : paiseToRupees(pricePaise);

  if (isDesktop) {
    return (
      <Card>
        <ExitPricesEditor companyId={companyId} saved={saved} currentPriceRupees={currentPriceRupees} />
      </Card>
    );
  }

  // Mobile is read-only: the saved exit prices as a sentence, then the same table.
  const exitPrices = Object.fromEntries(
    EXIT_HORIZONS.map((years) => [years, saved ? paiseToRupees(saved[`y${years}`]) : null]),
  ) as Record<ExitHorizon, number | null>;

  return (
    <Card>
      <CardHeader>
        <BuyingPriceTitle />
      </CardHeader>
      <p className="px-4 pt-3 pb-1 text-xs text-slate-500">
        {saved
          ? `Base-case exit price: ${EXIT_HORIZONS.map((years) => `${formatRupees(paiseToRupees(saved[`y${years}`]))} in ${years} yrs`).join(", ")}`
          : "No exit prices entered yet."}
      </p>
      <BuyingPriceTable rows={buyingPriceRows(exitPrices, currentPriceRupees)} />
    </Card>
  );
}
