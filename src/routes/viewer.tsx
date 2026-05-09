import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  ContactShadows,
  useGLTF,
  Center,
  Stage,
} from "@react-three/drei";
import * as THREE from "three";
import {
  Suspense,
  useState,
  useRef,
  useEffect,
  useMemo,
} from "react";
import {
  Box,
  ImageIcon,
  Lock,
  Globe,
  Search,
  Loader2,
  FolderOpen,
  ZoomIn,
  ZoomOut,
  Grid3x3,
  Upload,
  X,
  Sun,
  Ruler,
  Layers,
} from "lucide-react";

export const Route = createFileRoute("/viewer")({
  head: () => ({
    meta: [{ title: "3D Viewer — Legacy AR" }],
  }),
  component: ProtectedViewer,
});

function ProtectedViewer() {
  return (
    <RequireAuth
      roles={[
        "admin",
        "designer",
        "collaborator",
        "manufacturing_expert",
      ]}
    >
      <ViewerPage />
    </RequireAuth>
  );
}

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
};

const MODEL_EXT = ["glb", "gltf"];

const STATUS_COLORS: Record<string, string> = {
  active:        "text-accent border-accent/30 bg-accent/10",
  review:        "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  draft:         "text-muted-foreground border-white/10 bg-white/5",
  "in-progress": "text-blue-400 border-blue-400/30 bg-blue-400/10",
  done:          "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
};

function useAllProjects(userId: string | undefined) {
  return useQuery({
    queryKey: ["viewer-projects", userId],
    queryFn: async () => {
      const [ownRes, teamRes] = await Promise.all([
        supabase
          .from("projects")
          .select("id, user_id, name, category, status, progress, cover_url, design_url, design_ext, version, visibility, creator_name")
          .eq("user_id", userId!)
          .order("created_at", { ascending: false }),
        supabase
          .from("projects")
          .select("id, user_id, name, category, status, progress, cover_url, design_url, design_ext, version, visibility, creator_name")
          .in("visibility", ["team", "public"])
          .neq("user_id", userId!)
          .order("created_at", { ascending: false }),
      ]);
      if (ownRes.error) throw ownRes.error;
      if (teamRes.error) throw teamRes.error;
      return [...(ownRes.data ?? []), ...(teamRes.data ?? [])] as Project[];
    },
    enabled: !!userId,
  });
}

function GLTFModel({ url, wireframe }: { url: string; wireframe: boolean }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    cloned.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((mat) => {
          if (
            mat instanceof THREE.MeshStandardMaterial ||
            mat instanceof THREE.MeshPhysicalMaterial
          ) {
            mat.wireframe = wireframe;
          }
        });
      }
    });
  }, [cloned, wireframe]);

  useEffect(() => {
    return () => {
      cloned.traverse((obj: any) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m: any) => m.dispose?.());
          else obj.material.dispose?.();
        }
      });
    };
  }, [cloned]);

  return <Center><primitive object={cloned} /></Center>;
}

