import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";

export type Role = "customer" | "staff" | "admin";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: Role;
  roleLoading: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function ensureAccountRecords(user: User) {
  await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      full_name: (user.user_metadata?.["full_name"] as string | undefined) ?? user.email?.split("@")[0] ?? null,
      phone: (user.user_metadata?.["phone"] as string | undefined) ?? null,
    },
    { onConflict: "id", ignoreDuplicates: true },
  );

  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  if (!roles || roles.length === 0) {
    await supabase.from("user_roles").insert({ user_id: user.id, role: "customer" });
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
      if (event === "SIGNED_IN" && nextSession?.user) {
        const u = nextSession.user;
        setTimeout(() => {
          void ensureAccountRecords(u).then(() => {
            void queryClient.invalidateQueries({ queryKey: ["role"] });
          });
        }, 0);
      }
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        void router.invalidate();
        if (event !== "SIGNED_OUT") void queryClient.invalidateQueries();
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session?.user) void ensureAccountRecords(data.session.user);
    });

    return () => sub.subscription.unsubscribe();
  }, [queryClient, router]);

  const user = session?.user ?? null;

  const { data: role = "customer", isLoading: roleLoading } = useQuery({
    queryKey: ["role", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Role> => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user!.id);
      if (error) throw error;
      const roles = (data ?? []).map((r) => r.role as Role);
      if (roles.includes("admin")) return "admin";
      if (roles.includes("staff")) return "staff";
      return "customer";
    },
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void router.navigate({ to: "/auth", replace: true });
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        role: user ? role : "customer",
        roleLoading: !!user && roleLoading,
        isAdmin: !!user && role === "admin",
        isStaff: !!user && (role === "staff" || role === "admin"),
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function homePathForRole(role: Role) {
  if (role === "admin") return "/admin" as const;
  if (role === "staff") return "/staff" as const;
  return "/" as const;
}
