import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type {
  Session,
  User,
} from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

type UserRole =
  | "admin"
  | "designer"
  | "collaborator"
  | "manufacturing_expert";

type AuthCtx = {
  session: Session | null;
  user: User | null;
  role: UserRole | null;
  loading: boolean;

  signIn: (
    email: string,
    password: string
  ) => Promise<{ error?: string }>;

  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error?: string }>;

  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(
  undefined
);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [session, setSession] =
    useState<Session | null>(null);

  const [role, setRole] =
    useState<UserRole | null>(null);

  const [loading, setLoading] =
    useState(true);

  /* ---------- Auth listener ---------- */

  useEffect(() => {
    const {
      data: sub,
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session);
      })
      .finally(() => {
        if (!session?.user) {
          setLoading(false);
        }
      });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  /* ---------- Load role ---------- */

  useEffect(() => {
    const loadRole = async () => {
      if (!session?.user) {
        setRole(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error(error);

        setRole("collaborator");
      } else {
        setRole(
          (data?.role as UserRole) ??
            "collaborator"
        );
      }

      setLoading(false);
    };

    loadRole();
  }, [session]);

  /* ---------- Sign in ---------- */

  const signIn: AuthCtx["signIn"] =
    async (email, password) => {
      const { error } =
        await supabase.auth.signInWithPassword(
          {
            email,
            password,
          }
        );

      return error
        ? { error: error.message }
        : {};
    };

  /* ---------- Sign up ---------- */

  const signUp: AuthCtx["signUp"] =
    async (
      email,
      password,
      fullName
    ) => {
      const { data, error } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: fullName,
            },
          },
        });

      if (error) {
        return {
          error: error.message,
        };
      }

      const userId = data.user?.id;

      if (userId) {
        const { error: profileError } =
          await supabase
            .from("profiles")
            .upsert({
              id: userId,
              full_name: fullName,
              role: "collaborator",
            });

        if (profileError) {
          console.error(profileError);
        }
      }

      return {};
    };

  /* ---------- Sign out ---------- */

  const signOut = async () => {
    await supabase.auth.signOut();

    setRole(null);
    setSession(null);
  };

  return (
    <Ctx.Provider
      value={{
        session,
        user: session?.user ?? null,
        role,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);

  if (!ctx) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return ctx;
}
