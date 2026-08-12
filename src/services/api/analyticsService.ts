import type { AnalyticsBundle } from "@/types";
import { ISSUES, WATER_BODIES } from "./mockData";
import { CATEGORY_LABEL, SEVERITY_LABEL } from "@/utils/format";
import { request } from "./client";

/** All figures are illustrative sample data, not official statistics. */
export const analyticsService = {
  async bundle(): Promise<AnalyticsBundle> {
    return request("/analytics", () => {
      const byCategory = Object.entries(
        ISSUES.reduce<Record<string, number>>((acc, i) => {
          acc[CATEGORY_LABEL[i.category]] = (acc[CATEGORY_LABEL[i.category]] ?? 0) + 1;
          return acc;
        }, {}),
      ).map(([category, count]) => ({ category, count }));

      const bySeverity = Object.entries(
        ISSUES.reduce<Record<string, number>>((acc, i) => {
          acc[SEVERITY_LABEL[i.severity]] = (acc[SEVERITY_LABEL[i.severity]] ?? 0) + 1;
          return acc;
        }, {}),
      ).map(([severity, count]) => ({ severity, count }));

      return {
        overTime: [
          { month: "Feb", reported: 18, resolved: 11 },
          { month: "Mar", reported: 24, resolved: 15 },
          { month: "Apr", reported: 21, resolved: 18 },
          { month: "May", reported: 29, resolved: 20 },
          { month: "Jun", reported: 34, resolved: 26 },
          { month: "Jul", reported: 31, resolved: 24 },
          { month: "Aug", reported: 17, resolved: 9 },
        ],
        byCategory,
        bySeverity,
        byWaterBody: WATER_BODIES.map((w) => ({ name: w.name, count: w.openIssues + w.resolvedIssues })),
        hotspots: WATER_BODIES.filter((w) => w.openIssues >= 4).map((w) => ({
          name: w.name,
          center: w.center,
          intensity: Math.min(1, w.openIssues / 10),
        })),
        resolutionRatePct: 68,
        avgResolutionDays: 12.4,
        active: WATER_BODIES.reduce((n, w) => n + w.openIssues, 0),
        resolved: WATER_BODIES.reduce((n, w) => n + w.resolvedIssues, 0),
      };
    });
  },
};
