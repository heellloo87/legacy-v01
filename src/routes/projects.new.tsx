import { RequireAuth } from "@/components/RequireAuth";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

import {
  Upload, Save, Box, ChevronDown, Image as ImageIcon, X, Loader2, Camera,
} from "lucide-react";
import { useState, useRef, useEffect, Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF, Center } from "@react-three/drei";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/projects/new")({
  head: () => ({
    meta: [
      {
        title: "Create Project — Legacy AR",
      },
    ],
  }),

  component: ProtectedNewProject,
});

function ProtectedNewProject() {
  return (
    <RequireAuth
      roles={[
        "admin",
        "designer",
      ]}
    >
      <NewProject />
    </RequireAuth>
  );
}

const ACCEPTED_DESIGN = ".glb,.gltf,.obj,.png,.jpg,.jpeg,.webp";
const ACCEPTED_COVER  = ".png,.jpg,.jpeg,.webp";
const MODEL_EXT  = ["glb", "gltf"];
const IMAGE_EXT  = ["png", "jpg", "jpeg", "webp"];
const CATEGORIES = ["Hardware", "Wearable", "Robotics", "Audio", "Optics", "Architecture"];

type UploadedFile = { file: File; url: string; ext: string };
type Visibility   = "Private" | "Team" | "Public";

/* ---------- Component ---------- */

