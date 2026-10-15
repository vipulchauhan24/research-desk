import type { MethodResult } from "@/lib/valuation-methods";

export function ResultCard({ result }: { result: MethodResult }) {
  return (
    // Updates as the inputs are typed, so screen readers hear the new value without moving focus.
    <div aria-live="polite" className="self-start rounded-lg bg-indigo-50 p-4">
      <div className="text-xs font-medium text-indigo-700">{result.label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{result.value}</div>
      <div className="mt-1 text-xs text-slate-600">{result.note}</div>
    </div>
  );
}
