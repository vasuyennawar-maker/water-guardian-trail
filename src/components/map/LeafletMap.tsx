import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { cn } from "@/lib/utils";
import type { Issue, LatLng, WaterBody } from "@/types";
import type { MapContainerProps } from "./types";

/**
 * Real GIS surface (Leaflet + OpenStreetMap tiles). Browser-only: this module
 * is lazily imported by MapContainer so it never runs during SSR.
 */
const SEV_COLOR: Record<string, string> = {
  low: "#2E7D32",
  medium: "#C08A17",
  high: "#D2691E",
  critical: "#B3261E",
};

const WATER = "#0B6E8C";

function issueIcon(sev: string) {
  const color = SEV_COLOR[sev] ?? WATER;
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export default function LeafletMap({
  viewport,
  onViewportChange,
  waterBodies,
  issues,
  layers,
  selectedIssueId,
  onSelectWaterBody,
  onSelectIssue,
  onMapClick,
  pin,
  className,
  interactive = true,
}: MapContainerProps) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const overlay = useRef<L.LayerGroup | null>(null);
  const pinRef = useRef<L.Marker | null>(null);
  const cbs = useRef({ onViewportChange, onSelectWaterBody, onSelectIssue, onMapClick });
  cbs.current = { onViewportChange, onSelectWaterBody, onSelectIssue, onMapClick };

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
    // Leaflet needs a size recalculation once the container has laid out.
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

  // Redraw geometry, issue clusters and the heat layer whenever data changes.
  useEffect(() => {
    const m = map.current;
    const group = overlay.current;
    if (!m || !group) return;
    group.clearLayers();

    const visibleBodies = waterBodies;
    for (const wb of visibleBodies) {
      const pts = wb.geometry.map((p) => [p.lat, p.lng] as [number, number]);
      const shape =
        wb.type === "river"
          ? L.polyline(pts, { color: WATER, weight: 4, opacity: 0.85 })
          : L.polygon(pts, { color: WATER, weight: 2, fillColor: WATER, fillOpacity: 0.25 });
      shape.bindTooltip(wb.name, { direction: "top" });
      shape.on("click", (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        cbs.current.onSelectWaterBody?.(wb);
      });
      group.addLayer(shape);

      if (layers.sources && wb.openIssues > 0) {
        group.addLayer(
          L.circle([wb.center.lat, wb.center.lng], {
            radius: 800 + wb.openIssues * 500,
            color: SEV_COLOR["critical"]!,
            weight: 0,
            fillColor: SEV_COLOR["critical"]!,
            fillOpacity: 0.18,
          }),
        );
      }
    }

    if (layers.issues && issues.length) {
      const cluster = (L as unknown as {
        markerClusterGroup: (o?: Record<string, unknown>) => L.LayerGroup;
      }).markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 45 });
      for (const issue of issues as Issue[]) {
        const marker = L.marker([issue.location.lat, issue.location.lng], {
          icon: issueIcon(issue.severity),
          title: issue.title,
          zIndexOffset: issue.id === selectedIssueId ? 1000 : 0,
        });
        marker.bindTooltip(`${issue.title} · ${issue.waterBodyName}`, { direction: "top" });
        marker.on("click", () => cbs.current.onSelectIssue?.(issue));
        cluster.addLayer(marker);
      }
      group.addLayer(cluster);
    }
  }, [waterBodies, issues, layers, selectedIssueId]);

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
        icon: issueIcon("high"),
      }).addTo(m);
    }
  }, [pin]);

  return (
    <div
      ref={el}
      className={cn("h-full w-full", className)}
      role="application"
      aria-label="Map of Nashik water bodies and reported issues"
    />
  );
}

export type { WaterBody };
