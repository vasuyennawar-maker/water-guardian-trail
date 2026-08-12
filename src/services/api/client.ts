/**
 * Shared transport helper for the mock service layer.
 * Every service call goes through `request()` so that replacing mocks with
 * real FastAPI endpoints later is a change inside services/api/ only.
 */

export const API_BASE_URL = "/api"; // real backend base once wired

const LATENCY_MS = 320;

export async function request<T>(_path: string, resolver: () => T, latency = LATENCY_MS): Promise<T> {
  // MOCK: simulated network latency so loading states are real in the UI.
  await new Promise((r) => setTimeout(r, latency));
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    throw new ApiError("You appear to be offline. Reconnect and retry.", 0);
  }
  return resolver();
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
