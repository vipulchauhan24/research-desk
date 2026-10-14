import { useEditorState, type Editor } from "@tiptap/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { LinkDialog } from "./link-dialog";
import { UploadThesisButton } from "./upload-thesis-button";

interface ToolbarButtonProps {
  label: string;
  children: string;
  pressed?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function ToolbarButton({ label, children, pressed, disabled, onClick }: ToolbarButtonProps) {
  return (
    <Button
      variant="ghost"
      size="toolbar"
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      // Keep the editor's selection when the button is pressed.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(pressed && "bg-indigo-50 text-indigo-700")}
    >
      {children}
    </Button>
  );
}

export function EditorToolbar({ editor }: { editor: Editor }) {
  const [linkOpen, setLinkOpen] = useState(false);
  // Subscribe to just the flags the toolbar shows, so typing doesn't re-render it on every keystroke.
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      h2: current.isActive("heading", { level: 2 }),
      h3: current.isActive("heading", { level: 3 }),
      bold: current.isActive("bold"),
      italic: current.isActive("italic"),
      bullets: current.isActive("bulletList"),
      numbers: current.isActive("orderedList"),
      link: current.isActive("link"),
      linkUrl: (current.getAttributes("link").href as string | undefined) ?? "",
      inTable: current.isActive("table"),
    }),
  });

  const run = () => editor.chain().focus();

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
      <div role="toolbar" aria-label="Text formatting" className="flex flex-wrap items-center gap-0.5">
        <ToolbarButton label="Heading 2" pressed={state.h2} onClick={() => run().toggleHeading({ level: 2 }).run()}>
          H2
        </ToolbarButton>
        <ToolbarButton label="Heading 3" pressed={state.h3} onClick={() => run().toggleHeading({ level: 3 }).run()}>
          H3
        </ToolbarButton>
        <ToolbarButton label="Bold" pressed={state.bold} onClick={() => run().toggleBold().run()}>
          B
        </ToolbarButton>
        <ToolbarButton label="Italic" pressed={state.italic} onClick={() => run().toggleItalic().run()}>
          I
        </ToolbarButton>
        <ToolbarButton label="Bullet list" pressed={state.bullets} onClick={() => run().toggleBulletList().run()}>
          • List
        </ToolbarButton>
        <ToolbarButton label="Numbered list" pressed={state.numbers} onClick={() => run().toggleOrderedList().run()}>
          1. List
        </ToolbarButton>
        <ToolbarButton label="Link" pressed={state.link} onClick={() => setLinkOpen(true)}>
          Link
        </ToolbarButton>
        <ToolbarButton
          label="Insert table"
          disabled={state.inTable}
          onClick={() => run().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        >
          Table
        </ToolbarButton>
        {state.inTable && (
          <>
            <ToolbarButton label="Add row below" onClick={() => run().addRowAfter().run()}>
              + Row
            </ToolbarButton>
            <ToolbarButton label="Add column to the right" onClick={() => run().addColumnAfter().run()}>
              + Col
            </ToolbarButton>
            <ToolbarButton label="Delete row" onClick={() => run().deleteRow().run()}>
              − Row
            </ToolbarButton>
            <ToolbarButton label="Delete column" onClick={() => run().deleteColumn().run()}>
              − Col
            </ToolbarButton>
            <ToolbarButton label="Delete table" onClick={() => run().deleteTable().run()}>
              Delete table
            </ToolbarButton>
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <UploadThesisButton editor={editor} />
      </div>
      <LinkDialog
        open={linkOpen}
        onOpenChange={setLinkOpen}
        initialUrl={state.linkUrl}
        onSubmit={(url) => {
          const attrs = { href: url, target: "_blank", rel: "noopener noreferrer" };
          if (editor.state.selection.empty && !state.link) {
            // Nothing is selected, so there is no text to turn into a link: insert the address itself as the link.
            run().insertContent({ type: "text", text: url, marks: [{ type: "link", attrs }] }).run();
          } else {
            run().extendMarkRange("link").setLink(attrs).run();
          }
          setLinkOpen(false);
        }}
        onRemove={() => {
          run().extendMarkRange("link").unsetLink().run();
          setLinkOpen(false);
        }}
      />
    </div>
  );
}
