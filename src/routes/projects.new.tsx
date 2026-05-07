import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Upload, Save, Box, ChevronDown, Image as ImageIcon } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/projects/new")({
  head: () => ({ meta: [{ title: "Create Project — Legacy AR" }] }),
  component: NewProject,
});

function NewProject() {
  const [title, setTitle] = useState("Untitled AR Project");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("Hardware");

  return (
    <AppShell title="Create Project">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-strong rounded-3xl p-6 space-y-5">
          <div>
            <label className="text-xs text-muted-foreground">Project title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5 w-full glass rounded-xl px-4 py-3 bg-transparent outline-none focus:ring-1 focus:ring-accent/60 text-lg font-display"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Description</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={5}
              placeholder="Describe what you're prototyping…"
              className="mt-1.5 w-full glass rounded-xl px-4 py-3 bg-transparent outline-none focus:ring-1 focus:ring-accent/60 resize-none"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Category</label>
              <div className="mt-1.5 relative">
                <select
                  value={cat}
                  onChange={(e) => setCat(e.target.value)}
                  className="w-full glass rounded-xl px-4 py-3 bg-transparent outline-none appearance-none focus:ring-1 focus:ring-accent/60"
                >
                  {["Hardware", "Wearable", "Robotics", "Audio", "Optics", "Architecture"].map((c) => (
                    <option key={c} value={c} className="bg-popover">{c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Visibility</label>
              <div className="mt-1.5 glass rounded-xl flex p-1">
                {["Private", "Team", "Public"].map((v, i) => (
                  <button key={v} className={`flex-1 py-2 rounded-lg text-xs ${i === 1 ? "bg-gradient-primary text-white" : "text-muted-foreground"}`}>{v}</button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Upload design</label>
            <div className="mt-1.5 glass rounded-2xl border border-dashed border-glass-border p-8 text-center hover:bg-white/5 transition cursor-pointer">
              <div className="h-12 w-12 mx-auto rounded-xl bg-gradient-primary grid place-items-center mb-3"><Upload className="h-5 w-5" /></div>
              <div className="text-sm">Drop your 3D model, image, or .glb file</div>
              <div className="text-xs text-muted-foreground mt-1">Supports .glb, .gltf, .obj, .png, .jpg up to 50MB</div>
              <button className="mt-4 px-4 py-2 rounded-xl glass text-xs hover:bg-white/10">Browse files</button>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button className="px-5 py-2.5 rounded-xl bg-gradient-primary text-white inline-flex items-center gap-2 shadow-[0_0_30px_-8px_oklch(0.65_0.24_295/70%)]">
              <Save className="h-4 w-4" /> Save project
            </button>
            <button className="px-5 py-2.5 rounded-xl glass text-sm">Save as draft</button>
          </div>
        </div>

        {/* Preview */}
        <div className="glass rounded-3xl p-5">
          <div className="text-xs text-muted-foreground mb-3">Live preview</div>
          <div className="relative h-72 rounded-2xl bg-gradient-primary/20 grid-bg overflow-hidden grid place-items-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-accent/30" />
            <div className="relative animate-float">
              <div className="h-24 w-24 rounded-2xl bg-gradient-primary glow grid place-items-center">
                <Box className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <Row label="Title" value={title || "—"} />
            <Row label="Category" value={cat} />
            <Row label="Status" value={<span className="text-accent">Draft</span>} />
            <Row label="Assets" value={<span className="inline-flex items-center gap-1"><ImageIcon className="h-3 w-3" /> 0 files</span>} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-glass-border last:border-0">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-xs">{value}</span>
    </div>
  );
}
