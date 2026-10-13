import type { ReactNode } from "react";
import { Card, CardBody } from "./card";

interface KpiCardProps {
  label: string;
  value: ReactNode;
  subLine?: ReactNode;
}

export function KpiCard({ label, value, subLine }: KpiCardProps) {
  return (
    <Card>
      <CardBody>
        <div className="text-xs font-medium text-slate-500">{label}</div>
        <div className="mt-1 text-2xl font-semibold text-slate-900 tabular-nums">{value}</div>
        {subLine && <div className="mt-1 text-xs text-slate-500">{subLine}</div>}
      </CardBody>
    </Card>
  );
}
