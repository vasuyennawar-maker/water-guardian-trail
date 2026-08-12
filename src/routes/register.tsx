import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/api/authService";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register — Digital Water Genome Nashik" },
      { name: "description", content: "Create a citizen account to report water pollution in Nashik District and track each report to resolution." },
      { property: "og:title", content: "Register — Digital Water Genome Nashik" },
      { property: "og:description", content: "Create a citizen account to report water pollution in Nashik District and track each report to resolution." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await authService.register(name, email);
      toast.success("Account created");
      navigate({ to: "/dashboard" });
    } catch { toast.error("Registration failed. Try again."); }
    finally { setBusy(false); }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <h1 className="text-center text-2xl font-semibold">Create a citizen account</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">You can browse the map and registry without one — an account is needed to file and track reports.</p>
          <form onSubmit={submit} className="surface-card mt-6 space-y-4 p-5">
            <div><Label htmlFor="n">Full name</Label><Input id="n" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 rounded-[6px]" /></div>
            <div><Label htmlFor="e">Email</Label><Input id="e" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 rounded-[6px]" /></div>
            <div><Label htmlFor="p">Password</Label><Input id="p" type="password" required className="mt-1.5 rounded-[6px]" /></div>
            <Button type="submit" disabled={busy} className="w-full rounded-[6px]">{busy ? "Creating…" : "Create account"}</Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">Already registered? <Link to="/login" className="font-medium text-water hover:underline">Sign in</Link></p>
        </div>
      </main>
    </div>
  );
}
