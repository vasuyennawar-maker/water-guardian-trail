import type { AppNotification } from "@/types";
import { NOTIFICATIONS } from "./mockData";
import { request } from "./client";

export const notificationService = {
  async list(): Promise<AppNotification[]> {
    return request("/notifications", () =>
      [...NOTIFICATIONS].sort((a, b) => +new Date(b.at) - +new Date(a.at)),
    );
  },
  async markAllRead() {
    return request("/notifications/read-all", () => ({ ok: true }), 300);
  },
};
