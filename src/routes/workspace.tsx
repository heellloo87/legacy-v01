import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import {
  Send, Upload, Heart, MessageSquare, Share2, Eye, History,
  Users, Tag, Calendar, ChevronLeft, ChevronRight, Search,
  X, Clock, CheckCircle2, AlertCircle,
} from "lucide-react";
import headsetImg  from "@/assets/model-headset.jpg";
import watchImg    from "@/assets/model-watch.jpg";
import droneImg    from "@/assets/model-drone.jpg";
import speakerImg  from "@/assets/model-speaker.jpg";
import gloveImg    from "@/assets/model-glove.jpg";
import cameraImg   from "@/assets/model-camera.jpg";
import { useState } from "react";

export const Route = createFileRoute("/workspace")({
  head: () => ({ meta: [{ title: "Workspace — Legacy AR" }] }),
  component: Workspace,
});

/* ---------- Project data ---------- */

const PROJECTS = [
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

type Project = typeof PROJECTS[number];

const STATUS_ICON: Record<string, React.ReactNode> = {
  active:  <CheckCircle2 className="h-3 w-3 text-accent" />,
  review:  <AlertCircle  className="h-3 w-3 text-yellow-400" />,
  draft:   <Clock        className="h-3 w-3 text-muted-foreground" />,
};

/* ---------- Page ---------- */

function Workspace() {
  const [activeId, setActiveId]     = useState("helios");
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch]         = useState("");
  const [comment, setComment]       = useState("");
  const [localComments, setLocalComments] = useState<
    Record<string, { who: string; text: string; time: string; color: string }[]>
  >({});

  const project = PROJECTS.find((p) => p.id === activeId)!;
  const idx     = PROJECTS.findIndex((p) => p.id === activeId);

  const prev = () => setActiveId(PROJECTS[(idx - 1 + PROJECTS.length) % PROJECTS.length].id);
  const next = () => setActiveId(PROJECTS[(idx + 1) % PROJECTS.length].id);

  const filtered = PROJECTS.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.cat.toLowerCase().includes(search.toLowerCase())
  );

  const allComments = [
    ...(project.comments_list ?? []),
    ...(localComments[activeId] ?? []),
  ];

  const sendComment = () => {
    const text = comment.trim();
    if (!text) return;
    setLocalComments((prev) => ({
      ...prev,
      [activeId]: [
        ...(prev[activeId] ?? []),
        { who: "You", text, time: "just now", color: "from-primary to-accent" },
      ],
    }));
    setComment("");
  };

  return (
    <AppShell title={project.name}>
      <div className="grid lg:grid-cols-12 gap-6 h-[calc(100vh-9rem)]">

        {/* ---- Left: project info ---- */}
        <aside className="lg:col-span-3 glass-strong rounded-3xl p-5 overflow-y-auto flex flex-col gap-4">

          {/* Project switcher header */}
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Project</div>
            <div className="flex items-center gap-1">
              <button onClick={prev} className="glass rounded-lg p-1 hover:bg-white/10 transition"><ChevronLeft  className="h-3.5 w-3.5" /></button>
              <button onClick={next} className="glass rounded-lg p-1 hover:bg-white/10 transition"><ChevronRight className="h-3.5 w-3.5" /></button>
              <button
                onClick={() => setShowPicker(true)}
                className="glass rounded-lg px-2 py-1 text-[10px] hover:bg-white/10 transition ml-1"
              >
                All
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
              <div className="h-full bg-gradient-primary transition-all duration-700" style={{ width: `${project.progress}%` }} />
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <Meta icon={Tag}      label="Category"   value={project.cat} />
            <Meta icon={Users}    label="Team"        value={`${project.memberCount} collaborators`} />
            <Meta icon={Calendar} label="Updated"     value={project.updated} />
            <Meta icon={Eye}      label="Visibility"  value={project.visibility} />
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-2">Members</div>
            <div className="flex -space-x-2">
              {project.members.slice(0, 5).map((m) => (
                <div key={m} className="h-8 w-8 rounded-full bg-gradient-primary border-2 border-background grid place-items-center text-[11px] font-semibold">{m}</div>
              ))}
              {project.memberCount > 5 && (
                <div className="h-8 w-8 rounded-full bg-white/10 border-2 border-background grid place-items-center text-[10px]">+{project.memberCount - 5}</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <Stat label="Versions" value={String(project.versions)} />
            <Stat label="Comments" value={String(project.comments)} />
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
              <button className="px-3 py-2 rounded-lg bg-gradient-primary text-white text-xs inline-flex items-center gap-2 shadow-[0_0_20px_-8px_oklch(0.65_0.24_295/70%)]">
                <Upload className="h-3.5 w-3.5" /> Upload new design
              </button>
            </div>
          </div>

          <div className="flex-1 mt-4 rounded-2xl relative overflow-hidden grid place-items-center">
            <img
              key={project.id}
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
                <button className="glass rounded-lg px-3 py-1.5 inline-flex items-center gap-1"><Heart className="h-3 w-3" /> {project.likes}</button>
                <button className="glass rounded-lg px-3 py-1.5 inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {project.comments}</button>
              </div>
            </div>
          </div>

          {/* Project strip — quick switch */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {PROJECTS.map((p) => (
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
          </div>
        </section>

        {/* ---- Right: comments ---- */}
        <aside className="lg:col-span-3 glass-strong rounded-3xl p-5 flex flex-col">
          <h3 className="font-display font-semibold">Activity & Comments</h3>

          <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
            {allComments.map((c, i) => (
              <div key={i} className="glass rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <div className={`h-7 w-7 rounded-full bg-gradient-to-br ${c.color} grid place-items-center text-[10px] font-semibold`}>{c.who[0]}</div>
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

      {/* ---- Project picker modal ---- */}
      {showPicker && (
        <div
          className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowPicker(false)}
        >
          <div
            className="glass-strong rounded-3xl p-6 w-full max-w-2xl shadow-[0_30px_80px_-20px_oklch(0.10_0.03_280/80%)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-lg">All Projects</h2>
              <button onClick={() => setShowPicker(false)} className="glass rounded-lg p-2 hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search */}
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
          </div>
        </div>
      )}
    </AppShell>
  );
}

/* ---------- Helpers ---------- */

function Meta({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 rounded-lg glass grid place-items-center"><Icon className="h-3.5 w-3.5 text-accent" /></div>
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
