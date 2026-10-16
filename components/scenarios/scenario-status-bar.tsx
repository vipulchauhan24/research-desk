import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, type SelectOption } from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import type { ScenarioVersionSummary } from "@/lib/queries/use-scenario-versions";
import type { AutosaveStatus } from "./use-scenario-autosave";

interface ScenarioStatusBarProps {
  hasDraft: boolean;
  status: AutosaveStatus;
  latest: ScenarioVersionSummary | null;
  versionItems: SelectOption[];
  // The version being viewed, or "current" for the working copy.
  selectedVersion: string;
  onSelectVersion: (value: string) => void;
  // Mobile is read-only: show the state and the version select, hide the actions.
  canEdit: boolean;
  saving: boolean;
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

export function ScenarioStatusBar({
  hasDraft,
  status,
  latest,
  versionItems,
  selectedVersion,
  onSelectVersion,
  canEdit,
  saving,
  onSave,
  onDiscard,
  onRetry,
}: ScenarioStatusBarProps) {
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
                ? "Fill in the grid below. It is saved as a draft."
                : "No scenarios written yet."}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          aria-label="Version"
          className="w-56 max-md:h-11"
          items={versionItems}
          value={selectedVersion}
          onValueChange={(value) => value && onSelectVersion(value)}
        />
        {canEdit && hasDraft && (
          <>
            <Button variant="secondary" onClick={onDiscard} disabled={saving}>
              Discard draft
            </Button>
            <Button onClick={onSave} disabled={saving}>
              {saving ? "Saving…" : "Save as new version"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
