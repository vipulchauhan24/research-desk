// Visible placeholder (spec 3.4, marked Later): filled from the Screener import once that exists.
export function FundamentalsPlaceholder() {
  return (
    <section className="rounded-lg border border-dashed border-slate-400 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-slate-900">Fundamentals</h3>
        <span className="font-mono text-xs text-slate-500">PLACEHOLDER · not connected</span>
      </div>
      <p className="mt-2 font-mono text-xs text-slate-500">
        Screener-style ratios (ROCE, ROE, debt/equity, 10-yr growth) will appear here once a Screener file is imported.
      </p>
    </section>
  );
}
