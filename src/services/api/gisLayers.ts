/**
 * Supplementary GIS layers for the existing Leaflet map: pollution sources and
 * administrative boundaries. These extend the single water-body / report
 * dataset in mockData.ts — they never duplicate it.
 *
 * All polygons here are PROTOTYPE APPROXIMATIONS drawn by hand, not surveyed
 * GeoJSON. The map labels them as approximate.
 */
import type { BoundaryArea, PollutionSource } from "@/types";

export const APPROX_BOUNDARY_NOTE = "Approximate prototype boundary — not a surveyed cadastral limit.";

const box = (lat: number, lng: number, dLat: number, dLng: number) => [
  { lat: lat + dLat, lng: lng - dLng },
  { lat: lat + dLat, lng: lng + dLng },
  { lat: lat - dLat, lng: lng + dLng },
  { lat: lat - dLat, lng: lng - dLng },
];

export const POLLUTION_SOURCES: PollutionSource[] = [
  {
    id: "src-tapovan-outfall",
    name: "Tapovan Nalla outfall",
    category: "sewage_outfall",
    status: "verified",
    location: { lat: 20.0121, lng: 73.8039 },
    waterBodyId: "wb-godavari",
    waterBodyName: "Godavari River",
    relatedIssueIds: [],
    lastVerifiedAt: "2026-07-18T09:20:00Z",
    note: "Untreated storm drain discharge entering the Godavari below Tapovan.",
  },
  {
    id: "src-satpur-effluent",
    name: "Satpur MIDC effluent channel",
    category: "industrial_effluent",
    status: "verified",
    location: { lat: 20.0068, lng: 73.7181 },
    waterBodyId: "wb-godavari",
    waterBodyName: "Godavari River",
    relatedIssueIds: [],
    lastVerifiedAt: "2026-06-29T11:05:00Z",
    note: "Industrial estate channel with recurring colour and odour complaints.",
  },
  {
    id: "src-ramkund-offerings",
    name: "Ramkund offering disposal point",
    category: "religious_offering",
    status: "suspected",
    location: { lat: 19.9993, lng: 73.7909 },
    waterBodyId: "wb-ramkund",
    waterBodyName: "Ramkund",
    relatedIssueIds: [],
    note: "Floral and cloth offerings accumulating on the ghat steps.",
  },
  {
    id: "src-niphad-runoff",
    name: "Niphad canal-side agricultural runoff",
    category: "agricultural_runoff",
    status: "suspected",
    location: { lat: 20.0708, lng: 74.0921 },
    waterBodyId: "wb-nandur",
    waterBodyName: "Nandur Madhmeshwar Wetland",
    relatedIssueIds: [],
    note: "Suspected fertiliser and pesticide wash-off ahead of the wetland.",
  },
  {
    id: "src-dindori-dump",
    name: "Dindori roadside waste dump",
    category: "solid_waste",
    status: "suspected",
    location: { lat: 20.1978, lng: 73.8341 },
    waterBodyId: "wb-kadva",
    waterBodyName: "Kadva River",
    relatedIssueIds: [],
    note: "Mixed solid waste tipped on the stream bank before the Kadva confluence.",
  },
  {
    id: "src-gangapur-canal-silt",
    name: "Gangapur canal siltation point",
    category: "other",
    status: "suspected",
    location: { lat: 20.0121, lng: 73.7188 },
    waterBodyId: "wb-gangapur-canal",
    waterBodyName: "Gangapur left-bank canal",
    relatedIssueIds: [],
    note: "Heavy silt load reducing canal carrying capacity.",
  },
];

export const SOURCE_CATEGORY_LABEL: Record<PollutionSource["category"], string> = {
  sewage_outfall: "Sewage outfall",
  industrial_effluent: "Industrial effluent",
  solid_waste: "Solid waste dumping",
  agricultural_runoff: "Agricultural runoff",
  religious_offering: "Religious offerings",
  other: "Other source",
};

