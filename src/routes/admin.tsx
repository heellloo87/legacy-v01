import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  Shield, Users, Box, Activity, Search, ChevronDown,
  Loader2, RefreshCw, Trash2, Crown, Pencil, Check, X,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — Legacy AR" }] }),
  component: AdminPage,
});

/* ---------- Types ---------- */

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  created_at: string;
};

const ROLES = ["designer", "collaborator", "manufacturing_expert", "admin"] as const;
type Role = typeof ROLES[number];

const ROLE_COLORS: Record<string, string> = {
  admin:                "from-purple-500 to-purple-700",
  designer:             "from-teal-500 to-teal-700",
  collaborator:         "from-blue-500 to-blue-700",
  manufacturing_expert: "from-amber-500 to-amber-700",
};

const ROLE_BADGE: Record<string, string> = {
  admin:                "bg-purple-500/20 text-purple-300 border-purple-500/30",
  designer:             "bg-teal-500/20 text-teal-300 border-teal-500/30",
  collaborator:         "bg-blue-500/20 text-blue-300 border-blue-500/30",
  manufacturing_expert: "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

/* ---------- Helpers ---------- */

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function getInitials(name: string | null, id: string) {
  if (!name) return id.slice(0, 2).toUpperCase();
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function formatRole(role: string | null) {
  if (!role) return "No role";
  return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ---------- Hooks ---------- */

function useProfiles() {
  return useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });
}

function useProjectCount() {
  return useQuery({
    queryKey: ["admin-project-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });
}

function useActiveProjectCount() {
  return useQuery({
    queryKey: ["admin-active-projects"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");
      if (error) throw error;
      return count ?? 0;
    },
  });
}

function useCommentCount() {
  return useQuery({
    queryKey: ["admin-comment-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });
}

/* ---------- Page ---------- */

function AdminPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const profiles     = useProfiles();
  const projectCount = useProjectCount();
  const activeCount  = useActiveProjectCount();
  const commentCount = useCommentCount();

  const [search, setSearch]       = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingRole, setPendingRole] = useState<string>("");

  /* Role change mutation */
  const changeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: (_, { userId, role }) => {
      qc.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast.success(`Role updated to ${formatRole(role)}`);
      setEditingId(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to update role"),
  });

  /* Delete user mutation */
  const deleteUser = useMutation({
  mutationFn: async (userId: string) => {
    const { error } = await supabase.functions.invoke("delete-user", {
      body: { userId },
    });
    if (error) throw error;
  },
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ["admin-profiles"] });
    toast.success("User deleted");
  },
  onError: (e: any) => toast.error(e.message ?? "Failed to delete user"),
});

  const allProfiles = profiles.data ?? [];
  const filtered = allProfiles.filter((p) => {
    const matchSearch = !search ||
      p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || p.role === roleFilter;
    return matchSearch && matchRole;
  });

  const adminCount = allProfiles.filter((p) => p.role === "admin").length;

  const stats = [
    { label: "Total Users",     value: profiles.isPending ? "…" : String(allProfiles.length), icon: Users,    color: "from-purple-500 to-purple-700" },
    { label: "Total Projects",  value: projectCount.isPending ? "…" : String(projectCount.data), icon: Box, color: "from-teal-500 to-teal-700" },
    { label: "Active Projects", value: activeCount.isPending ? "…" : String(activeCount.data),  icon: Activity, color: "from-blue-500 to-blue-700" },
    { label: "Total Comments",  value: commentCount.isPending ? "…" : String(commentCount.data), icon: Shield, color: "from-amber-500 to-amber-700" },
  ];

  return (
    <ProtectedRoute roles={["admin"]}>
      <AppShell title="Admin Dashboard">
        <div className="space-y-6">

          {/* Header */}
          <div className="relative overflow-hidden glass-strong rounded-3xl p-6">
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/30 blur-3xl" />
            <div className="absolute -bottom-20 left-10 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
            <div className="relative flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 text-xs mb-3">
                  <Crown className="h-3 w-3 text-accent" /> Admin Panel
                </div>
                <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                  Manage users, roles, projects and platform activity.
                </p>
              </div>
              <button
                onClick={() => {
                  qc.invalidateQueries({ queryKey: ["admin-profiles"] });
                  qc.invalidateQueries({ queryKey: ["admin-project-count"] });
                  qc.invalidateQueries({ queryKey: ["admin-active-projects"] });
                  qc.invalidateQueries({ queryKey: ["admin-comment-count"] });
                  toast.success("Data refreshed");
                }}
                className="glass rounded-xl p-3 hover:bg-white/10 transition"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="glass rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${s.color} grid place-items-center`}>
                    <s.icon className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="text-2xl font-display font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* User Management */}
          <div className="glass-strong rounded-3xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="font-display font-semibold text-lg">User Management</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {allProfiles.length} users · {adminCount} admin{adminCount !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="flex items-center gap-2 glass rounded-xl px-3 py-2">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search users…"
                    className="bg-transparent outline-none text-sm w-36"
                  />
                </div>

                {/* Role filter */}
                <div className="relative">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="glass rounded-xl px-3 py-2 text-sm bg-transparent outline-none appearance-none pr-8 cursor-pointer"
                  >
                    <option value="all" className="bg-popover">All roles</option>
                    {ROLES.map((r) => (
                      <option key={r} value={r} className="bg-popover">{formatRole(r)}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Table */}
            {profiles.isPending ? (
              <div className="grid place-items-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="grid place-items-center h-40 text-muted-foreground text-sm">
                No users found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left text-[10px] uppercase tracking-widest text-muted-foreground pb-3 pr-4">User</th>
                      <th className="text-left text-[10px] uppercase tracking-widest text-muted-foreground pb-3 pr-4">Role</th>
                      <th className="text-left text-[10px] uppercase tracking-widest text-muted-foreground pb-3 pr-4">Joined</th>
                      <th className="text-left text-[10px] uppercase tracking-widest text-muted-foreground pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.map((profile) => {
                      const isMe      = profile.id === user?.id;
                      const isEditing = editingId === profile.id;
                      const color     = ROLE_COLORS[profile.role ?? ""] ?? "from-gray-500 to-gray-700";

                      return (
                        <tr key={profile.id} className="group hover:bg-white/3 transition">
                          {/* User */}
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-3">
                              <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${color} grid place-items-center text-xs font-semibold shrink-0`}>
                                {getInitials(profile.full_name, profile.id)}
                              </div>
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  {profile.full_name ?? "Unnamed user"}
                                  {isMe && <span className="text-[10px] glass rounded-full px-2 py-0.5 text-accent">You</span>}
                                </div>
                                <div className="text-[10px] text-muted-foreground font-mono">{profile.id.slice(0, 16)}…</div>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-3 pr-4">
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <select
                                  value={pendingRole}
                                  onChange={(e) => setPendingRole(e.target.value)}
                                  className="glass rounded-lg px-2 py-1.5 text-xs bg-transparent outline-none appearance-none cursor-pointer border border-accent/40"
                                  autoFocus
                                >
                                  {ROLES.map((r) => (
                                    <option key={r} value={r} className="bg-popover">{formatRole(r)}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => changeRole.mutate({ userId: profile.id, role: pendingRole })}
                                  disabled={changeRole.isPending}
                                  className="h-7 w-7 rounded-lg bg-gradient-primary grid place-items-center"
                                >
                                  {changeRole.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="h-7 w-7 rounded-lg glass grid place-items-center hover:bg-white/10"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] border ${ROLE_BADGE[profile.role ?? ""] ?? "bg-white/5 text-muted-foreground border-white/10"}`}>
                                {formatRole(profile.role)}
                              </span>
                            )}
                          </td>

                          {/* Joined */}
                          <td className="py-3 pr-4 text-xs text-muted-foreground">
                            {timeAgo(profile.created_at)}
                          </td>

                          {/* Actions */}
                          <td className="py-3">
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                              {!isEditing && (
                                <button
                                  onClick={() => { setEditingId(profile.id); setPendingRole(profile.role ?? "designer"); }}
                                  className="h-7 w-7 rounded-lg glass grid place-items-center hover:bg-white/10 transition"
                                  title="Change role"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                              )}
                              {!isMe && (
                                <button
                                  onClick={() => {
                                    if (!confirm(`Remove ${profile.full_name ?? "this user"}?`)) return;
                                    deleteUser.mutate(profile.id);
                                  }}
                                  className="h-7 w-7 rounded-lg glass grid place-items-center hover:bg-red-500/20 hover:text-red-400 transition"
                                  title="Remove user"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
