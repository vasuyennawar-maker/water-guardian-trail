import { useCallback, useEffect, useState } from "react";
import { authService } from "@/services/api/authService";
import type { Role } from "@/types";

/**
 * Role state for role-aware navigation and route guarding.
 * NOTE: this is UX only. Real authorization is enforced server-side later.
 */
export function useRole() {
  const [role, setRoleState] = useState<Role>("public");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setRoleState(authService.getRole());
    setReady(true);
  }, []);

  const setRole = useCallback((next: Role) => {
    authService.setRole(next);
    setRoleState(next);
  }, []);

  const signOut = useCallback(() => {
    authService.signOut();
    setRoleState("public");
  }, []);

  return { role, setRole, signOut, ready, user: authService.currentUser(role) };
}

export const ROLE_LABEL: Record<Role, string> = {
  public: "Public Viewer",
  citizen: "Citizen",
  verifier: "Field Verifier",
  authority: "Department / Authority",
  admin: "Administrator",
};
