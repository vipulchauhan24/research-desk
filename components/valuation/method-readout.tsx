import type { EvaluationContext, MethodSpec, MethodValues } from "@/lib/valuation-methods";
import { evaluateMethod, formatFieldValue } from "@/lib/valuation-methods";
import { MethodCard } from "./method-card";
import { ResultCard } from "./result-card";

interface MethodReadoutProps {
  spec: MethodSpec;
  saved: MethodValues | null;
  context: EvaluationContext;
}

// Mobile is read-only: the saved inputs as a list, with the same result card as the editor.
export function MethodReadout({ spec, saved, context }: MethodReadoutProps) {
  return (
    <MethodCard
      title={spec.title}
      inputs={
        saved ? (
          <dl className="grid grid-cols-2 gap-x-3 gap-y-3">
            {spec.fields.map((field) => (
              <div key={field.key}>
                <dt className="text-xs font-medium text-slate-500">{field.label}</dt>
                <dd className="mt-1 text-slate-900">{formatFieldValue(field.kind, saved[field.key])}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-slate-500">No inputs entered yet.</p>
        )
      }
      result={<ResultCard result={evaluateMethod(spec, saved, context)} />}
    />
  );
}
