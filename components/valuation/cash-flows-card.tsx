import { useIsDesktop } from "@/components/layout/use-is-desktop";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { StoredCashFlows } from "@/lib/valuation-base-case";
import type { DcfKind, DiscountAssumptions } from "@/lib/valuation-cash-flow-table";
import { CashFlowsEditor } from "./cash-flows-editor";
import { CashFlowsReadout } from "./cash-flows-readout";
import { CashFlowsTitle } from "./cash-flows-title";

interface CashFlowsCardProps {
  companyId: string;
  saved: StoredCashFlows | null;
  kind: DcfKind;
  // From the method's saved inputs: the discounting rows are only as current as the last save.
  discount: DiscountAssumptions | null;
}

export function CashFlowsCard({ companyId, saved, kind, discount }: CashFlowsCardProps) {
  const isDesktop = useIsDesktop();

  return (
    <Card>
      {isDesktop ? (
        <CashFlowsEditor companyId={companyId} saved={saved} kind={kind} discount={discount} />
      ) : (
        <>
          <CardHeader>
            <CashFlowsTitle />
          </CardHeader>
          {saved ? (
            <CashFlowsReadout saved={saved} kind={kind} discount={discount} />
          ) : (
            <EmptyState title="No cash flows entered yet" />
          )}
        </>
      )}
    </Card>
  );
}
