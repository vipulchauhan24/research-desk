import type { Editor } from "@tiptap/react";
import { useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { fitHeadings } from "@/lib/research";

const MAX_DOCX_BYTES = 10 * 1024 * 1024;

// Reads a .docx in the browser (nothing is uploaded) and loads it into the editor, which turns it into saved JSON.
export function UploadThesisButton({ editor }: { editor: Editor }) {
  const input = useRef<HTMLInputElement>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);

  function load(content: string) {
    // emitUpdate so the new content is autosaved as the draft like any other edit.
    editor.chain().focus().setContent(content, { emitUpdate: true }).run();
    setHtml(null);
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Clear the input so choosing the same file again still fires a change.
    event.target.value = "";
    if (!file) return;

    setError(null);
    if (!file.name.toLowerCase().endsWith(".docx")) return setError("Choose a Word document (.docx).");
    if (file.size > MAX_DOCX_BYTES) return setError("That file is over 10 MB.");

    setConverting(true);
    try {
      // Loaded on demand: the converter is large and only needed when someone uploads.
      const mammoth = await import("mammoth");
      const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
      const html = fitHeadings(result.value);
      if (editor.isEmpty) load(html);
      else setHtml(html);
    } catch {
      setError("Couldn't read that document. Check it isn't damaged or password-protected.");
    } finally {
      setConverting(false);
    }
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={(event) => void handleFile(event)}
        className="hidden"
        aria-label="Upload thesis document"
        tabIndex={-1}
      />
      <Button variant="secondary" size="sm" onClick={() => input.current?.click()} disabled={converting}>
        {converting ? "Reading…" : "Upload thesis (.docx)"}
      </Button>
      {error && (
        <p role="alert" className="basis-full text-xs text-red-600">
          {error}
        </p>
      )}
      <ConfirmDialog
        open={html !== null}
        onOpenChange={(open) => !open && setHtml(null)}
        title="Replace the note with this document?"
        description="The document replaces what is in the editor. Earlier saved versions are not affected, and images in the document are left out."
        confirmLabel="Replace"
        onConfirm={() => html !== null && load(html)}
      />
    </>
  );
}
