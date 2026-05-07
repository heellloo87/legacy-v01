import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Box, Users, Sparkles, Zap } from "lucide-react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Legacy Collaborative AR Platform" },
      { name: "description", content: "Futuristic collaborative product prototyping platform powered by AR and 3D." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen grid-bg">
      <header className="px-6 lg:px-10 py-5 flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#preview" className="hover:text-foreground">Preview</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className="text-sm px-4 py-2 rounded-xl hover:bg-white/5">Sign in</Link>
          <Link to="/register" className="text-sm px-4 py-2 rounded-xl bg-gradient-primary text-white shadow-[0_0_30px_-8px_oklch(0.65_0.24_295/70%)]">Get started</Link>
        </div>
      </header>

      <section className="relative px-6 lg:px-10 pt-16 pb-24 max-w-6xl mx-auto text-center">
        <div className="absolute inset-x-0 -top-10 h-96 bg-gradient-glow pointer-events-none" />
        <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 text-xs mb-6">
          <Sparkles className="h-3 w-3 text-accent" /> Now in beta — invite-only
        </div>
        <h1 className="text-5xl lg:text-7xl font-display font-bold tracking-tight">
          Build the next era of <span className="text-gradient">AR products</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          A collaborative prototyping platform where teams design, review, and ship immersive 3D experiences together — in real time.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/dashboard" className="px-6 py-3 rounded-xl bg-gradient-primary text-white inline-flex items-center gap-2 shadow-[0_0_40px_-8px_oklch(0.65_0.24_295/70%)]">
            Launch Dashboard <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/viewer" className="px-6 py-3 rounded-xl glass inline-flex items-center gap-2">
            Try 3D Viewer
          </Link>
        </div>

        <div id="features" className="grid sm:grid-cols-3 gap-4 mt-20 text-left">
          {[
            { icon: Box, title: "3D & AR Native", desc: "View, rotate, and annotate 3D models directly in the browser." },
            { icon: Users, title: "Real-time Collab", desc: "Comment, react, and iterate with your team — instantly." },
            { icon: Zap, title: "Lightning Workflow", desc: "From concept to prototype in minutes, not weeks." },
          ].map((f) => (
            <div key={f.title} className="glass rounded-2xl p-6">
              <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center mb-4"><f.icon className="h-5 w-5" /></div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
