import type { BoundaryArea, Issue, LatLng, PollutionSource, Severity, WaterBody } from "@/types";
import type { MapLayerState } from "@/services/api/mapService";

export interface MapViewport {
  center: LatLng;
  zoom: number;
}

/** Anything on the map that a user can select. */
export type MapSelection =
  | { kind: "waterBody"; item: WaterBody }
  | { kind: "issue"; item: Issue }
  | { kind: "source"; item: PollutionSource }
  | { kind: "boundary"; item: BoundaryArea }
  | { kind: "cluster"; count: number; severity: Severity; issues: Issue[] };

export interface MapContainerProps {
  viewport: MapViewport;
  onViewportChange?: (v: MapViewport) => void;
  waterBodies: WaterBody[];
  issues: Issue[];
  sources?: PollutionSource[];
  boundaries?: BoundaryArea[];
  layers: MapLayerState;
  /** Current selection — the map highlights it and keeps it until cleared. */
  selection?: MapSelection | null;
  onSelect?: (selection: MapSelection) => void;
  onMapClick?: (point: LatLng) => void;
  pin?: LatLng | null;
  className?: string;
  interactive?: boolean;
  /** Fit the view to the selected geometry when the selection changes. */
  fitToSelection?: boolean;
}
