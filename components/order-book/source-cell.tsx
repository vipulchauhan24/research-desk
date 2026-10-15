import { linkHost } from "@/lib/research";

const linkClass =
  "rounded font-medium text-indigo-600 hover:text-indigo-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500";

interface SourceCellProps {
  note: string | null;
  url: string | null;
}

// The note ("Q1 FY27 concall, p.4") is the label; with a link it becomes clickable, falling back to the site name.
export function SourceCell({ note, url }: SourceCellProps) {
  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {note ?? linkHost(url)}
        <span className="sr-only"> (opens in a new tab)</span>
        <span aria-hidden="true"> ↗</span>
      </a>
    );
  }
  return note ? <>{note}</> : <span className="text-slate-400">—</span>;
}
