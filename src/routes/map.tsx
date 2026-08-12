import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { MapExplorer } from "@/components/map/MapExplorer";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Map — Digital Water Genome Nashik" },
      { name: "description", content: "Interactive map of Nashik District water bodies with issue markers, severity legend, layer controls and hotspot heat layer." },
      { property: "og:title", content: "Map — Digital Water Genome Nashik" },
      { property: "og:description", content: "Interactive map of Nashik District water bodies with issue markers, severity legend, layer controls and hotspot heat layer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <h1 className="sr-only">Map of Nashik District water bodies</h1>
      <MapExplorer />
    </div>
  );
}
