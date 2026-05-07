import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Upload, Save, Box, ChevronDown, Image as ImageIcon, X } from "lucide-react";
import { useState, useRef, useEffect, Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Stage, useGLTF, Center } from "@react-three/drei";

export const Route = createFileRoute("/projects/new")({
  head: () => ({ meta: [{ title: "Create Project — Legacy AR" }] }),
  component: NewProject,
});

const ACCEPTED = ".glb,.gltf,.obj,.png,.jpg,.jpeg,.webp";
const MODEL_EXT = ["glb", "gltf"];
const IMAGE_EXT = ["png", "jpg", "jpeg", "webp"];

type UploadedFile = { file: File; url: string; ext: string };

function NewProject() {
  const [title, setTitle] = useState("Untitled AR Project");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("Hardware");
  const [uploaded, setUploaded] = useState<UploadedFile | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (uploaded) URL.revokeObjectURL(uploaded.url); }, [uploaded]);

  const handleFiles = (files: FileList | null) => {
    if (!files || !files[0]) return;
    const file = files[0];
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (![...MODEL_EXT, ...IMAGE_EXT, "obj"].includes(ext)) {
      alert(`Unsupported file: .${ext}\nSupported: ${ACCEPTED}`);
      return;
    }
    if (uploaded) URL.revokeObjectURL(uploaded.url);
    setUploaded({ file, url: URL.createObjectURL(file), ext });
  };

  const isModel = uploaded && MODEL_EXT.includes(uploaded.ext);
  const isImage = uploaded && IMAGE_EXT.includes(uploaded.ext);

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
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED}
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFiles(e.dataTransfer.files);
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
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); URL.revokeObjectURL(uploaded.url); setUploaded(null); }}
                    className="glass rounded-lg p-2 hover:bg-white/10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="h-12 w-12 mx-auto rounded-xl bg-gradient-primary grid place-items-center mb-3"><Upload className="h-5 w-5" /></div>
                  <div className="text-sm">Drop your 3D model, image, or .glb file</div>
                  <div className="text-xs text-muted-foreground mt-1">Supports .glb, .gltf, .obj, .png, .jpg up to 50MB</div>
                  <button type="button" className="mt-4 px-4 py-2 rounded-xl glass text-xs hover:bg-white/10">Browse files</button>
                </>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              Tip: For instant 3D preview, upload <span className="text-accent">.glb</span> or <span className="text-accent">.gltf</span>. Images preview as flat assets; .obj uploads are stored but not rendered live.
            </p>
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
          <div className="relative h-72 rounded-2xl bg-gradient-primary/20 grid-bg overflow-hidden">
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
              <img src={uploaded!.url} alt={uploaded!.file.name} className="absolute inset-0 w-full h-full object-contain" />
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
          <div className="mt-4 space-y-3 text-sm">
            <Row label="Title" value={title || "—"} />
            <Row label="Category" value={cat} />
            <Row label="Status" value={<span className="text-accent">Draft</span>} />
            <Row label="Assets" value={
              <span className="inline-flex items-center gap-1">
                <ImageIcon className="h-3 w-3" /> {uploaded ? "1 file" : "0 files"}
              </span>
            } />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function GLTFModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => scene.clone(true), [scene]);
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
