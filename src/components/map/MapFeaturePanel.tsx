import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { Button } from "@/components/ui/button";
import { useRole } from "@/hooks/useRole";
import { mapService } from "@/services/api/mapService";
import { WATER_BODY_LABEL, CATEGORY_LABEL, formatCoords, formatDate } from "@/utils/format";
import type { Issue } from "@/types";
import type { MapSelection } from "./types";

const SOURCE_CATEGORY_LABEL: Record<string, string> = {
  sewage_outfall: "Sewage outfall",
  industrial_effluent: "Industrial effluent",
  solid_waste: "Solid waste",
  agricultural_runoff: "Agricultural runoff",
  religious_offering: "Religious / floral offerings",
  other: "Other source",
};

const BOUNDARY_KIND_LABEL: Record<string, string> = {
  taluka: "Taluka boundary",
  catchment: "Catchment boundary",
  jurisdiction: "Department jurisdiction",
};

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[6px] bg-muted p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-lg font-semibold">{value}</dd>
    </div>
  );
}

/**
 * Shared details surface for any clicked map feature. Renders as a right-hand
 * side drawer on desktop and a bottom sheet on mobile so the map stays visible.
 */
export function MapFeaturePanel({
  selection,
  onClose,
  onSelect,
  onTrace,
  tracing,
  issues = [],
}: {
  selection: MapSelection;
  onClose: () => void;
  onSelect?: (s: MapSelection) => void;
  onTrace?: (waterBodyId: string) => void;
  tracing?: boolean;
  issues?: Issue[];
}) {
  const { role } = useRole();
  const canReport = role === "public" || role === "citizen";

  return (
    <aside
      className="absolute inset-x-0 bottom-0 z-[1000] max-h-[70vh] overflow-y-auto rounded-t-[10px] border border-border bg-card p-5 shadow-overlay sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-96 sm:rounded-none sm:rounded-l-[10px]"
      aria-label="Map feature details"
    >
      <button
        className="absolute top-3 right-3 rounded-[6px] p-1.5 hover:bg-muted"
        aria-label="Close details"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </button>

      {selection.kind === "waterBody" ? (
        (() => {
          const w = selection.item;
          const trace = mapService.trace(w.id);
          const related = issues.filter((i) => i.waterBodyId === w.id).slice(0, 4);
          return (
            <div className="pr-6">
              <p className="text-xs font-medium text-water">
                {WATER_BODY_LABEL[w.type]} · {w.taluka}
                {w.riverBasin ? ` · ${w.riverBasin} basin` : ""}
              </p>
              <h2 className="mt-1 text-lg font-semibold">{w.name}</h2>
              <p className="data-mono mt-1 text-muted-foreground">{formatCoords(w.center)}</p>
              {w.geometryNote ? (
                <p className="mt-1 text-xs text-muted-foreground italic">{w.geometryNote}</p>
              ) : null}
              <p className="mt-3 text-sm text-muted-foreground">{w.description}</p>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Stat label="Health card score" value={`${w.healthScore}/100`} />
                <Stat label="Condition" value={w.condition ? w.condition[0]!.toUpperCase() + w.condition.slice(1) : "—"} />
                <Stat label="Open issues" value={w.openIssues} />
                <Stat label="Resolved" value={w.resolvedIssues} />
              </dl>

              <dl className="mt-4 grid gap-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Responsible department</dt>
                  <dd className="text-right font-medium">{w.responsibleDepartment ?? "Not assigned"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Last inspection</dt>
                  <dd className="text-right font-medium">
                    {w.lastInspectionAt ? formatDate(w.lastInspectionAt) : formatDate(w.lastSurveyedAt)}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 rounded-[6px] border border-border p-3">
                <p className="text-xs font-semibold">Connections</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Upstream: {trace.upstream.length ? trace.upstream.map((u) => u.name).join(", ") : "None recorded"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Downstream: {trace.downstream.length ? trace.downstream.map((d) => d.name).join(", ") : "None recorded"}
                </p>
              </div>

              {related.length ? (
                <div className="mt-4">
                  <p className="text-xs font-semibold">Recent reports here</p>
                  <ul className="mt-2 grid gap-1">
                    {related.map((i) => (
                      <li key={i.id}>
                        <button
                          className="w-full rounded-[6px] px-2 py-1.5 text-left text-xs hover:bg-muted"
                          onClick={() => onSelect?.({ kind: "issue", item: i })}
                        >
                          <span className="data-mono text-muted-foreground">{i.id}</span> · {i.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-4 grid gap-2">
                {onTrace ? (
                  <Button variant={tracing ? "default" : "secondary"} className="rounded-[6px]" onClick={() => onTrace(w.id)}>
                    {tracing ? "Hide water path" : "Trace water path"}
                  </Button>
                ) : null}
                <Button asChild variant="outline" className="rounded-[6px]">
                  <Link to="/water-bodies/$id" params={{ id: w.id }}>Open health card</Link>
                </Button>
                {canReport ? (
                  <Button asChild className="rounded-[6px]"><Link to="/report">Report issue here</Link></Button>
                ) : null}
              </div>
            </div>
          );
        })()
      ) : null}

      {selection.kind === "issue" ? (
        (() => {
          const i = selection.item;
          return (
            <div className="pr-6">
              <p className="data-mono text-muted-foreground">{i.id}</p>
              <h2 className="mt-1 text-lg font-semibold">{i.title}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <StatusBadge status={i.status} size="sm" />
                <SeverityBadge severity={i.severity} />
              </div>
              <p className="data-mono mt-2 text-muted-foreground">{formatCoords(i.location)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {i.waterBodyName} · {CATEGORY_LABEL[i.category]}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">{i.description}</p>
              <div className="mt-4 grid gap-2">
                <Button asChild className="rounded-[6px]">
                  <Link to="/reports/$id" params={{ id: i.id }}>Open full report</Link>
                </Button>
                {role === "verifier" ? (
                  <Button asChild variant="outline" className="rounded-[6px]"><Link to="/verify">Go to verification queue</Link></Button>
                ) : null}
                {role === "authority" ? (
                  <Button asChild variant="outline" className="rounded-[6px]"><Link to="/authority/issues">Manage in authority queue</Link></Button>
                ) : null}
                {canReport ? (
                  <Button asChild variant="outline" className="rounded-[6px]"><Link to="/report">Report issue here</Link></Button>
                ) : null}
              </div>
            </div>
          );
        })()
      ) : null}

      {selection.kind === "source" ? (
        (() => {
          const s = selection.item;
          return (
            <div className="pr-6">
              <p className="text-xs font-medium text-water">
                {s.status === "verified" ? "Verified" : "Suspected"} pollution source
              </p>
              <h2 className="mt-1 text-lg font-semibold">{s.name}</h2>
              <p className="data-mono mt-1 text-muted-foreground">{formatCoords(s.location)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {SOURCE_CATEGORY_LABEL[s.category] ?? s.category} · affects {s.waterBodyName}
              </p>
              {s.note ? <p className="mt-3 text-sm text-muted-foreground">{s.note}</p> : null}
              {s.lastVerifiedAt ? (
                <p className="mt-2 text-xs text-muted-foreground">Last verified {formatDate(s.lastVerifiedAt)}</p>
              ) : null}
              {s.relatedIssueIds.length ? (
                <ul className="mt-3 grid gap-1">
                  {s.relatedIssueIds.map((id) => (
                    <li key={id}>
                      <Link to="/reports/$id" params={{ id }} className="data-mono text-xs text-water hover:underline">
                        {id}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-4 grid gap-2">
                <Button asChild variant="outline" className="rounded-[6px]">
                  <Link to="/water-bodies/$id" params={{ id: s.waterBodyId }}>Open affected water body</Link>
                </Button>
                {canReport ? (
                  <Button asChild className="rounded-[6px]"><Link to="/report">Report issue here</Link></Button>
                ) : null}
              </div>
            </div>
          );
        })()
      ) : null}

      {selection.kind === "boundary" ? (
        (() => {
          const b = selection.item;
          const inArea = issues.filter((i) => b.talukas.includes(i.locationLabel?.split(",").pop()?.trim() ?? ""));
          return (
            <div className="pr-6">
              <p className="text-xs font-medium text-water">{BOUNDARY_KIND_LABEL[b.kind]}</p>
              <h2 className="mt-1 text-lg font-semibold">{b.name}</h2>
              {b.department ? <p className="mt-1 text-sm">{b.department}</p> : null}
              <p className="mt-2 text-xs text-muted-foreground">Covers: {b.talukas.join(", ")}</p>
              {b.note ? <p className="mt-2 text-xs text-muted-foreground italic">{b.note}</p> : null}
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Stat label="Reports in area" value={inArea.length} />
                <Stat label="Talukas" value={b.talukas.length} />
              </dl>
            </div>
          );
        })()
      ) : null}

      {selection.kind === "cluster" ? (
        <div className="pr-6">
          <p className="text-xs font-medium text-water">Report cluster</p>
          <h2 className="mt-1 text-lg font-semibold">{selection.count} reports in this area</h2>
          <p className="mt-1 text-xs text-muted-foreground">Highest severity: {selection.severity}</p>
          <ul className="mt-3 grid gap-1">
            {selection.issues.map((i) => (
              <li key={i.id}>
                <button
                  className="w-full rounded-[6px] px-2 py-1.5 text-left text-xs hover:bg-muted"
                  onClick={() => onSelect?.({ kind: "issue", item: i })}
                >
                  <span className="data-mono text-muted-foreground">{i.id}</span> · {i.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}
