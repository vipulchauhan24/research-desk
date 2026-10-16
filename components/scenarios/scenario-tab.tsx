import { useMemo, useRef, useState } from "react";
import { useIsDesktop } from "@/components/layout/use-is-desktop";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { todayIso } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import { useCompany } from "@/lib/queries/use-company";
import { useDiscardScenarioDraft } from "@/lib/queries/use-discard-scenario-draft";
import { useSaveScenarioVersion } from "@/lib/queries/use-save-scenario-version";
import { useScenarioDraft } from "@/lib/queries/use-scenario-draft";
import { useScenarioVersion } from "@/lib/queries/use-scenario-version";
import { useScenarioVersions } from "@/lib/queries/use-scenario-versions";
import { useSetScenarioDraft } from "@/lib/queries/use-set-scenario-draft";
import { defaultScenarioDraft, parseScenarioDraft, scenarioToDraft, type ScenarioDraft } from "@/lib/scenarios-form";
import { ScenarioEditor } from "./scenario-editor";
import { ScenarioReadout } from "./scenario-readout";
import { ScenarioStatusBar } from "./scenario-status-bar";
import { useScenarioAutosave } from "./use-scenario-autosave";

// The working copy in the version select: the draft, or the latest saved version when there is no draft.
const CURRENT = "current";

type Confirming = "discard" | "restore" | null;

const versionDate = (createdAt: string) => formatDate(todayIso(new Date(createdAt)));

