import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import type { NoteVersionSummary } from "@/lib/queries/use-note-versions";

export interface VersionHistoryProps {
  versions: NoteVersionSummary[];
  // ISO timestamp of the draft's last save, or null when there is no draft.
  draftUpdatedAt: string | null;
  hasDraft: boolean;
  // The saved version being previewed; null means the current (draft or latest) note.
  viewingId: string | null;
  onSelect: (versionId: string | null) => void;
}

const rowClass =
  "block w-full cursor-pointer border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-500";

export function VersionHistory({ versions, draftUpdatedAt, hasDraft, viewingId, onSelect }: VersionHistoryProps) {
  const latestId = versions[0]?.id;

  return (
      <ul>
        {hasDraft && (
          <li>
            <button
              type="button"
              onClick={() => onSelect(null)}
              aria-current={viewingId === null ? "true" : undefined}
              className={cn(rowClass, viewingId === null && "bg-indigo-50 hover:bg-indigo-50")}
            >
              <span className="flex items-center justify-between gap-2">
                <Badge>Draft</Badge>
                {draftUpdatedAt && <span className="text-xs text-slate-500">{formatDate(draftUpdatedAt.slice(0, 10))}</span>}
              </span>
              <span className="mt-1 block text-xs text-slate-500">Not saved as a version yet</span>
            </button>
          </li>
        )}
        {versions.map((version) => {
          // With no draft, the newest saved version is the one open in the editor.
          const selected = viewingId === null ? !hasDraft && version.id === latestId : viewingId === version.id;
          return (
            <li key={version.id}>
              <button
                type="button"
                onClick={() => onSelect(!hasDraft && version.id === latestId ? null : version.id)}
                aria-current={selected ? "true" : undefined}
                className={cn(rowClass, selected && "bg-indigo-50 hover:bg-indigo-50")}
              >
                <span className="flex justify-between gap-2">
                  <span className="font-medium text-slate-900">
                    v{version.version}
                    {!hasDraft && version.id === latestId && " · current"}
                  </span>
                  <span className="text-xs text-slate-500">{formatDate(version.createdAt.slice(0, 10))}</span>
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">{version.changeNote}</span>
              </button>
            </li>
          );
        })}
        {versions.length === 0 && !hasDraft && (
          <li className="px-4 py-6 text-center text-slate-500">No saved versions yet.</li>
        )}
      </ul>
  );
}
