import { EditorContent, useEditor, type Editor, type JSONContent } from "@tiptap/react";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { EMPTY_DOC } from "@/lib/research";
import { isValidDoc, researchExtensions } from "./editor-extensions";

interface ResearchEditorProps {
  // Read once when the editor mounts; to load different content, remount with a new key.
  initialContent: JSONContent;
  editable: boolean;
  onChange?: (doc: JSONContent) => void;
  // Gives the tab the live editor (and null on unmount) so it can host the toolbar and outline in its own layout.
  onReady?: (editor: Editor | null) => void;
  // True when a toolbar sits directly above, so the two read as one card.
  attachedToToolbar?: boolean;
}

// Browser-only (Tiptap touches the DOM): always imported through next/dynamic with ssr: false.
export function ResearchEditor({ initialContent, editable, onChange, onReady, attachedToToolbar }: ResearchEditorProps) {
  const valid = isValidDoc(initialContent);

  const editor = useEditor({
    extensions: researchExtensions,
    content: valid ? initialContent : EMPTY_DOC,
    // Never let someone type over content we couldn't read: autosave would overwrite it.
    editable: editable && valid,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "rich-text min-h-[520px] px-8 py-6 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-500",
        "aria-label": "Research note",
      },
    },
    onUpdate: ({ editor: current }) => onChange?.(current.getJSON()),
  });

  useEffect(() => {
    onReady?.(editor);
    return () => onReady?.(null);
  }, [editor, onReady]);

  return (
    <Card className={attachedToToolbar ? "rounded-t-none border-t-0" : undefined}>
      {!valid && (
        <p role="alert" className="border-b border-slate-200 px-4 py-3 text-red-600">
          This note&rsquo;s saved content couldn&rsquo;t be read, so it isn&rsquo;t shown. Earlier saved versions are unaffected.
        </p>
      )}
      <EditorContent editor={editor} />
    </Card>
  );
}
