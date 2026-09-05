import type { FieldVerification, Issue, IssueCategory, IssueStatus, Severity } from "@/types";
import { addIssue, allIssues, notifyReportsChanged, updateIssue } from "./reportStore";
import { request } from "./client";

export interface IssueQuery {
  status?: IssueStatus | "all" | "pending";
  severity?: Severity | "all";
  waterBodyId?: string;
  search?: string;
  reportedBy?: string;
  sort?: "recent" | "severity" | "age" | "location";
}

const SEV_ORDER: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export const issueService = {
  async list(q: IssueQuery = {}): Promise<Issue[]> {
    return request("/issues", () => {
      let rows = [...allIssues()];
      if (q.status && q.status !== "all") {
        if (q.status === "pending") rows = rows.filter((i) => i.status === "reported");
        else rows = rows.filter((i) => i.status === q.status);
      }
      if (q.severity && q.severity !== "all") rows = rows.filter((i) => i.severity === q.severity);
      if (q.waterBodyId) rows = rows.filter((i) => i.waterBodyId === q.waterBodyId);
      if (q.reportedBy) rows = rows.filter((i) => i.reportedBy === q.reportedBy);
      if (q.search) {
        const s = q.search.toLowerCase();
        rows = rows.filter(
          (i) =>
            i.title.toLowerCase().includes(s) ||
            i.id.toLowerCase().includes(s) ||
            i.waterBodyName.toLowerCase().includes(s),
        );
      }
      if (q.sort === "severity") rows.sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);
      else if (q.sort === "age") rows.sort((a, b) => +new Date(a.reportedAt) - +new Date(b.reportedAt));
      else if (q.sort === "location") rows.sort((a, b) => a.waterBodyName.localeCompare(b.waterBodyName));
      else rows.sort((a, b) => +new Date(b.reportedAt) - +new Date(a.reportedAt));
      return rows;
    });
  },

  async get(id: string): Promise<Issue> {
    return request("/issues/" + id, () => {
      const found = allIssues().find((i) => i.id === id);
      if (!found) throw new Error(`Report ${id} could not be found.`);
      return found;
    });
  },

  /**
   * Verification queues. `pending` holds every unassigned report awaiting a
   * field decision; `mine` holds reports claimed by this verifier; `completed`
   * holds reports this verifier has already decided.
   */
  async verificationQueue(verifierId?: string): Promise<{
    pending: Issue[];
    mine: Issue[];
    completed: Issue[];
  }> {
    return request("/issues/verification-queue", () => {
      const rows = allIssues();
      const bySeverity = (a: Issue, b: Issue) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity];
      const open = rows.filter(
        (i) => i.status === "reported" || i.status === "under_verification",
      );
      return {
        pending: open.filter((i) => !i.assignedVerifierId).sort(bySeverity),
        mine: open.filter((i) => verifierId && i.assignedVerifierId === verifierId).sort(bySeverity),
        completed: rows
          .filter(
            (i) =>
              (i.verificationStatus === "verified" || i.verificationStatus === "rejected") &&
              (!verifierId || i.assignedVerifierId === verifierId),
          )
          .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
          .slice(0, 25),
      };
    });
  },

  /** Claim a report so it moves out of the general queue into "Assigned to me". */
  async startVerification(id: string, verifierId: string, verifierName: string) {
    return request("/issues/" + id + "/start-verification", () => {
      const issue = allIssues().find((i) => i.id === id);
      updateIssue(id, {
        status: "under_verification",
        verificationStatus: "in_review",
        assignedVerifierId: verifierId,
        timeline: [
          ...(issue?.timeline ?? []),
          {
            id: `t-${Date.now()}`,
            stage: "under_verification",
            label: "Verification started",
            actor: verifierName,
            at: new Date().toISOString(),
          },
        ],
      });
      return { id };
    }, 400);
  },

  /** Persist a completed field verification onto the shared report. */
  async recordVerification(v: FieldVerification) {
    return request("/issues/" + v.issueId + "/field-verification", () => {
      const issue = allIssues().find((i) => i.id === v.issueId);
      const status: IssueStatus = v.decision === "verified" ? "verified" : v.decision === "rejected" ? "rejected" : "under_verification";
      updateIssue(v.issueId, {
        status,
        verificationStatus:
          v.decision === "verified" ? "verified" : v.decision === "rejected" ? "rejected" : "in_review",
        severity: v.confirmedSeverity,
        category: v.confirmedCategories[0] ?? issue?.category ?? "other",
        categories: v.confirmedCategories,
        ...(v.correctedLocation ? { location: v.correctedLocation } : {}),
        verificationNote: v.observations,
        evidence: [...(issue?.evidence ?? []), ...v.evidence],
        fieldVerification: v,
        timeline: [
          ...(issue?.timeline ?? []),
          {
            id: `t-${Date.now()}`,
            stage: status === "rejected" ? "rejected" : status,
            label:
              v.decision === "verified"
                ? "Field-verified"
                : v.decision === "rejected"
                  ? "Rejected after field visit"
                  : "Field visit inconclusive",
            actor: v.verifierName,
            note: v.observations,
            at: v.recordedAt,
          },
        ],
      });
      return { id: v.issueId };
    }, 600);
  },

  async citizenStats(reporter: string) {
    return request("/issues/stats/citizen", () => {
      const mine = allIssues().filter((i) => i.reportedBy === reporter);
      return {
        submitted: mine.length,
        underVerification: mine.filter((i) => ["reported", "under_verification"].includes(i.status)).length,
        underAction: mine.filter((i) => ["verified", "assigned", "in_progress"].includes(i.status)).length,
        resolved: mine.filter((i) => i.status === "resolved").length,
      };
    });
  },

  async authorityStats() {
    return request("/issues/stats/authority", () => ({
      needsActionToday: allIssues().filter(
        (i) => ["verified", "assigned"].includes(i.status) && ["high", "critical"].includes(i.severity),
      ).length,
      awaitingVerification: allIssues().filter((i) =>
        ["reported", "under_verification"].includes(i.status),
      ).length,
      inProgress: allIssues().filter((i) => i.status === "in_progress").length,
      resolvedThisMonth: allIssues().filter((i) => i.status === "resolved").length,
    }));
  },

  /**
   * Creates a report in the SHARED store so it is instantly visible to the
   * citizen dashboard, verification queue, authority list, map and analytics.
   * MOCK persistence (localStorage) — swap for a POST when the API exists.
   */
  async submit(draft: Partial<Issue> & { categories?: IssueCategory[] }): Promise<{ id: string; submittedAt: string }> {
    return request(
      "/issues",
      () => {
        const now = new Date().toISOString();
        const id = draft.id ?? `DWG-NSK-2026-0${160 + Math.floor(Math.random() * 39)}`;
        const issue: Issue = {
          id,
          title: draft.title ?? (draft.description ?? "Citizen report").slice(0, 70),
          description: draft.description ?? "",
          category: draft.category ?? "other",
          ...(draft.categories ? { categories: draft.categories } : {}),
          status: "reported",
          verificationStatus: "pending",
          assignedVerifierId: null,
          severity: draft.severity ?? "medium",
          waterBodyId: draft.waterBodyId ?? "",
          waterBodyName: draft.waterBodyName ?? "Unassigned water body",
          location: draft.location ?? { lat: 19.9975, lng: 73.7898 },
          locationLabel: draft.locationLabel ?? "Nashik District",
          reportedBy: draft.reportedBy ?? "You",
          reportedAt: now,
          updatedAt: now,
          evidence: draft.evidence ?? [],
          timeline: [
            { id: "t1", stage: "reported", label: "Reported", actor: draft.reportedBy ?? "You", at: now },
          ],
        };
        addIssue(issue);
        return { id, submittedAt: now };
      },
      700,
    );
  },
  async verify(id: string, decision: "verify" | "reject" | "more_info", note: string) {
    return request("/issues/" + id + "/verify", () => {
      const status = decision === "verify" ? "verified" : decision === "reject" ? "rejected" : "under_verification";
      updateIssue(id, {
        status,
        verificationStatus: decision === "verify" ? "verified" : decision === "reject" ? "rejected" : "in_review",
        verificationNote: note,
      });
      return { id, decision, note };
    }, 500);
  },
  async assign(id: string, department: string) {
    return request("/issues/" + id + "/assign", () => {
      updateIssue(id, { status: "assigned", assignedDepartment: department });
      return { id, department };
    }, 500);
  },
  async act(id: string, note: string) {
    return request("/issues/" + id + "/action", () => {
      updateIssue(id, { status: "in_progress" });
      notifyReportsChanged();
      return { id, note };
    }, 500);
  },
  async resolve(id: string, note: string) {
    return request("/issues/" + id + "/resolve", () => {
      updateIssue(id, { status: "resolved", resolutionRemarks: note });
      return { id, note };
    }, 500);
  },
};
