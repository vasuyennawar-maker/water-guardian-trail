// Domain types. Shaped to mirror what a REST (FastAPI) backend would return,
// so services/api/* can swap mocks for real HTTP calls with no UI changes.

export type Role = "public" | "citizen" | "verifier" | "authority" | "admin";

export type IssueStatus =
  | "reported"
  | "under_verification"
  | "verified"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "rejected";

export type Severity = "low" | "medium" | "high" | "critical";

export type WaterBodyType = "river" | "dam" | "lake" | "pond" | "reservoir";

export type IssueCategory =
  | "waste_dumping"
  | "sewage_discharge"
  | "industrial_pollution"
  | "ecological_concern"
  | "plastic_waste"
  | "encroachment"
  | "illegal_discharge"
  | "water_obstruction"
  | "other";

export interface LatLng {
  lat: number;
  lng: number;
}

/** Region is data, not architecture: geography can extend past Nashik later. */
export interface Region {
  id: string;
  name: string;
  state: string;
  country: string;
  center: LatLng;
  defaultZoom: number;
}

export interface WaterBody {
  id: string;
  name: string;
  localName?: string;
  type: WaterBodyType;
  regionId: string;
  taluka: string;
  center: LatLng;
  /** Polygon ring for area bodies; polyline for rivers. */
  geometry: LatLng[];
  areaSqKm?: number;
  lengthKm?: number;
  healthScore: number; // 0-100, mock indicator
  openIssues: number;
  resolvedIssues: number;
  lastSurveyedAt: string;
  description: string;
  imageUrl?: string;
}

export interface Evidence {
  id: string;
  url: string;
  caption?: string;
  capturedAt: string;
}

export interface AIAssessment {
  possibleIssue: string;
  estimatedSeverity: Severity;
  possibleCause: string;
  confidence: number; // 0-1
  reason: string;
  model: string;
  generatedAt: string;
}

export interface TimelineEvent {
  id: string;
  stage: IssueStatus | "ai_analyzed";
  label: string;
  actor: string;
  note?: string;
  at: string;
}

export interface Issue {
  id: string; // human-readable report ID e.g. DWG-NSK-2026-0142
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  severity: Severity;
  waterBodyId: string;
  waterBodyName: string;
  location: LatLng;
  locationLabel: string;
  reportedBy: string;
  reportedAt: string;
  updatedAt: string;
  evidence: Evidence[];
  ai?: AIAssessment;
  verificationNote?: string;
  assignedDepartment?: string;
  actionNotes?: string[];
  resolutionEvidence?: Evidence[];
  timeline: TimelineEvent[];
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  department?: string;
  active: boolean;
  joinedAt: string;
  reportsSubmitted?: number;
}

export interface Department {
  id: string;
  name: string;
  contact: string;
  responsibility: string;
  openAssignments: number;
  members: number;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
  kind: "status" | "assignment" | "system";
  issueId?: string;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  at: string;
  ip: string;
}

export interface AnalyticsBundle {
  overTime: { month: string; reported: number; resolved: number }[];
  byCategory: { category: string; count: number }[];
  bySeverity: { severity: string; count: number }[];
  byWaterBody: { name: string; count: number }[];
  hotspots: { name: string; center: LatLng; intensity: number }[];
  resolutionRatePct: number;
  avgResolutionDays: number;
  active: number;
  resolved: number;
}
