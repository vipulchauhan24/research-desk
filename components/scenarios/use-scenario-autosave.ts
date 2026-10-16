import { useCallback, useEffect, useRef, useState } from "react";
import { useSetScenarioDraft } from "@/lib/queries/use-set-scenario-draft";
import type { ScenarioDraft } from "@/lib/scenarios-form";

export type AutosaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

// Long enough not to save per keystroke, short enough to lose little on a crash.
const AUTOSAVE_DEBOUNCE_MS = 1500;

interface Options {
  companyId: string;
  // The saved version the draft is based on, recorded with the draft.
  basedOnVersion: number | null;
}

// Debounced draft saving. Writes are queued one after another so a late save can never land after (and undo)
// a discard or a newer save.
export function useScenarioAutosave({ companyId, basedOnVersion }: Options) {
  const { mutateAsync } = useSetScenarioDraft();
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pending = useRef<ScenarioDraft | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const lastSaveFailed = useRef(false);
  const basedOn = useRef(basedOnVersion);

  useEffect(() => {
    basedOn.current = basedOnVersion;
  }, [basedOnVersion]);

  const write = useCallback(
    (draft: ScenarioDraft) => {
      queue.current = queue.current.then(async () => {
        setStatus("saving");
        try {
          await mutateAsync({ companyId, draft, basedOnVersion: basedOn.current });
          lastSaveFailed.current = false;
          setStatus(pending.current ? "pending" : "saved");
        } catch {
          lastSaveFailed.current = true;
          // Keep the draft so a retry (or the next edit) writes it, unless something newer has arrived.
          pending.current ??= draft;
          setStatus("error");
        }
      });
      return queue.current;
    },
    [companyId, mutateAsync],
  );

  // Writes any waiting edit now. Resolves true when everything is saved.
  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    const draft = pending.current;
    pending.current = null;
    if (draft) await write(draft);
    else await queue.current;
    return !lastSaveFailed.current;
  }, [write]);

  const schedule = useCallback(
    (draft: ScenarioDraft) => {
      pending.current = draft;
      setStatus("pending");
      clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), AUTOSAVE_DEBOUNCE_MS);
    },
    [flush],
  );

  // Drops waiting edits (used before discarding or replacing the draft) and waits for any write already in flight.
  const cancel = useCallback(async () => {
    clearTimeout(timer.current);
    pending.current = null;
    await queue.current;
    lastSaveFailed.current = false;
    setStatus("idle");
  }, []);

  // Don't lose the last edits when leaving the tab or hiding the page.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      void flush();
    };
  }, [flush]);

  return { status, schedule, flush, cancel };
}
