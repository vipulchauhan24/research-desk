import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import type { NoteVersionSummary } from "@/lib/queries/use-note-versions";
import type { AutosaveStatus } from "./use-draft-autosave";

interface DraftStatusBarProps {
  hasDraft: boolean;
  status: AutosaveStatus;
  latest: NoteVersionSummary | null;
  // Mobile is read-only: show the state, hide the actions.
  canEdit: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onRetry: () => void;
}

const SAVE_TEXT: Record<AutosaveStatus, string> = {
  idle: "Draft saved",
  pending: "Unsaved changes…",
  saving: "Saving…",
  saved: "Draft saved",
  error: "Couldn't save the draft",
};

export function DraftStatusBar({ hasDraft, status, latest, canEdit, onSave, onDiscard, onRetry }: DraftStatusBarProps) {
  return (
    <div className="flex min-h-9 flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {hasDraft ? (
          <>
            <Badge>Draft</Badge>
            <span role="status" className={status === "error" ? "text-red-600" : "text-slate-500"}>
              {SAVE_TEXT[status]}
            </span>
            {status === "error" && canEdit && (
              <Button variant="ghost" size="sm" onClick={onRetry}>
                Retry
              </Button>
            )}
          </>
        ) : (
          <span className="text-slate-500">
            {latest
              ? `Latest saved: v${latest.version} · ${formatDate(latest.createdAt.slice(0, 10))}`
              : canEdit
                ? "Start typing to write your research. It is saved as a draft."
                : "No research written yet."}
          </span>
        )}
      </div>
      {canEdit && hasDraft && (
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onDiscard}>
            Discard draft
          </Button>
          <Button size="sm" onClick={onSave}>
            Save as new version
          </Button>
        </div>
      )}
    </div>
  );
}
