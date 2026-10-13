// Shared class strings so every control and surface matches .claude/theme.md.

export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500";

export const controlBase = `h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 hover:border-slate-400 focus-visible:border-indigo-500 data-invalid:border-red-600 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 data-disabled:border-slate-200 data-disabled:bg-slate-50 data-disabled:text-slate-400 ${focusRing}`;

export const popupSurface = "rounded-lg border border-slate-200 bg-white shadow-md";

export const popupMotion =
  "transition-opacity duration-100 data-starting-style:opacity-0 data-ending-style:opacity-0";

export const optionItem =
  "cursor-default rounded px-2 py-1.5 text-sm text-slate-700 outline-none select-none data-highlighted:bg-indigo-50 data-highlighted:text-indigo-700 data-selected:font-medium data-disabled:text-slate-400";
