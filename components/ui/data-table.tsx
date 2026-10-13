import { useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ArrowDownIcon, ArrowUpIcon } from "./icons";
import { focusRing } from "./styles";

export type SortDirection = "asc" | "desc";

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  // Numbers are right-aligned; text and badges left-aligned.
  align?: "left" | "right";
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  "aria-label": string;
  onRowClick?: (row: T) => void;
  sort?: { key: string; direction: SortDirection } | null;
  onSortChange?: (key: string) => void;
  // Shown when rows is empty, usually an <EmptyState />.
  empty?: ReactNode;
  // Tailwind max-height class, e.g. "max-h-96", to scroll vertically under the sticky header.
  maxHeightClassName?: string;
}

const stickyCell = "sticky left-0 group-data-scrolled/table:border-r group-data-scrolled/table:border-slate-200";

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  sort,
  onSortChange,
  empty,
  maxHeightClassName,
  ...props
}: DataTableProps<T>) {
  // Right border on the pinned first column only appears once the table is scrolled sideways.
  const [scrolled, setScrolled] = useState(false);

  if (rows.length === 0 && empty) return <>{empty}</>;

  function handleRowKey(event: KeyboardEvent, row: T) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onRowClick?.(row);
    }
  }

  return (
    <div
      data-scrolled={scrolled || undefined}
      onScroll={(event) => setScrolled(event.currentTarget.scrollLeft > 0)}
      className={cn("group/table overflow-auto", maxHeightClassName)}
    >
      <table aria-label={props["aria-label"]} className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            {columns.map((column, index) => {
              const direction = sort?.key === column.key ? sort.direction : undefined;
              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={direction ? (direction === "asc" ? "ascending" : "descending") : undefined}
                  className={cn(
                    "sticky top-0 h-9 border-b border-slate-200 bg-slate-50 px-3 text-xs font-medium whitespace-nowrap text-slate-500",
                    column.align === "right" ? "text-right" : "text-left",
                    index === 0 && cn(stickyCell, "z-20"),
                    index !== 0 && "z-10",
                  )}
                >
                  {column.sortable && onSortChange ? (
                    <button
                      type="button"
                      onClick={() => onSortChange(column.key)}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-1 rounded hover:text-slate-700",
                        column.align === "right" && "flex-row-reverse",
                        focusRing,
                      )}
                    >
                      {column.header}
                      {direction === "asc" && <ArrowUpIcon width={12} height={12} />}
                      {direction === "desc" && <ArrowDownIcon width={12} height={12} />}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={getRowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={onRowClick ? (event) => handleRowKey(event, row) : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              className={cn(
                "group/row hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-500",
                onRowClick && "cursor-pointer",
              )}
            >
              {columns.map((column, index) => (
                <td
                  key={column.key}
                  className={cn(
                    "border-b border-slate-100 px-3 py-2 max-md:py-3",
                    column.align === "right" ? "text-right tabular-nums" : "text-left",
                    index === 0 && cn(stickyCell, "z-10 bg-white group-hover/row:bg-slate-50"),
                  )}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
