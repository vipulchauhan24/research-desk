import { STATUS_TONE, type Status } from "@/lib/status";
import { Badge } from "./badge";

export function StatusBadge({ status }: { status: Status }) {
  return <Badge tone={STATUS_TONE[status]}>{status}</Badge>;
}
