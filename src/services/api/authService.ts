import type { AppUser, Role } from "@/types";
import { USERS } from "./mockData";
import { request } from "./client";

/**
 * MOCK auth. Role is persisted in localStorage purely so the prototype can
 * demonstrate role-aware navigation. NOTE: frontend role checks are UX only —
 * real authorization must be enforced server-side.
 */
const KEY = "dwg.session.role";

export const authService = {
  getRole(): Role {
    if (typeof window === "undefined") return "public";
    return (localStorage.getItem(KEY) as Role) ?? "public";
  },
  setRole(role: Role) {
    if (typeof window !== "undefined") localStorage.setItem(KEY, role);
  },
  signOut() {
    if (typeof window !== "undefined") localStorage.removeItem(KEY);
  },
  currentUser(role: Role): AppUser | null {
    if (role === "public") return null;
    return USERS.find((u) => u.role === role) ?? null;
  },
  async login(email: string, role: Role) {
    return request("/auth/login", () => {
      authService.setRole(role);
      return USERS.find((u) => u.email === email) ?? USERS.find((u) => u.role === role)!;
    });
  },
  async register(name: string, email: string) {
    return request("/auth/register", () => {
      authService.setRole("citizen");
      return { id: "new", name, email, role: "citizen" as Role, active: true, joinedAt: new Date().toISOString() };
    });
  },
};
