import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Legacy AR" }] }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const { signIn, session, loading } = useAuth();
  const [remember, setRemember] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session) nav({ to: "/dashboard" });
  }, [loading, session, nav]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Welcome back!");
    nav({ to: "/dashboard" });
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Legacy AR workspace"
      footer={<>Don't have an account? <Link to="/register" className="text-accent hover:underline">Create one</Link></>}
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field icon={<Mail className="h-4 w-4" />} type="email" placeholder="you@company.com" label="Email"
          value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Field icon={<Lock className="h-4 w-4" />} type="password" placeholder="••••••••" label="Password"
          value={password} onChange={(e) => setPassword(e.target.value)} required />

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-glass-border bg-white/5 accent-[oklch(0.65_0.24_295)]"
            />
            <span className="text-muted-foreground">Remember me</span>
          </label>
          <Link to="/login" className="text-accent hover:underline">Forgot password?</Link>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-gradient-primary text-white font-medium inline-flex items-center justify-center gap-2 shadow-[0_0_30px_-8px_oklch(0.65_0.24_295/70%)] hover:shadow-[0_0_50px_-8px_oklch(0.78_0.18_200/70%)] transition-shadow disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign in <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>
    </AuthLayout>
  );
}

function Field({ label, icon, ...props }: { label: string; icon: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="mt-1.5 flex items-center gap-2 glass rounded-xl px-3 py-2.5 focus-within:ring-1 focus-within:ring-accent/60 transition">
        <span className="text-muted-foreground">{icon}</span>
        <input {...props} className="bg-transparent outline-none w-full text-sm" />
      </div>
    </label>
  );
}
