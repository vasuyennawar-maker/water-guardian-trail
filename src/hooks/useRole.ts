import { useCallback, useEffect, useState } from "react";
import { authService } from "@/services/api/authService";
import type { Role } from "@/types";

/**
 * Session/role state for role-aware navigation and route guarding.
 * NOTE: this is UX only. Real authorization is enforced server-side later.
 */
const EVENT = "dwg:session";
const emit = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
};

export function useRole() {
  const [role, setRoleState] = useState<Role>("public");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setRoleState(authService.getRole());
    sync();
    setReady(true);
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const signIn = useCallback(
    async (identifier: string, password: string, remember: boolean) => {
      const user = await authService.login(identifier, password, remember);
      setRoleState(user.role);
      emit();
      return user;
    },
    [],
  );

  const signOut = useCallback(() => {
    authService.signOut();
    setRoleState("public");
    emit();
  }, []);

  /** Prototype escape hatch — not exposed in the UI. */
  const setRole = useCallback((next: Role) => {
    authService.setRole(next);
    setRoleState(next);
    emit();
  }, []);

  return { role, ready, signIn, signOut, setRole, user: authService.currentUser(role) };
}

export const ROLE_LABEL: Record<Role, string> = {
  public: "Public Viewer",
  citizen: "Citizen",
  verifier: "Field Verifier",
  authority: "Department / Authority",
  admin: "Administrator",
};

export const ROLE_HOME: Record<Role, string> = {
  public: "/",
  citizen: "/dashboard",
  verifier: "/verify",
  authority: "/authority/issues",
  admin: "/admin",
};
