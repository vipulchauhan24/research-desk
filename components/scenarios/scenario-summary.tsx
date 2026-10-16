import { cn } from "@/lib/cn";
import { formatNumber, formatRupees, formatSignedPercent, PLACEHOLDER } from "@/lib/format";
import { paiseToRupees } from "@/lib/money";
import { CASE_KEYS, CASE_LABEL, expectedReturnPct } from "@/lib/scenarios";
import type { ScenarioSummary } from "@/lib/scenarios-form";

interface CardProps {
  label: string;
  value: string;
  note: string;
  tone?: "gain" | "loss";
  highlight?: "neutral" | "accent";
  className?: string;
}

function SummaryCard({ label, value, note, tone, highlight, className }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        highlight === "accent" ? "border-indigo-200 bg-indigo-50" : highlight === "neutral" ? "border-slate-200 bg-slate-50" : "border-slate-200",
        className,
      )}
    >
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={cn("text-xl font-semibold text-slate-900", tone === "gain" && "text-green-600", tone === "loss" && "text-red-600")}>
        {value}
      </div>
      <div className="text-xs text-slate-500">{note}</div>
    </div>
  );
}

const rupees = (value: number | null) => (value === null ? PLACEHOLDER : formatRupees(value, 0));

// "In about 1.4 years", from today to the end of the target year.
function horizonNote(years: number | null): string {
  return years === null ? "Target year has passed" : `Over ~${formatNumber(years, 1)} years`;
}

interface ScenarioSummaryCardsProps {
  summary: ScenarioSummary;
  pricePaise: number | null;
}

export function ScenarioSummaryCards({ summary, pricePaise }: ScenarioSummaryCardsProps) {
  const price = pricePaise === null ? null : paiseToRupees(pricePaise);
  const versusPrice = (target: number | null) => {
    const change = expectedReturnPct(target, price);
    return change === null ? "No current price yet" : `${formatSignedPercent(change)} vs current price`;
  };
  const { expectedReturn } = summary;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {CASE_KEYS.map((key) => (
        <SummaryCard
          key={key}
          label={`${CASE_LABEL[key]} target`}
          value={rupees(summary.targets[key])}
          note={summary.targets[key] === null ? "Fill in the grid below" : versusPrice(summary.targets[key])}
        />
      ))}
      <SummaryCard
        label="Weighted target"
        value={rupees(summary.weighted)}
        note={summary.targetLabel ? `${summary.targetLabel}, by probability` : "Choose a target year"}
        highlight="neutral"
      />
      <SummaryCard
        label="Expected return"
        value={expectedReturn === null ? PLACEHOLDER : formatSignedPercent(expectedReturn)}
        note={
          !summary.probabilitiesOk
            ? "Fix probabilities"
            : expectedReturn === null
              ? price === null
                ? "Enter the current price"
                : "Fill in the grid below"
              : horizonNote(summary.yearsToTarget)
        }
        tone={expectedReturn === null ? undefined : expectedReturn >= 0 ? "gain" : "loss"}
        highlight="accent"
        className="max-md:col-span-2"
      />
    </div>
  );
}
