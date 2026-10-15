import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface MethodCardProps {
  title: string;
  // Input form (desktop) or read-only values (mobile).
  inputs: ReactNode;
  result: ReactNode;
}

export function MethodCard({ title, inputs, result }: MethodCardProps) {
  return (
    <Card className="grid gap-6 p-4 md:grid-cols-[minmax(0,1fr)_300px]">
      <div>
        <h3 className="mb-3 font-semibold text-slate-900">{title}</h3>
        {inputs}
      </div>
      {result}
    </Card>
  );
}
