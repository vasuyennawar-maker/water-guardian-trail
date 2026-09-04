import type { BoundaryArea, Issue, LatLng, PollutionSource, Region, WaterBody, WaterBodyType } from "@/types";
import { NASHIK, WATER_BODIES, WATER_PATHS } from "./mockData";
import { BOUNDARIES, POLLUTION_SOURCES } from "./gisLayers";
import { allIssues } from "./reportStore";
import { request } from "./client";

/**
 * Map data access. The app renders geometry through a provider-agnostic
 * MapContainer, so a real provider (Mapbox / Leaflet / Google Maps) can be
 * introduced here and inside MapContainer only.
 */
export interface MapLayerState {
  /** Major rivers */
  majorRivers: boolean;
  /** Tributaries and streams */
  tributaries: boolean;
  /** Lakes, wetlands, ponds and kunds */
  waterbodies: boolean;
  /** Dams and reservoirs */
  dams: boolean;
  /** Drains and canals */
  channels: boolean;
  /** Citizen-reported issue markers */
  citizenIssues: boolean;
  /** Field-verified issue markers */
  verifiedIssues: boolean;
  /** Suspected pollution sources */
  suspectedSources: boolean;
  /** Verified pollution sources */
  verifiedSources: boolean;
  /** Catchment boundaries */
  catchments: boolean;
  /** Taluka boundaries */
  talukas: boolean;
  /** Department jurisdictions */
  jurisdictions: boolean;
  /** Include non-featured secondary bodies (e.g. Chankapur, Waldevi, Mukane) */
  showAll: boolean;
}

export const DEFAULT_LAYERS: MapLayerState = {
  majorRivers: true,
  tributaries: true,
  waterbodies: true,
  dams: true,
  channels: true,
  citizenIssues: true,
  verifiedIssues: true,
  suspectedSources: false,
  verifiedSources: false,
  catchments: false,
  talukas: false,
  jurisdictions: false,
  showAll: false,
};

export const LAYER_LABELS: Record<keyof MapLayerState, string> = {
  majorRivers: "Major rivers",
  tributaries: "Tributaries and streams",
  waterbodies: "Lakes, wetlands, ponds and kunds",
  dams: "Dams and reservoirs",
  channels: "Drains and canals",
  citizenIssues: "Citizen-reported issues",
  verifiedIssues: "Field-verified issues",
  suspectedSources: "Suspected pollution sources",
  verifiedSources: "Verified pollution sources",
  catchments: "Catchment boundaries",
  talukas: "Taluka boundaries",
  jurisdictions: "Department jurisdictions",
  showAll: "Show all water bodies",
};

/** Layer toggles grouped for the map's layer control. */
export const LAYER_GROUPS: { title: string; keys: (keyof MapLayerState)[] }[] = [
  { title: "Water network", keys: ["majorRivers", "tributaries", "waterbodies", "dams", "channels"] },
  { title: "Reports", keys: ["citizenIssues", "verifiedIssues"] },
  { title: "Pollution sources", keys: ["suspectedSources", "verifiedSources"] },
  { title: "Boundaries", keys: ["catchments", "talukas", "jurisdictions"] },
  { title: "Coverage", keys: ["showAll"] },
];

/** Maps a water-body type onto the layer toggle that controls it. */
export function layerForType(t: WaterBodyType): keyof MapLayerState {
  if (t === "river") return "majorRivers";
  if (t === "tributary" || t === "stream") return "tributaries";
  if (t === "drain" || t === "canal") return "channels";
  if (t === "dam" || t === "reservoir") return "dams";
  return "waterbodies";
}

/** Boundary layer key for a boundary record. */
export function layerForBoundary(kind: BoundaryArea["kind"]): keyof MapLayerState {
  return kind === "taluka" ? "talukas" : kind === "catchment" ? "catchments" : "jurisdictions";
}

/** Issue markers that the current layer toggles allow. */
export function visibleIssues(issues: Issue[], layers: MapLayerState): Issue[] {
  return issues.filter((i) => {
    const verified = i.verificationStatus === "verified" ||
      ["verified", "assigned", "in_progress", "resolved"].includes(i.status);
    return verified ? layers.verifiedIssues : layers.citizenIssues;
  });
}

export function visibleSources(sources: PollutionSource[], layers: MapLayerState): PollutionSource[] {
  return sources.filter((s) => (s.status === "verified" ? layers.verifiedSources : layers.suspectedSources));
}

export function visibleBoundaries(boundaries: BoundaryArea[], layers: MapLayerState): BoundaryArea[] {
  return boundaries.filter((b) => layers[layerForBoundary(b.kind)]);
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
  async features(): Promise<{
    waterBodies: WaterBody[];
    issues: Issue[];
    sources: PollutionSource[];
    boundaries: BoundaryArea[];
  }> {
    return request("/map/features", () => {
      const issues = allIssues();
      const sources = POLLUTION_SOURCES.map((s) => ({
        ...s,
        relatedIssueIds: issues.filter((i) => i.waterBodyId === s.waterBodyId).map((i) => i.id).slice(0, 4),
      }));
      return { waterBodies: WATER_BODIES, issues, sources, boundaries: BOUNDARIES };
    });
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
