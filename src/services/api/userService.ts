import type { AppUser, AuditLogEntry, Department, Role } from "@/types";
import { AUDIT_LOG, DEPARTMENTS, USERS } from "./mockData";
import { request } from "./client";

export const userService = {
  async list(): Promise<AppUser[]> {
    return request("/users", () => [...USERS]);
  },
  async departments(): Promise<Department[]> {
    return request("/departments", () => [...DEPARTMENTS]);
  },
  async auditLog(): Promise<AuditLogEntry[]> {
    return request("/audit-logs", () => [...AUDIT_LOG]);
  },
  async setActive(id: string, active: boolean) {
    return request("/users/" + id, () => ({ id, active }), 400);
  },
  async setRole(id: string, role: Role) {
    return request("/users/" + id + "/role", () => ({ id, role }), 400);
  },
  async profile(): Promise<AppUser> {
    return request("/me", () => USERS[0]!);
  },
};
