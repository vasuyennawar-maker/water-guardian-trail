import type { AppUser, Role } from "@/types";
import { USERS } from "./mockData";
import { request } from "./client";

/**
 * PROTOTYPE auth. Credentials are checked against a mock directory and the
 * session is kept in localStorage. NOTE: frontend role checks are UX only —
 * real authorization must be enforced server-side when a backend is added.
 */
const KEY = "dwg.session";

export interface Session {
  role: Role;
  email: string;
  name: string;
}

/** Mock credential directory. Staff accounts are issued, never self-registered. */
const CREDENTIALS: { username: string; password: string; email: string }[] = [
  { username: "citizen", password: "citizen123", email: "anjali.d@example.in" },
  { username: "verifier", password: "verifier123", email: "r.pawar@nashik.gov.example" },
  { username: "authority", password: "authority123", email: "s.kulkarni@nmc.gov.example" },
  { username: "admin", password: "admin123", email: "admin@dwg.example" },
];

export const DEMO_ACCOUNTS = CREDENTIALS.map((c) => ({
  username: c.username,
  password: c.password,
  role: (USERS.find((u) => u.email === c.email)?.role ?? "citizen") as Role,
}));

function read(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export const authService = {
  session: read,
  getRole(): Role {
    return read()?.role ?? "public";
  },
  /** Prototype-only. Kept for compatibility; never call from user-facing UI. */
  setRole(role: Role) {
    const u = USERS.find((x) => x.role === role);
    if (typeof window !== "undefined" && u)
      localStorage.setItem(KEY, JSON.stringify({ role, email: u.email, name: u.name }));
  },
  signOut() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
  },
  currentUser(role: Role): AppUser | null {
    if (role === "public") return null;
    const s = read();
    return (
      (s ? USERS.find((u) => u.email === s.email) : null) ??
      USERS.find((u) => u.role === role) ??
      null
    );
  },
  async login(identifier: string, password: string, remember = true): Promise<AppUser> {
    return request("/auth/login", () => {
      const id = identifier.trim().toLowerCase();
      const match = CREDENTIALS.find(
        (c) => (c.username === id || c.email.toLowerCase() === id) && c.password === password,
      );
      if (!match) throw new Error("Invalid username or password.");
      const user = USERS.find((u) => u.email === match.email);
      if (!user) throw new Error("Invalid username or password.");
      if (!user.active) throw new Error("This account has been deactivated.");
      const session: Session = { role: user.role, email: user.email, name: user.name };
      const store = remember ? localStorage : sessionStorage;
      store.setItem(KEY, JSON.stringify(session));
      return user;
    }, 500);
  },
  async register(name: string, email: string) {
    return request("/auth/register", () => {
      const user: AppUser = {
        id: "new",
        name,
        email,
        role: "citizen",
        active: true,
        joinedAt: new Date().toISOString(),
      };
      localStorage.setItem(KEY, JSON.stringify({ role: "citizen", email, name }));
      return user;
    });
  },
};
