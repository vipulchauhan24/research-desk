import { useRouter } from "next/router";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { DocumentsTab } from "@/components/documents/documents-tab";
import { OrderBookTab } from "@/components/order-book/order-book-tab";
import { ResearchTab } from "@/components/research/research-tab";
import { ScenarioTab } from "@/components/scenarios/scenario-tab";
import { ValuationTab } from "@/components/valuation/valuation-tab";

// Tab order and labels from .design/FEATURES.md §3.
const TABS = [
  { value: "research", label: "Research" },
  { value: "thesis", label: "Thesis and triggers" },
  { value: "scenarios", label: "Scenarios" },
  { value: "valuation", label: "Valuation" },
  { value: "order-book", label: "Order book and capex" },
  { value: "documents", label: "Documents and tracker" },
] as const;

type TabValue = (typeof TABS)[number]["value"];
const DEFAULT_TAB: TabValue = "research";

function toTab(value: string | string[] | undefined): TabValue {
  return TABS.find((tab) => tab.value === value)?.value ?? DEFAULT_TAB;
}

export function CompanyTabs({ companyId }: { companyId: string }) {
  const router = useRouter();
  // The selected tab lives in the URL so it survives a refresh and can be shared.
  const tab = toTab(router.query.tab);

  function select(next: string) {
    const query = { ...router.query };
    if (next === DEFAULT_TAB) delete query.tab;
    else query.tab = next;
    void router.replace({ pathname: router.pathname, query }, undefined, { shallow: true, scroll: false });
  }

  return (
    <Tabs value={tab} onValueChange={(value) => select(String(value))}>
      <TabsList aria-label="Company sections">
        {TABS.map(({ value, label }) => (
          <TabsTab key={value} value={value}>
            {label}
          </TabsTab>
        ))}
      </TabsList>
      {TABS.map(({ value, label }) => (
        <TabsPanel key={value} value={value}>
          {value === "research" ? (
            <ResearchTab companyId={companyId} />
          ) : value === "scenarios" ? (
            <ScenarioTab companyId={companyId} />
          ) : value === "valuation" ? (
            <ValuationTab companyId={companyId} />
          ) : value === "order-book" ? (
            <OrderBookTab companyId={companyId} />
          ) : value === "documents" ? (
            <DocumentsTab companyId={companyId} />
          ) : (
            <Card>
              <EmptyState title={label} description="This section isn't built yet." />
            </Card>
          )}
        </TabsPanel>
      ))}
    </Tabs>
  );
}
