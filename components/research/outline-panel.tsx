import { useEditorState, type Editor } from "@tiptap/react";
import { cn } from "@/lib/cn";

interface OutlineItem {
  level: number;
  text: string;
  pos: number;
}

function scrollToHeading(editor: Editor, pos: number) {
  const node = editor.view.nodeDOM(pos);
  if (!(node instanceof HTMLElement)) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  node.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
}

// Headings of the note shown in the editor, for jumping around a long document.
export function OutlinePanel({ editor }: { editor: Editor }) {
  // Only re-renders when the list of headings actually changes, not on every keystroke.
  const items = useEditorState({
    editor,
    selector: ({ editor: current }) => {
      const found: OutlineItem[] = [];
      current.state.doc.descendants((node, pos) => {
        if (node.type.name === "heading" && node.textContent.trim()) {
          found.push({ level: node.attrs.level as number, text: node.textContent.trim(), pos });
        }
      });
      return found;
    },
  });

  if (items.length === 0) {
    return <p className="px-4 py-6 text-center text-slate-500">Add H2 or H3 headings to see an outline.</p>;
  }

  return (
    <ul>
      {items.map((item) => (
        <li key={item.pos}>
          <button
            type="button"
            onClick={() => scrollToHeading(editor, item.pos)}
            className={cn(
              "block w-full cursor-pointer px-4 py-2 text-left hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-500",
              item.level === 2 ? "font-medium text-slate-900" : "pl-7 text-slate-600",
            )}
          >
            {item.text}
          </button>
        </li>
      ))}
    </ul>
  );
}
