import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import {
  Plus, TrendingUp, Box, Users, Activity, MoreHorizontal,
  Bell, Sparkles, Loader2, FolderOpen, ImageIcon, Lock, Globe,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      {
        title: "Dashboard — Legacy AR",
      },
    ],
  }),

  component: ProtectedDashboard,
});

function ProtectedDashboard() {
  return (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  );
}

/* ---------- Types ---------- */

type Project = {
  id: string;
  user_id: string;
  name: string;
  category: string;
  status: string;
  progress: number;
  cover_url: string | null;
  design_ext: string | null;
  version: string;
  visibility: string;
  creator_name: string | null;
  created_at: string;
};

/* ---------- Hooks ---------- */

/** My projects — all visibility levels, owner only */
function useMyProjects(userId: string | undefined) {
  return useQuery({
    queryKey: ["my-projects", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, user_id, name, category, status, progress, cover_url, design_ext, version, visibility, creator_name, created_at")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Project[];
    },
    enabled: !!userId,
  });
}

/** Team projects — all users' team/public projects (RLS allows this) */
function useTeamProjects(userId: string | undefined) {
  return useQuery({
    queryKey: ["team-projects", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, user_id, name, category, status, progress, cover_url, design_ext, version, visibility, creator_name, created_at")
        .in("visibility", ["team", "public"])
        .neq("user_id", userId!)           // exclude own (already shown above)
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data as Project[];
    },
    enabled: !!userId,
  });
}

