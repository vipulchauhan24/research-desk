import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { CASE_KEYS, CASE_LABEL, METHOD_LABEL, type CaseKey, type GridMode } from "@/lib/scenarios";
import { summarise, type ScenarioDraft } from "@/lib/scenarios-form";
import { ScenarioGrid } from "./scenario-grid";
import { ScenarioSummaryCards } from "./scenario-summary";
import { CaseToggle, ModeToggle } from "./scenario-toggles";

interface ScenarioReadoutProps {
  scenario: ScenarioDraft;
  pricePaise: number | null;
}

// The read-only view, for mobile and for previewing a saved version. Cases and period types can still be switched.
export function ScenarioReadout({ scenario, pricePaise }: ScenarioReadoutProps) {
  const [caseKey, setCaseKey] = useState<CaseKey>("base");
  const [mode, setMode] = useState<GridMode>("yearly");

  return (
    <div className="flex flex-col gap-4">
      <CaseToggle value={caseKey} onChange={setCaseKey} />
      <Card className="flex flex-col gap-3 p-4">
        <p className="text-slate-500">
          {CASE_KEYS.map((key) => `${CASE_LABEL[key]} ${scenario.probabilities[key]}%`).join(" · ")} · {METHOD_LABEL[scenario.method]}
        </p>
        <ScenarioSummaryCards summary={summarise(scenario, pricePaise)} pricePaise={pricePaise} />
      </Card>
      <Card>
        <CardHeader className="flex-wrap">
          <span>{CASE_LABEL[caseKey]} case</span>
          <ModeToggle value={mode} onChange={setMode} />
        </CardHeader>
        <ScenarioGrid grid={scenario[mode]} mode={mode} method={scenario.method} caseKey={caseKey} />
        <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">Amounts in ₹ Cr unless stated</p>
      </Card>
    </div>
  );
}
