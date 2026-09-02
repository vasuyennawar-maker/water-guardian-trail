import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Droplets, LogOut, Menu, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROLE_LABEL, useRole } from "@/hooks/useRole";
import type { Role } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  ],
  verifier: [
    { to: "/verify", label: "Verification Queue" },
    { to: "/map", label: "Map" },
    { to: "/explore", label: "Water Bodies" },
    { to: "/notifications", label: "Notifications" },
  ],
  authority: [
    { to: "/authority", label: "Dashboard" },
    { to: "/authority/issues", label: "Issues" },
    { to: "/verify", label: "Verification" },
    { to: "/map", label: "Map" },
    { to: "/analytics", label: "Analytics" },
  ],
  admin: [
    { to: "/admin", label: "Dashboard" },
    { to: "/admin/users", label: "Users" },
    { to: "/admin/departments", label: "Departments" },
    { to: "/authority/issues", label: "Reports" },
    { to: "/analytics", label: "Analytics" },
    { to: "/admin/audit", label: "Audit Logs" },
  ],
};

export function Navbar() {
  const { role, user, signOut } = useRole();
  const [open, setOpen] = useState(false);
  const links = NAV[role];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-primary text-primary-foreground">
            <Droplets className="h-4 w-4" aria-hidden />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-semibold">Digital Water Genome</span>
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
          <Button asChild size="sm" className="hidden rounded-[6px] sm:inline-flex">
            <Link to="/report">Report an Issue</Link>
          </Button>

          {role === "public" ? (
            <Button asChild variant="outline" size="sm" className="hidden rounded-[6px] sm:inline-flex">
              <Link to="/login">Login</Link>
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden rounded-[6px] sm:inline-flex"
                  aria-label="Account menu"
                >
                  <User className="mr-1.5 h-4 w-4" aria-hidden />
                  <span className="max-w-[9rem] truncate">{user?.name ?? ROLE_LABEL[role]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <span className="block text-sm font-medium">{user?.name ?? ROLE_LABEL[role]}</span>
                  <span className="block text-xs text-muted-foreground">{ROLE_LABEL[role]}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/notifications">Notifications</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" aria-hidden />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
            {role === "public" ? (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="mt-1 rounded-[6px] border border-border px-3 py-2 text-center text-sm font-medium"
              >
                Login
              </Link>
            ) : (
              <>
                <Link
                  to="/profile"
                  onClick={() => setOpen(false)}
                  className="mt-1 rounded-[6px] px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
                >
                  Profile ({ROLE_LABEL[role]})
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    signOut();
                  }}
                  className="rounded-[6px] px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted"
                >
                  Sign out
                </button>
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
