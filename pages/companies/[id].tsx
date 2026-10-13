import { useRouter } from "next/router";
import { AppShell } from "@/components/layout/app-shell";

export default function CompanyPage() {
  const router = useRouter();
  // Client-rendered page: router.query is empty until the router is ready.
  const id = router.isReady ? router.query.id : undefined;

  return (
    <AppShell title="Analysis">
      <p className="text-slate-500">{id ? `Company ${id}` : "Loading…"}</p>
    </AppShell>
  );
}
