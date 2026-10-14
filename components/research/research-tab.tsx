import dynamic from "next/dynamic";
import type { Editor } from "@tiptap/react";
import { useState } from "react";
import { useIsDesktop } from "@/components/layout/use-is-desktop";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { useDiscardNoteDraft } from "@/lib/queries/use-discard-note-draft";
import { useNoteDraft } from "@/lib/queries/use-note-draft";
import { useNoteVersion } from "@/lib/queries/use-note-version";
import { useNoteVersions } from "@/lib/queries/use-note-versions";
import { useSaveNoteVersion } from "@/lib/queries/use-save-note-version";
import { useSetNoteDraft } from "@/lib/queries/use-set-note-draft";
import { EMPTY_DOC } from "@/lib/research";
import { DraftStatusBar } from "./draft-status-bar";
import { ResourcesCard } from "./resources-card";
import { SaveVersionDialog } from "./save-version-dialog";
import { useDraftAutosave } from "./use-draft-autosave";
import { SidePanel } from "./side-panel";

// Tiptap needs the DOM, so the editor is client-only and loaded on demand.
const ResearchEditor = dynamic(() => import("./research-editor").then((module) => module.ResearchEditor), {
  ssr: false,
  loading: () => (
    <Card>
      <p className="px-4 py-10 text-center text-slate-500" role="status">
        Loading editor…
      </p>
    </Card>
  ),
});

// Same reason as the editor: the toolbar reads editor state, so it loads with it. The placeholder keeps the height
// so the page doesn't jump when it arrives.
const EditorToolbar = dynamic(() => import("./editor-toolbar").then((module) => module.EditorToolbar), {
  ssr: false,
  loading: () => <div className="h-12.5 border-b border-slate-200" />,
});

type Confirming = "discard" | "restore" | null;

