import type { Severity } from "@/types";
import { SEVERITY_LABEL } from "@/utils/format";
import { cn } from "@/lib/utils";

/**
 * Severity uses a bar + dot ramp so it stays visually distinct from
 * StatusBadge (pill + icon), and never relies on colour alone.
 */
const RAMP: Record<Severity, { dot: string; bar: string; text: string; level: number }> = {
  low: { dot: "bg-sev-low", bar: "bg-sev-low", text: "text-sev-low", level: 1 },
  medium: { dot: "bg-sev-medium", bar: "bg-sev-medium", text: "text-sev-medium", level: 2 },
  high: { dot: "bg-sev-high", bar: "bg-sev-high", text: "text-sev-high", level: 3 },
  critical: { dot: "bg-sev-critical", bar: "bg-sev-critical", text: "text-sev-critical", level: 4 },
};

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  const c = RAMP[severity];
  return (
    <span
      className={cn("inline-flex items-center gap-2 text-xs font-medium", c.text, className)}
      title={`Severity: ${SEVERITY_LABEL[severity]}`}
    >
      <span className="flex items-end gap-[2px]" aria-hidden>
        {[1, 2, 3, 4].map((n) => (
          <span
            key={n}
            className={cn(
              "w-[3px] rounded-[1px]",
              n <= c.level ? c.bar : "bg-border",
              n === 1 && "h-[6px]",
              n === 2 && "h-[9px]",
              n === 3 && "h-[12px]",
              n === 4 && "h-[15px]",
            )}
          />
        ))}
      </span>
      {SEVERITY_LABEL[severity]}
    </span>
  );
}

export const severityDotClass = (s: Severity) => RAMP[s].dot;
