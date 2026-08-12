import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Droplets } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { authService } from "@/services/api/authService";
import { ROLE_LABEL } from "@/hooks/useRole";
import type { Role } from "@/types";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Digital Water Genome Nashik" },
      { name: "description", content: "Sign in as a citizen, field verifier, department officer or administrator to act on water body reports." },
      { property: "og:title", content: "Sign in — Digital Water Genome Nashik" },
      { property: "og:description", content: "Sign in as a citizen, field verifier, department officer or administrator to act on water body reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

const DEST: Record<Role, string> = { public: "/", citizen: "/dashboard", verifier: "/verify", authority: "/authority", admin: "/admin" };

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("anjali.d@example.in");
  const [role, setRole] = useState<Role>("citizen");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await authService.login(email, role);
      toast.success("Signed in");
      navigate({ to: DEST[role] });
    } catch {
      toast.error("Sign in failed. Check your email and try again.");
    } finally { setBusy(false); }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <span className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-[6px] bg-primary text-primary-foreground"><Droplets className="h-5 w-5" aria-hidden /></span>
          <h1 className="text-center text-2xl font-semibold">Sign in</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">Prototype sign-in. Any password is accepted.</p>
          <form onSubmit={submit} className="surface-card mt-6 space-y-4 p-5">
            <div><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 rounded-[6px]" /></div>
            <div><Label htmlFor="pwd">Password</Label><Input id="pwd" type="password" defaultValue="demo1234" className="mt-1.5 rounded-[6px]" /></div>
            <div>
              <Label htmlFor="role">Sign in as</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger id="role" className="mt-1.5 rounded-[6px]"><SelectValue /></SelectTrigger>
                <SelectContent>{(["citizen", "verifier", "authority", "admin"] as Role[]).map((r) => <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={busy} className="w-full rounded-[6px]">{busy ? "Signing in…" : "Sign in"}</Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            No account? <Link to="/register" className="font-medium text-water hover:underline">Register as a citizen</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
