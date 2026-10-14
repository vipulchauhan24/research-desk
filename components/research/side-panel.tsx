import dynamic from "next/dynamic";
import type { Editor } from "@tiptap/react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { VersionHistory, type VersionHistoryProps } from "./version-history";

// Reads the editor's document, so it loads with the editor (client-only).
const OutlinePanel = dynamic(() => import("./outline-panel").then((module) => module.OutlinePanel), { ssr: false });

interface SidePanelProps extends VersionHistoryProps {
  // The editor currently on screen (live or previewing), or null while it is still loading.
  outlineEditor: Editor | null;
}

export function SidePanel({ outlineEditor, ...history }: SidePanelProps) {
  return (
    // Stays beside the note while a long document scrolls; its own list scrolls if it outgrows the screen.
    <aside className="md:sticky md:top-4 md:max-h-[calc(100vh-2rem)] md:overflow-y-auto">
      <Card>
        <Tabs defaultValue="versions">
          <div className="px-4">
            <TabsList aria-label="Note side panel">
              <TabsTab value="versions">Versions</TabsTab>
              <TabsTab value="outline">Outline</TabsTab>
            </TabsList>
          </div>
          <TabsPanel value="versions" className="pt-0!">
            <VersionHistory {...history} />
          </TabsPanel>
          <TabsPanel value="outline" className="pt-0!">
            {outlineEditor ? (
              <OutlinePanel key={outlineEditor.instanceId} editor={outlineEditor} />
            ) : (
              <p className="px-4 py-6 text-center text-slate-500">Loading…</p>
            )}
          </TabsPanel>
        </Tabs>
      </Card>
    </aside>
  );
}
