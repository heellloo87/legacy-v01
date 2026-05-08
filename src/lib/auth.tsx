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

  useEffect(() => {
    const {
      data: sub,
    } = supabase.auth.onAuthStateChange(
      (_e, s) => {
        setSession(s);
      }
    );

    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session);
        setLoading(false);
      });

    return () =>
      sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setRole(null);
      return;
    }

    supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => {
        setRole(
          (data?.role as UserRole) ??
            "designer"
        );
      });
  }, [session]);

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

  const signUp: AuthCtx["signUp"] =
    async (
      email,
      password,
      fullName
    ) => {
      const { error } =
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

      return error
        ? { error: error.message }
        : {};
    };

  const signOut = async () => {
    await supabase.auth.signOut();
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
  const v = useContext(Ctx);

  if (!v) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return v;
}
