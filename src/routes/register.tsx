import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { User, Mail, Lock, ArrowRight } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — Legacy AR" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const nav = useNavigate();
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start prototyping AR experiences in minutes"
      footer={<>Already have an account? <Link to="/login" className="text-accent hover:underline">Sign in</Link></>}
    >
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); nav({ to: "/dashboard" }); }}>
        <Field icon={<User className="h-4 w-4" />} label="Full name" placeholder="Ada Lovelace" />
        <Field icon={<Mail className="h-4 w-4" />} type="email" label="Email" placeholder="you@company.com" />
        <Field icon={<Lock className="h-4 w-4" />} type="password" label="Password" placeholder="••••••••" />
        <Field icon={<Lock className="h-4 w-4" />} type="password" label="Confirm password" placeholder="••••••••" />

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-gradient-primary text-white font-medium inline-flex items-center justify-center gap-2 shadow-[0_0_30px_-8px_oklch(0.65_0.24_295/70%)] hover:shadow-[0_0_50px_-8px_oklch(0.78_0.18_200/70%)] transition-shadow"
        >
          Create account <ArrowRight className="h-4 w-4" />
        </button>

        <p className="text-[11px] text-muted-foreground text-center">
          By continuing you agree to our Terms of Service and Privacy Policy.
        </p>
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
