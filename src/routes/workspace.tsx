import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import {
  Send, Upload, Heart, MessageSquare, Share2, Eye, History,
  Users, Tag, Calendar, ChevronLeft, ChevronRight, Search,
  X, Clock, CheckCircle2, AlertCircle, Plus, ImageIcon, Loader2, Box,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback, Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF, Center } from "@react-three/drei";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

/* ---------- Route — reads ?id search param ---------- */

export const Route = createFileRoute("/workspace")({
  head: () => ({ meta: [{ title: "Workspace — Legacy AR" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === "string" ? search.id : undefined,
  }),
  component: Workspace,
});

/* ---------- Types ---------- */

type DbProject = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  status: "active" | "review" | "draft";
  progress: number;
  version: string;
  visibility: string;
  cover_url: string | null;
  design_url: string | null;
  design_ext: string | null;
  created_at: string;
  updated_at: string;
};

type Comment = {
  id: string;
  project_id: string;
  user_id: string;
  text: string;
  created_at: string;
};

/* ---------- Constants ---------- */

const MODEL_EXT = ["glb", "gltf"];

const COLORS = [
  "from-primary to-secondary",
  "from-secondary to-accent",
  "from-accent to-primary",
  "from-primary to-accent",
];

const STATUS_ICON: Record<string, React.ReactNode> = {
  active: <CheckCircle2 className="h-3 w-3 text-accent" />,
  review: <AlertCircle  className="h-3 w-3 text-yellow-400" />,
  draft:  <Clock        className="h-3 w-3 text-muted-foreground" />,
};

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

function nextVersion(current: string) {
  const n = parseInt(current.replace("v", ""), 10);
  return `v${isNaN(n) ? 1 : n + 1}`;
}

/* ---------- Data hooks ---------- */

function useAllProjects() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["projects", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(
          "id, name, description, category, status, progress, version, visibility, cover_url, design_url, design_ext, created_at, updated_at"
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DbProject[];
    },
    enabled: !!user,
  });
}

function useComments(projectId: string | undefined) {
  return useQuery({
    queryKey: ["comments", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Comment[];
    },
    enabled: !!projectId,
  });
}

/* ---------- Page ---------- */

