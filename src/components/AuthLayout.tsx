import type { ReactNode } from "react";
import { Logo } from "./Logo";

export function AuthLayout({
  title, subtitle, children, footer,
}: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="relative min-h-screen w-full grid lg:grid-cols-2 overflow-hidden">
      {/* Visual side */}
      <div className="relative hidden lg:flex flex-col justify-between p-10 grid-bg overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/30 blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-accent/20 blur-3xl" />
        <Logo />
        <div className="relative space-y-6 max-w-md">
          <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" /> Next-gen AR Collaboration
          </div>
          <h2 className="text-4xl font-display font-bold leading-tight">
            Prototype the <span className="text-gradient">future</span> together, in augmented reality.
          </h2>
          <p className="text-muted-foreground">
            Design, iterate, and ship 3D experiences with your team — in real time, from any device.
          </p>
          <div className="grid grid-cols-3 gap-3 pt-4">
            {["Live Co-edit", "AR Preview", "3D Assets"].map((t) => (
              <div key={t} className="glass rounded-xl p-3 text-center text-xs">{t}</div>
            ))}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">© 2026 Legacy Collaborative AR</div>
      </div>

      {/* Form side */}
      <div className="relative flex items-center justify-center p-6">
        <div className="absolute inset-0 grid-bg opacity-40 lg:hidden" />
        <div className="relative w-full max-w-md glass-strong rounded-3xl p-8 shadow-[0_30px_80px_-30px_oklch(0.10_0.03_280/80%)]">
          <div className="lg:hidden mb-6"><Logo /></div>
          <h1 className="text-2xl font-display font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1 mb-6">{subtitle}</p>
          {children}
          <div className="mt-6 text-sm text-center text-muted-foreground">{footer}</div>
        </div>
      </div>
    </div>
  );
}
