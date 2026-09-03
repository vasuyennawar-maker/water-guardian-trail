/**
 * SHARED REPORT STORE — the single source of truth for reports across every
 * role surface (citizen dashboard, verification queue, authority issue
 * management, map markers and analytics). There are deliberately no
 * per-role arrays: seeded mock reports and citizen-submitted reports live in
 * the same list, and every consumer reads through `allIssues()`.
 *
 * Persistence is the existing prototype mechanism (localStorage). Swap the
 * two helpers below for HTTP calls when a real reports API exists.
 */
import type { Issue } from "@/types";
import { ISSUES } from "./mockData";

const STORAGE_KEY = "dwg:reports:v1";
export const REPORTS_EVENT = "dwg:reports";

let submitted: Issue[] | null = null;

function load(): Issue[] {
  if (submitted) return submitted;
  if (typeof window === "undefined") return (submitted = []);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    submitted = raw ? (JSON.parse(raw) as Issue[]) : [];
  } catch {
    submitted = [];
  }
  return submitted;
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(submitted ?? []));
  } catch {
    /* quota or private mode — the in-memory list still works for this session */
  }
  window.dispatchEvent(new CustomEvent(REPORTS_EVENT));
}

/** Every report the platform knows about, newest citizen submissions first. */
export function allIssues(): Issue[] {
  return [...load(), ...ISSUES];
}

export function addIssue(issue: Issue) {
  load();
  submitted = [issue, ...(submitted ?? [])];
  persist();
}

export function updateIssue(id: string, patch: Partial<Issue>) {
  load();
  let touched = false;
  submitted = (submitted ?? []).map((i) => {
    if (i.id !== id) return i;
    touched = true;
    return { ...i, ...patch, updatedAt: new Date().toISOString() };
  });
  if (!touched) {
    const seed = ISSUES.find((i) => i.id === id);
    if (seed) submitted = [{ ...seed, ...patch, updatedAt: new Date().toISOString() }, ...(submitted ?? [])];
  }
  persist();
}

/** Notify listeners without changing anything (used after mock writes). */
export function notifyReportsChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(REPORTS_EVENT));
}
