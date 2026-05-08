import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import {
  Send, Upload, Heart, MessageSquare, Share2, Eye, History,
  Users, Tag, Calendar, ChevronLeft, ChevronRight, Search,
  X, Clock, CheckCircle2, AlertCircle, Plus, ImageIcon, Loader2,
} from "lucide-react";
import headsetImg  from "@/assets/model-headset.jpg";
import watchImg    from "@/assets/model-watch.jpg";
import droneImg    from "@/assets/model-drone.jpg";
import speakerImg  from "@/assets/model-speaker.jpg";
import gloveImg    from "@/assets/model-glove.jpg";
import cameraImg   from "@/assets/model-camera.jpg";
import { useState, useEffect, useRef, useCallback } from "react";

export const Route = createFileRoute("/workspace")({
  head: () => ({ meta: [{ title: "Workspace — Legacy AR" }] }),
  component: Workspace,
});

/* ---------- Types ---------- */

type Comment = {
  who: string;
  text: string;
  time: string;
  color: string;
};

type Project = {
  id: string;
  name: string;
  desc: string;
  cat: string;
  image: string;           // URL or data-URL (for uploads)
  members: string[];
  memberCount: number;
  progress: number;
  version: string;
  updated: string;
  visibility: "Team" | "Private" | "Public";
  versions: number;
  comments: number;        // persisted count (from server)
  renders: number;
  arViews: number;
  likes: number;
  status: "active" | "review" | "draft";
  comments_list: Comment[];
  activity: string[];
};

/* ---------- Seed data (simulates API response) ---------- */

