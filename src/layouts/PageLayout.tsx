import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { RoleGate } from "@/components/layout/RoleGate";
import type { Role } from "@/types";

export function PageLayout({
  children,
  title,
  lead,
  actions,
  wide,
  allow,
}: {
  children: ReactNode;
  title?: string;
  lead?: string;
  actions?: ReactNode;
  wide?: boolean;
  /** When set, the page body is only rendered for these roles (UX gate). */
  allow?: Role[];
}) {
  const body = allow ? <RoleGate allow={allow}>{children}</RoleGate> : children;
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className={wide ? "w-full" : "mx-auto w-full max-w-7xl px-4 py-8 sm:px-6"}>
          {title ? (
            <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                {lead ? <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{lead}</p> : null}
              </div>
              {actions}
            </header>
          ) : null}
          {body}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-semibold">Digital Water Genome — Nashik</p>
          <p className="mt-1 text-muted-foreground">Don't clean the end. Protect the beginning.</p>
        </div>
        <nav className="flex flex-wrap gap-4 text-muted-foreground" aria-label="Footer">
          <Link to="/explore" className="hover:text-foreground">Water Bodies</Link>
          <Link to="/map" className="hover:text-foreground">Map</Link>
          <Link to="/how-it-works" className="hover:text-foreground">How It Works</Link>
          <Link to="/about" className="hover:text-foreground">About</Link>
        </nav>
      </div>
      <div className="border-t border-border px-4 py-3 sm:px-6">
        <p className="mx-auto max-w-7xl text-xs text-muted-foreground">
          Prototype interface. All figures, reports and assessments shown are sample data for
          demonstration and are not official statistics.
        </p>
      </div>
    </footer>
  );
}
