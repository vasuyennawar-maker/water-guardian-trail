import { useCallback, useMemo, useRef, useState } from "react";
import type { Issue, LatLng, WaterBody } from "@/types";
import type { MapLayerState } from "@/services/api/mapService";
import { cn } from "@/lib/utils";

/**
 * Provider-agnostic map surface.
 *
 * This renders geometry with a simple equirectangular projection into SVG so
 * the whole product can be exercised without a paid map provider. The public
 * props (viewport, layers, markers, selection callbacks) are deliberately
 * provider-shaped: swapping in Mapbox GL / Leaflet / Google Maps means
 * rewriting THIS FILE ONLY — no surrounding UI changes.
 */
export interface MapViewport {
  center: LatLng;
  zoom: number;
}

export interface MapContainerProps {
  viewport: MapViewport;
  onViewportChange?: (v: MapViewport) => void;
  waterBodies: WaterBody[];
  issues: Issue[];
  layers: MapLayerState;
  selectedWaterBodyId?: string | null;
  selectedIssueId?: string | null;
  onSelectWaterBody?: (wb: WaterBody) => void;
  onSelectIssue?: (issue: Issue) => void;
  onMapClick?: (point: LatLng) => void;
  pin?: LatLng | null;
  className?: string;
  interactive?: boolean;
}

const SEV_VAR: Record<string, string> = {
  low: "var(--sev-low)",
  medium: "var(--sev-medium)",
  high: "var(--sev-high)",
  critical: "var(--sev-critical)",
};

const TYPE_STYLE: Record<string, { fill: string; stroke: string }> = {
  river: { fill: "none", stroke: "var(--water)" },
  dam: { fill: "color-mix(in oklch, var(--water) 22%, transparent)", stroke: "var(--water)" },
  lake: { fill: "color-mix(in oklch, var(--water) 18%, transparent)", stroke: "var(--water)" },
  pond: { fill: "color-mix(in oklch, var(--water) 26%, transparent)", stroke: "var(--water)" },
  reservoir: { fill: "color-mix(in oklch, var(--water) 20%, transparent)", stroke: "var(--water)" },
};

const W = 1000;
const H = 700;

