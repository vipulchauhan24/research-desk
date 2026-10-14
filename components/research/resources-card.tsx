import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDeleteResearchLink } from "@/lib/queries/use-delete-research-link";
import { useResearchLinks, type ResearchLink } from "@/lib/queries/use-research-links";
import { linkHost } from "@/lib/research";
import { ResearchLinkDialog } from "./research-link-dialog";

interface ResourcesCardProps {
  companyId: string;
  // Mobile is read-only: links stay clickable, but add/edit/delete are hidden.
  canEdit: boolean;
}

const linkClass =
  "rounded font-medium text-indigo-600 hover:text-indigo-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500";

export function ResourcesCard({ companyId, canEdit }: ResourcesCardProps) {
  const { data: links, isPending, isError, refetch } = useResearchLinks(companyId);
  const deleteLink = useDeleteResearchLink();
  const [dialogOpen, setDialogOpen] = useState(false);
  // null = adding a new link
  const [editing, setEditing] = useState<ResearchLink | null>(null);
  const [deleting, setDeleting] = useState<ResearchLink | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Nothing to read and nothing to add on a phone: leave the space to the note.
  if (!canEdit && !isPending && !isError && links?.length === 0) return null;

  function openDialog(link: ResearchLink | null) {
    setEditing(link);
    setDialogOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteError(null);
    try {
      await deleteLink.mutateAsync({ companyId, id: deleting.id });
      setDeleting(null);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Couldn't delete the link.");
      setDeleting(null);
    }
  }

  return (
    <Card aria-label="Resources" className="mb-4">
      <CardHeader>
        <span>
          Resources
          {links && links.length > 0 && <span className="font-normal text-slate-500"> · {links.length}</span>}
        </span>
        {canEdit && (
          <Button variant="secondary" size="sm" onClick={() => openDialog(null)}>
            Add link
          </Button>
        )}
      </CardHeader>

      {isPending ? (
        <p className="px-4 py-4 text-slate-500" role="status">
          Loading resources…
        </p>
      ) : isError ? (
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <span className="text-red-600">Couldn&rsquo;t load the resources.</span>
          <Button variant="secondary" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : links.length === 0 ? (
        <p className="px-4 py-4 text-slate-500">
          No resources yet. Add links to filings, articles or presentations you rely on for this company.
        </p>
      ) : (
        <ul>
          {links.map((link) => (
            <li
              key={link.id}
              className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-2 last:border-b-0"
            >
              <div className="min-w-0">
                <a href={link.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  {link.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                  <span aria-hidden="true"> ↗</span>
                </a>
                <span className="ml-2 text-xs text-slate-500">{linkHost(link.url)}</span>
              </div>
              {canEdit && (
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="sm" aria-label={`Edit ${link.label}`} onClick={() => openDialog(link)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" aria-label={`Delete ${link.label}`} onClick={() => setDeleting(link)}>
                    Delete
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {deleteError && (
        <p role="alert" className="border-t border-slate-100 px-4 py-2 text-red-600">
          {deleteError}
        </p>
      )}

      <ResearchLinkDialog companyId={companyId} open={dialogOpen} onOpenChange={setDialogOpen} link={editing} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete "${deleting?.label ?? ""}"?`}
        description="The link is removed from this company's resources. The page it points to is not affected."
        pending={deleteLink.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </Card>
  );
}
