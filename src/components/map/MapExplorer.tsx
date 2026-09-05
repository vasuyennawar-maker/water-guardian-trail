import { useMemo, useState } from "react";
import { ChevronDown, Crosshair, Layers, Minus, Plus } from "lucide-react";
import { MapContainer } from "./MapContainer";
import { MapFeaturePanel } from "./MapFeaturePanel";
import { GEOMETRY_STYLE, SEV_COLOR, SOURCE_COLOR } from "./LeafletMap";
import type { MapSelection } from "./types";
import {
  DEFAULT_LAYERS,
  LAYER_GROUPS,
  LAYER_LABELS,
  mapService,
  type MapLayerState,
} from "@/services/api/mapService";
import { useAsync } from "@/hooks/useAsync";
import { SearchBar } from "@/components/common/SearchBar";
import { ErrorState } from "@/components/common/States";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { WATER_BODY_LABEL } from "@/utils/format";

export function MapExplorer() {
  const { data, loading, error, retry, offline } = useAsync(() => mapService.features(), []);
  const [viewport, setViewport] = useState({ center: { lat: 20.05, lng: 73.87 }, zoom: 9.8 });
  const [layers, setLayers] = useState<MapLayerState>(DEFAULT_LAYERS);
  const [showLayers, setShowLayers] = useState(false);
  const [layerSearch, setLayerSearch] = useState("");
  const [showLegend, setShowLegend] = useState(false);
  const [search, setSearch] = useState("");
  const [sel, setSel] = useState<MapSelection | null>(null);
  const [tracedId, setTracedId] = useState<string | null>(null);

  const allBodies = data?.waterBodies ?? [];
  const allIssues = data?.issues ?? [];

  const q = search.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!q) return [] as { id: string; label: string; sub: string; sel: MapSelection }[];
    const wb = allBodies
      .filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          WATER_BODY_LABEL[w.type].toLowerCase().includes(q) ||
          w.taluka.toLowerCase().includes(q),
      )
      .slice(0, 6)
      .map((w) => ({
        id: w.id,
        label: w.name,
        sub: `${WATER_BODY_LABEL[w.type]} · ${w.taluka}`,
        sel: { kind: "waterBody", item: w } as MapSelection,
      }));
    const iss = allIssues
      .filter((i) => i.id.toLowerCase().includes(q) || i.title.toLowerCase().includes(q))
      .slice(0, 5)
      .map((i) => ({
        id: i.id,
        label: i.title,
        sub: `${i.id} · ${i.waterBodyName}`,
        sel: { kind: "issue", item: i } as MapSelection,
      }));
    return [...wb, ...iss];
  }, [q, allBodies, allIssues]);

  // Trace Water Path: restrict the drawn network to the traced chain.
  const trace = tracedId ? mapService.trace(tracedId) : null;
  const tracedIds = trace
    ? new Set([
        tracedId!,
        ...trace.upstream.map((w) => w.id),
        ...trace.downstream.map((w) => w.id),
        ...trace.paths.flatMap((p) => p.bodyIds),
      ])
    : null;

  const shownBodies = tracedIds ? allBodies.filter((w) => tracedIds.has(w.id)) : allBodies;
  const shownIssues = tracedIds ? allIssues.filter((i) => tracedIds.has(i.waterBodyId)) : allIssues;

  if (error) return <div className="p-6"><ErrorState message={error} onRetry={retry} offline={offline} /></div>;

  const legendGeometry = ["river", "tributary", "drain", "canal", "lake", "wetland", "dam"] as const;

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full">
      {loading ? <Skeleton className="h-full w-full rounded-none" /> : (
        <MapContainer
          viewport={viewport}
          onViewportChange={setViewport}
          waterBodies={shownBodies}
          issues={shownIssues}
          sources={data?.sources ?? []}
          boundaries={data?.boundaries ?? []}
          layers={layers}
          selection={sel}
          onSelect={setSel}
        />
      )}

      {/* Floating control cluster: search, zoom, locate, layers. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[900] flex justify-between gap-3 p-3 sm:p-4">
        <div className="pointer-events-auto w-full max-w-[16rem] sm:max-w-xs">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search name, type, taluka or report ID"
            className="shadow-overlay"
          />
          {matches.length ? (
            <ul className="mt-2 max-h-64 overflow-y-auto rounded-[6px] border border-border bg-card shadow-overlay">
              {matches.map((m) => (
                <li key={`${m.sel.kind}-${m.id}`}>
                  <button
                    className="w-full px-3 py-2 text-left hover:bg-muted"
                    onClick={() => { setSel(m.sel); setSearch(""); }}
                  >
                    <span className="block truncate text-sm font-medium">{m.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{m.sub}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <div className="flex flex-col overflow-hidden rounded-[6px] border border-border bg-card shadow-overlay">
            <button className="p-2 hover:bg-muted" aria-label="Zoom in" onClick={() => setViewport((v) => ({ ...v, zoom: Math.min(16, v.zoom + 0.6) }))}><Plus className="h-4 w-4" /></button>
            <button className="border-t border-border p-2 hover:bg-muted" aria-label="Zoom out" onClick={() => setViewport((v) => ({ ...v, zoom: Math.max(8.5, v.zoom - 0.6) }))}><Minus className="h-4 w-4" /></button>
            <button className="border-t border-border p-2 hover:bg-muted" aria-label="Centre on district" onClick={() => setViewport({ center: { lat: 20.05, lng: 73.87 }, zoom: 9.8 })}><Crosshair className="h-4 w-4" /></button>
            <button className="border-t border-border p-2 hover:bg-muted" aria-label="Toggle layers" aria-expanded={showLayers} onClick={() => setShowLayers((s) => !s)}><Layers className="h-4 w-4" /></button>
          </div>

          {showLayers ? (
            <div className="max-h-[60vh] w-60 overflow-y-auto rounded-[6px] border border-border bg-card p-3 shadow-overlay">
              <p className="mb-2 text-xs font-semibold">Map layers</p>
              <input
                value={layerSearch}
                onChange={(e) => setLayerSearch(e.target.value)}
                placeholder="Find a layer"
                aria-label="Find a layer"
                className="mb-3 w-full rounded-[6px] border border-border bg-background px-2 py-1.5 text-xs"
              />
              {LAYER_GROUPS.map((g) => {
                const keys = g.keys.filter((k) =>
                  LAYER_LABELS[k].toLowerCase().includes(layerSearch.trim().toLowerCase()),
                );
                if (!keys.length) return null;
                return (
                  <div key={g.title} className="mb-3 last:mb-0">
                    <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{g.title}</p>
                    <ul className="space-y-2">
                      {keys.map((k) => (
                        <li key={k} className="flex items-center justify-between gap-2">
                          <span className="text-xs">{LAYER_LABELS[k]}</span>
                          <Switch
                            checked={layers[k]}
                            onCheckedChange={(v) => setLayers((l) => ({ ...l, [k]: v }))}
                            aria-label={LAYER_LABELS[k]}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      {trace ? (
        <div className="pointer-events-auto absolute top-20 left-3 z-[900] max-w-[16rem] rounded-[6px] border border-border bg-card p-3 shadow-overlay sm:left-4">
          <p className="text-xs font-semibold">Tracing water path</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Showing {trace.current?.name ?? "selection"} with its upstream sources, downstream receivers and their reports.
          </p>
          <button className="mt-2 text-xs font-medium text-water hover:underline" onClick={() => setTracedId(null)}>
            Show the whole network
          </button>
        </div>
      ) : null}

      {/* One collapsible legend. */}
      <div className="absolute bottom-3 left-3 z-[900] w-52 rounded-[6px] border border-border bg-card/95 shadow-overlay sm:bottom-4 sm:left-4">
        <button
          className="flex w-full items-center justify-between gap-2 p-3 text-xs font-semibold"
          aria-expanded={showLegend}
          onClick={() => setShowLegend((s) => !s)}
        >
          Legend
          <ChevronDown className={`h-4 w-4 transition-transform ${showLegend ? "rotate-180" : ""}`} />
        </button>
        {showLegend ? (
          <div className="max-h-[45vh] overflow-y-auto border-t border-border p-3">
            <p className="mb-1.5 text-[11px] font-semibold text-muted-foreground uppercase">Report severity</p>
            <ul className="grid gap-1">
              {(["low", "medium", "high", "critical"] as const).map((s) => (
                <li key={s} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: SEV_COLOR[s] }} aria-hidden />
                  {s[0]!.toUpperCase() + s.slice(1)}
                </li>
              ))}
            </ul>
            <p className="mt-3 mb-1.5 text-[11px] font-semibold text-muted-foreground uppercase">Water network</p>
            <ul className="grid gap-1">
              {legendGeometry.map((t) => (
                <li key={t} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="h-1 w-4 rounded-full" style={{ background: GEOMETRY_STYLE[t]?.color }} aria-hidden />
                  {GEOMETRY_STYLE[t]?.label}
                </li>
              ))}
            </ul>
            <p className="mt-3 mb-1.5 text-[11px] font-semibold text-muted-foreground uppercase">Pollution sources</p>
            <ul className="grid gap-1">
              {(["suspected", "verified"] as const).map((s) => (
                <li key={s} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="h-2.5 w-2.5 rotate-45" style={{ background: SOURCE_COLOR[s] }} aria-hidden />
                  {s[0]!.toUpperCase() + s.slice(1)} source
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-muted-foreground italic">
              Geometry is approximate prototype data, not surveyed GeoJSON.
            </p>
          </div>
        ) : null}
      </div>

      {sel ? (
        <MapFeaturePanel
          selection={sel}
          issues={allIssues}
          onClose={() => setSel(null)}
          onSelect={setSel}
          {...(sel.kind === "waterBody"
            ? {
                onTrace: (id: string) => setTracedId((t) => (t === id ? null : id)),
                tracing: tracedId === sel.item.id,
              }
            : {})}
        />
      ) : null}
    </div>
  );
}
