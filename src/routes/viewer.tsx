import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Box,
  ImageIcon,
  Lock,
  Globe,
  Search,
  Loader2,
  FolderOpen,
  Eye,
} from "lucide-react";

export const Route = createFileRoute("/viewer")({
  head: () => ({
    meta: [{ title: "3D Viewer — Legacy AR" }],
  }),
  component: ProtectedViewerPicker,
});

function ProtectedViewerPicker() {
  return (
    <RequireAuth
      roles={[
        "admin",
        "designer",
        "collaborator",
        "manufacturing_expert",
      ]}
    >
      <ViewerPicker />
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
  design_url: string | null;
  design_ext: string | null;
  version: string;
  visibility: string;
  creator_name: string | null;
  created_at: string;
};

/* ---------- Constants ---------- */

const STATUS_BADGE: Record<string, string> = {
  active:      "text-accent border-accent/30 bg-accent/10",
  review:      "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  draft:       "text-muted-foreground border-white/10 bg-white/5",
  "in-progress": "text-blue-400 border-blue-400/30 bg-blue-400/10",
  done:        "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
};

const MODEL_EXT = ["glb", "gltf"];

/* ---------- Hooks ---------- */

function useViewerProjects(userId: string | undefined) {
  return useQuery({
    queryKey: ["viewer-projects", userId],
    queryFn: async () => {
      const [ownRes, teamRes] = await Promise.all([
        supabase
          .from("projects")
          .select(
            "id, user_id, name, category, status, progress, cover_url, design_url, design_ext, version, visibility, creator_name, created_at"
          )
          .eq("user_id", userId!)
          .order("created_at", { ascending: false }),
        supabase
          .from("projects")
          .select(
            "id, user_id, name, category, status, progress, cover_url, design_url, design_ext, version, visibility, creator_name, created_at"
          )
          .in("visibility", ["team", "public"])
          .neq("user_id", userId!)
          .order("created_at", { ascending: false }),
      ]);
      if (ownRes.error)  throw ownRes.error;
      if (teamRes.error) throw teamRes.error;
      return [...(ownRes.data ?? []), ...(teamRes.data ?? [])] as Project[];
    },
    enabled: !!userId,
  });
}

/* ---------- Main ---------- */

function ViewerPicker() {
  const nav        = useNavigate();
  const { user }   = useAuth();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "3d" | "image">("all");

  const { data: projects = [], isPending, isError } = useViewerProjects(user?.id);

  const filtered = projects.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      filter === "all" ||
      (filter === "3d"    && p.design_ext && MODEL_EXT.includes(p.design_ext)) ||
      (filter === "image" && p.design_ext && !MODEL_EXT.includes(p.design_ext));

    return matchSearch && matchFilter;
  });

  const modelCount = projects.filter(
    (p) => p.design_ext && MODEL_EXT.includes(p.design_ext)
  ).length;

  const openViewer = (id: string) => {
    nav({ to: "/viewer/$projectId", params: { projectId: id } });
  };

  return (
    <AppShell title="3D Viewer">
      <div className="space-y-6">

        {/* Header banner */}
        <div className="relative overflow-hidden glass-strong rounded-3xl p-6 lg:p-8">
          <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -bottom-20 left-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 text-xs mb-3">
                <Box className="h-3 w-3 text-accent" /> Select a project to view in 3D
              </div>
              <h2 className="text-3xl font-display font-bold">
                Choose a <span className="text-gradient">project</span> to open
              </h2>
              <p className="text-muted-foreground mt-2 max-w-xl">
                {isPending
                  ? "Loading your projects…"
                  : `${projects.length} project${projects.length !== 1 ? "s" : ""} available · ${modelCount} with 3D models`}
              </p>
            </div>

            {/* Stats pills */}
            <div className="flex gap-3 shrink-0">
              <div className="glass rounded-2xl px-5 py-3 text-center">
                <div className="text-2xl font-display font-bold">{projects.length}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Total</div>
              </div>
              <div className="glass rounded-2xl px-5 py-3 text-center">
                <div className="text-2xl font-display font-bold text-accent">{modelCount}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">3D Models</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 glass rounded-xl px-4 py-2.5 flex-1">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects…"
              className="bg-transparent outline-none text-sm flex-1"
            />
          </div>

          <div className="flex gap-1 glass rounded-xl p-1 shrink-0">
            {(["all", "3d", "image"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-xs transition capitalize ${
                  filter === f
                    ? "bg-gradient-primary text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "all" ? "All" : f === "3d" ? "3D Models" : "Images"}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {isPending ? (
          <div className="flex h-64 items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading projects…</span>
          </div>
        ) : isError ? (
          <div className="flex h-64 items-center justify-center text-sm text-destructive">
            Failed to load projects
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
            <FolderOpen className="h-10 w-10 opacity-30" />
            <p className="text-sm">
              {search ? `No projects match "${search}"` : "No projects yet"}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((p) => {
              const isModel = p.design_ext && MODEL_EXT.includes(p.design_ext);
              const hasDesign = !!p.design_url;

              return (
                <button
                  key={p.id}
                  onClick={() => openViewer(p.id)}
                  className="glass rounded-2xl p-4 hover:border-accent/40 transition group text-left block w-full"
                >
                  {/* Thumbnail */}
                  <div className="h-36 rounded-xl relative overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
                    {p.cover_url ? (
                      <img
                        src={p.cover_url}
                        alt={p.name}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center">
                        {isModel ? (
                          <Box className="h-10 w-10 text-white/20" />
                        ) : (
                          <ImageIcon className="h-10 w-10 text-white/20" />
                        )}
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="glass rounded-xl px-4 py-2 flex items-center gap-2 text-xs font-medium">
                        <Eye className="h-3.5 w-3.5" /> Open in Viewer
                      </div>
                    </div>

                    {/* Status badge */}
                    <div
                      className={`absolute top-2 right-2 rounded-md px-2 py-0.5 text-[10px] capitalize border ${
                        STATUS_BADGE[p.status] ?? STATUS_BADGE.draft
                      }`}
                    >
                      {p.status}
                    </div>

                    {/* 3D badge */}
                    {isModel && (
                      <div className="absolute top-2 left-2 glass rounded-md px-2 py-0.5 text-[10px] text-accent inline-flex items-center gap-1">
                        <Box className="h-2.5 w-2.5" /> 3D
                      </div>
                    )}

                    {/* No design badge */}
                    {!hasDesign && (
                      <div className="absolute bottom-2 left-2 glass rounded-md px-2 py-0.5 text-[10px] text-muted-foreground">
                        No design yet
                      </div>
                    )}

                    {/* Visibility */}
                    {hasDesign && (
                      <div className="absolute bottom-2 left-2 glass rounded-md px-2 py-0.5 text-[10px] inline-flex items-center gap-1">
                        {p.visibility === "private" ? (
                          <Lock className="h-2.5 w-2.5 text-muted-foreground" />
                        ) : (
                          <Globe className="h-2.5 w-2.5 text-accent" />
                        )}
                        <span className="capitalize text-muted-foreground">{p.visibility}</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="mt-3">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="flex items-center justify-between mt-0.5">
                      <div className="text-[11px] text-muted-foreground">{p.category}</div>
                      {p.creator_name && (
                        <div className="text-[10px] text-accent truncate max-w-[80px]">
                          {p.creator_name}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mt-3">
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-primary"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="text-[10px] text-muted-foreground">{p.version}</div>
                      <div className="text-[10px] text-muted-foreground">{p.progress}%</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
