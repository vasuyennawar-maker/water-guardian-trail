import { Link } from "@tanstack/react-router";
import { Droplets, MapPin, TriangleAlert } from "lucide-react";
import type { WaterBody } from "@/types";
import { WATER_BODY_LABEL, formatDate } from "@/utils/format";
import { cn } from "@/lib/utils";

function healthTone(score: number) {
  if (score >= 70) return { label: "Fair", cls: "text-status-resolved", bar: "bg-status-resolved" };
  if (score >= 55) return { label: "Watch", cls: "text-status-progress", bar: "bg-status-progress" };
  return { label: "Stressed", cls: "text-sev-critical", bar: "bg-sev-critical" };
}

export function WaterBodyCard({ wb, view = "grid" }: { wb: WaterBody; view?: "grid" | "list" }) {
  const h = healthTone(wb.healthScore);
  return (
    <Link
      to="/water-bodies/$id"
      params={{ id: wb.id }}
      className={cn(
        "surface-card group block p-4 transition-colors hover:border-water/50",
        view === "list" && "sm:flex sm:items-center sm:justify-between sm:gap-6",
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-water/10 px-2 py-0.5 text-[11px] font-medium text-water">
            <Droplets className="h-3 w-3" aria-hidden /> {WATER_BODY_LABEL[wb.type]}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" aria-hidden /> {wb.taluka}
          </span>
        </div>
        <h3 className="mt-2 truncate text-base font-semibold group-hover:text-water">{wb.name}</h3>
        {view === "grid" ? (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{wb.description}</p>
        ) : null}
      </div>

      <div className={cn("mt-4", view === "list" && "mt-3 sm:mt-0 sm:w-80 sm:shrink-0")}>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Condition indicator (sample)</span>
          <span className={cn("font-semibold", h.cls)}>
            {h.label} · {wb.healthScore}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className={cn("h-full rounded-full", h.bar)} style={{ width: `${wb.healthScore}%` }} />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <TriangleAlert className="h-3.5 w-3.5 text-sev-high" aria-hidden />
            {wb.openIssues} open · {wb.resolvedIssues} resolved
          </span>
          <span className="data-mono">{formatDate(wb.lastSurveyedAt)}</span>
        </div>
      </div>
    </Link>
  );
}
