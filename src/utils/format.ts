import type { IssueCategory, IssueStatus, Severity, WaterBodyType } from "@/types";

export const STATUS_LABEL: Record<IssueStatus, string> = {
  reported: "Reported",
  under_verification: "Under Verification",
  verified: "Verified",
  assigned: "Assigned",
  in_progress: "In Progress",
  resolved: "Resolved",
  rejected: "Rejected",
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const CATEGORY_LABEL: Record<IssueCategory, string> = {
  waste_dumping: "Waste dumping",
  sewage_discharge: "Sewage discharge",
  industrial_pollution: "Industrial pollution",
  ecological_concern: "Dead fish / ecological concern",
  plastic_waste: "Plastic waste",
  encroachment: "Encroachment",
  illegal_discharge: "Illegal discharge",
  water_obstruction: "Water obstruction",
  agricultural_runoff: "Agricultural runoff",
  siltation: "Siltation",
  water_hyacinth: "Water hyacinth",
  religious_waste: "Religious / floral waste",
  other: "Other",
};

export const WATER_BODY_LABEL: Record<WaterBodyType, string> = {
  river: "River",
  tributary: "Tributary",
  stream: "Stream",
  drain: "Drain",
  canal: "Canal",
  dam: "Dam",
  reservoir: "Reservoir",
  lake: "Lake",
  wetland: "Wetland",
  pond: "Pond",
  kund: "Kund",
};

/** Grouping used by the layers panel and the report-form water-body combobox. */
export const WATER_BODY_GROUP: Record<WaterBodyType, string> = {
  river: "Rivers",
  tributary: "Tributaries",
  stream: "Streams, drains & canals",
  drain: "Streams, drains & canals",
  canal: "Streams, drains & canals",
  dam: "Dams & reservoirs",
  reservoir: "Dams & reservoirs",
  lake: "Lakes & wetlands",
  wetland: "Lakes & wetlands",
  pond: "Ponds & kunds",
  kund: "Ponds & kunds",
};

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeAge(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  return `${Math.floor(days / 30)} mo ago`;
}

export function formatCoords({ lat, lng }: { lat: number; lng: number }) {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}
