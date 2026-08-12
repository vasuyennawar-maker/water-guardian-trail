import type { WaterBody } from "@/types";
import { WATER_BODIES } from "./mockData";
import { request } from "./client";

export interface WaterBodyQuery {
  search?: string;
  type?: string;
  taluka?: string;
  sort?: "name" | "health" | "issues";
}

export const waterBodyService = {
  async list(q: WaterBodyQuery = {}): Promise<WaterBody[]> {
    return request("/water-bodies", () => {
      let rows = [...WATER_BODIES];
      if (q.search) {
        const s = q.search.toLowerCase();
        rows = rows.filter(
          (w) => w.name.toLowerCase().includes(s) || w.taluka.toLowerCase().includes(s),
        );
      }
      if (q.type && q.type !== "all") rows = rows.filter((w) => w.type === q.type);
      if (q.taluka && q.taluka !== "all") rows = rows.filter((w) => w.taluka === q.taluka);
      if (q.sort === "health") rows.sort((a, b) => a.healthScore - b.healthScore);
      else if (q.sort === "issues") rows.sort((a, b) => b.openIssues - a.openIssues);
      else rows.sort((a, b) => a.name.localeCompare(b.name));
      return rows;
    });
  },
  async get(id: string): Promise<WaterBody> {
    return request("/water-bodies/" + id, () => {
      const wb = WATER_BODIES.find((w) => w.id === id);
      if (!wb) throw new Error(`Water body ${id} could not be found.`);
      return wb;
    });
  },
  async talukas(): Promise<string[]> {
    return request("/water-bodies/talukas", () =>
      Array.from(new Set(WATER_BODIES.map((w) => w.taluka))).sort(),
    );
  },
  async stats() {
    return request("/water-bodies/stats", () => ({
      total: WATER_BODIES.length,
      monitored: WATER_BODIES.length,
      openIssues: WATER_BODIES.reduce((n, w) => n + w.openIssues, 0),
      resolvedIssues: WATER_BODIES.reduce((n, w) => n + w.resolvedIssues, 0),
    }));
  },
};
