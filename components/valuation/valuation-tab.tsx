import { useRouter } from "next/router";
import { useIsDesktop } from "@/components/layout/use-is-desktop";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PillTab, PillTabsList, Tabs, TabsPanel } from "@/components/ui/tabs";
import { useCompany } from "@/lib/queries/use-company";
import { useValuationInputs, type ValuationInputs } from "@/lib/queries/use-valuation-inputs";
import {
  cashFlowsStoredSchema,
  CASH_FLOWS_KEY,
  exitPricesStoredSchema,
  EXIT_PRICES_KEY,
} from "@/lib/valuation-base-case";
import type { DiscountAssumptions } from "@/lib/valuation-cash-flow-table";
import {
  DEFAULT_METHOD,
  findMethod,
  METHODS,
  methodStoredSchema,
  type EvaluationContext,
  type MethodSpec,
  type MethodValues,
} from "@/lib/valuation-methods";
import { BuyingPriceCard } from "./buying-price-card";
import { CashFlowsCard } from "./cash-flows-card";
import { FundamentalsPlaceholder } from "./fundamentals-placeholder";
import { MethodForm } from "./method-form";
import { MethodReadout } from "./method-readout";

function savedMethod(spec: MethodSpec, inputs: ValuationInputs): MethodValues | null {
  const parsed = methodStoredSchema(spec).safeParse(inputs[spec.id]);
  return parsed.success ? (parsed.data as MethodValues) : null;
}

// The DCF rates saved for a method, for the discounting rows of Table 2.
function savedDiscount(spec: MethodSpec, values: MethodValues | null): DiscountAssumptions | null {
  if (!spec.discount || !values) return null;
  return { ratePct: values[spec.discount.rateKey], terminalGrowthPct: values[spec.discount.growthKey] };
}

interface ValuationBodyProps {
  companyId: string;
  spec: MethodSpec;
  inputs: ValuationInputs;
  pricePaise: number | null;
}

function ValuationBody({ companyId, spec, inputs, pricePaise }: ValuationBodyProps) {
  const isDesktop = useIsDesktop();
  const saved = savedMethod(spec, inputs);
  const cashFlows = cashFlowsStoredSchema.safeParse(inputs[CASH_FLOWS_KEY]);
  const exitPrices = exitPricesStoredSchema.safeParse(inputs[EXIT_PRICES_KEY]);
  const context: EvaluationContext = { pricePaise, cashFlows: cashFlows.success ? cashFlows.data : null };

  return (
    <div className="flex flex-col gap-4">
      {isDesktop ? (
        // Keyed so switching method or company starts from that method's saved values.
        <MethodForm key={`${companyId}-${spec.id}`} companyId={companyId} spec={spec} saved={saved} context={context} />
      ) : (
        <MethodReadout spec={spec} saved={saved} context={context} />
      )}
      {spec.usesCashFlows && (
        <CashFlowsCard
          companyId={companyId}
          saved={context.cashFlows}
          kind={spec.id === "dcf-fcff" ? "fcff" : "fcfe"}
          discount={savedDiscount(spec, saved)}
        />
      )}
      <BuyingPriceCard companyId={companyId} saved={exitPrices.success ? exitPrices.data : null} pricePaise={pricePaise} />
      <FundamentalsPlaceholder />
    </div>
  );
}

export function ValuationTab({ companyId }: { companyId: string }) {
  const router = useRouter();
  const inputsQuery = useValuationInputs(companyId);
  const companyQuery = useCompany(companyId);
  const company = companyQuery.data;
  // The selected method lives in the URL, next to the selected tab, so a refresh keeps it.
  const spec = findMethod(typeof router.query.method === "string" ? router.query.method : undefined);

  function select(next: string) {
    const query = { ...router.query };
    if (next === DEFAULT_METHOD) delete query.method;
    else query.method = next;
    void router.replace({ pathname: router.pathname, query }, undefined, { shallow: true, scroll: false });
  }

  if (inputsQuery.isPending || companyQuery.isPending) {
    return (
      <Card>
        <p className="px-4 py-10 text-center text-slate-500" role="status">
          Loading valuation…
        </p>
      </Card>
    );
  }

  if (inputsQuery.isError || companyQuery.isError || !company) {
    return (
      <Card>
        <EmptyState
          title="Couldn't load the valuation"
          description="Check your connection and try again."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                void inputsQuery.refetch();
                void companyQuery.refetch();
              }}
            >
              Retry
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <Tabs value={spec.id} onValueChange={(value) => select(String(value))}>
      <PillTabsList aria-label="Valuation methods">
        {METHODS.map((method) => (
          <PillTab key={method.id} value={method.id}>
            {method.label}
          </PillTab>
        ))}
      </PillTabsList>
      {METHODS.map((method) => (
        <TabsPanel key={method.id} value={method.id}>
          <ValuationBody
            companyId={companyId}
            spec={method}
            inputs={inputsQuery.data}
            pricePaise={company.pricePaise}
          />
        </TabsPanel>
      ))}
    </Tabs>
  );
}
