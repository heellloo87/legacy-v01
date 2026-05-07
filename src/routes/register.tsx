import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { User, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — Legacy AR" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const nav = useNavigate();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error("Passwords do not match"); return; }
    setSubmitting(true);
    const { error } = await signUp(email, password, fullName);
    setSubmitting(false);
    if (error) { toast.error(error); return; }
    toast.success("Account created!");
    nav({ to: "/dashboard" });
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start prototyping AR experiences in minutes"
      footer={<>Already have an account? <Link to="/login" className="text-accent hover:underline">Sign in</Link></>}
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field icon={<User className="h-4 w-4" />} label="Full name" placeholder="Ada Lovelace" required
          value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <Field icon={<Mail className="h-4 w-4" />} type="email" label="Email" placeholder="you@company.com" required
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field icon={<Lock className="h-4 w-4" />} type="password" label="Password" placeholder="••••••••" required
          value={password} onChange={(e) => setPassword(e.target.value)} />
        <Field icon={<Lock className="h-4 w-4" />} type="password" label="Confirm password" placeholder="••••••••" required
          value={confirm} onChange={(e) => setConfirm(e.target.value)} />

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-gradient-primary text-white font-medium inline-flex items-center justify-center gap-2 shadow-[0_0_30px_-8px_oklch(0.65_0.24_295/70%)] hover:shadow-[0_0_50px_-8px_oklch(0.78_0.18_200/70%)] transition-shadow disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create account <ArrowRight className="h-4 w-4" /></>}
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
