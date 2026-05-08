import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import {
  Plus, TrendingUp, Box, Users, Activity, MoreHorizontal,
  Bell, Sparkles, Loader2, FolderOpen,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Legacy AR" }] }),
  component: Dashboard,
});

/* ---------- Hooks ---------- */

function useProjects() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["projects", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

function useCommentCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["comment-count", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
  });
}

function useRecentComments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["recent-comments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*, projects(name)")
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

/* ---------- Helpers ---------- */

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const STATUS_COLOR: Record<string, string> = {
  active: "text-accent",
  review: "text-yellow-400",
  draft:  "text-muted-foreground",
};

/* ---------- Page ---------- */

function Dashboard() {
  const { user } = useAuth();
  const projects      = useProjects();
  const commentCount  = useCommentCount();
  const recentComments = useRecentComments();

  const displayName = user?.user_metadata?.full_name?.split(" ")[0] ?? "there";
  const projectCount = projects.data?.length ?? 0;
  const activeCount  = projects.data?.filter((p) => p.status === "active").length ?? 0;

  const stats = [
    { label: "My Projects",   value: projects.isPending ? "…" : String(projectCount), change: `${activeCount} active`, icon: Box },
    { label: "Collaborators", value: "—",  change: "coming soon", icon: Users },
    { label: "AR Sessions",   value: "—",  change: "coming soon", icon: Activity },
    { label: "Comments",      value: commentCount.isPending ? "…" : String(commentCount.data), change: "total", icon: TrendingUp },
  ];

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
                <Sparkles className="h-3 w-3 text-accent" /> {greeting()}, {displayName}
              </div>
              <h2 className="text-3xl font-display font-bold">
                Welcome back to your <span className="text-gradient">AR workspace</span>
              </h2>
              <p className="text-muted-foreground mt-2 max-w-xl">
                {projectCount === 0
                  ? "You have no projects yet — create your first one to get started."
                  : `You have ${projectCount} project${projectCount > 1 ? "s" : ""} in your workspace.`}
              </p>
            </div>
            <Link
              to="/projects/new"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-primary text-white shadow-[0_0_30px_-8px_oklch(0.65_0.24_295/70%)] self-start"
            >
              <Plus className="h-4 w-4" /> Create project
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-gradient-primary/30 grid place-items-center">
                  <s.icon className="h-4 w-4 text-accent" />
                </div>
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
              <Link to="/projects/new" className="text-xs text-accent hover:underline">
                + New project
              </Link>
            </div>

            {projects.isPending ? (
              <div className="grid place-items-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
              </div>
            ) : projects.isError ? (
              <div className="grid place-items-center h-40 text-sm text-destructive">
                Failed to load projects
              </div>
            ) : projects.data?.length === 0 ? (
              <div className="grid place-items-center h-40 text-center gap-3">
                <FolderOpen className="h-10 w-10 text-muted-foreground/40" />
                <div>
                  <p className="text-sm text-muted-foreground">No projects yet</p>
                  <Link to="/projects/new" className="text-xs text-accent hover:underline mt-1 inline-block">
                    Create your first project →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {projects.data.map((p) => (
                  <Link
                    key={p.id}
                    to="/workspace"
                    className="glass rounded-2xl p-4 hover:border-accent/30 transition group block"
                  >
                    {/* Placeholder thumbnail */}
                    <div className="h-32 rounded-xl relative overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
                      <div className="absolute inset-0 grid place-items-center">
                        <Box className="h-10 w-10 text-white/20" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                      <div className="absolute top-2 right-2 glass rounded-md px-2 py-0.5 text-[10px] capitalize">
                        {p.status}
                      </div>
                      <div className="absolute top-2 left-2 glass rounded-md p-1">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-sm font-medium truncate">{p.name}</div>
                      <div className="text-[11px] text-muted-foreground">{p.category}</div>
                    </div>
                    <div className="mt-3">
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full bg-gradient-primary" style={{ width: `${p.progress}%` }} />
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">{p.progress}% complete</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent comments as notifications */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4" /> Recent Activity
              </h3>
            </div>

            {recentComments.isPending ? (
              <div className="grid place-items-center h-24">
                <Loader2 className="h-5 w-5 animate-spin text-accent" />
              </div>
            ) : recentComments.data?.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                No activity yet
              </div>
            ) : (
              <div className="space-y-3">
                {recentComments.data?.map((c) => (
                  <div key={c.id} className="flex items-start gap-3 glass rounded-xl p-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-primary grid place-items-center text-[10px] font-semibold shrink-0">
                      {c.user_id.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground truncate">
                        Comment on <span className="text-foreground">{(c as any).projects?.name ?? "a project"}</span>
                      </div>
                      <div className="text-xs mt-0.5 truncate">{c.text}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(c.created_at)} ago</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
