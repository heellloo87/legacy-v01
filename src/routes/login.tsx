import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { useState } from "react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Legacy AR" }] }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [remember, setRemember] = useState(true);

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Legacy AR workspace"
      footer={<>Don't have an account? <Link to="/register" className="text-accent hover:underline">Create one</Link></>}
    >
      <form
        className="space-y-4"
        onSubmit={(e) => { e.preventDefault(); nav({ to: "/dashboard" }); }}
      >
        <Field icon={<Mail className="h-4 w-4" />} type="email" placeholder="you@company.com" label="Email" />
        <Field icon={<Lock className="h-4 w-4" />} type="password" placeholder="••••••••" label="Password" />

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
          className="w-full py-3 rounded-xl bg-gradient-primary text-white font-medium inline-flex items-center justify-center gap-2 shadow-[0_0_30px_-8px_oklch(0.65_0.24_295/70%)] hover:shadow-[0_0_50px_-8px_oklch(0.78_0.18_200/70%)] transition-shadow"
        >
          Sign in <ArrowRight className="h-4 w-4" />
        </button>

        <div className="relative my-2 text-center text-xs text-muted-foreground">
          <span className="bg-card/0 px-2 relative z-10">or continue with</span>
          <div className="absolute inset-x-0 top-1/2 h-px bg-glass-border" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="glass rounded-xl py-2.5 text-sm hover:bg-white/10">Google</button>
          <button type="button" className="glass rounded-xl py-2.5 text-sm hover:bg-white/10">GitHub</button>
        </div>
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
