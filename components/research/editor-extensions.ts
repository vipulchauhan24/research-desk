import { Extension, getSchema, type AnyExtension, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { chartFromRows, type ChartData } from "@/lib/research-chart";

// A table can be shown as a bar chart. The flag is a node attribute, so it is saved (and versioned) with the document.
const ChartableTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      showChart: { default: false, rendered: false },
    };
  },
});

function tableRows(table: ProseMirrorNode): string[][] {
  const rows: string[][] = [];
  table.forEach((row) => {
    const cells: string[] = [];
    row.forEach((cell) => cells.push(cell.textContent.trim()));
    rows.push(cells);
  });
  return rows;
}

const BUTTON_CLASS =
  "h-8 cursor-pointer rounded-md border border-indigo-200 bg-indigo-50 px-3 text-[13px] font-medium text-indigo-700 hover:bg-indigo-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500";

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function buildChart(chart: ChartData) {
  const container = element("div", "mt-3 flex flex-col gap-2 rounded-lg border border-slate-200 p-4");
  container.append(element("div", "text-xs font-medium text-slate-500", chart.title));
  for (const bar of chart.bars) {
    const row = element("div", "grid grid-cols-[140px_1fr_72px] items-center gap-3 text-xs");
    const track = element("div", "h-4 rounded bg-slate-100");
    const fill = element("div", "h-4 rounded bg-indigo-500");
    fill.style.width = `${bar.widthPercent}%`;
    track.append(fill);
    row.append(
      element("span", "truncate", bar.label),
      track,
      element("span", "text-right tabular-nums", bar.display),
    );
    container.append(row);
  }
  return container;
}

// Drawn as a widget after each chartable table (not a node view) so the table keeps its stock editing behaviour.
function chartWidgets(doc: ProseMirrorNode, editable: boolean) {
  const decorations: Decoration[] = [];

  doc.descendants((node, pos) => {
    if (node.type.name !== "table") return;
    const rows = tableRows(node);
    const chart = chartFromRows(rows);
    if (!chart) return false;

    const show = Boolean(node.attrs.showChart);
    // Read-only views (previews, mobile) just show the chart if it was left on.
    if (!show && !editable) return false;

    const key = JSON.stringify([show, editable, rows]);
    decorations.push(
      Decoration.widget(
        pos + node.nodeSize,
        (view, getPos) => {
          const wrapper = element("div", "my-3");
          wrapper.contentEditable = "false";

          if (editable) {
            const controls = element("div", "mt-2 flex items-center gap-3");
            const toggle = element("button", BUTTON_CLASS, show ? "Hide chart" : "Show chart");
            toggle.type = "button";
            toggle.setAttribute("aria-pressed", String(show));
            toggle.addEventListener("click", () => {
              const widgetPos = getPos();
              if (widgetPos === undefined) return;
              // The table sits directly before its widget, so find it from there rather than trusting a stale position.
              const table = view.state.doc.resolve(widgetPos).nodeBefore;
              if (!table) return;
              const tablePos = widgetPos - table.nodeSize;
              view.dispatch(view.state.tr.setNodeMarkup(tablePos, undefined, { ...table.attrs, showChart: !show }));
              view.focus();
            });
            controls.append(toggle, element("span", "text-xs text-slate-500", `Pasted table · ${rows.length - 1} rows`));
            wrapper.append(controls);
          }

          if (show) wrapper.append(buildChart(chart));
          return wrapper;
        },
        { key, side: -1, stopEvent: () => true },
      ),
    );
    return false;
  });

  return DecorationSet.create(doc, decorations);
}

const TableChart = Extension.create({
  name: "tableChart",
  addProseMirrorPlugins() {
    const editor = this.editor;
    return [
      new Plugin({
        key: new PluginKey("tableChart"),
        props: { decorations: (state) => chartWidgets(state.doc, editor.isEditable) },
      }),
    ];
  },
});

// The one extension list for the editor and the read-only renderer, so a saved document renders identically in both.
export const researchExtensions: AnyExtension[] = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    // Not in the toolbar, so don't let it in through shortcuts or pasted content either.
    underline: false,
    link: { openOnClick: true, autolink: false, protocols: ["http", "https", "mailto"], },
  }),
  ChartableTable.configure({ resizable: false }),
  TableRow,
  TableHeader,
  TableCell,
  TableChart,
];

let schema: ReturnType<typeof getSchema> | undefined;

// True when the stored JSON fits the editor's schema. Stored content is data from outside the app, so check it
// before handing it to the editor rather than trusting it.
export function isValidDoc(content: JSONContent): boolean {
  schema ??= getSchema(researchExtensions);
  try {
    schema.nodeFromJSON(content).check();
    return true;
  } catch {
    return false;
  }
}
