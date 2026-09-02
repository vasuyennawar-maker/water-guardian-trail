import type { Issue, LatLng, WaterBody } from "@/types";
import type { MapLayerState } from "@/services/api/mapService";

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
