import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
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
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [busy, setBusy] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  // Show/Hide password toggles
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  useEffect(() => {
    if (user && !roleLoading) {
      void navigate({ to: homePathForRole(role) as any, replace: true });
    }
  }, [user, role, roleLoading, navigate]);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName.trim(), phone: phone.trim() },
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

  async function handleForgot(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Enter your email first");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password reset link sent to your email");
      setMode("login");
    }
  }

  async function handleGoogleSignIn() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      toast.error(error.message);
      setBusy(false);
    }
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
          {mode === "forgot" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold">Forgot Password</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter your registered email and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleForgot} className="space-y-4">
                <Field
                  id="forgot-email"
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  required
                  autoComplete="email"
                />
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Send reset link
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setMode("login")}
                  disabled={busy}
                >
                  ← Back to Sign in
                </Button>
              </form>
            </div>
          ) : (
            <>
              <Tabs
                value={mode}
                onValueChange={(val) => setMode(val as "login" | "register")}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Sign in</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>

                {/* LOGIN TAB */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="mt-4 space-y-4">
                    <Field
                      id="login-email"
                      label="Email"
                      type="email"
                      value={email}
                      onChange={setEmail}
                      required
                      autoComplete="email"
                    />
                    <PasswordField
                      id="login-password"
                      label="Password"
                      value={password}
                      onChange={setPassword}
                      show={showLoginPassword}
                      onToggleShow={() => setShowLoginPassword((prev) => !prev)}
                      required
                      autoComplete="current-password"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="text-sm text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <Button type="submit" className="w-full" disabled={busy}>
                      {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sign in
                    </Button>
                  </form>
                </TabsContent>

                {/* REGISTER TAB */}
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="mt-4 space-y-4">
                    <Field
                      id="reg-name"
                      label="Full name"
                      value={fullName}
                      onChange={setFullName}
                      required
                      autoComplete="name"
                    />
                    <Field
                      id="reg-email"
                      label="Email"
                      type="email"
                      value={email}
                      onChange={setEmail}
                      required
                      autoComplete="email"
                    />
                    <Field
                      id="reg-phone"
                      label="Mobile number"
                      type="tel"
                      value={phone}
                      onChange={setPhone}
                      autoComplete="tel"
                    />
                    <PasswordField
                      id="reg-password"
                      label="Password"
                      value={password}
                      onChange={setPassword}
                      show={showRegPassword}
                      onToggleShow={() => setShowRegPassword((prev) => !prev)}
                      required
                      autoComplete="new-password"
                    />
                    <PasswordField
                      id="reg-confirm-password"
                      label="Confirm password"
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      show={showRegConfirmPassword}
                      onToggleShow={() => setShowRegConfirmPassword((prev) => !prev)}
                      required
                      autoComplete="new-password"
                    />
                    <Button type="submit" className="w-full" disabled={busy}>
                      {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create account
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              {/* SOCIAL / GOOGLE SIGN IN */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 font-medium"
                onClick={handleGoogleSignIn}
                disabled={busy}
              >
                <GoogleIcon />
                Google
              </Button>

              {/* LOGIN / REGISTER TOGGLE FOOTER */}
              <p className="mt-5 text-center text-sm text-muted-foreground">
                {mode === "login" ? (
                  <>
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("register")}
                      className="font-medium text-primary hover:underline"
                    >
                      Register
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="font-medium text-primary hover:underline"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </>
          )}
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
  required = false,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string | undefined;
  required?: boolean | undefined;
  autoComplete?: string | undefined;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        {...(autoComplete ? { autoComplete } : {})}
      />
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggleShow,
  required = false,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  required?: boolean | undefined;
  autoComplete?: string | undefined;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          {...(autoComplete ? { autoComplete } : {})}
          className="pr-10"
        />
        <button
          type="button"
          onClick={onToggleShow}
          tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}
