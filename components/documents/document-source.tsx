import { cn } from "@/lib/cn";
import type { CompanyDocument } from "@/lib/documents";
import { useOpenDocument } from "@/lib/queries/use-open-document";
import { linkHost } from "@/lib/research";

const linkClass =
  "rounded font-medium text-indigo-600 hover:text-indigo-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500";

interface DocumentSourceProps {
  document: CompanyDocument;
  onError: (message: string) => void;
}

// A link opens directly. A stored PDF needs a fresh signed address first, so it opens from a button: the tab is
// opened straight away (browsers block tabs opened after an await) and pointed at the address once it arrives.
export function DocumentSource({ document, onError }: DocumentSourceProps) {
  const openDocument = useOpenDocument();

  if (document.url) {
    return (
      <a href={document.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {linkHost(document.url)}
        <span className="sr-only"> (opens in a new tab)</span>
        <span aria-hidden="true"> ↗</span>
      </a>
    );
  }

  async function open() {
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    try {
      const address = await openDocument.mutateAsync(document);
      if (tab) tab.location.href = address;
      else window.open(address, "_blank", "noopener,noreferrer");
    } catch (error) {
      tab?.close();
      onError(error instanceof Error ? error.message : "Couldn't open the file.");
    }
  }

  return (
    <button
      type="button"
      onClick={() => void open()}
      disabled={openDocument.isPending}
      className={cn(linkClass, "max-w-60 cursor-pointer truncate text-left disabled:cursor-wait disabled:opacity-60")}
    >
      {document.file?.name}
      <span className="sr-only"> (opens in a new tab)</span>
      <span aria-hidden="true"> ↗</span>
    </button>
  );
}