export function ResearchTab({ companyId }: { companyId: string }) {
  const isDesktop = useIsDesktop();
  const draftQuery = useNoteDraft(companyId);
  const versionsQuery = useNoteVersions(companyId);
  const versions = versionsQuery.data;
  const latest = versions?.[0] ?? null;
  const latestContent = useNoteVersion(latest?.id ?? null);

  // A saved version being previewed (read-only); null means the current note is open for editing.
  const [viewingId, setViewingId] = useState<string | null>(null);
  const viewed = useNoteVersion(viewingId);
  // Bumped to reload the editor with fresh content after a restore or discard (the editor reads its content once).
  const [revision, setRevision] = useState(0);
  const [saveOpen, setSaveOpen] = useState(false);
  const [confirming, setConfirming] = useState<Confirming>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  // The editors on screen, handed up so the toolbar and outline can live in this tab's layout.
  const [liveEditor, setLiveEditor] = useState<Editor | null>(null);
  const [previewEditor, setPreviewEditor] = useState<Editor | null>(null);

  const autosave = useDraftAutosave({ companyId, basedOnVersion: latest?.version ?? null });
  const setDraft = useSetNoteDraft();
  const discardDraft = useDiscardNoteDraft();
  const saveVersion = useSaveNoteVersion();

  const draft = draftQuery.data;
  // Typing creates the draft, so it counts as existing from the first keystroke, before the first save lands.
  const hasDraft = Boolean(draft) || autosave.status !== "idle";

  const isLoading =
    draftQuery.isPending || versionsQuery.isPending || (!draft && latest !== null && latestContent.isPending);
  // Only the first load blocks the tab. Later fetches (e.g. the version just saved) must not unmount a live editor.
  const [initialised, setInitialised] = useState(false);
  if (!isLoading && !initialised) setInitialised(true);
  const loadFailed = draftQuery.isError || versionsQuery.isError || latestContent.isError;

  async function handleSave(changeNote: string): Promise<string | null> {
    // The draft must be fully written before it is promoted.
    if (!(await autosave.flush())) return "Couldn't save your latest edits. Try again.";
    try {
      await saveVersion.mutateAsync({ companyId, changeNote });
    } catch (error) {
      return error instanceof Error ? error.message : "Couldn't save the version.";
    }
    await autosave.cancel();
    setSaveOpen(false);
    return null;
  }

  async function discard() {
    setActionError(null);
    try {
      await autosave.cancel();
      await discardDraft.mutateAsync(companyId);
      // The editor reads its content once, so the version it falls back to must be loaded before it remounts.
      if (latest && !latestContent.data && !(await latestContent.refetch()).data) {
        throw new Error("Couldn't load the saved version. Try again.");
      }
      setRevision((current) => current + 1);
      setViewingId(null);
      setConfirming(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Couldn't discard the draft.");
      setConfirming(null);
    }
  }

  async function restore() {
    if (!viewed.data) return;
    setActionError(null);
    try {
      await autosave.cancel();
      await setDraft.mutateAsync({ companyId, content: viewed.data.content, basedOnVersion: viewed.data.version });
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
          title="Couldn't load the research note"
          description="Check your connection and try again."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                void draftQuery.refetch();
                void versionsQuery.refetch();
                void latestContent.refetch();
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
          Loading research…
        </p>
      </Card>
    );
  }

  const currentContent = draft?.content ?? latestContent.data?.content ?? EMPTY_DOC;
  const viewedVersion = versions?.find((version) => version.id === viewingId);
  const previewing = viewingId !== null;

  const showToolbar = isDesktop && !previewing && liveEditor !== null;

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_280px] md:items-start">
      <div className="min-w-0">
        {/* mb-4 keeps the sticky block's -mt-4 below from pulling it up over this card. */}
        <ResourcesCard companyId={companyId} canEdit={isDesktop} />
        {/* Pinned to the top of the screen so Save, the draft status and the toolbar stay reachable in a long note.
            pt-4 lines the content up with the side panel (which pins at top-4); -mt-4 cancels it at rest. */}
        <div className={cn("sticky top-0 z-10 -mt-4 flex flex-col gap-3 bg-slate-50 pt-4", !showToolbar && "pb-3")}>
          <DraftStatusBar
            hasDraft={hasDraft}
            status={autosave.status}
            latest={latest}
            canEdit={isDesktop}
            onSave={() => setSaveOpen(true)}
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
                <span className="text-slate-500">
                  {" "}
                  · {formatDate(viewedVersion.createdAt.slice(0, 10))} · {viewedVersion.changeNote}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setViewingId(null)}>
                  Back to {hasDraft ? "draft" : "current"}
                </Button>
                {isDesktop && (
                  <Button
                    size="sm"
                    disabled={!viewed.data}
                    onClick={() => (hasDraft ? setConfirming("restore") : void restore())}
                  >
                    Restore to draft
                  </Button>
                )}
              </div>
            </div>
          )}

          {showToolbar && (
            <Card className="rounded-b-none">
              <EditorToolbar editor={liveEditor} />
            </Card>
          )}
        </div>

        {/* The live editor stays mounted while a version is previewed, so unsaved typing is never lost. */}
        <div hidden={previewing} inert={previewing}>
          <ResearchEditor
            key={`${companyId}-${revision}`}
            initialContent={currentContent}
            editable={isDesktop}
            onChange={autosave.schedule}
            onReady={setLiveEditor}
            attachedToToolbar={showToolbar}
          />
        </div>
        {previewing &&
          (viewed.data ? (
            <ResearchEditor
              key={`view-${viewingId}`}
              initialContent={viewed.data.content}
              editable={false}
              onReady={setPreviewEditor}
            />
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
      </div>

      {isDesktop && (
        <SidePanel
          versions={versions ?? []}
          hasDraft={hasDraft}
          draftUpdatedAt={draft?.updatedAt ?? null}
          viewingId={viewingId}
          onSelect={setViewingId}
          outlineEditor={previewing ? previewEditor : liveEditor}
        />
      )}

      <SaveVersionDialog open={saveOpen} onOpenChange={setSaveOpen} onSave={handleSave} />
      <ConfirmDialog
        open={confirming === "discard"}
        onOpenChange={(open) => !open && setConfirming(null)}
        title="Discard this draft?"
        description={
          latest
            ? `Your unsaved changes are deleted and the note goes back to v${latest.version}.`
            : "Your unsaved changes are deleted and the note goes back to empty."
        }
        confirmLabel="Discard draft"
        pending={discardDraft.isPending}
        onConfirm={() => void discard()}
      />
      <ConfirmDialog
        open={confirming === "restore"}
        onOpenChange={(open) => !open && setConfirming(null)}
        title="Replace your draft?"
        description={`Restoring v${viewedVersion?.version ?? ""} replaces the draft with that version's content. Your unsaved changes are deleted.`}
        confirmLabel="Replace draft"
        pending={setDraft.isPending}
        onConfirm={() => void restore()}
      />
    </div>
  );
}
