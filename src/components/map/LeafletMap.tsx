import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { cn } from "@/lib/utils";
import {
  visibleBodies,
  visibleBoundaries,
  visibleIssues,
  visibleSources,
} from "@/services/api/mapService";
import type { Issue, LatLng, Severity, WaterBody } from "@/types";
import type { MapContainerProps } from "./types";

/**
 * Real GIS surface (Leaflet + OpenStreetMap tiles). Browser-only: this module
 * is lazily imported by MapContainer so it never runs during SSR.
 *
 * Only issue-report markers are clustered — water-body geometry, pollution
 * sources and boundaries are drawn directly.
 */
export const SEV_COLOR: Record<Severity, string> = {
  low: "#2E7D32",
  medium: "#C08A17",
  high: "#D2691E",
  critical: "#B3261E",
};

export interface GeometryStyle {
  color: string;
  weight?: number;
  fill?: string;
  dashArray?: string;
  label: string;
}

/** One shared style table for geometry — the legend renders from this. */
export const GEOMETRY_STYLE: Record<string, GeometryStyle> = {
  river: { color: "#0B4F8C", weight: 5, label: "Major river" },
  tributary: { color: "#5FB4E5", weight: 2.5, label: "Tributary" },
  stream: { color: "#5FB4E5", weight: 2, label: "Stream" },
  drain: { color: "#6E5F80", weight: 3, label: "Drain" },
  canal: { color: "#1478C8", weight: 3, dashArray: "8 6", label: "Canal" },
  lake: { color: "#12A5C4", fill: "#22C0DC", label: "Lake" },
  pond: { color: "#12A5C4", fill: "#22C0DC", label: "Pond" },
  kund: { color: "#12A5C4", fill: "#22C0DC", label: "Kund" },
  wetland: { color: "#0E8C7F", fill: "#14A594", label: "Wetland" },
  reservoir: { color: "#0A3D73", fill: "#12508F", label: "Reservoir" },
  dam: { color: "#0A3D73", fill: "#12508F", label: "Dam" },
};

export const BOUNDARY_STYLE = {
  taluka: { color: "#7A6A55", dashArray: "6 5" },
  catchment: { color: "#2E7D32", dashArray: "3 6" },
  jurisdiction: { color: "#8A3FB0", dashArray: "10 6" },
} as const;

export const SOURCE_COLOR = { suspected: "#C08A17", verified: "#B3261E" } as const;

const LINEAR = new Set(["river", "tributary", "stream", "drain", "canal"]);

function isVerified(i: Issue) {
  return (
    i.verificationStatus === "verified" ||
    ["verified", "assigned", "in_progress", "resolved"].includes(i.status)
  );
}

