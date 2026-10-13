import { Progress as BaseProgress } from "@base-ui/react/progress";
import { cn } from "@/lib/cn";

type ProgressTone = "normal" | "complete" | "low";

const FILL: Record<ProgressTone, string> = {
  normal: "bg-indigo-600",
  complete: "bg-green-600",
  low: "bg-amber-500",
};

interface ProgressProps {
  value: number;
  label: string;
  tone?: ProgressTone;
}

export function Progress({ value, label, tone = "normal" }: ProgressProps) {
  return (
    <BaseProgress.Root value={value} className="grid grid-cols-2 gap-y-1.5">
      <BaseProgress.Label className="text-xs text-slate-500">{label}</BaseProgress.Label>
      <BaseProgress.Value className="text-right text-xs text-slate-500" />
      <BaseProgress.Track className="col-span-2 h-2 overflow-hidden rounded bg-slate-200">
        <BaseProgress.Indicator className={cn("transition-[width] duration-300", FILL[tone])} />
      </BaseProgress.Track>
    </BaseProgress.Root>
  );
}