const SEED_PROJECTS: Project[] = [
  {
    id: "helios",
    name: "Helios Headset v3",
    desc: "Next-gen AR headset prototype with adaptive lenses and spatial audio.",
    cat: "Hardware",
    image: headsetImg,
    members: ["A", "M", "L", "S", "K"],
    memberCount: 5,
    progress: 78,
    version: "v14",
    updated: "Today, 18:42",
    visibility: "Team",
    versions: 14,
    comments: 38,
    renders: 212,
    arViews: 89,
    likes: 24,
    status: "active",
    comments_list: [
      { who: "Maya", text: "Love the new bezel curve — feels more premium.", time: "2m", color: "from-primary to-secondary" },
      { who: "Leo",  text: "Can we push the cyan glow 10% brighter on the inner rim?", time: "12m", color: "from-secondary to-accent" },
      { who: "Sara", text: "Approved for AR preview ✨", time: "1h", color: "from-accent to-primary" },
    ],
    activity: ["Leo uploaded v14", "Render queue completed", "Maya joined the workspace"],
  },
  {
    id: "watch",
    name: "Neon Smartwatch",
    desc: "Ultra-thin wearable with holographic display and biometric sensors.",
    cat: "Wearable",
    image: watchImg,
    members: ["R", "T", "J"],
    memberCount: 3,
    progress: 42,
    version: "v6",
    updated: "Yesterday, 14:20",
    visibility: "Private",
    versions: 6,
    comments: 17,
    renders: 94,
    arViews: 31,
    likes: 11,
    status: "active",
    comments_list: [
      { who: "Rita",  text: "The strap hinge needs rework — too bulky at 3mm.", time: "1h",  color: "from-primary to-secondary" },
      { who: "James", text: "Holographic layer render looks stunning!", time: "4h",  color: "from-secondary to-accent" },
    ],
    activity: ["James pushed v6", "Rita left 3 annotations", "Auto-render started"],
  },
  {
    id: "drone",
    name: "Aether Drone",
    desc: "Autonomous delivery drone with foldable arms and LiDAR obstacle detection.",
    cat: "Robotics",
    image: droneImg,
    members: ["B", "N", "C", "P", "V", "W", "Q"],
    memberCount: 7,
    progress: 91,
    version: "v22",
    updated: "2 days ago",
    visibility: "Team",
    versions: 22,
    comments: 61,
    renders: 540,
    arViews: 210,
    likes: 47,
    status: "review",
    comments_list: [
      { who: "Nina",  text: "Final propeller geometry approved by aerodynamics team.", time: "30m", color: "from-primary to-secondary" },
      { who: "Cole",  text: "Battery compartment latch still needs tolerance check.", time: "2h",  color: "from-secondary to-accent" },
      { who: "Pablo", text: "Sending to manufacturing review board tomorrow.", time: "5h",  color: "from-accent to-primary" },
    ],
    activity: ["Pablo requested final review", "Cole uploaded v22", "Stress test passed"],
  },
  {
    id: "speaker",
    name: "Quantum Speaker",
    desc: "360° spatial audio device with reactive LED mesh and voice AI built in.",
    cat: "Audio",
    image: speakerImg,
    members: ["D", "F", "G", "H"],
    memberCount: 4,
    progress: 25,
    version: "v3",
    updated: "3 days ago",
    visibility: "Team",
    versions: 3,
    comments: 9,
    renders: 28,
    arViews: 12,
    likes: 5,
    status: "draft",
    comments_list: [
      { who: "Dana", text: "LED diffuser pattern needs more variance — too uniform.", time: "1d", color: "from-primary to-secondary" },
    ],
    activity: ["Dana started workspace", "Initial renders complete", "Project created"],
  },
  {
    id: "glove",
    name: "Pulse VR Glove",
    desc: "Haptic feedback glove with 24-point pressure sensing and wireless streaming.",
    cat: "Wearable",
    image: gloveImg,
    members: ["E", "I", "U", "O", "Y", "Z"],
    memberCount: 6,
    progress: 60,
    version: "v9",
    updated: "4 days ago",
    visibility: "Team",
    versions: 9,
    comments: 29,
    renders: 130,
    arViews: 55,
    likes: 18,
    status: "active",
    comments_list: [
      { who: "Eli",  text: "Thumb actuator response time dropped to 8ms — great improvement.", time: "2d", color: "from-primary to-secondary" },
      { who: "Uma",  text: "Need to revisit palm plate ergonomics for smaller hands.", time: "3d", color: "from-secondary to-accent" },
    ],
    activity: ["Eli merged haptic update", "Firmware v2.1 linked", "Uma added annotations"],
  },
  {
    id: "camera",
    name: "Orbit Camera",
    desc: "Modular 8K camera body with magnetic lens system and AI autofocus.",
    cat: "Optics",
    image: cameraImg,
    members: ["X", "Y"],
    memberCount: 2,
    progress: 15,
    version: "v2",
    updated: "1 week ago",
    visibility: "Private",
    versions: 2,
    comments: 4,
    renders: 11,
    arViews: 3,
    likes: 2,
    status: "draft",
    comments_list: [
      { who: "Xena", text: "Lens mount diameter confirmed at 54mm.", time: "1w", color: "from-primary to-secondary" },
    ],
    activity: ["Xena created project", "Initial sketch uploaded"],
  },
];

/* ---------- Simulated fetch (swap with real API call) ---------- */
// Replace this function body with:
//   const res = await fetch("/api/projects");
//   return res.json();
async function fetchProjects(): Promise<Project[]> {
  await new Promise((r) => setTimeout(r, 600)); // simulate network
  return SEED_PROJECTS;
}

/* ---------- Helpers ---------- */

const STATUS_ICON: Record<string, React.ReactNode> = {
  active: <CheckCircle2 className="h-3 w-3 text-accent" />,
  review: <AlertCircle  className="h-3 w-3 text-yellow-400" />,
  draft:  <Clock        className="h-3 w-3 text-muted-foreground" />,
};

const CATEGORIES = ["Hardware", "Wearable", "Robotics", "Audio", "Optics", "Software", "Other"];
const COLORS     = [
  "from-primary to-secondary",
  "from-secondary to-accent",
  "from-accent to-primary",
  "from-primary to-accent",
];

