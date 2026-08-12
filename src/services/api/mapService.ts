import type { Issue, LatLng, Region, WaterBody } from "@/types";
import { ISSUES, NASHIK, WATER_BODIES } from "./mockData";
import { request } from "./client";

/**
 * Map data access. The app renders geometry through a provider-agnostic
 * MapContainer, so a real provider (Mapbox / Leaflet / Google Maps) can be
 * introduced here and inside MapContainer only.
 */
export interface MapLayerState {
  river: boolean;
  dam: boolean;
  lake: boolean;
  pond: boolean;
  reservoir: boolean;
  issues: boolean;
  heatmap: boolean;
}

export const DEFAULT_LAYERS: MapLayerState = {
  river: true,
  dam: true,
  lake: true,
  pond: true,
  reservoir: true,
  issues: true,
  heatmap: false,
};

export const mapService = {
  async region(): Promise<Region> {
    return request("/map/region", () => NASHIK);
  },
  async features(): Promise<{ waterBodies: WaterBody[]; issues: Issue[] }> {
    return request("/map/features", () => ({ waterBodies: WATER_BODIES, issues: ISSUES }));
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
  nearestWaterBody(point: LatLng): WaterBody {
    return [...WATER_BODIES].sort((a, b) => dist(a.center, point) - dist(b.center, point))[0]!;
  },
};

function dist(a: LatLng, b: LatLng) {
  return Math.hypot(a.lat - b.lat, a.lng - b.lng);
}
