import Link from "next/link";
import { useRouter } from "next/router";
import { CompanyHeader } from "@/components/company/company-header";
import { CompanyTabs } from "@/components/company/company-tabs";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useCompany } from "@/lib/queries/use-company";

export default function CompanyPage() {
  const router = useRouter();
  // Client-rendered page: router.query is empty until the router is ready.
  const id = router.isReady && typeof router.query.id === "string" ? router.query.id : undefined;
  const { data: company, isPending, isError, refetch } = useCompany(id);

  return (
    // "Analysis" stays the page title so the mobile top bar and nav match the sidebar while inside a company.
    <AppShell title="Analysis" header={company ? <CompanyHeader company={company} /> : undefined}>
      {company ? (
        <CompanyTabs companyId={company.id} />
      ) : (
        <Card>
          {isPending ? (
            <p className="px-4 py-10 text-center text-slate-500" role="status">
              Loading company…
            </p>
          ) : isError ? (
            <EmptyState
              title="Couldn't load this company"
              description="Check your connection and try again."
              action={
                <Button variant="secondary" onClick={() => void refetch()}>
                  Retry
                </Button>
              }
            />
          ) : (
            <EmptyState
              title="Company not found"
              description="It may have been removed, or the link is wrong."
              action={
                <Link
                  href="/companies"
                  className="rounded font-medium text-indigo-600 hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                >
                  Back to companies
                </Link>
              }
            />
          )}
        </Card>
      )}
    </AppShell>
  );
}
