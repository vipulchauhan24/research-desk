import { useIsDesktop } from "@/components/layout/use-is-desktop";
import { CapexCard } from "./capex-card";
import { OrderBookCard } from "./order-book-card";

export function OrderBookTab({ companyId }: { companyId: string }) {
  // Mobile is read-only: the tables stay, the add, edit and delete controls go.
  const canEdit = useIsDesktop();

  return (
    <div className="flex flex-col gap-4">
      <OrderBookCard companyId={companyId} canEdit={canEdit} />
      <CapexCard companyId={companyId} canEdit={canEdit} />
    </div>
  );
}
