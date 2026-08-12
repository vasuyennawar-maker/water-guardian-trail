import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  action,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ElementType;
  tone?: "default" | "water" | "warning" | "critical" | "resolved";
  action?: ReactNode;
}) {
  const toneRing: Record<string, string> = {
    default: "text-primary bg-primary/10",
    water: "text-water bg-water/10",
    warning: "text-status-progress bg-status-progress/10",
    critical: "text-sev-critical bg-sev-critical/10",
    resolved: "text-status-resolved bg-status-resolved/10",
  };
  return (
    <div className="surface-card flex flex-col justify-between p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
        {Icon ? (
          <span className={cn("flex h-7 w-7 items-center justify-center rounded-[6px]", toneRing[tone])}>
            <Icon className="h-4 w-4" aria-hidden />
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-3xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