function issueIcon(sev: Severity, selected: boolean, verified: boolean) {
  const color = SEV_COLOR[sev];
  const size = selected ? 22 : 16;
  return L.divIcon({
    className: "dwg-marker",
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:${verified ? 3 : 2}px solid ${verified ? "#fff" : "rgba(255,255,255,.85)"};box-shadow:0 1px 5px rgba(0,0,0,.4)${selected ? ";outline:3px solid rgba(11,110,140,.55)" : ""}"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function sourceIcon(status: "suspected" | "verified", selected: boolean) {
  const color = SOURCE_COLOR[status];
  const s = selected ? 18 : 14;
  return L.divIcon({
    className: "dwg-marker",
    html: `<span style="display:block;width:${s}px;height:${s}px;transform:rotate(45deg);background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)${selected ? ";outline:3px solid rgba(11,110,140,.55)" : ""}"></span>`,
    iconSize: [s, s],
    iconAnchor: [s / 2, s / 2],
  });
}

const SEV_RANK: Record<Severity, number> = { critical: 3, high: 2, medium: 1, low: 0 };

export default function LeafletMap({
  viewport,
  onViewportChange,
  waterBodies,
  issues,
  sources = [],
  boundaries = [],
  layers,
  selection,
  onSelect,
  onMapClick,
  pin,
  className,
  interactive = true,
  fitToSelection = true,
}: MapContainerProps) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const overlay = useRef<L.LayerGroup | null>(null);
  const pinRef = useRef<L.Marker | null>(null);
  const cbs = useRef({ onViewportChange, onSelect, onMapClick });
  cbs.current = { onViewportChange, onSelect, onMapClick };

  // Create the map once.
  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, {
      center: [viewport.center.lat, viewport.center.lng],
      zoom: viewport.zoom,
      zoomControl: false,
      attributionControl: true,
      dragging: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      touchZoom: interactive,
      keyboard: interactive,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(m);
    overlay.current = L.layerGroup().addTo(m);
    m.on("moveend", () => {
      const c = m.getCenter();
      cbs.current.onViewportChange?.({ center: { lat: c.lat, lng: c.lng }, zoom: m.getZoom() });
    });
    m.on("click", (e: L.LeafletMouseEvent) => {
      cbs.current.onMapClick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
    map.current = m;
    setTimeout(() => m.invalidateSize(), 0);
    return () => {
      m.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Follow externally driven viewport changes (zoom buttons, recentre).
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const c = m.getCenter();
    const moved =
      Math.abs(c.lat - viewport.center.lat) > 1e-6 ||
      Math.abs(c.lng - viewport.center.lng) > 1e-6 ||
      Math.abs(m.getZoom() - viewport.zoom) > 0.01;
    if (moved) m.setView([viewport.center.lat, viewport.center.lng], viewport.zoom, { animate: true });
  }, [viewport.center.lat, viewport.center.lng, viewport.zoom]);

  // Redraw all layers whenever data, layer toggles or the selection changes.
  useEffect(() => {
    const m = map.current;
    const group = overlay.current;
    if (!m || !group) return;
    group.clearLayers();

    const selId =
      selection && selection.kind !== "cluster"
        ? (selection.item as { id: string }).id
        : null;

    /* --- Administrative / catchment boundaries (drawn first, underneath) --- */
    for (const b of visibleBoundaries(boundaries, layers)) {
      const style = BOUNDARY_STYLE[b.kind];
      const selected = selId === b.id;
      const poly = L.polygon(b.polygon.map((p) => [p.lat, p.lng] as [number, number]), {
        color: style.color,
        weight: selected ? 3 : 1.5,
        dashArray: style.dashArray,
        fillColor: style.color,
        fillOpacity: selected ? 0.14 : 0.04,
        interactive: true,
      });
      poly.bindTooltip(b.name, { direction: "top", sticky: true });
      poly.on("click", (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        cbs.current.onSelect?.({ kind: "boundary", item: b });
      });
      group.addLayer(poly);
    }

    /* --- Water bodies --- */
    for (const wb of visibleBodies(waterBodies, layers)) {
      const style = (GEOMETRY_STYLE as Record<string, { color: string; weight?: number; fill?: string; dashArray?: string }>)[wb.type] ??
        GEOMETRY_STYLE.lake;
      const selected = selId === wb.id;
      const pts = wb.geometry.map((p) => [p.lat, p.lng] as [number, number]);
      const shape = LINEAR.has(wb.type)
        ? L.polyline(pts, {
            color: style.color,
            weight: (style.weight ?? 3) + (selected ? 3 : 0),
            opacity: 0.9,
            ...(style.dashArray ? { dashArray: style.dashArray } : {}),
          })
        : L.polygon(pts, {
            color: style.color,
            weight: selected ? 4 : 2,
            fillColor: style.fill ?? style.color,
            fillOpacity: selected ? 0.45 : 0.28,
          });
      shape.bindTooltip(`${wb.name}${wb.taluka ? ` · ${wb.taluka}` : ""}`, { direction: "top", sticky: true });
      shape.on("click", (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        cbs.current.onSelect?.({ kind: "waterBody", item: wb });
      });
      const path = (shape as unknown as { getElement?: () => Element | null }).getElement?.();
      if (path) (path as SVGElement).setAttribute("tabindex", "0");
      group.addLayer(shape);
    }

    /* --- Pollution sources (never clustered) --- */
    for (const s of visibleSources(sources, layers)) {
      const marker = L.marker([s.location.lat, s.location.lng], {
        icon: sourceIcon(s.status, selId === s.id),
        title: s.name,
        keyboard: true,
        alt: `${s.status} pollution source: ${s.name}`,
      });
      marker.bindTooltip(`${s.name} · ${s.status === "verified" ? "Verified" : "Suspected"} source`, {
        direction: "top",
      });
      marker.on("click", () => cbs.current.onSelect?.({ kind: "source", item: s }));
      group.addLayer(marker);
    }

    /* --- Issue reports (the ONLY clustered layer) --- */
    const shownIssues = visibleIssues(issues as Issue[], layers);
    if (shownIssues.length) {
      const cluster = (L as unknown as {
        markerClusterGroup: (o?: Record<string, unknown>) => L.LayerGroup & {
          on: (ev: string, fn: (e: { layer: { getAllChildMarkers: () => { options: { alt?: string } }[]; getBounds: () => L.LatLngBounds } }) => void) => void;
        };
      }).markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 45, chunkedLoading: true });

      const byId = new Map<string, Issue>();
      for (const issue of shownIssues) {
        byId.set(issue.id, issue);
        const marker = L.marker([issue.location.lat, issue.location.lng], {
          icon: issueIcon(issue.severity, selId === issue.id, isVerified(issue)),
          title: issue.title,
          alt: issue.id,
          keyboard: true,
          zIndexOffset: selId === issue.id ? 1000 : 0,
        });
        marker.bindTooltip(
          `${issue.title} · ${issue.waterBodyName}${isVerified(issue) ? " · Field-verified" : ""}`,
          { direction: "top" },
        );
        marker.on("click", () => cbs.current.onSelect?.({ kind: "issue", item: issue }));
        cluster.addLayer(marker);
      }

      cluster.on("clusterclick", (e) => {
        const children = e.layer.getAllChildMarkers();
        const contained = children
          .map((c) => byId.get(c.options.alt ?? ""))
          .filter(Boolean) as Issue[];
        const top = contained.reduce<Severity>(
          (acc, i) => (SEV_RANK[i.severity] > SEV_RANK[acc] ? i.severity : acc),
          "low",
        );
        m.fitBounds(e.layer.getBounds(), { padding: [40, 40] });
        cbs.current.onSelect?.({ kind: "cluster", count: contained.length, severity: top, issues: contained });
      });

      group.addLayer(cluster);
    }
  }, [waterBodies, issues, sources, boundaries, layers, selection]);

  // Fit / zoom to the selected feature so the click visibly focuses the map.
  useEffect(() => {
    const m = map.current;
    if (!m || !selection || !fitToSelection) return;
    if (selection.kind === "waterBody") {
      const pts = selection.item.geometry.map((p) => [p.lat, p.lng] as [number, number]);
      if (pts.length > 1) m.fitBounds(L.latLngBounds(pts), { padding: [48, 48], maxZoom: 14 });
      else m.setView([selection.item.center.lat, selection.item.center.lng], 13);
    } else if (selection.kind === "boundary") {
      m.fitBounds(L.latLngBounds(selection.item.polygon.map((p) => [p.lat, p.lng] as [number, number])), {
        padding: [48, 48],
      });
    } else if (selection.kind === "issue") {
      m.setView([selection.item.location.lat, selection.item.location.lng], Math.max(m.getZoom(), 13));
    } else if (selection.kind === "source") {
      m.setView([selection.item.location.lat, selection.item.location.lng], Math.max(m.getZoom(), 13));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection]);

  // Report-flow pin.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (pinRef.current) {
      pinRef.current.remove();
      pinRef.current = null;
    }
    if (pin) {
      pinRef.current = L.marker([(pin as LatLng).lat, (pin as LatLng).lng], {
        icon: issueIcon("high", true, false),
      }).addTo(m);
    }
  }, [pin]);

  return (
    <div
      ref={el}
      className={cn("dwg-map h-full w-full", className)}
      role="application"
      aria-label="Map of Nashik water bodies, pollution sources and reported issues"
    />
  );
}

export type { WaterBody };
