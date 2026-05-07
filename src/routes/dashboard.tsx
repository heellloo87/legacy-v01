import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import {
  Plus, TrendingUp, Box, Users, Activity, MoreHorizontal, Bell, Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Legacy AR" }] }),
  component: Dashboard,
});

const stats = [
  { label: "Active Projects", value: "12", change: "+3", icon: Box },
  { label: "Collaborators", value: "48", change: "+8", icon: Users },
  { label: "AR Sessions", value: "1.2K", change: "+24%", icon: Activity },
  { label: "Renders", value: "8.7K", change: "+12%", icon: TrendingUp },
];

const projects = [
  { name: "Helios Headset v3", cat: "Hardware", members: 5, progress: 78, color: "from-primary to-secondary" },
  { name: "Neon Smartwatch", cat: "Wearable", members: 3, progress: 42, color: "from-secondary to-accent" },
  { name: "Aether Drone", cat: "Robotics", members: 7, progress: 91, color: "from-accent to-primary" },
  { name: "Quantum Speaker", cat: "Audio", members: 4, progress: 25, color: "from-primary to-accent" },
  { name: "Pulse VR Glove", cat: "Wearable", members: 6, progress: 60, color: "from-secondary to-primary" },
  { name: "Orbit Camera", cat: "Optics", members: 2, progress: 15, color: "from-accent to-secondary" },
];

const notifications = [
  { who: "Maya", what: "commented on Helios Headset v3", when: "2m" },
  { who: "Leo", what: "uploaded a new design to Aether Drone", when: "18m" },
  { who: "System", what: "AR render queue completed", when: "1h" },
  { who: "Sara", what: "invited you to Quantum Speaker", when: "3h" },
];

function Dashboard() {
  return (
    <AppShell title="Dashboard">
      <div className="space-y-6">
        {/* Welcome */}
        <div className="relative overflow-hidden glass-strong rounded-3xl p-6 lg:p-8">
          <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -bottom-20 left-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 text-xs mb-3">
                <Sparkles className="h-3 w-3 text-accent" /> Good evening, Ada
              </div>
              <h2 className="text-3xl font-display font-bold">Welcome back to your <span className="text-gradient">AR workspace</span></h2>
              <p className="text-muted-foreground mt-2 max-w-xl">You have 3 design reviews pending and 5 new comments from your team today.</p>
            </div>
            <Link to="/projects/new" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-primary text-white shadow-[0_0_30px_-8px_oklch(0.65_0.24_295/70%)] self-start">
              <Plus className="h-4 w-4" /> Create project
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-gradient-primary/30 grid place-items-center"><s.icon className="h-4 w-4 text-accent" /></div>
                <span className="text-xs text-accent">{s.change}</span>
              </div>
              <div className="mt-4 text-2xl font-display font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Projects */}
          <div className="lg:col-span-2 glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold">Recent Projects</h3>
              <button className="text-xs text-accent hover:underline">View all</button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {projects.map((p) => (
                <div key={p.name} className="glass rounded-2xl p-4 hover:border-accent/30 transition group">
                  <div className={`h-28 rounded-xl bg-gradient-to-br ${p.color} grid-bg relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute top-2 right-2 glass rounded-md p-1"><MoreHorizontal className="h-3.5 w-3.5" /></div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{p.name}</div>
                      <div className="text-[11px] text-muted-foreground">{p.cat}</div>
                    </div>
                    <div className="flex -space-x-2">
                      {Array.from({ length: Math.min(p.members, 3) }).map((_, i) => (
                        <div key={i} className="h-6 w-6 rounded-full bg-gradient-primary border border-background text-[9px] grid place-items-center">{String.fromCharCode(65 + i)}</div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full bg-gradient-primary" style={{ width: `${p.progress}%` }} />
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">{p.progress}% complete</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications</h3>
              <button className="text-xs text-accent hover:underline">Mark read</button>
            </div>
            <div className="space-y-3">
              {notifications.map((n, i) => (
                <div key={i} className="flex items-start gap-3 glass rounded-xl p-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-primary grid place-items-center text-[10px] font-semibold">{n.who[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm"><span className="font-medium">{n.who}</span> <span className="text-muted-foreground">{n.what}</span></div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{n.when} ago</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