function nowLabel() {
  return new Date().toLocaleString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function nextVersion(current: string): string {
  const n = parseInt(current.replace("v", ""), 10);
  return `v${isNaN(n) ? 1 : n + 1}`;
}

/* ---------- New-Project Form ---------- */

type NewProjectForm = {
  name: string;
  desc: string;
  cat: string;
  visibility: "Team" | "Private" | "Public";
  status: "active" | "review" | "draft";
};

const BLANK_FORM: NewProjectForm = {
  name: "",
  desc: "",
  cat: "Hardware",
  visibility: "Team",
  status: "draft",
};

/* ---------- Page ---------- */

function Workspace() {
  // ---- data state ----
  const [projects, setProjects]     = useState<Project[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activeId, setActiveId]     = useState<string>("");

  // ---- UI state ----
  const [showPicker,    setShowPicker]    = useState(false);
  const [showAddModal,  setShowAddModal]  = useState(false);
  const [showUpload,    setShowUpload]    = useState(false);
  const [search,        setSearch]        = useState("");
  const [comment,       setComment]       = useState("");

  // ---- per-project local state ----
  const [localComments, setLocalComments] = useState<Record<string, Comment[]>>({});
  const [likedIds,      setLikedIds]      = useState<Set<string>>(new Set());
  const [localLikes,    setLocalLikes]    = useState<Record<string, number>>({});

  // ---- new project form ----
  const [form, setForm] = useState<NewProjectForm>(BLANK_FORM);

  // ---- upload state ----
  const [uploadPreview,  setUploadPreview]  = useState<string | null>(null);
  const [uploadFileName, setUploadFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---- Fetch on mount ---- */
  useEffect(() => {
    fetchProjects().then((data) => {
      setProjects(data);
      if (data.length > 0) setActiveId(data[0].id);
      setLoading(false);
    });
  }, []);

  /* ---- Derived ---- */
  const project = projects.find((p) => p.id === activeId);
  const idx     = projects.findIndex((p) => p.id === activeId);

  const prev = useCallback(() =>
    setActiveId(projects[(idx - 1 + projects.length) % projects.length].id),
    [idx, projects]);

  const next = useCallback(() =>
    setActiveId(projects[(idx + 1) % projects.length].id),
    [idx, projects]);

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.cat.toLowerCase().includes(search.toLowerCase())
  );

  const allComments = project
    ? [...(project.comments_list ?? []), ...(localComments[activeId] ?? [])]
    : [];

  // Live comment count = persisted count + local additions
  const liveCommentCount = project
    ? project.comments + (localComments[activeId]?.length ?? 0)
    : 0;

  // Live likes = base + toggle delta
  const liveLikes = project
    ? project.likes + (localLikes[activeId] ?? 0)
    : 0;

  const isLiked = likedIds.has(activeId);

  /* ---- Actions ---- */

  const sendComment = useCallback(() => {
    const text = comment.trim();
    if (!text || !activeId) return;
    const newComment: Comment = {
      who: "You",
      text,
      time: "just now",
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
    setLocalComments((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] ?? []), newComment],
    }));
    // Also append to activity
    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeId
          ? { ...p, activity: [`You commented: "${text.slice(0, 30)}…"`, ...p.activity] }
          : p
      )
    );
    setComment("");
  }, [comment, activeId]);

  const toggleLike = useCallback(() => {
    if (!activeId) return;
    setLikedIds((prev) => {
      const next = new Set(prev);
      const delta = prev.has(activeId) ? -1 : 1;
      if (prev.has(activeId)) next.delete(activeId); else next.add(activeId);
      setLocalLikes((lk) => ({ ...lk, [activeId]: (lk[activeId] ?? 0) + delta }));
      return next;
    });
  }, [activeId]);

  /* ---- Add new project ---- */
  const handleAddProject = useCallback(() => {
    if (!form.name.trim()) return;
    const id = `proj-${Date.now()}`;
    const newProject: Project = {
      id,
      name: form.name.trim(),
      desc: form.desc.trim() || "No description provided.",
      cat: form.cat,
      image: headsetImg, // placeholder until a design is uploaded
      members: ["Y"],
      memberCount: 1,
      progress: 0,
      version: "v1",
      updated: `Today, ${nowLabel()}`,
      visibility: form.visibility,
      versions: 1,
      comments: 0,
      renders: 0,
      arViews: 0,
      likes: 0,
      status: form.status,
      comments_list: [],
      activity: ["Project created", "You joined the workspace"],
    };
    // TODO: POST /api/projects with newProject, then setProjects from response
    setProjects((prev) => [newProject, ...prev]);
    setActiveId(id);
    setForm(BLANK_FORM);
    setShowAddModal(false);
  }, [form]);

  /* ---- Upload design ---- */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setUploadPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const confirmUpload = useCallback(() => {
    if (!uploadPreview || !activeId) return;
    const newVer = nextVersion(project?.version ?? "v0");
    // TODO: POST /api/projects/:id/designs with the file, update version from response
    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeId
          ? {
              ...p,
              image:    uploadPreview,
              version:  newVer,
              versions: p.versions + 1,
              updated:  `Today, ${nowLabel()}`,
              activity: [`You uploaded ${newVer}`, ...p.activity],
            }
          : p
      )
    );
    setUploadPreview(null);
    setUploadFileName("");
    setShowUpload(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [uploadPreview, activeId, project]);

  /* ---- Loading state ---- */
  if (loading) {
    return (
      <AppShell title="Workspace">
        <div className="flex h-[60vh] items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading projects…</span>
        </div>
      </AppShell>
    );
  }

  /* ---- Empty state ---- */
  if (!project) {
    return (
      <AppShell title="Workspace">
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-muted-foreground">
          <p className="text-sm">No projects yet.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-primary text-white text-sm inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> New Project
          </button>
        </div>
      </AppShell>
    );
  }

  /* ---- Main UI ---- */
  return (
    <AppShell title={project.name}>
      <div className="grid lg:grid-cols-12 gap-6 h-[calc(100vh-9rem)]">

        {/* ---- Left: project info ---- */}
        <aside className="lg:col-span-3 glass-strong rounded-3xl p-5 overflow-y-auto flex flex-col gap-4">

          {/* Header: nav + All + New */}
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
              <button
                onClick={() => setShowAddModal(true)}
                title="New project"
                className="glass rounded-lg p-1 hover:bg-white/10 transition ml-1"
              >
                <Plus className="h-3.5 w-3.5 text-accent" />
              </button>
            </div>
          </div>

          {/* Thumbnail */}
          <div className="h-32 rounded-2xl relative overflow-hidden">
            <img
              src={project.image}
              alt={project.name}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent" />
            <div className="absolute bottom-2 left-2 flex items-center gap-1 glass rounded-md px-2 py-1 text-[10px]">
              {STATUS_ICON[project.status]}
              <span className="capitalize">{project.status}</span>
            </div>
          </div>

          <div>
            <h3 className="font-display font-semibold text-lg leading-tight">{project.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">{project.desc}</p>
          </div>

          {/* Progress */}
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
            <Meta icon={Tag}      label="Category"  value={project.cat} />
            <Meta icon={Users}    label="Team"       value={`${project.memberCount} collaborators`} />
            <Meta icon={Calendar} label="Updated"    value={project.updated} />
            <Meta icon={Eye}      label="Visibility" value={project.visibility} />
          </div>

          {/* Members */}
          <div>
            <div className="text-xs text-muted-foreground mb-2">Members</div>
            <div className="flex -space-x-2">
              {project.members.slice(0, 5).map((m) => (
                <div
                  key={m}
                  className="h-8 w-8 rounded-full bg-gradient-primary border-2 border-background grid place-items-center text-[11px] font-semibold"
                >
                  {m}
                </div>
              ))}
              {project.memberCount > 5 && (
                <div className="h-8 w-8 rounded-full bg-white/10 border-2 border-background grid place-items-center text-[10px]">
                  +{project.memberCount - 5}
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Stat label="Versions" value={String(project.versions)} />
            <Stat label="Comments" value={String(liveCommentCount)} />
            <Stat label="Renders"  value={String(project.renders)} />
            <Stat label="AR views" value={String(project.arViews)} />
          </div>
        </aside>

        {/* ---- Center: design preview ---- */}
        <section className="lg:col-span-6 glass-strong rounded-3xl p-5 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="glass rounded-lg px-3 py-1.5 text-xs">{project.version} · current</span>
              <button className="glass rounded-lg p-1.5"><History className="h-4 w-4" /></button>
            </div>
            <div className="flex items-center gap-2">
              <button className="glass rounded-lg p-2 hover:bg-white/10"><Share2 className="h-4 w-4" /></button>
              <button
                onClick={() => setShowUpload(true)}
                className="px-3 py-2 rounded-lg bg-gradient-primary text-white text-xs inline-flex items-center gap-2 shadow-[0_0_20px_-8px_oklch(0.65_0.24_295/70%)]"
              >
                <Upload className="h-3.5 w-3.5" /> Upload new design
              </button>
            </div>
          </div>

          <div className="flex-1 mt-4 rounded-2xl relative overflow-hidden grid place-items-center">
            <img
              key={project.id + project.version}
              src={project.image}
              alt={project.name}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />
            <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-accent/20 blur-3xl pointer-events-none" />

            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs">
              <span className="glass rounded-lg px-3 py-1.5">1920 × 1080</span>
              <div className="flex items-center gap-2">
                {/* Like button — toggles */}
                <button
                  onClick={toggleLike}
                  className={`glass rounded-lg px-3 py-1.5 inline-flex items-center gap-1 transition-colors ${
                    isLiked ? "text-pink-400" : ""
                  }`}
                >
                  <Heart className={`h-3 w-3 ${isLiked ? "fill-pink-400" : ""}`} />
                  {liveLikes}
                </button>
                <button className="glass rounded-lg px-3 py-1.5 inline-flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> {liveCommentCount}
                </button>
              </div>
            </div>
          </div>

          {/* Project strip */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => setActiveId(p.id)}
                className={`shrink-0 h-12 w-16 rounded-xl overflow-hidden relative border-2 transition-all ${
                  p.id === activeId ? "border-accent" : "border-transparent opacity-50 hover:opacity-80"
                }`}
              >
                <img src={p.image} alt={p.name} className="absolute inset-0 h-full w-full object-cover" />
              </button>
            ))}
            {/* Add project shortcut in strip */}
            <button
              onClick={() => setShowAddModal(true)}
              className="shrink-0 h-12 w-16 rounded-xl border-2 border-dashed border-white/20 hover:border-accent/60 transition-all grid place-items-center"
            >
              <Plus className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </section>

        {/* ---- Right: comments ---- */}
        <aside className="lg:col-span-3 glass-strong rounded-3xl p-5 flex flex-col">
          <h3 className="font-display font-semibold">Activity & Comments</h3>

          <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
            {allComments.map((c, i) => (
              <div key={i} className="glass rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <div className={`h-7 w-7 rounded-full bg-gradient-to-br ${c.color} grid place-items-center text-[10px] font-semibold`}>
                    {c.who[0]}
                  </div>
                  <div className="text-sm font-medium">{c.who}</div>
                  <div className="ml-auto text-[10px] text-muted-foreground">{c.time}</div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{c.text}</p>
              </div>
            ))}

            <div className="text-[10px] uppercase tracking-widest text-muted-foreground pt-2">Activity</div>
            {project.activity.map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {a}
              </div>
            ))}
          </div>

          <div className="mt-4 glass rounded-xl p-2 flex items-center gap-2">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendComment()}
              placeholder="Write a comment…"
              className="bg-transparent outline-none flex-1 text-sm px-2"
            />
            <button
              onClick={sendComment}
              className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </aside>
      </div>

      {/* ======== Project Picker Modal ======== */}
      {showPicker && (
        <Modal onClose={() => { setShowPicker(false); setSearch(""); }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-lg">All Projects</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setShowPicker(false); setShowAddModal(true); }}
                className="glass rounded-lg px-3 py-1.5 text-xs inline-flex items-center gap-1 hover:bg-white/10 transition"
              >
                <Plus className="h-3.5 w-3.5 text-accent" /> New
              </button>
              <button onClick={() => { setShowPicker(false); setSearch(""); }} className="glass rounded-lg p-2 hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>
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
                <div className="h-14 w-14 rounded-xl overflow-hidden shrink-0 relative">
                  <img src={p.image} alt={p.name} className="absolute inset-0 h-full w-full object-cover group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground">{p.cat}</div>
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
              <p className="col-span-2 text-center text-sm text-muted-foreground py-8">No projects match "{search}"</p>
            )}
          </div>
        </Modal>
      )}

      {/* ======== Add New Project Modal ======== */}
      {showAddModal && (
        <Modal onClose={() => { setShowAddModal(false); setForm(BLANK_FORM); }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-lg">New Project</h2>
            <button onClick={() => { setShowAddModal(false); setForm(BLANK_FORM); }} className="glass rounded-lg p-2 hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Project name *</label>
              <input
                autoFocus
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Phantom Headset v1"
                className="mt-1 w-full glass rounded-xl px-3 py-2 text-sm bg-transparent outline-none border border-white/10 focus:border-accent/50 transition"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Description</label>
              <textarea
                value={form.desc}
                onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
                placeholder="What is this project about?"
                rows={3}
                className="mt-1 w-full glass rounded-xl px-3 py-2 text-sm bg-transparent outline-none resize-none border border-white/10 focus:border-accent/50 transition"
              />
            </div>

            {/* Category + Visibility */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Category</label>
                <select
                  value={form.cat}
                  onChange={(e) => setForm((f) => ({ ...f, cat: e.target.value }))}
                  className="mt-1 w-full glass rounded-xl px-3 py-2 text-sm bg-background/80 outline-none border border-white/10 focus:border-accent/50 transition"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Visibility</label>
                <select
                  value={form.visibility}
                  onChange={(e) => setForm((f) => ({ ...f, visibility: e.target.value as Project["visibility"] }))}
                  className="mt-1 w-full glass rounded-xl px-3 py-2 text-sm bg-background/80 outline-none border border-white/10 focus:border-accent/50 transition"
                >
                  <option value="Team">Team</option>
                  <option value="Private">Private</option>
                  <option value="Public">Public</option>
                </select>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Initial status</label>
              <div className="mt-1 flex gap-2">
                {(["draft", "active", "review"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setForm((f) => ({ ...f, status: s }))}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs transition border ${
                      form.status === s
                        ? "border-accent bg-accent/10 text-accent"
                        : "glass border-transparent text-muted-foreground hover:bg-white/5"
                    }`}
                  >
                    {STATUS_ICON[s]}
                    <span className="capitalize">{s}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setShowAddModal(false); setForm(BLANK_FORM); }}
                className="flex-1 glass rounded-xl py-2 text-sm hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProject}
                disabled={!form.name.trim()}
                className="flex-1 rounded-xl py-2 text-sm bg-gradient-primary text-white disabled:opacity-40 transition"
              >
                Create project
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ======== Upload Design Modal ======== */}
      {showUpload && (
        <Modal onClose={() => { setShowUpload(false); setUploadPreview(null); setUploadFileName(""); }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display font-semibold text-lg">Upload New Design</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Will be saved as <span className="text-accent">{nextVersion(project.version)}</span> for {project.name}
              </p>
            </div>
            <button
              onClick={() => { setShowUpload(false); setUploadPreview(null); setUploadFileName(""); }}
              className="glass rounded-lg p-2 hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Drop zone / preview */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative h-48 rounded-2xl border-2 border-dashed border-white/20 hover:border-accent/50 transition cursor-pointer overflow-hidden grid place-items-center"
          >
            {uploadPreview ? (
              <img src={uploadPreview} alt="preview" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImageIcon className="h-8 w-8" />
                <p className="text-sm">Click to select image</p>
                <p className="text-[10px]">PNG, JPG, WebP, SVG</p>
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
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {uploadFileName && (
            <p className="mt-2 text-[11px] text-muted-foreground truncate">
              Selected: <span className="text-foreground">{uploadFileName}</span>
            </p>
          )}

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => { setShowUpload(false); setUploadPreview(null); setUploadFileName(""); }}
              className="flex-1 glass rounded-xl py-2 text-sm hover:bg-white/10 transition"
            >
              Cancel
            </button>
            <button
              onClick={confirmUpload}
              disabled={!uploadPreview}
              className="flex-1 rounded-xl py-2 text-sm bg-gradient-primary text-white disabled:opacity-40 transition inline-flex items-center justify-center gap-2"
            >
              <Upload className="h-3.5 w-3.5" /> Publish {nextVersion(project.version)}
            </button>
          </div>
        </Modal>
      )}
    </AppShell>
  );
}

/* ---------- Modal wrapper ---------- */

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

/* ---------- Helper components ---------- */

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
