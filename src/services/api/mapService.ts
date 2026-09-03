import type { Issue, LatLng, Region, WaterBody, WaterBodyType } from "@/types";
import { NASHIK, WATER_BODIES, WATER_PATHS } from "./mockData";
import { allIssues } from "./reportStore";
import { request } from "./client";

/**
 * Map data access. The app renders geometry through a provider-agnostic
 * MapContainer, so a real provider (Mapbox / Leaflet / Google Maps) can be
 * introduced here and inside MapContainer only.
 */
export interface MapLayerState {
  /** Rivers and tributaries */
  rivers: boolean;
  /** Lakes, wetlands, ponds and kunds */
  waterbodies: boolean;
  /** Dams and reservoirs */
  dams: boolean;
  /** Streams, drains and canals */
  channels: boolean;
  /** Pollution reports (issue markers) */
  issues: boolean;
  /** Pollution sources (drain outfalls / hotspot circles) */
  sources: boolean;
  /** Catchment boundaries */
  catchments: boolean;
  /** Include non-featured secondary bodies (e.g. Chankapur, Waldevi, Mukane) */
  showAll: boolean;
}

export const DEFAULT_LAYERS: MapLayerState = {
  rivers: true,
  waterbodies: true,
  dams: true,
  channels: true,
  issues: true,
  sources: false,
  catchments: false,
  showAll: false,
};

export const LAYER_LABELS: Record<keyof MapLayerState, string> = {
  rivers: "Rivers and tributaries",
  waterbodies: "Lakes, wetlands, ponds and kunds",
  dams: "Dams and reservoirs",
  channels: "Streams, drains and canals",
  issues: "Pollution reports",
  sources: "Pollution sources",
  catchments: "Catchment boundaries",
  showAll: "Show all water bodies",
};

/** Maps a water-body type onto the layer toggle that controls it. */
export function layerForType(t: WaterBodyType): keyof MapLayerState {
  if (t === "river" || t === "tributary") return "rivers";
  if (t === "stream" || t === "drain" || t === "canal") return "channels";
  if (t === "dam" || t === "reservoir") return "dams";
  return "waterbodies";
}

/** Applies the layer toggles + featured/show-all rule to a body list. */
export function visibleBodies(bodies: WaterBody[], layers: MapLayerState): WaterBody[] {
  return bodies.filter(
    (w) => layers[layerForType(w.type)] && (layers.showAll || w.featured !== false),
  );
}

export const mapService = {
  async region(): Promise<Region> {
    return request("/map/region", () => NASHIK);
  },
  async features(): Promise<{ waterBodies: WaterBody[]; issues: Issue[] }> {
    return request("/map/features", () => ({ waterBodies: WATER_BODIES, issues: allIssues() }));
  },
  /** MOCK geolocation label lookup (a real backend would reverse geocode). */
  async reverseGeocode(point: LatLng): Promise<string> {
    return request("/map/reverse-geocode", () => {
      const nearest = [...WATER_BODIES].sort(
        (a, b) => dist(a.center, point) - dist(b.center, point),
      )[0]!;
      return `Near ${nearest.name}, ${nearest.taluka}`;
    }, 400);
  },
  /** Upstream / downstream trace for the "Trace Water Path" action. */
  trace(id: string): { current: WaterBody | null; upstream: WaterBody[]; downstream: WaterBody[]; paths: typeof WATER_PATHS } {
    const byId = (x: string) => WATER_BODIES.find((w) => w.id === x) ?? null;
    const current = byId(id);
    return {
      current,
      upstream: (current?.upstreamIds ?? []).map(byId).filter(Boolean) as WaterBody[],
      downstream: (current?.downstreamIds ?? []).map(byId).filter(Boolean) as WaterBody[],
      paths: WATER_PATHS.filter((p) => p.bodyIds.includes(id)),
    };
  },
  nearestWaterBody(point: LatLng): WaterBody {
    return [...WATER_BODIES].sort((a, b) => dist(a.center, point) - dist(b.center, point))[0]!;
  },
};

function dist(a: LatLng, b: LatLng) {
  return Math.hypot(a.lat - b.lat, a.lng - b.lng);
}
