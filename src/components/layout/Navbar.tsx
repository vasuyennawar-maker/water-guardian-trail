import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Droplets, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROLE_LABEL, useRole } from "@/hooks/useRole";
import type { Role } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Role-aware navigation. UX only — server-side authorization comes later. */
export const NAV: Record<Role, { to: string; label: string }[]> = {
  public: [
    { to: "/", label: "Home" },
    { to: "/explore", label: "Explore" },
    { to: "/map", label: "Map" },
    { to: "/how-it-works", label: "How It Works" },
    { to: "/about", label: "About" },
  ],
  citizen: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/map", label: "Map" },
    { to: "/explore", label: "Water Bodies" },
    { to: "/reports", label: "My Reports" },
    { to: "/notifications", label: "Notifications" },
    { to: "/profile", label: "Profile" },
  ],
  verifier: [
    { to: "/verify", label: "Verification Queue" },
    { to: "/map", label: "Map" },
    { to: "/notifications", label: "Notifications" },
  ],
  authority: [
    { to: "/authority", label: "Dashboard" },
    { to: "/authority/issues", label: "Issues" },
    { to: "/verify", label: "Verification" },
    { to: "/explore", label: "Water Bodies" },
    { to: "/map", label: "Map" },
    { to: "/analytics", label: "Analytics" },
    { to: "/notifications", label: "Notifications" },
  ],
  admin: [
    { to: "/admin", label: "Dashboard" },
    { to: "/admin/users", label: "Users" },
    { to: "/admin/departments", label: "Departments" },
    { to: "/explore", label: "Water Bodies" },
    { to: "/authority/issues", label: "Reports" },
    { to: "/analytics", label: "Analytics" },
    { to: "/admin/audit", label: "Audit Logs" },
  ],
};

export function Navbar() {
  const { role, setRole, signOut } = useRole();
  const [open, setOpen] = useState(false);
  const links = NAV[role];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-primary text-primary-foreground">
            <Droplets className="h-4 w-4" aria-hidden />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold">Digital Water Genome</span>
            <span className="block text-[11px] text-muted-foreground">Nashik District</span>
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Main">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-[6px] px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-accent text-accent-foreground font-medium" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* Prototype role switcher — stands in for real authentication. */}
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger
              aria-label="Switch role (prototype)"
              className="hidden h-9 w-[11.5rem] rounded-[6px] text-xs sm:flex"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                <SelectItem key={r} value={r} className="text-xs">
                  {ROLE_LABEL[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button asChild size="sm" className="hidden rounded-[6px] sm:inline-flex">
            <Link to="/report">Report an Issue</Link>
          </Button>

          {role === "public" ? (
            <Button asChild variant="outline" size="sm" className="hidden rounded-[6px] sm:inline-flex">
              <Link to="/login">Login</Link>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="hidden rounded-[6px] sm:inline-flex"
              onClick={signOut}
            >
              Sign out
            </Button>
          )}

          <button
            type="button"
            className="rounded-[6px] p-2 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border bg-card px-4 py-3 lg:hidden">
          <nav className="grid gap-1" aria-label="Mobile">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-[6px] px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
                activeProps={{ className: "bg-accent text-accent-foreground font-medium" }}
                activeOptions={{ exact: l.to === "/" }}
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/report"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-[6px] bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground"
            >
              Report an Issue
            </Link>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger aria-label="Switch role (prototype)" className="mt-2 h-9 rounded-[6px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                  <SelectItem key={r} value={r} className="text-xs">
                    {ROLE_LABEL[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
