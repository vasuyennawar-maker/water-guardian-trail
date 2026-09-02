import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRole } from "@/hooks/useRole";
import type { Role } from "@/types";

/**
 * UX-level route guard. Frontend gating only — real authorization must be
 * enforced server-side once a backend replaces the mock services.
 */
export function RoleGate({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { role, ready } = useRole();

  if (!ready) return <div className="h-40 animate-pulse rounded-[6px] bg-muted" aria-hidden />;
  if (allow.includes(role)) return <>{children}</>;

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <span className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-[6px] bg-muted">
        <Lock className="h-5 w-5 text-muted-foreground" aria-hidden />
      </span>
      <h2 className="text-lg font-semibold">Sign in required</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {role === "public"
          ? "This area is available to signed-in users."
          : "Your account role does not have access to this area."}
      </p>
      <Button asChild className="mt-5 rounded-[6px]">
        <Link to="/login">Go to sign in</Link>
      </Button>
    </div>
  );
}