export const BOUNDARIES: BoundaryArea[] = [
  // Taluka boundaries (approximate)
  { id: "tal-nashik-city", kind: "taluka", name: "Nashik City", polygon: box(19.999, 73.79, 0.085, 0.1), talukas: ["Nashik City"], note: APPROX_BOUNDARY_NOTE },
  { id: "tal-nashik", kind: "taluka", name: "Nashik", polygon: box(20.02, 73.68, 0.12, 0.12), talukas: ["Nashik"], note: APPROX_BOUNDARY_NOTE },
  { id: "tal-trimbak", kind: "taluka", name: "Trimbakeshwar", polygon: box(19.94, 73.53, 0.12, 0.12), talukas: ["Trimbakeshwar"], note: APPROX_BOUNDARY_NOTE },
  { id: "tal-igatpuri", kind: "taluka", name: "Igatpuri", polygon: box(19.72, 73.58, 0.13, 0.13), talukas: ["Igatpuri"], note: APPROX_BOUNDARY_NOTE },
  { id: "tal-dindori", kind: "taluka", name: "Dindori", polygon: box(20.21, 73.85, 0.14, 0.15), talukas: ["Dindori"], note: APPROX_BOUNDARY_NOTE },
  { id: "tal-niphad", kind: "taluka", name: "Niphad", polygon: box(20.08, 74.1, 0.13, 0.16), talukas: ["Niphad"], note: APPROX_BOUNDARY_NOTE },
  { id: "tal-kalwan", kind: "taluka", name: "Kalwan", polygon: box(20.5, 73.93, 0.14, 0.14), talukas: ["Kalwan"], note: APPROX_BOUNDARY_NOTE },
  { id: "tal-baglan", kind: "taluka", name: "Baglan", polygon: box(20.66, 74.16, 0.15, 0.16), talukas: ["Baglan"], note: APPROX_BOUNDARY_NOTE },

  // Catchment boundaries (approximate)
  { id: "cat-upper-godavari", kind: "catchment", name: "Upper Godavari catchment", polygon: box(19.99, 73.7, 0.22, 0.3), talukas: ["Nashik City", "Nashik", "Trimbakeshwar"], note: APPROX_BOUNDARY_NOTE },
  { id: "cat-darna", kind: "catchment", name: "Darna sub-catchment", polygon: box(19.79, 73.62, 0.18, 0.2), talukas: ["Igatpuri", "Nashik / Igatpuri"], note: APPROX_BOUNDARY_NOTE },
  { id: "cat-kadva", kind: "catchment", name: "Kadva sub-catchment", polygon: box(20.16, 73.98, 0.2, 0.28), talukas: ["Dindori", "Niphad"], note: APPROX_BOUNDARY_NOTE },

  // Department jurisdictions (approximate)
  { id: "jur-nmc", kind: "jurisdiction", name: "Nashik Municipal Corporation", department: "Nashik Municipal Corporation", polygon: box(19.999, 73.79, 0.1, 0.13), talukas: ["Nashik City"], note: APPROX_BOUNDARY_NOTE },
  { id: "jur-irrigation", kind: "jurisdiction", name: "Water Resources / Irrigation Department", department: "Water Resources Department", polygon: box(19.92, 73.62, 0.25, 0.24), talukas: ["Nashik", "Trimbakeshwar", "Igatpuri"], note: APPROX_BOUNDARY_NOTE },
  { id: "jur-mpcb", kind: "jurisdiction", name: "Maharashtra Pollution Control Board — Nashik", department: "Maharashtra Pollution Control Board", polygon: box(20.15, 74.02, 0.24, 0.3), talukas: ["Dindori", "Niphad", "Kalwan"], note: APPROX_BOUNDARY_NOTE },
];

export const BOUNDARY_KIND_LABEL: Record<BoundaryArea["kind"], string> = {
  taluka: "Taluka boundary",
  catchment: "Catchment boundary",
  jurisdiction: "Department jurisdiction",
};
