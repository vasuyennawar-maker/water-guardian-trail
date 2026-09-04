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

export type WaterBodyType =
  | "river"
  | "tributary"
  | "stream"
  | "drain"
  | "canal"
  | "dam"
  | "reservoir"
  | "lake"
  | "wetland"
  | "pond"
  | "kund";

export type IssueCategory =
  | "waste_dumping"
  | "sewage_discharge"
  | "industrial_pollution"
  | "ecological_concern"
  | "plastic_waste"
  | "encroachment"
  | "illegal_discharge"
  | "water_obstruction"
  | "agricultural_runoff"
  | "siltation"
  | "water_hyacinth"
  | "religious_waste"
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
  /** Optional enrichment fields — all safe-optional so older records still render. */
  riverBasin?: string;
  responsibleDepartment?: string;
  pressures?: string[];
  upstream?: { name: string; kind: string }[];
  downstream?: { name: string; kind: string }[];
  lastInspectionAt?: string;
  illustrative?: boolean;
  /** Featured bodies are the default map view; others appear under "Show all". */
  featured?: boolean;
  /** Note shown when geometry is hand-approximated rather than surveyed GeoJSON. */
  geometryNote?: string;
  condition?: "good" | "fair" | "poor" | "critical";
  /** Graph edges used by the Water Genome / Trace Water Path feature. */
  upstreamIds?: string[];
  downstreamIds?: string[];
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
  /** Optional explainability fields. */
  priorityScore?: number; // 0-100
  evidenceConsidered?: string[];
  priorityFactors?: { label: string; points: number; note?: string }[];
  suggestedDepartment?: string;
  recommendedChecks?: string[];
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
  /** Full multi-select list; `category` stays the primary for API compatibility. */
  categories?: IssueCategory[];
  status: IssueStatus;
  verificationStatus?: "pending" | "in_review" | "verified" | "rejected";
  assignedVerifierId?: string | null;
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
  assignedVerifier?: string;
  dueAt?: string;
  statusReason?: string;
  resolutionRemarks?: string;
  assignmentHistory?: { at: string; from?: string; to: string; by: string }[];
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
  overdueAssignments?: number;
  resolvedAssignments?: number;
  medianResolutionDays?: number;
  slaCompliancePct?: number;
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

/* ---------------------------------------------------------------------------
 * GIS layer additions: pollution sources and administrative boundaries.
 * ------------------------------------------------------------------------ */

export type PollutionSourceCategory =
  | "sewage_outfall"
  | "industrial_effluent"
  | "solid_waste"
  | "agricultural_runoff"
  | "religious_offering"
  | "other";

export interface PollutionSource {
  id: string;
  name: string;
  category: PollutionSourceCategory;
  status: "suspected" | "verified";
  location: LatLng;
  waterBodyId: string;
  waterBodyName: string;
  relatedIssueIds: string[];
  lastVerifiedAt?: string;
  note?: string;
}

export type BoundaryKind = "taluka" | "catchment" | "jurisdiction";

export interface BoundaryArea {
  id: string;
  kind: BoundaryKind;
  name: string;
  /** Department shown for jurisdiction boundaries. */
  department?: string;
  polygon: LatLng[];
  /** Talukas contained/covered — used to count active issues in the area. */
  talukas: string[];
  note?: string;
}

/* ---------------------------------------------------------------------------
 * Field verification record (Field Verifier workflow).
 * ------------------------------------------------------------------------ */

export interface FieldVerification {
  issueId: string;
  decision: "verified" | "rejected" | "inconclusive";
  visitedAt: string;
  waterBodyId: string;
  waterBodyName: string;
  confirmedSeverity: Severity;
  confirmedCategories: IssueCategory[];
  observations: string;
  correctedLocation?: LatLng;
  evidence: Evidence[];
  suggestedDepartment?: string;
  labTestingRequested: boolean;
  remarks?: string;
  verifierName: string;
  recordedAt: string;
}

/* ---------------------------------------------------------------------------
 * Community discussion (public observations — NOT official reports).
 * ------------------------------------------------------------------------ */

export interface CommunityComment {
  id: string;
  postId: string;
  authorName: string;
  authorRole: Role;
  body: string;
  at: string;
  official?: boolean;
  hidden?: boolean;
}

export interface CommunityPost {
  id: string;
  waterBodyId: string;
  waterBodyName: string;
  authorName: string;
  authorRole: Role;
  title: string;
  body: string;
  imageUrl?: string;
  linkedIssueId?: string;
  at: string;
  likes: number;
  likedByMe?: boolean;
  /** Only verifier/authority authors may mark an update as verified. */
  verifiedUpdate?: boolean;
  reported?: boolean;
  reportCount?: number;
  hidden?: boolean;
  comments: CommunityComment[];
}