function useCommentCount(userId: string | undefined) {
  return useQuery({
    queryKey: ["comment-count", userId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!userId,
  });
}

function useRecentComments(userId: string | undefined) {
  return useQuery({
    queryKey: ["recent-comments", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*, projects(name)")
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

/* ---------- Helpers ---------- */

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const STATUS_BADGE: Record<string, string> = {
  active: "text-accent border-accent/30 bg-accent/10",
  review: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  draft:  "text-muted-foreground border-white/10 bg-white/5",
};

/* ---------- Project Card ---------- */

function ProjectCard({ p, showCreator = false }: { p: Project; showCreator?: boolean }) {
  return (
    <Link
      to="/workspace"
      search={{ id: p.id }}
      className="glass rounded-2xl p-4 hover:border-accent/30 transition group block"
    >
      {/* Thumbnail */}
      <div className="h-32 rounded-xl relative overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
        {p.cover_url ? (
          <img
            src={p.cover_url}
            alt={p.name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            {p.design_ext && ["glb", "gltf"].includes(p.design_ext) ? (
              <Box className="h-10 w-10 text-white/20" />
            ) : (
              <ImageIcon className="h-10 w-10 text-white/20" />
            )}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

        {/* Status badge */}
        <div className={`absolute top-2 right-2 rounded-md px-2 py-0.5 text-[10px] capitalize border ${STATUS_BADGE[p.status] ?? STATUS_BADGE.draft}`}>
          {p.status}
        </div>

        {/* 3D badge */}
        {p.design_ext && ["glb", "gltf"].includes(p.design_ext) && (
          <div className="absolute top-2 left-2 glass rounded-md px-2 py-0.5 text-[10px] text-accent inline-flex items-center gap-1">
            <Box className="h-2.5 w-2.5" /> 3D
          </div>
        )}

        {/* Visibility badge */}
        <div className="absolute bottom-2 left-2 glass rounded-md px-2 py-0.5 text-[10px] inline-flex items-center gap-1">
          {p.visibility === "private"
            ? <Lock className="h-2.5 w-2.5 text-muted-foreground" />
            : <Globe className="h-2.5 w-2.5 text-accent" />}
          <span className="capitalize text-muted-foreground">{p.visibility}</span>
        </div>
      </div>

      <div className="mt-3">
        <div className="text-sm font-medium truncate">{p.name}</div>
        <div className="flex items-center justify-between mt-0.5">
          <div className="text-[11px] text-muted-foreground">{p.category}</div>
          {showCreator && p.creator_name && (
            <div className="text-[10px] text-accent truncate max-w-[80px]">{p.creator_name}</div>
          )}
        </div>
      </div>
      <div className="mt-3">
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full bg-gradient-primary" style={{ width: `${p.progress}%` }} />
        </div>
        <div className="text-[10px] text-muted-foreground mt-1">{p.progress}% complete</div>
      </div>
    </Link>
  );
}

/* ---------- Section ---------- */

function ProjectSection({
  title,
  icon: Icon,
  badge,
  projects,
  isPending,
  isError,
  emptyMsg,
  showCreator = false,
  linkTo,
}: {
  title: string;
  icon: React.ElementType;
  badge?: string;
  projects: Project[];
  isPending: boolean;
  isError: boolean;
  emptyMsg: string;
  showCreator?: boolean;
  linkTo?: string;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold flex items-center gap-2">
          <Icon className="h-4 w-4 text-accent" />
          {title}
          {badge !== undefined && (
            <span className="ml-1 glass rounded-full px-2 py-0.5 text-[10px] text-muted-foreground">{badge}</span>
          )}
        </h3>
        {linkTo && (
          <Link to={linkTo} className="text-xs text-accent hover:underline">+ New</Link>
        )}
      </div>

      {isPending ? (
        <div className="grid place-items-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      ) : isError ? (
        <div className="grid place-items-center h-40 text-sm text-destructive">Failed to load projects</div>
      ) : projects.length === 0 ? (
        <div className="grid place-items-center h-40 text-center gap-3">
          <FolderOpen className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{emptyMsg}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((p) => (
            <ProjectCard key={p.id} p={p} showCreator={showCreator} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Page ---------- */

function Dashboard() {
  const { user } = useAuth();

  const myProjects     = useMyProjects(user?.id);
  const teamProjects   = useTeamProjects(user?.id);
  const commentCount   = useCommentCount(user?.id);
  const recentComments = useRecentComments(user?.id);

  const displayName  = user?.user_metadata?.full_name?.split(" ")[0] ?? "there";
  const myCount      = myProjects.data?.length ?? 0;
  const teamCount    = teamProjects.data?.length ?? 0;
  const activeCount  = myProjects.data?.filter((p) => p.status === "active").length ?? 0;

  const stats = [
    { label: "My Projects",   value: myProjects.isPending    ? "…" : String(myCount),          change: `${activeCount} active`,  icon: Box },
    { label: "Team Projects", value: teamProjects.isPending  ? "…" : String(teamCount),         change: "shared with team",       icon: Users },
    { label: "AR Sessions",   value: "—",                                                        change: "coming soon",            icon: Activity },
    { label: "Comments",      value: commentCount.isPending  ? "…" : String(commentCount.data), change: "total",                  icon: TrendingUp },
  ];

  return (
    <AppShell title="Dashboard">
      <div className="space-y-6">

        {/* Welcome banner */}
        <div className="relative overflow-hidden glass-strong rounded-3xl p-6 lg:p-8">
          <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -bottom-20 left-10   h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 text-xs mb-3">
                <Sparkles className="h-3 w-3 text-accent" /> {greeting()}, {displayName}
              </div>
              <h2 className="text-3xl font-display font-bold">
                Welcome back to your <span className="text-gradient">AR workspace</span>
              </h2>
              <p className="text-muted-foreground mt-2 max-w-xl">
                {myCount === 0
                  ? "You have no projects yet — create your first one to get started."
                  : `You have ${myCount} project${myCount > 1 ? "s" : ""}${teamCount > 0 ? ` and ${teamCount} team project${teamCount > 1 ? "s" : ""} shared with you` : ""}.`}
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

          {/* My projects — full width top, spans 2 cols */}
          <div className="lg:col-span-2 space-y-6">

            {/* Private / own projects */}
            <ProjectSection
              title="My Projects"
              icon={Lock}
              badge={String(myCount)}
              projects={myProjects.data ?? []}
              isPending={myProjects.isPending}
              isError={myProjects.isError}
              emptyMsg="No projects yet"
              linkTo="/projects/new"
            />

            {/* Team projects from other users */}
            <ProjectSection
              title="Team Projects"
              icon={Users}
              badge={String(teamCount)}
              projects={teamProjects.data ?? []}
              isPending={teamProjects.isPending}
              isError={teamProjects.isError}
              emptyMsg="No team projects shared yet"
              showCreator
            />
          </div>

          {/* Recent activity */}
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
              <div className="text-sm text-muted-foreground text-center py-8">No activity yet</div>
            ) : (
              <div className="space-y-3">
                {recentComments.data?.map((c) => (
                  <div key={c.id} className="flex items-start gap-3 glass rounded-xl p-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-primary grid place-items-center text-[10px] font-semibold shrink-0">
                      {c.user_id.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground truncate">
                        Comment on{" "}
                        <Link
                          to="/workspace"
                          search={{ id: c.project_id }}
                          className="text-foreground hover:text-accent transition"
                        >
                          {(c as any).projects?.name ?? "a project"}
                        </Link>
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
