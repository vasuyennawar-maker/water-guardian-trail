import { Suspense, lazy } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { MapContainerProps, MapViewport } from "./types";

export type { MapContainerProps, MapViewport };

/**
 * Provider boundary. The real GIS surface (Leaflet + OpenStreetMap) is loaded
 * only in the browser — Leaflet touches `window` at import time, so it must
 * never enter the SSR module graph.
 */
const LeafletMap = lazy(() => import("./LeafletMap"));

function MapSkeleton({ className }: { className?: string }) {
  return <div className={cn("h-full w-full animate-pulse bg-muted", className)} aria-hidden />;
}

export function MapContainer(props: MapContainerProps) {
  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-water-soft", props.className)}>
      <ClientOnly fallback={<MapSkeleton />}>
        <Suspense fallback={<MapSkeleton />}>
          <LeafletMap {...props} />
        </Suspense>
      </ClientOnly>
    </div>
  );
}