export function ScenarioTab({ companyId }: { companyId: string }) {
  const isDesktop = useIsDesktop();
  const companyQuery = useCompany(companyId);
  const draftQuery = useScenarioDraft(companyId);
  const versionsQuery = useScenarioVersions(companyId);
  const versions = versionsQuery.data;
  const latest = versions?.[0] ?? null;
  const latestData = useScenarioVersion(latest?.id ?? null);

  // A saved version being previewed (read-only); null means the working copy is open.
  const [viewingId, setViewingId] = useState<string | null>(null);
  const viewed = useScenarioVersion(viewingId);
  // Bumped to reload the editor with fresh content after a restore or discard (the editor reads its content once).
  const [revision, setRevision] = useState(0);
  const [confirming, setConfirming] = useState<Confirming>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  // What is on screen right now, so Save uses the latest edits rather than the last autosaved ones.
  const liveDraft = useRef<ScenarioDraft | null>(null);

  const autosave = useScenarioAutosave({ companyId, basedOnVersion: latest?.version ?? null });
  const setDraft = useSetScenarioDraft();
  const discardDraft = useDiscardScenarioDraft();
  const saveVersion = useSaveScenarioVersion();

  const draft = draftQuery.data;
  // Typing creates the draft, so it counts as existing from the first keystroke, before the first save lands.
  const hasDraft = Boolean(draft) || autosave.status !== "idle";

  const isLoading =
    draftQuery.isPending ||
    versionsQuery.isPending ||
    companyQuery.isPending ||
    (!draft && latest !== null && latestData.isPending);
  // Only the first load blocks the tab. Later fetches (e.g. the version just saved) must not unmount a live editor.
  const [initialised, setInitialised] = useState(false);
  if (!isLoading && !initialised) setInitialised(true);
  const loadFailed = draftQuery.isError || versionsQuery.isError || companyQuery.isError || latestData.isError;

  // The editor starts from the draft, else the latest saved version, else an empty scenario. It reads this once, when
  // it mounts; restoring or discarding changes the draft in the cache, so the remount picks up the new content.
  const startingDraft = useMemo(
    () => draft?.draft ?? (latestData.data ? scenarioToDraft(latestData.data.scenario) : defaultScenarioDraft()),
    [draft, latestData.data],
  );
  const viewedDraft = useMemo(() => (viewed.data ? scenarioToDraft(viewed.data.scenario) : null), [viewed.data]);

  function handleChange(next: ScenarioDraft) {
    liveDraft.current = next;
    autosave.schedule(next);
  }

  async function handleSave() {
    setActionError(null);
    // The draft must be fully written before it is promoted.
    if (!(await autosave.flush())) return setActionError("Couldn't save your latest edits. Try again.");

    const parsed = parseScenarioDraft(liveDraft.current ?? startingDraft);
    if (!parsed.ok) return setActionError(`Can't save yet. ${parsed.message}`);
    try {
      await saveVersion.mutateAsync({ companyId, scenario: parsed.data });
    } catch (error) {
      return setActionError(error instanceof Error ? error.message : "Couldn't save the version.");
    }
    await autosave.cancel();
  }

  async function discard() {
    setActionError(null);
    try {
      await autosave.cancel();
      await discardDraft.mutateAsync(companyId);
      // The editor reads its content once, so the version it falls back to must be loaded before it remounts.
      if (latest && !latestData.data && !(await latestData.refetch()).data) {
        throw new Error("Couldn't load the saved version. Try again.");
      }
      liveDraft.current = null;
      setRevision((current) => current + 1);
      setViewingId(null);
      setConfirming(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Couldn't discard the draft.");
      setConfirming(null);
    }
  }

  async function restore() {
    if (!viewed.data || !viewedDraft) return;
    setActionError(null);
    try {
      await autosave.cancel();
      await setDraft.mutateAsync({ companyId, draft: viewedDraft, basedOnVersion: viewed.data.version });
      liveDraft.current = viewedDraft;
      setRevision((current) => current + 1);
      setViewingId(null);
      setConfirming(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Couldn't restore that version.");
      setConfirming(null);
    }
  }

  if (loadFailed) {
    return (
      <Card>
        <EmptyState
          title="Couldn't load the scenarios"
          description="Check your connection and try again."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                void draftQuery.refetch();
                void versionsQuery.refetch();
                void companyQuery.refetch();
                void latestData.refetch();
              }}
            >
              Retry
            </Button>
          }
        />
      </Card>
    );
  }

  if (isLoading && !initialised) {
    return (
      <Card>
        <p className="px-4 py-10 text-center text-slate-500" role="status">
          Loading scenarios…
        </p>
      </Card>
    );
  }

  if (!isDesktop && !hasDraft && !latest) {
    return (
      <Card>
        <EmptyState title="No scenarios yet" description="Scenarios are written on a desktop." />
      </Card>
    );
  }

  const pricePaise = companyQuery.data?.pricePaise ?? null;
  const previewing = viewingId !== null;
  const viewedVersion = versions?.find((version) => version.id === viewingId);

  // With a draft, the draft is the working copy and every version is listed after it. Without one, the latest
  // version is the working copy.
  const versionItems = [
    ...(hasDraft || !latest ? [{ value: CURRENT, label: hasDraft ? "Draft" : "New scenario" }] : []),
    ...(versions ?? []).map((version, index) => ({
      value: index === 0 && !hasDraft ? CURRENT : version.id,
      label: `v${version.version} · ${versionDate(version.createdAt)}${index === 0 ? " · latest" : ""}`,
    })),
  ];

  return (
    <div className="flex flex-col gap-4">
      <ScenarioStatusBar
        hasDraft={hasDraft}
        status={autosave.status}
        latest={latest}
        versionItems={versionItems}
        selectedVersion={viewingId ?? CURRENT}
        onSelectVersion={(value) => setViewingId(value === CURRENT ? null : value)}
        canEdit={isDesktop}
        saving={saveVersion.isPending}
        onSave={() => void handleSave()}
        onDiscard={() => setConfirming("discard")}
        onRetry={() => void autosave.flush()}
      />
      {actionError && (
        <p role="alert" className="text-red-600">
          {actionError}
        </p>
      )}

      {previewing && viewedVersion && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3">
          <div>
            <span className="font-medium text-slate-900">Viewing v{viewedVersion.version}</span>
            <span className="text-slate-500"> · {versionDate(viewedVersion.createdAt)}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setViewingId(null)}>
              Back to {hasDraft ? "draft" : "current"}
            </Button>
            {isDesktop && (
              <Button size="sm" disabled={!viewed.data} onClick={() => (hasDraft ? setConfirming("restore") : void restore())}>
                Restore to draft
              </Button>
            )}
          </div>
        </div>
      )}

      {/* The live editor stays mounted while a version is previewed, so unsaved typing is never lost. */}
      {isDesktop && (
        <div hidden={previewing} inert={previewing}>
          <ScenarioEditor key={`${companyId}-${revision}`} initial={startingDraft} pricePaise={pricePaise} onChange={handleChange} />
        </div>
      )}
      {!isDesktop && !previewing && <ScenarioReadout key={`current-${revision}`} scenario={startingDraft} pricePaise={pricePaise} />}
      {previewing &&
        (viewedDraft ? (
          <ScenarioReadout key={`view-${viewingId}`} scenario={viewedDraft} pricePaise={pricePaise} />
        ) : viewed.isError ? (
          <Card>
            <EmptyState title="Couldn't load that version" description="Try selecting it again." />
          </Card>
        ) : (
          <Card>
            <p className="px-4 py-10 text-center text-slate-500" role="status">
              Loading version…
            </p>
          </Card>
        ))}

      <ConfirmDialog
        open={confirming === "discard"}
        onOpenChange={(open) => !open && setConfirming(null)}
        title="Discard this draft?"
        description={
          latest
            ? `Your unsaved changes are deleted and the scenarios go back to v${latest.version}.`
            : "Your unsaved changes are deleted and the scenarios go back to empty."
        }
        confirmLabel="Discard draft"
        pending={discardDraft.isPending}
        onConfirm={() => void discard()}
      />
      <ConfirmDialog
        open={confirming === "restore"}
        onOpenChange={(open) => !open && setConfirming(null)}
        title="Replace your draft?"
        description={`Restoring v${viewedVersion?.version ?? ""} replaces the draft with that version. Your unsaved changes are deleted.`}
        confirmLabel="Replace draft"
        pending={setDraft.isPending}
        onConfirm={() => void restore()}
      />
    </div>
  );
}
