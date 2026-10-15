import { useIsDesktop } from "@/components/layout/use-is-desktop";
import { DocumentsCard } from "./documents-card";
import { TrackerCard } from "./tracker-card";

export function DocumentsTab({ companyId }: { companyId: string }) {
  // Mobile is read-only: documents stay openable, the add, edit, delete and summary editing go.
  const canEdit = useIsDesktop();

  return (
    <div className="flex flex-col gap-4">
      <DocumentsCard companyId={companyId} canEdit={canEdit} />
      <TrackerCard companyId={companyId} canEdit={canEdit} />
    </div>
  );
}