function NewProject() {
  const nav       = useNavigate();
  const { user }  = useAuth();

  const [title,      setTitle]      = useState("Untitled AR Project");
  const [desc,       setDesc]       = useState("");
  const [cat,        setCat]        = useState("Hardware");
  const [visibility, setVisibility] = useState<Visibility>("Team");
  const [uploaded,   setUploaded]   = useState<UploadedFile | null>(null);  // 3D / design file
  const [cover,      setCover]      = useState<UploadedFile | null>(null);  // cover image (pfp)
  const [dragOver,   setDragOver]   = useState(false);
  const [saving,     setSaving]     = useState(false);

  const designInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef  = useRef<HTMLInputElement>(null);

  /* clean up object URLs on unmount */
  useEffect(() => () => {
    if (uploaded) URL.revokeObjectURL(uploaded.url);
    if (cover)    URL.revokeObjectURL(cover.url);
  }, [uploaded, cover]);

  /* ---- File handlers ---- */
  const handleDesignFile = (files: FileList | null) => {
    if (!files?.[0]) return;
    const file = files[0];
    const ext  = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (![...MODEL_EXT, ...IMAGE_EXT, "obj"].includes(ext)) {
      toast.error(`Unsupported file: .${ext}`);
      return;
    }
    if (uploaded) URL.revokeObjectURL(uploaded.url);
    setUploaded({ file, url: URL.createObjectURL(file), ext });
  };

  const handleCoverFile = (files: FileList | null) => {
    if (!files?.[0]) return;
    const file = files[0];
    const ext  = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!IMAGE_EXT.includes(ext)) {
      toast.error("Cover must be an image (PNG / JPG / WebP)");
      return;
    }
    if (cover) URL.revokeObjectURL(cover.url);
    setCover({ file, url: URL.createObjectURL(file), ext });
  };

  /* ---- Save ---- */
  const handleSave = async (status: "active" | "draft") => {
    if (!title.trim()) { toast.error("Project title is required"); return; }
    if (!user)         { toast.error("You must be logged in");     return; }
    setSaving(true);

    try {
      /* 1. Upload cover image to Storage (optional) */
      let coverUrl: string | null = null;
      if (cover) {
        const path = `covers/${user.id}/${Date.now()}-${cover.file.name}`;
        const { error: storageErr } = await supabase.storage
          .from("project-assets")
          .upload(path, cover.file, { upsert: true });
        if (storageErr) throw storageErr;
        const { data: { publicUrl } } = supabase.storage
          .from("project-assets")
          .getPublicUrl(path);
        coverUrl = publicUrl;
      }

      /* 2. Upload design file to Storage (optional) */
      let designUrl: string | null = null;
      let designExt: string | null = null;
      if (uploaded) {
        const path = `designs/${user.id}/${Date.now()}-${uploaded.file.name}`;
        const { error: storageErr } = await supabase.storage
          .from("project-assets")
          .upload(path, uploaded.file, { upsert: true });
        if (storageErr) throw storageErr;
        const { data: { publicUrl } } = supabase.storage
          .from("project-assets")
          .getPublicUrl(path);
        designUrl = publicUrl;
        designExt = uploaded.ext;
      }

      /* 3. Insert project row */
      const { error } = await supabase
        .from("projects")
        .insert({
          user_id:     user.id,
          name:        title.trim(),
          description: desc.trim() || null,
          category:    cat,
          visibility:  visibility.toLowerCase(),
          status,
          progress:    0,
          version:     "v1",
          cover_url:   coverUrl,      // <-- project thumbnail / pfp
          design_url:  designUrl,     // <-- 3D model or image asset
          design_ext:  designExt,     // <-- so workspace knows if it's a model
        });
      if (error) throw error;

      toast.success(status === "draft" ? "Saved as draft!" : "Project created!");
      nav({ to: "/dashboard" });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save project");
    } finally {
      setSaving(false);
    }
  };

  const isModel = uploaded && MODEL_EXT.includes(uploaded.ext);
  const isImage = uploaded && IMAGE_EXT.includes(uploaded.ext);

  return (
    <AppShell title="Create Project">
      <div className="grid lg:grid-cols-3 gap-6">

        {/* ---- Left: form ---- */}
        <div className="lg:col-span-2 glass-strong rounded-3xl p-6 space-y-5">

          {/* Cover image picker */}
          <div>
            <label className="text-xs text-muted-foreground">
              Cover image <span className="opacity-50">(shown as project thumbnail)</span>
            </label>
            <input
              ref={coverInputRef}
              type="file"
              accept={ACCEPTED_COVER}
              className="hidden"
              onChange={(e) => handleCoverFile(e.target.files)}
            />
            <div className="mt-1.5 flex items-center gap-4">
              {/* Thumbnail preview */}
              <div
                onClick={() => coverInputRef.current?.click()}
                className="relative h-20 w-20 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/30 to-accent/20 border border-white/10 hover:border-accent/50 transition cursor-pointer shrink-0 grid place-items-center group"
              >
                {cover ? (
                  <img
                    src={cover.url}
                    alt="cover"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <Camera className="h-6 w-6 text-white/30 group-hover:text-accent transition" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition grid place-items-center">
                  <Camera className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                {cover ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs truncate max-w-[180px]">{cover.file.name}</span>
                    <button
                      onClick={() => { URL.revokeObjectURL(cover.url); setCover(null); }}
                      className="glass rounded-lg p-1 hover:bg-white/10"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    className="glass rounded-xl px-4 py-2 text-xs hover:bg-white/10 transition"
                  >
                    Choose cover image
                  </button>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">PNG, JPG, WebP — displayed on dashboard &amp; workspace</p>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs text-muted-foreground">Project title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5 w-full glass rounded-xl px-4 py-3 bg-transparent outline-none focus:ring-1 focus:ring-accent/60 text-lg font-display"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-muted-foreground">Description</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={4}
              placeholder="Describe what you're prototyping…"
              className="mt-1.5 w-full glass rounded-xl px-4 py-3 bg-transparent outline-none focus:ring-1 focus:ring-accent/60 resize-none"
            />
          </div>

          {/* Category + Visibility */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Category</label>
              <div className="mt-1.5 relative">
                <select
                  value={cat}
                  onChange={(e) => setCat(e.target.value)}
                  className="w-full glass rounded-xl px-4 py-3 bg-transparent outline-none appearance-none focus:ring-1 focus:ring-accent/60 cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-popover">{c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Visibility</label>
              <div className="mt-1.5 glass rounded-xl flex p-1">
                {(["Private", "Team", "Public"] as Visibility[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVisibility(v)}
                    className={`flex-1 py-2 rounded-lg text-xs transition cursor-pointer ${
                      visibility === v
                        ? "bg-gradient-primary text-white"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Design / 3D model upload */}
          <div>
            <label className="text-xs text-muted-foreground">
              Upload design / 3D model <span className="opacity-50">(shown in workspace viewer)</span>
            </label>
            <input
              ref={designInputRef}
              type="file"
              accept={ACCEPTED_DESIGN}
              className="hidden"
              onChange={(e) => handleDesignFile(e.target.files)}
            />
            <div
              onClick={() => designInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleDesignFile(e.dataTransfer.files);
              }}
              className={`mt-1.5 glass rounded-2xl border border-dashed p-8 text-center transition cursor-pointer ${
                dragOver ? "border-accent bg-accent/10" : "border-glass-border hover:bg-white/5"
              }`}
            >
              {uploaded ? (
                <div className="flex items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center shrink-0">
                      <Box className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm truncate">{uploaded.file.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {(uploaded.file.size / 1024).toFixed(1)} KB · .{uploaded.ext}
                        {MODEL_EXT.includes(uploaded.ext) && (
                          <span className="ml-2 text-accent">3D model — interactive viewer</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      URL.revokeObjectURL(uploaded.url);
                      setUploaded(null);
                    }}
                    className="glass rounded-lg p-2 hover:bg-white/10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="h-12 w-12 mx-auto rounded-xl bg-gradient-primary grid place-items-center mb-3">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div className="text-sm">Drop your 3D model or design image</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    .glb / .gltf → interactive 3D viewer &nbsp;·&nbsp; .png / .jpg → image viewer
                  </div>
                  <button type="button" className="mt-4 px-4 py-2 rounded-xl glass text-xs hover:bg-white/10">
                    Browse files
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleSave("active")}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-primary text-white inline-flex items-center gap-2 shadow-[0_0_30px_-8px_oklch(0.65_0.24_295/70%)] disabled:opacity-60 cursor-pointer"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving…" : "Save project"}
            </button>
            <button
              type="button"
              onClick={() => handleSave("draft")}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl glass text-sm disabled:opacity-60 cursor-pointer hover:bg-white/10 transition"
            >
              Save as draft
            </button>
          </div>
        </div>

        {/* ---- Right: live preview ---- */}
        <div className="glass rounded-3xl p-5">
          <div className="text-xs text-muted-foreground mb-3">Live preview</div>

          {/* Design viewer */}
          <div className="relative h-72 rounded-2xl bg-gradient-primary/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-accent/30 pointer-events-none" />
            {isModel ? (
              <Canvas camera={{ position: [0, 0, 3.5], fov: 50 }} dpr={[1, 2]}>
                <Suspense fallback={null}>
                  <Stage environment="city" intensity={0.5} adjustCamera={1}>
                    <GLTFModel url={uploaded!.url} />
                  </Stage>
                </Suspense>
                <OrbitControls enablePan={false} autoRotate autoRotateSpeed={1.2} />
              </Canvas>
            ) : isImage ? (
              <img
                src={uploaded!.url}
                alt={uploaded!.file.name}
                className="absolute inset-0 w-full h-full object-contain"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center">
                <div className="relative animate-float">
                  <div className="h-24 w-24 rounded-2xl bg-gradient-primary glow grid place-items-center">
                    <Box className="h-10 w-10 text-white" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cover preview row */}
          <div className="mt-4 flex items-center gap-3 glass rounded-xl p-3">
            <div className="h-10 w-10 rounded-xl overflow-hidden bg-gradient-to-br from-primary/30 to-accent/20 shrink-0 grid place-items-center">
              {cover ? (
                <img src={cover.url} alt="cover" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-4 w-4 text-white/30" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium truncate">{title || "Untitled"}</div>
              <div className="text-[10px] text-muted-foreground">{cat} · {visibility}</div>
            </div>
            <div className="ml-auto text-[10px] text-accent capitalize">draft</div>
          </div>

          {/* Meta rows */}
          <div className="mt-4 space-y-3 text-sm">
            <Row label="Title"      value={title || "—"} />
            <Row label="Category"   value={cat} />
            <Row label="Visibility" value={visibility} />
            <Row label="Status"     value={<span className="text-accent">Draft</span>} />
            <Row label="Cover"      value={cover ? <span className="text-accent">✓ Ready</span> : "None"} />
            <Row label="Design"     value={
              uploaded
                ? <span className="inline-flex items-center gap-1">
                    {MODEL_EXT.includes(uploaded.ext)
                      ? <><Box className="h-3 w-3" /> 3D model</>
                      : <><ImageIcon className="h-3 w-3" /> Image</>}
                  </span>
                : "None"
            } />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* ---------- Helpers ---------- */

function GLTFModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const cloned    = useMemo(() => scene.clone(true), [scene]);
  return <Center><primitive object={cloned} /></Center>;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-glass-border last:border-0">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-xs">{value}</span>
    </div>
  );
}
