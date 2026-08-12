import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Crosshair, Layers, Minus, Plus, X } from "lucide-react";
import { MapContainer } from "./MapContainer";
import { DEFAULT_LAYERS, mapService, type MapLayerState } from "@/services/api/mapService";
import { useAsync } from "@/hooks/useAsync";
import { useRole } from "@/hooks/useRole";
import { SearchBar } from "@/components/common/SearchBar";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { ErrorState } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { WATER_BODY_LABEL, formatCoords } from "@/utils/format";
import type { Issue, WaterBody } from "@/types";

const LAYER_KEYS: (keyof MapLayerState)[] = ["river", "dam", "lake", "pond", "reservoir", "issues", "heatmap"];
const LAYER_LABEL: Record<string, string> = { river: "Rivers", dam: "Dams", lake: "Lakes", pond: "Ponds", reservoir: "Reservoirs", issues: "Issue markers", heatmap: "Hotspot heat layer" };

export function MapExplorer() {
  const { role } = useRole();
  const { data, loading, error, retry, offline } = useAsync(() => mapService.features(), []);
  const [viewport, setViewport] = useState({ center: { lat: 20.05, lng: 73.87 }, zoom: 9.8 });
  const [layers, setLayers] = useState<MapLayerState>(DEFAULT_LAYERS);
  const [showLayers, setShowLayers] = useState(false);
  const [search, setSearch] = useState("");
  const [sel, setSel] = useState<{ kind: "wb"; item: WaterBody } | { kind: "issue"; item: Issue } | null>(null);

  const bodies = (data?.waterBodies ?? []).filter((w) => !search || w.name.toLowerCase().includes(search.toLowerCase()));

  if (error) return <div className="p-6"><ErrorState message={error} onRetry={retry} offline={offline} /></div>;

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full">
      {loading ? <Skeleton className="h-full w-full rounded-none" /> : (
        <MapContainer
          viewport={viewport} onViewportChange={setViewport}
          waterBodies={bodies} issues={data?.issues ?? []} layers={layers}
          selectedWaterBodyId={sel?.kind === "wb" ? sel.item.id : null}
          selectedIssueId={sel?.kind === "issue" ? sel.item.id : null}
          onSelectWaterBody={(item) => setSel({ kind: "wb", item })}
          onSelectIssue={(item) => setSel({ kind: "issue", item })}
        />
      )}

      {/* Single floating control cluster: search, zoom, locate, layers, legend. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between gap-3 p-3 sm:p-4">
        <div className="pointer-events-auto w-full max-w-xs"><SearchBar value={search} onChange={setSearch} placeholder="Search water bodies" className="shadow-overlay" /></div>
        <div className="pointer-events-auto flex flex-col gap-2">
          <div className="flex flex-col overflow-hidden rounded-[6px] border border-border bg-card shadow-overlay">
            <button className="p-2 hover:bg-muted" aria-label="Zoom in" onClick={() => setViewport((v) => ({ ...v, zoom: Math.min(14, v.zoom + 0.6) }))}><Plus className="h-4 w-4" /></button>
            <button className="border-t border-border p-2 hover:bg-muted" aria-label="Zoom out" onClick={() => setViewport((v) => ({ ...v, zoom: Math.max(8.5, v.zoom - 0.6) }))}><Minus className="h-4 w-4" /></button>
            <button className="border-t border-border p-2 hover:bg-muted" aria-label="Centre on district" onClick={() => setViewport({ center: { lat: 20.05, lng: 73.87 }, zoom: 9.8 })}><Crosshair className="h-4 w-4" /></button>
            <button className="border-t border-border p-2 hover:bg-muted" aria-label="Toggle layers" onClick={() => setShowLayers((s) => !s)}><Layers className="h-4 w-4" /></button>
          </div>
          {showLayers ? (
            <div className="w-52 rounded-[6px] border border-border bg-card p-3 shadow-overlay">
              <p className="mb-2 text-xs font-semibold">Layers</p>
              <ul className="space-y-2">
                {LAYER_KEYS.map((k) => (
                  <li key={k} className="flex items-center justify-between gap-2">
                    <span className="text-xs">{LAYER_LABEL[k]}</span>
                    <Switch checked={layers[k]} onCheckedChange={(v) => setLayers((l) => ({ ...l, [k]: v }))} aria-label={LAYER_LABEL[k]} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 rounded-[6px] border border-border bg-card/95 p-3 shadow-overlay sm:bottom-4 sm:left-4">
        <p className="mb-1.5 text-xs font-semibold">Severity legend</p>
        <ul className="grid gap-1">
          {[["low", "Low"], ["medium", "Medium"], ["high", "High"], ["critical", "Critical"]].map(([k, l]) => (
            <li key={k} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: `var(--sev-${k})` }} aria-hidden />{l}
            </li>
          ))}
        </ul>
      </div>

      {/* Side drawer on desktop, bottom sheet on mobile — never a modal, so map context stays visible. */}
      {sel ? (
        <aside className="absolute inset-x-0 bottom-0 max-h-[70vh] overflow-y-auto rounded-t-[10px] border border-border bg-card p-5 shadow-overlay sm:inset-y-0 sm:right-0 sm:left-auto sm:w-96 sm:max-h-none sm:rounded-none sm:rounded-l-[10px]">
          <button className="absolute top-3 right-3 rounded-[6px] p-1.5 hover:bg-muted" aria-label="Close details" onClick={() => setSel(null)}><X className="h-4 w-4" /></button>
          {sel.kind === "wb" ? (
            <div>
              <p className="text-xs font-medium text-water">{WATER_BODY_LABEL[sel.item.type]} · {sel.item.taluka}</p>
              <h2 className="mt-1 text-lg font-semibold">{sel.item.name}</h2>
              <p className="data-mono mt-1 text-muted-foreground">{formatCoords(sel.item.center)}</p>
              <p className="mt-3 text-sm text-muted-foreground">{sel.item.description}</p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-[6px] bg-muted p-3"><dt className="text-xs text-muted-foreground">Open issues</dt><dd className="text-lg font-semibold">{sel.item.openIssues}</dd></div>
                <div className="rounded-[6px] bg-muted p-3"><dt className="text-xs text-muted-foreground">Resolved</dt><dd className="text-lg font-semibold">{sel.item.resolvedIssues}</dd></div>
              </dl>
              <div className="mt-4 grid gap-2">
                <Button asChild className="rounded-[6px]"><Link to="/report">Report here</Link></Button>
                <Button asChild variant="outline" className="rounded-[6px]"><Link to="/water-bodies/$id" params={{ id: sel.item.id }}>{role === "authority" ? "View assigned issues" : "View full record"}</Link></Button>
              </div>
            </div>
          ) : (
            <div>
              <p className="data-mono text-muted-foreground">{sel.item.id}</p>
              <h2 className="mt-1 text-lg font-semibold">{sel.item.title}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-3"><StatusBadge status={sel.item.status} size="sm" /><SeverityBadge severity={sel.item.severity} /></div>
              <p className="data-mono mt-2 text-muted-foreground">{formatCoords(sel.item.location)}</p>
              <p className="mt-3 text-sm text-muted-foreground">{sel.item.description}</p>
              <div className="mt-4 grid gap-2">
                <Button asChild className="rounded-[6px]"><Link to="/reports/$id" params={{ id: sel.item.id }}>Open full report</Link></Button>
                <Button asChild variant="outline" className="rounded-[6px]"><Link to="/report">Report here</Link></Button>
              </div>
            </div>
          )}
        </aside>
      ) : null}
    </div>
  );
}