function Workspace() {
  const { id: routeId } = Route.useSearch();
  const { user }        = useAuth();
  const qc              = useQueryClient();

  const allProjects = useAllProjects();
  const projects    = allProjects.data ?? [];

  /* Active project — prefer route param, else first */
  const [activeId, setActiveId] = useState<string | undefined>(routeId);
  useEffect(() => {
    if (!activeId && projects.length > 0) setActiveId(projects[0].id);
  }, [projects, activeId]);
  useEffect(() => {
    if (routeId) setActiveId(routeId);
  }, [routeId]);

  const project = projects.find((p) => p.id === activeId);
  const idx     = projects.findIndex((p) => p.id === activeId);

  const prev = useCallback(() => {
    if (!projects.length) return;
    setActiveId(projects[(idx - 1 + projects.length) % projects.length].id);
  }, [idx, projects]);

  const next = useCallback(() => {
    if (!projects.length) return;
    setActiveId(projects[(idx + 1) % projects.length].id);
  }, [idx, projects]);

  /* ---- Comments ---- */
  const commentsQuery = useComments(activeId);
  const comments      = commentsQuery.data ?? [];
  const [commentText, setCommentText] = useState("");

  const addComment = useMutation({
    mutationFn: async (text: string) => {
      if (!user || !activeId) throw new Error("Not ready");
      const { error } = await supabase
        .from("comments")
        .insert({ project_id: activeId, user_id: user.id, text });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", activeId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const sendComment = useCallback(() => {
    const text = commentText.trim();
    if (!text) return;
    addComment.mutate(text);
    setCommentText("");
  }, [commentText, addComment]);

  /* ---- Likes (local, wire to DB if needed) ---- */
  const [likedIds,   setLikedIds]   = useState<Set<string>>(new Set());
  const [localLikes, setLocalLikes] = useState<Record<string, number>>({});
  const isLiked   = activeId ? likedIds.has(activeId) : false;
  const liveLikes = (localLikes[activeId ?? ""] ?? 0);

  const toggleLike = useCallback(() => {
    if (!activeId) return;
    setLikedIds((prev) => {
      const next  = new Set(prev);
      const delta = prev.has(activeId) ? -1 : 1;
      prev.has(activeId) ? next.delete(activeId) : next.add(activeId);
      setLocalLikes((lk) => ({ ...lk, [activeId]: (lk[activeId] ?? 0) + delta }));
      return next;
    });
  }, [activeId]);

  /* ---- Upload design ---- */
  const [showUpload,    setShowUpload]    = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadFile,    setUploadFile]    = useState<File | null>(null);
  const [uploading,     setUploading]     = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setUploadPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const confirmUpload = useCallback(async () => {
    if (!uploadFile || !activeId || !user || !project) return;
    setUploading(true);
    try {
      const newVer = nextVersion(project.version);
      const ext    = uploadFile.name.split(".").pop()?.toLowerCase() ?? "png";
      const path   = `designs/${user.id}/${activeId}/${Date.now()}-${uploadFile.name}`;

      const { error: storErr } = await supabase.storage
        .from("project-assets")
        .upload(path, uploadFile, { upsert: true });
      if (storErr) throw storErr;

      const { data: { publicUrl } } = supabase.storage
        .from("project-assets")
        .getPublicUrl(path);

      const { error: dbErr } = await supabase
        .from("projects")
        .update({ design_url: publicUrl, design_ext: ext, version: newVer })
        .eq("id", activeId);
      if (dbErr) throw dbErr;

      qc.invalidateQueries({ queryKey: ["projects", user.id] });
      toast.success(`Design uploaded as ${newVer}`);
      setShowUpload(false);
      setUploadPreview(null);
      setUploadFile(null);
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [uploadFile, activeId, user, project, qc]);

  const closeUpload = () => {
    if (uploading) return;
    setShowUpload(false);
    setUploadPreview(null);
    setUploadFile(null);
  };

  /* ---- Picker / search ---- */
  const [showPicker, setShowPicker] = useState(false);
  const [search,     setSearch]     = useState("");
  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  /* ---- Loading / empty states ---- */
  if (allProjects.isPending) {
    return (
      <AppShell title="Workspace">
        <div className="flex h-[60vh] items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading projects…</span>
        </div>
      </AppShell>
    );
  }

  if (!project) {
    return (
      <AppShell title="Workspace">
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-muted-foreground">
          <p className="text-sm">No project found.</p>
        </div>
      </AppShell>
    );
  }

  const isModel3D = !!(project.design_ext && MODEL_EXT.includes(project.design_ext));
  const hasDesign = !!project.design_url;
  const hasCover  = !!project.cover_url;

  /* ---- Render ---- */
  return (
    <AppShell title={project.name}>
      <div className="grid lg:grid-cols-12 gap-6 h-[calc(100vh-9rem)]">

        {/* ---- Left: project info ---- */}
        <aside className="lg:col-span-3 glass-strong rounded-3xl p-5 overflow-y-auto flex flex-col gap-4">

          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Project</div>
            <div className="flex items-center gap-1">
              <button onClick={prev} className="glass rounded-lg p-1 hover:bg-white/10 transition">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button onClick={next} className="glass rounded-lg p-1 hover:bg-white/10 transition">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setShowPicker(true)}
                className="glass rounded-lg px-2 py-1 text-[10px] hover:bg-white/10 transition ml-1"
              >
                All
              </button>
            </div>
          </div>

          {/* Cover thumbnail */}
          <div className="h-32 rounded-2xl relative overflow-hidden">
            {hasCover ? (
              <img
                src={project.cover_url!}
                alt={project.name}
                className="absolute inset-0 h-full w-full object-cover transition-all duration-500"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/20 grid place-items-center">
                {isModel3D ? (
                  <Box className="h-10 w-10 text-white/20" />
                ) : (
                  <ImageIcon className="h-10 w-10 text-white/20" />
                )}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent" />
            <div className="absolute bottom-2 left-2 flex items-center gap-1 glass rounded-md px-2 py-1 text-[10px]">
              {STATUS_ICON[project.status]}
              <span className="capitalize">{project.status}</span>
            </div>
            {isModel3D && (
              <div className="absolute top-2 right-2 glass rounded-md px-2 py-0.5 text-[10px] text-accent inline-flex items-center gap-1">
                <Box className="h-2.5 w-2.5" /> 3D
              </div>
            )}
          </div>

          <div>
            <h3 className="font-display font-semibold text-lg leading-tight">{project.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {project.description ?? "No description."}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
              <span>Progress</span><span>{project.progress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full bg-gradient-primary transition-all duration-700"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <Meta icon={Tag}      label="Category"   value={project.category} />
            <Meta icon={Eye}      label="Visibility"  value={project.visibility} />
            <Meta icon={Calendar} label="Version"     value={project.version} />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <Stat label="Comments" value={String(comments.length)} />
            <Stat label="Progress" value={`${project.progress}%`} />
          </div>
        </aside>

        {/* ---- Center: design viewer ---- */}
        <section className="lg:col-span-6 glass-strong rounded-3xl p-5 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="glass rounded-lg px-3 py-1.5 text-xs">
                {project.version} · current
              </span>
              <button className="glass rounded-lg p-1.5">
                <History className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="glass rounded-lg p-2 hover:bg-white/10">
                <Share2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowUpload(true)}
                className="px-3 py-2 rounded-lg bg-gradient-primary text-white text-xs inline-flex items-center gap-2 shadow-[0_0_20px_-8px_oklch(0.65_0.24_295/70%)]"
              >
                <Upload className="h-3.5 w-3.5" /> Upload new design
              </button>
            </div>
          </div>

          {/* Viewer area */}
          <div className="flex-1 mt-4 rounded-2xl relative overflow-hidden grid place-items-center bg-gradient-to-br from-primary/10 to-accent/10">
            {isModel3D && hasDesign ? (
              /* Interactive 3D viewer */
              <Canvas
                key={project.design_url}
                camera={{ position: [0, 0, 3.5], fov: 50 }}
                dpr={[1, 2]}
                className="absolute inset-0 h-full w-full"
              >
                <Suspense fallback={null}>
                  <Stage environment="city" intensity={0.5} adjustCamera={1}>
                    <GLTFModel url={project.design_url!} />
                  </Stage>
                </Suspense>
                <OrbitControls enablePan={false} autoRotate autoRotateSpeed={0.8} />
              </Canvas>
            ) : hasDesign ? (
              /* Image design */
              <img
                key={project.design_url}
                src={project.design_url!}
                alt={project.name}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-all duration-500"
              />
            ) : hasCover ? (
              /* Cover as fallback */
              <img
                key={project.cover_url}
                src={project.cover_url!}
                alt={project.name}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover opacity-50 transition-all duration-500"
              />
            ) : (
              /* Empty placeholder */
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Box className="h-14 w-14 opacity-20" />
                <p className="text-xs">No design uploaded yet</p>
                <button
                  onClick={() => setShowUpload(true)}
                  className="px-4 py-2 rounded-xl glass text-xs hover:bg-white/10 transition"
                >
                  Upload first design
                </button>
              </div>
            )}

            {!isModel3D && (
              <>
                <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
              </>
            )}

            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs">
              <span className="glass rounded-lg px-3 py-1.5">
                {isModel3D ? "3D · drag to rotate" : "Image viewer"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleLike}
                  className={`glass rounded-lg px-3 py-1.5 inline-flex items-center gap-1 transition-colors ${isLiked ? "text-pink-400" : ""}`}
                >
                  <Heart className={`h-3 w-3 ${isLiked ? "fill-pink-400" : ""}`} />
                  {liveLikes}
                </button>
                <button className="glass rounded-lg px-3 py-1.5 inline-flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> {comments.length}
                </button>
              </div>
            </div>
          </div>

          {/* Project thumbnail strip */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => setActiveId(p.id)}
                className={`shrink-0 h-12 w-16 rounded-xl overflow-hidden relative border-2 transition-all ${
                  p.id === activeId ? "border-accent" : "border-transparent opacity-50 hover:opacity-80"
                }`}
              >
                {p.cover_url ? (
                  <img src={p.cover_url} alt={p.name} className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/20 grid place-items-center">
                    <Box className="h-4 w-4 text-white/20" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* ---- Right: comments ---- */}
        <aside className="lg:col-span-3 glass-strong rounded-3xl p-5 flex flex-col">
          <h3 className="font-display font-semibold">Activity & Comments</h3>

          <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
            {commentsQuery.isPending ? (
              <div className="grid place-items-center h-20">
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                No comments yet — be first!
              </p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="glass rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-7 w-7 rounded-full bg-gradient-to-br ${
                        COLORS[parseInt(c.user_id.slice(-1), 16) % COLORS.length]
                      } grid place-items-center text-[10px] font-semibold`}
                    >
                      {c.user_id === user?.id ? "Me" : c.user_id.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="text-sm font-medium">
                      {c.user_id === user?.id ? "You" : "Member"}
                    </div>
                    <div className="ml-auto text-[10px] text-muted-foreground">
                      {timeAgo(c.created_at)}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{c.text}</p>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 glass rounded-xl p-2 flex items-center gap-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendComment()}
              placeholder="Write a comment…"
              className="bg-transparent outline-none flex-1 text-sm px-2"
            />
            <button
              onClick={sendComment}
              disabled={addComment.isPending}
              className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center disabled:opacity-60"
            >
              {addComment.isPending
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Send className="h-3.5 w-3.5" />}
            </button>
          </div>
        </aside>
      </div>

      {/* ======== Project Picker Modal ======== */}
      {showPicker && (
        <Modal onClose={() => { setShowPicker(false); setSearch(""); }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-lg">All Projects</h2>
            <button
              onClick={() => { setShowPicker(false); setSearch(""); }}
              className="glass rounded-lg p-2 hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 glass rounded-xl px-3 py-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects…"
              className="bg-transparent outline-none text-sm flex-1"
              autoFocus
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => { setActiveId(p.id); setShowPicker(false); setSearch(""); }}
                className={`glass rounded-2xl p-3 text-left hover:border-accent/40 transition group flex gap-3 items-start ${
                  p.id === activeId ? "border border-accent" : ""
                }`}
              >
                <div className="h-14 w-14 rounded-xl overflow-hidden shrink-0 relative bg-gradient-to-br from-primary/20 to-accent/10">
                  {p.cover_url ? (
                    <img
                      src={p.cover_url}
                      alt={p.name}
                      className="absolute inset-0 h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center">
                      <Box className="h-5 w-5 text-white/20" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground">{p.category}</div>
                  <div className="mt-1.5 h-1 rounded-full bg-white/5 overflow-hidden w-full">
                    <div className="h-full bg-gradient-primary" style={{ width: `${p.progress}%` }} />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      {STATUS_ICON[p.status]}
                      <span className="capitalize">{p.status}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{p.progress}%</span>
                  </div>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="col-span-2 text-center text-sm text-muted-foreground py-8">
                No projects match "{search}"
              </p>
            )}
          </div>
        </Modal>
      )}

      {/* ======== Upload Design Modal ======== */}
      {showUpload && (
        <Modal onClose={closeUpload}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display font-semibold text-lg">Upload New Design</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Will be saved as{" "}
                <span className="text-accent">{nextVersion(project.version)}</span>
                {" "}for {project.name}
              </p>
            </div>
            <button onClick={closeUpload} className="glass rounded-lg p-2 hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative h-52 rounded-2xl border-2 border-dashed border-white/20 hover:border-accent/50 transition cursor-pointer overflow-hidden grid place-items-center"
          >
            {uploadPreview ? (
              <img
                src={uploadPreview}
                alt="preview"
                className="absolute inset-0 h-full w-full object-contain bg-black/20"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImageIcon className="h-8 w-8" />
                <p className="text-sm">Click to select image or 3D model</p>
                <p className="text-[10px]">.glb / .gltf → 3D viewer &nbsp;·&nbsp; .png / .jpg → image</p>
              </div>
            )}
            {uploadPreview && (
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition flex items-center justify-center">
                <p className="text-xs text-white">Click to change</p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".glb,.gltf,.png,.jpg,.jpeg,.webp"
            className="hidden"
            onChange={handleFileChange}
          />

          {uploadFile && (
            <p className="mt-2 text-[11px] text-muted-foreground truncate">
              Selected:{" "}
              <span className="text-foreground">{uploadFile.name}</span>
              {" "}· {(uploadFile.size / 1024).toFixed(1)} KB
              {MODEL_EXT.includes(uploadFile.name.split(".").pop()?.toLowerCase() ?? "") && (
                <span className="ml-2 text-accent">3D model</span>
              )}
            </p>
          )}

          <div className="flex gap-2 mt-4">
            <button
              onClick={closeUpload}
              disabled={uploading}
              className="flex-1 glass rounded-xl py-2 text-sm hover:bg-white/10 transition disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={confirmUpload}
              disabled={!uploadFile || uploading}
              className="flex-1 rounded-xl py-2 text-sm bg-gradient-primary text-white disabled:opacity-40 transition inline-flex items-center justify-center gap-2"
            >
              {uploading ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…</>
              ) : (
                <><Upload className="h-3.5 w-3.5" /> Publish {nextVersion(project.version)}</>
              )}
            </button>
          </div>
        </Modal>
      )}
    </AppShell>
  );
}

/* ---------- 3D Model ---------- */

function GLTFModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const cloned    = useMemo(() => scene.clone(true), [scene]);
  return <Center><primitive object={cloned} /></Center>;
}

/* ---------- Modal ---------- */

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="glass-strong rounded-3xl p-6 w-full max-w-2xl shadow-[0_30px_80px_-20px_oklch(0.10_0.03_280/80%)]"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */

function Meta({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 rounded-lg glass grid place-items-center">
        <Icon className="h-3.5 w-3.5 text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className="text-xs">{value}</div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-3">
      <div className="text-base font-display font-semibold">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