export function MapContainer({
  viewport,
  onViewportChange,
  waterBodies,
  issues,
  layers,
  selectedWaterBodyId,
  selectedIssueId,
  onSelectWaterBody,
  onSelectIssue,
  onMapClick,
  pin,
  className,
  interactive = true,
}: MapContainerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<{ x: number; y: number; center: LatLng } | null>(null);

  // Degrees of latitude visible at the current zoom.
  const span = useMemo(() => 1.6 / Math.pow(1.55, viewport.zoom - 10), [viewport.zoom]);
  const lngSpan = span * (W / H);

  const project = useCallback(
    (p: LatLng) => ({
      x: ((p.lng - (viewport.center.lng - lngSpan / 2)) / lngSpan) * W,
      y: ((viewport.center.lat + span / 2 - p.lat) / span) * H,
    }),
    [viewport.center, span, lngSpan],
  );

  const unproject = useCallback(
    (x: number, y: number): LatLng => ({
      lng: viewport.center.lng - lngSpan / 2 + (x / W) * lngSpan,
      lat: viewport.center.lat + span / 2 - (y / H) * span,
    }),
    [viewport.center, span, lngSpan],
  );

  const toLocal = (e: { clientX: number; clientY: number }) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: ((e.clientX - rect.left) / rect.width) * W, y: ((e.clientY - rect.top) / rect.height) * H };
  };

  const visibleBodies = waterBodies.filter((w) => layers[w.type]);
  const visibleIssues = layers.issues ? issues : [];

  // Cluster markers at low zoom so the map does not become a pin soup.
  const clustered = viewport.zoom < 10.5;
  const clusters = useMemo(() => {
    if (!clustered) return [];
    const map = new Map<string, { wb: string; items: Issue[]; center: LatLng }>();
    for (const i of visibleIssues) {
      const entry = map.get(i.waterBodyId);
      if (entry) entry.items.push(i);
      else map.set(i.waterBodyId, { wb: i.waterBodyName, items: [i], center: i.location });
    }
    return [...map.values()];
  }, [clustered, visibleIssues]);

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-water-soft", className)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        className={cn("h-full w-full touch-none", interactive && (drag ? "cursor-grabbing" : "cursor-grab"))}
        role="img"
        aria-label="Map of water bodies and reported issues"
        onPointerDown={(e) => {
          if (!interactive) return;
          const l = toLocal(e);
          setDrag({ x: l.x, y: l.y, center: viewport.center });
        }}
        onPointerMove={(e) => {
          if (!drag || !interactive) return;
          const l = toLocal(e);
          onViewportChange?.({
            zoom: viewport.zoom,
            center: {
              lat: drag.center.lat + ((l.y - drag.y) / H) * span,
              lng: drag.center.lng - ((l.x - drag.x) / W) * lngSpan,
            },
          });
        }}
        onPointerUp={(e) => {
          if (drag) {
            const l = toLocal(e);
            const moved = Math.hypot(l.x - drag.x, l.y - drag.y) > 4;
            if (!moved && onMapClick) onMapClick(unproject(l.x, l.y));
          }
          setDrag(null);
        }}
        onPointerLeave={() => setDrag(null)}
      >
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="var(--border)" strokeWidth="1" opacity="0.7" />
          </pattern>
          <radialGradient id="heat">
            <stop offset="0%" stopColor="var(--sev-critical)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--sev-critical)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width={W} height={H} fill="var(--background)" />
        <rect width={W} height={H} fill="url(#grid)" />

        {layers.heatmap
          ? visibleBodies
              .filter((w) => w.openIssues > 0)
              .map((w) => {
                const p = project(w.center);
                return (
                  <circle
                    key={`heat-${w.id}`}
                    cx={p.x}
                    cy={p.y}
                    r={40 + w.openIssues * 14}
                    fill="url(#heat)"
                  />
                );
              })
          : null}

        {visibleBodies.map((wb) => {
          const pts = wb.geometry.map(project);
          const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
          const style = TYPE_STYLE[wb.type]!;
          const selected = selectedWaterBodyId === wb.id;
          return (
            <g
              key={wb.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectWaterBody?.(wb);
              }}
              className="cursor-pointer"
            >
              <path
                d={wb.type === "river" ? d : `${d} Z`}
                fill={style.fill}
                stroke={style.stroke}
                strokeWidth={wb.type === "river" ? (selected ? 7 : 5) : selected ? 3 : 1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={selected ? 1 : 0.9}
              />
              {viewport.zoom > 9.2 ? (
                <text
                  x={project(wb.center).x}
                  y={project(wb.center).y - 10}
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="600"
                  fill="var(--foreground)"
                  className="pointer-events-none select-none"
                >
                  {wb.name}
                </text>
              ) : null}
            </g>
          );
        })}

        {clustered
          ? clusters.map((c) => {
              const p = project(c.center);
              return (
                <g key={c.wb} className="cursor-pointer" onClick={(e) => e.stopPropagation()}>
                  <circle cx={p.x} cy={p.y} r={16} fill="var(--primary)" opacity="0.18" />
                  <circle cx={p.x} cy={p.y} r={12} fill="var(--primary)" />
                  <text
                    x={p.x}
                    y={p.y + 4}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill="var(--primary-foreground)"
                    className="pointer-events-none select-none"
                  >
                    {c.items.length}
                  </text>
                </g>
              );
            })
          : visibleIssues.map((i) => {
              const p = project(i.location);
              const selected = selectedIssueId === i.id;
              return (
                <g
                  key={i.id}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectIssue?.(i);
                  }}
                >
                  {selected ? <circle cx={p.x} cy={p.y} r={16} fill={SEV_VAR[i.severity]} opacity="0.25" /> : null}
                  <path
                    d={`M ${p.x} ${p.y} l -7 -11 a 8.5 8.5 0 1 1 14 0 Z`}
                    fill={SEV_VAR[i.severity]}
                    stroke="var(--card)"
                    strokeWidth="1.5"
                  />
                  <circle cx={p.x} cy={p.y - 13} r={3} fill="var(--card)" />
                </g>
              );
            })}

        {pin ? (
          <g className="pointer-events-none">
            <circle cx={project(pin).x} cy={project(pin).y} r={7} fill="var(--primary)" />
            <circle
              cx={project(pin).x}
              cy={project(pin).y}
              r={15}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2"
              opacity="0.55"
            />
          </g>
        ) : null}
      </svg>

      <p className="pointer-events-none absolute right-2 bottom-1 data-mono text-[10px] text-muted-foreground">
        Schematic map · sample geometry
      </p>
    </div>
  );
}
