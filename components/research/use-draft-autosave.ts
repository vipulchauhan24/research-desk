import type { JSONContent } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSetNoteDraft } from "@/lib/queries/use-set-note-draft";
import { DRAFT_AUTOSAVE_DEBOUNCE_MS } from "@/lib/research";

export type AutosaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

interface Options {
  companyId: string;
  // The saved version the draft is based on, recorded with the draft.
  basedOnVersion: number | null;
}

// Debounced draft saving. Writes are queued one after another so a late save can never land after (and undo)
// a discard or a newer save.
export function useDraftAutosave({ companyId, basedOnVersion }: Options) {
  const { mutateAsync } = useSetNoteDraft();
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pending = useRef<JSONContent | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const lastSaveFailed = useRef(false);
  const basedOn = useRef(basedOnVersion);

  useEffect(() => {
    basedOn.current = basedOnVersion;
  }, [basedOnVersion]);

  const write = useCallback(
    (content: JSONContent) => {
      queue.current = queue.current.then(async () => {
        setStatus("saving");
        try {
          await mutateAsync({ companyId, content, basedOnVersion: basedOn.current });
          lastSaveFailed.current = false;
          setStatus(pending.current ? "pending" : "saved");
        } catch {
          lastSaveFailed.current = true;
          // Keep the content so a retry (or the next edit) writes it, unless something newer has arrived.
          pending.current ??= content;
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
    const content = pending.current;
    pending.current = null;
    if (content) await write(content);
    else await queue.current;
    return !lastSaveFailed.current;
  }, [write]);

  const schedule = useCallback(
    (content: JSONContent) => {
      pending.current = content;
      setStatus("pending");
      clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), DRAFT_AUTOSAVE_DEBOUNCE_MS);
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