function ToolBtn({ children, label, active, onClick }: {
  children: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} title={label}
      className={`h-9 w-9 rounded-xl grid place-items-center transition ${
        active ? "bg-gradient-primary text-white" : "hover:bg-white/10 text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function ViewerPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Project | null>(null);
  const [zoom, setZoom] = useState(5);
  const [wireframe, setWireframe] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: projects = [], isPending } = useAllProjects(user?.id);

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const activeUrl = localUrl ?? selected?.design_url ?? null;
  const isModel = localUrl
    ? true
    : selected?.design_ext
    ? MODEL_EXT.includes(selected.design_ext)
    : false;

  const handleSelect = (p: Project) => {
    setSelected(p);
    setLocalUrl(null);
    setWireframe(false);
  };

  const loadLocalFile = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "glb" && ext !== "gltf") {
      alert("Only .glb and .gltf files are supported.");
      return;
    }
    if (localUrl) URL.revokeObjectURL(localUrl);
    setLocalUrl(URL.createObjectURL(file));
  };

  const clearLocal = () => {
    if (localUrl) URL.revokeObjectURL(localUrl);
    setLocalUrl(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) loadLocalFile(file);
  };

  return (
    <AppShell title="3D Viewer">
      <div className="flex gap-4 h-[calc(100vh-9rem)]">

        {/* Left: Project List */}
        <aside className="w-72 shrink-0 glass-strong rounded-3xl p-4 flex flex-col gap-3 overflow-hidden">
          <div className="flex items-center gap-2 glass rounded-xl px-3 py-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects…"
              className="bg-transparent outline-none text-xs flex-1"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {isPending ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-accent" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
                <FolderOpen className="h-8 w-8 opacity-30" />
                <p className="text-xs">No projects found</p>
              </div>
            ) : (
              filtered.map((p) => {
                const isActive = selected?.id === p.id;
                const has3D = p.design_ext && MODEL_EXT.includes(p.design_ext);
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(p)}
                    className={`w-full text-left glass rounded-2xl p-3 transition flex gap-3 items-start ${
                      isActive ? "border border-accent" : "hover:border-accent/40"
                    }`}
                  >
                    <div className="h-12 w-12 rounded-xl overflow-hidden shrink-0 relative bg-gradient-to-br from-primary/20 to-accent/10">
                      {p.cover_url ? (
                        <img src={p.cover_url} alt={p.name} className="absolute inset-0 h-full w-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 grid place-items-center">
                          {has3D ? <Box className="h-5 w-5 text-white/20" /> : <ImageIcon className="h-5 w-5 text-white/20" />}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{p.name}</div>
                      <div className="text-[10px] text-muted-foreground">{p.category}</div>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {has3D && (
                          <span className="text-[9px] text-accent glass rounded px-1.5 py-0.5 inline-flex items-center gap-0.5">
                            <Box className="h-2 w-2" /> 3D
                          </span>
                        )}
                        <span className={`text-[9px] border rounded px-1.5 py-0.5 capitalize ${STATUS_COLORS[p.status] ?? STATUS_COLORS.draft}`}>
                          {p.status}
                        </span>
                        {p.visibility === "private"
                          ? <Lock className="h-2.5 w-2.5 text-muted-foreground ml-auto" />
                          : <Globe className="h-2.5 w-2.5 text-accent ml-auto" />}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".glb,.gltf"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) loadLocalFile(e.target.files[0]); }}
          />
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-primary text-white text-xs"
          >
            <Upload className="h-3.5 w-3.5" /> Load local GLB
          </button>
        </aside>

        {/* Right: 3D Canvas */}
        <section
          className={`flex-1 glass-strong rounded-3xl p-3 relative overflow-hidden transition ${dragOver ? "ring-2 ring-accent" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {/* Top bar */}
          <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selected ? (
                <span className="glass rounded-lg px-3 py-1.5 text-xs font-medium truncate max-w-[220px]">{selected.name}</span>
              ) : (
                <span className="glass rounded-lg px-3 py-1.5 text-xs text-muted-foreground">Select a project</span>
              )}
              {localUrl && (
                <button onClick={clearLocal} className="glass rounded-lg p-1.5 hover:bg-white/10">
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            {selected && (
              <div className="flex items-center gap-1">
                <span className="glass rounded-lg px-2 py-1 text-[10px] text-accent">{selected.version}</span>
                <span className={`glass rounded-lg px-2 py-1 text-[10px] border capitalize ${STATUS_COLORS[selected.status] ?? STATUS_COLORS.draft}`}>
                  {selected.status}
                </span>
              </div>
            )}
          </div>

          {dragOver && (
            <div className="absolute inset-0 z-20 bg-accent/10 border-2 border-dashed border-accent rounded-3xl grid place-items-center pointer-events-none">
              <p className="text-accent font-medium">Drop .glb / .gltf here</p>
            </div>
          )}

          <div className="h-full w-full rounded-2xl overflow-hidden relative bg-gradient-to-br from-primary/10 to-accent/10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-accent/15" />

            {activeUrl && isModel ? (
              <Canvas
                key={activeUrl}
                camera={{ position: [0, 0.6, zoom], fov: 50 }}
                shadows
                dpr={[1, 2]}
              >
                <ambientLight intensity={0.5} />
                <pointLight position={[5, 5, 5]} intensity={1.4} color="#a855f7" />
                <pointLight position={[-5, -3, -3]} intensity={0.9} color="#22d3ee" />
                <spotLight position={[0, 6, 4]} intensity={1.2} angle={0.5} penumbra={0.5} castShadow />
                <Suspense fallback={null}>
                  <Stage environment="city" intensity={0.5} adjustCamera={false}>
                    <GLTFModel url={activeUrl} wireframe={wireframe} />
                  </Stage>
                  <ContactShadows position={[0, -1.1, 0]} opacity={0.5} scale={8} blur={2.4} far={3} />
                  <Environment preset="city" />
                </Suspense>
                <OrbitControls enablePan enableZoom enableRotate autoRotate autoRotateSpeed={0.8} />
              </Canvas>
            ) : activeUrl && !isModel ? (
              <img
                key={activeUrl}
                src={activeUrl}
                alt={selected?.name}
                className="absolute inset-0 h-full w-full object-contain"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center space-y-4">
                  <div className="h-24 w-24 mx-auto rounded-2xl bg-gradient-primary glow grid place-items-center animate-float">
                    <Box className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">No model selected</p>
                    <p className="text-xs text-muted-foreground mt-1">Pick a project from the left or drop a .glb file here</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {activeUrl && isModel && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 glass-strong rounded-2xl p-2 flex items-center gap-1">
              <ToolBtn label="Zoom in" onClick={() => setZoom((z) => Math.max(1, z - 0.5))}><ZoomIn className="h-4 w-4" /></ToolBtn>
              <ToolBtn label="Zoom out" onClick={() => setZoom((z) => Math.min(20, z + 0.5))}><ZoomOut className="h-4 w-4" /></ToolBtn>
              <div className="w-px h-6 bg-glass-border mx-1" />
              <ToolBtn label="Wireframe" active={wireframe} onClick={() => setWireframe((w) => !w)}><Grid3x3 className="h-4 w-4" /></ToolBtn>
              <ToolBtn label="Lighting"><Sun className="h-4 w-4" /></ToolBtn>
              <ToolBtn label="Measure"><Ruler className="h-4 w-4" /></ToolBtn>
              <ToolBtn label="Layers"><Layers className="h-4 w-4" /></ToolBtn>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
