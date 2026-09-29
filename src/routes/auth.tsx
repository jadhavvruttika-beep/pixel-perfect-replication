import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { homePathForRole, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in or Register — FreshCart" },
      { name: "description", content: "Access your FreshCart account to shop groceries, track orders and more." },
      { property: "og:title", content: "Sign in or Register — FreshCart" },
      { property: "og:description", content: "Create a FreshCart account or sign in to continue shopping." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, role, roleLoading } = useAuth();
  const [mode, setMode] = useState("login");
  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (user && !roleLoading) void navigate({ to: homePathForRole(role), replace: true });
  }, [user, role, roleLoading, navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName, phone },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      toast.success("Account created. Check your email to confirm your address.");
      setMode("login");
      return;
    }
    toast.success("Account created successfully");
  }

  async function handleForgot() {
    if (!email.trim()) {
      toast.error("Enter your email first");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset link sent to your email");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="brand-gradient flex h-10 w-10 items-center justify-center rounded-xl text-xl">🥬</span>
          <span className="text-2xl font-extrabold">
            Fresh<span className="text-primary">Cart</span>
          </span>
        </Link>

        <div className="surface-card p-6">
          <Tabs value={mode} onValueChange={setMode}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign in</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="mt-4 space-y-4">
                <Field id="login-email" label="Email" type="email" value={email} onChange={setEmail} required />
                <Field
                  id="login-password"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  required
                />
                <button type="button" onClick={() => void handleForgot()} className="text-sm text-primary hover:underline">
                  Forgot password?
                </button>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="mt-4 space-y-4">
                <Field id="reg-name" label="Full name" value={fullName} onChange={setFullName} required />
                <Field id="reg-email" label="Email" type="email" value={email} onChange={setEmail} required />
                <Field id="reg-phone" label="Mobile number" value={phone} onChange={setPhone} />
                <Field
                  id="reg-password"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  required
                />
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />} Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">
            ← Continue browsing groceries
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} />
    </div>
  );
}
