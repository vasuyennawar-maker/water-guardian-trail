import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Droplets } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DEMO_ACCOUNTS } from "@/services/api/authService";
import { ROLE_HOME, ROLE_LABEL, useRole } from "@/hooks/useRole";
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

function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useRole();
  const [identifier, setIdentifier] = useState("citizen");
  const [password, setPassword] = useState("citizen123");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = await signIn(identifier, password, remember);
      toast.success(`Signed in as ${ROLE_LABEL[user.role]}`);
      navigate({ to: ROLE_HOME[user.role] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <span className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-[6px] bg-primary text-primary-foreground">
            <Droplets className="h-5 w-5" aria-hidden />
          </span>
          <h1 className="text-center text-2xl font-semibold">Sign in</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            Staff accounts are issued by the administrator. Citizens can self-register.
          </p>

          <form onSubmit={submit} className="surface-card mt-6 space-y-4 p-5">
            <div>
              <Label htmlFor="identifier">Username or email</Label>
              <Input
                id="identifier"
                required
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="mt-1.5 rounded-[6px]"
              />
            </div>
            <div>
              <Label htmlFor="pwd">Password</Label>
              <Input
                id="pwd"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 rounded-[6px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="remember" checked={remember} onCheckedChange={(v) => setRemember(v === true)} />
              <Label htmlFor="remember" className="text-sm font-normal">Keep me signed in</Label>
            </div>
            {error ? (
              <p role="alert" className="rounded-[6px] bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={busy} className="w-full rounded-[6px]">
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="surface-card mt-4 p-4">
            <p className="text-xs font-semibold">Demo accounts</p>
            <ul className="mt-2 grid gap-1.5">
              {DEMO_ACCOUNTS.map((a) => (
                <li key={a.username} className="flex items-center justify-between gap-2 text-xs">
                  <span className="data-mono">{a.username} / {a.password}</span>
                  <button
                    type="button"
                    className="rounded-[6px] px-2 py-1 text-water hover:underline"
                    onClick={() => {
                      setIdentifier(a.username);
                      setPassword(a.password);
                    }}
                  >
                    Use {ROLE_LABEL[a.role]}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            No account? <Link to="/register" className="font-medium text-water hover:underline">Register as a citizen</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
