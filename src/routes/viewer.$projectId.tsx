import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";

import { Canvas } from "@react-three/fiber";

import {
  OrbitControls,
  Environment,
  ContactShadows,
  useGLTF,
  Center,
  Stage,
} from "@react-three/drei";

import {
  Maximize2,
  ZoomIn,
  ZoomOut,
  Grid3x3,
  Sun,
  Ruler,
  Layers,
  Download,
  Share2,
  Upload,
  X,
  Box,
  Loader2,
} from "lucide-react";

import {
  Suspense,
  useState,
  useRef,
  useEffect,
  useMemo,
} from "react";

import * as THREE from "three";

export const Route = createFileRoute(
  "/viewer/$projectId"
)({
  head: () => ({
    meta: [
      {
        title: "3D Viewer — Legacy AR",
      },
    ],
  }),

  component: ProtectedViewer,
});

/* ---------- Protected wrapper ---------- */

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
      <Viewer />
    </RequireAuth>
  );
}

/* ---------- GLTF renderer ---------- */

function GLTFModel({
  url,
  wireframe,
}: {
  url: string;
  wireframe: boolean;
}) {
  const { scene } = useGLTF(url);

  const cloned = useMemo(
    () => scene.clone(true),
    [scene]
  );

  useEffect(() => {
    cloned.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;

        const mats = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];

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

  return (
    <Center>
      <primitive object={cloned} />
    </Center>
  );
}

/* ---------- Empty state ---------- */

function EmptyCanvas({
  onBrowse,
}: {
  onBrowse: () => void;
}) {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="text-center space-y-4">
        <div className="h-24 w-24 mx-auto rounded-2xl bg-gradient-primary glow grid place-items-center animate-float">
          <Box className="h-10 w-10 text-white" />
        </div>

        <div>
          <p className="text-sm font-medium">
            No model loaded
          </p>

          <p className="text-xs text-muted-foreground mt-1">
            Drop a .glb or .gltf file anywhere
          </p>
        </div>

        <button
          onClick={onBrowse}
          className="px-4 py-2 rounded-xl glass text-xs hover:bg-white/10 transition"
        >
          Browse files
        </button>
      </div>
    </div>
  );
}

/* ---------- File stats ---------- */

function getFileStats(file: File) {
  const ext =
    file.name.split(".").pop()?.toUpperCase() ??
    "GLB";

  const size =
    file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(1)} KB`
      : `${(
          file.size /
          1024 /
          1024
        ).toFixed(2)} MB`;

  return { ext, size };
}

/* ---------- Main viewer ---------- */

function Viewer() {
  const { projectId } = Route.useParams();

  const [zoom, setZoom] = useState(5);

  const [wireframe, setWireframe] =
    useState(false);

  const [fileUrl, setFileUrl] = useState<
    string | null
  >(null);

  const [fileName, setFileName] = useState<
    string | null
  >(null);

  const [fileStats, setFileStats] = useState<{
    ext: string;
    size: string;
  } | null>(null);

  const [dragOver, setDragOver] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const inputRef =
    useRef<HTMLInputElement>(null);

  /* ---------- Load project ---------- */

  useEffect(() => {
    const loadProject = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error || !data) {
        alert("Project not found");
        setLoading(false);
        return;
      }

      if (data.design_url) {
        setFileUrl(data.design_url);

        setFileName(data.name);

        setFileStats({
          ext:
            data.design_ext?.toUpperCase() ??
            "GLB",

          size: "Remote File",
        });
      }

      setLoading(false);
    };

    loadProject();
  }, [projectId]);

  /* ---------- Local upload ---------- */

  const loadFile = (file: File) => {
    const ext =
      file.name.split(".").pop()?.toLowerCase();

    if (ext !== "glb" && ext !== "gltf") {
      alert(
        "Only .glb and .gltf files are supported."
      );

      return;
    }

    if (fileUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(fileUrl);
    }

    const url = URL.createObjectURL(file);

    setFileUrl(url);

    setFileName(file.name);

    setFileStats(getFileStats(file));
  };

  const clearModel = () => {
    if (fileUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(fileUrl);
    }

    setFileUrl(null);
    setFileName(null);
    setFileStats(null);
  };

  const handleDrop = (
    e: React.DragEvent
  ) => {
    e.preventDefault();

    setDragOver(false);

    const file = e.dataTransfer.files[0];

    if (file) {
      loadFile(file);
    }
  };

  /* ---------- Loading ---------- */

  if (loading) {
    return (
      <AppShell title="3D Viewer">
        <div className="h-[70vh] flex items-center justify-center">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading model...
          </div>
        </div>
      </AppShell>
    );
  }

  /* ---------- UI ---------- */

  return (
    <AppShell title="3D Viewer">
      <input
        ref={inputRef}
        type="file"
        accept=".glb,.gltf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            loadFile(e.target.files[0]);
          }
        }}
      />

      <div className="grid lg:grid-cols-12 gap-6 h-[calc(100vh-9rem)]">

        {/* ---------- Canvas ---------- */}

        <section
          className={`lg:col-span-9 glass-strong rounded-3xl p-3 relative overflow-hidden transition ${
            dragOver
              ? "ring-2 ring-accent"
              : ""
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() =>
            setDragOver(false)
          }
          onDrop={handleDrop}
        >

          {/* Top left */}

          <div className="absolute top-5 left-5 z-10 flex items-center gap-2">
            {fileName ? (
              <>
                <span className="glass rounded-lg px-3 py-1.5 text-xs truncate max-w-[200px]">
                  {fileName}
                </span>

                <button
                  onClick={clearModel}
                  className="glass rounded-lg p-1.5 hover:bg-white/10 transition"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </>
            ) : (
              <span className="glass rounded-lg px-3 py-1.5 text-xs text-muted-foreground">
                No model loaded
              </span>
            )}
          </div>

          {/* Top right */}

          <div className="absolute top-5 right-5 z-10 flex items-center gap-2">
            <button
              onClick={() =>
                inputRef.current?.click()
              }
              className="glass rounded-lg px-3 py-2 hover:bg-white/10 transition flex items-center gap-2 text-xs"
            >
              <Upload className="h-3.5 w-3.5" />
              Load file
            </button>

            <button className="glass rounded-lg p-2 hover:bg-white/10">
              <Share2 className="h-4 w-4" />
            </button>

            <button className="glass rounded-lg p-2 hover:bg-white/10">
              <Download className="h-4 w-4" />
            </button>

            <button className="glass rounded-lg p-2 hover:bg-white/10">
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>

          {/* Drag overlay */}

          {dragOver && (
            <div className="absolute inset-0 z-20 bg-accent/10 border-2 border-dashed border-accent rounded-3xl grid place-items-center pointer-events-none">
              <p className="text-accent font-medium">
                Drop .glb / .gltf here
              </p>
            </div>
          )}

          {/* Canvas */}

          <div className="h-full w-full rounded-2xl overflow-hidden grid-bg relative">

            <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-accent/15" />

            {fileUrl ? (
              <Canvas
                camera={{
                  position: [0, 0.6, zoom],
                  fov: 50,
                }}
                shadows
                dpr={[1, 2]}
              >
                <ambientLight intensity={0.5} />

                <pointLight
                  position={[5, 5, 5]}
                  intensity={1.4}
                  color="#a855f7"
                />

                <pointLight
                  position={[-5, -3, -3]}
                  intensity={0.9}
                  color="#22d3ee"
                />

                <spotLight
                  position={[0, 6, 4]}
                  intensity={1.2}
                  angle={0.5}
                  penumbra={0.5}
                  castShadow
                />

                <Suspense fallback={null}>
                  <Stage
                    environment="city"
                    intensity={0.5}
                    adjustCamera={false}
                  >
                    <GLTFModel
                      url={fileUrl}
                      wireframe={wireframe}
                    />
                  </Stage>

                  <ContactShadows
                    position={[0, -1.1, 0]}
                    opacity={0.5}
                    scale={8}
                    blur={2.4}
                    far={3}
                  />

                  <Environment preset="city" />
                </Suspense>

                <OrbitControls
                  enablePan
                  enableZoom
                  enableRotate
                  autoRotate
                  autoRotateSpeed={0.8}
                />
              </Canvas>
            ) : (
              <EmptyCanvas
                onBrowse={() =>
                  inputRef.current?.click()
                }
              />
            )}
          </div>

          {/* Bottom toolbar */}

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 glass-strong rounded-2xl p-2 flex items-center gap-1">

            <ToolBtn
              label="Zoom in"
              onClick={() =>
                setZoom((z) =>
                  Math.max(1, z - 0.5)
                )
              }
            >
              <ZoomIn className="h-4 w-4" />
            </ToolBtn>

            <ToolBtn
              label="Zoom out"
              onClick={() =>
                setZoom((z) =>
                  Math.min(20, z + 0.5)
                )
              }
            >
              <ZoomOut className="h-4 w-4" />
            </ToolBtn>

            <div className="w-px h-6 bg-glass-border mx-1" />

            <ToolBtn
              label="Wireframe"
              active={wireframe}
              onClick={() =>
                setWireframe((w) => !w)
              }
            >
              <Grid3x3 className="h-4 w-4" />
            </ToolBtn>

            <ToolBtn label="Lighting">
              <Sun className="h-4 w-4" />
            </ToolBtn>

            <ToolBtn label="Measure">
              <Ruler className="h-4 w-4" />
            </ToolBtn>

            <ToolBtn label="Layers">
              <Layers className="h-4 w-4" />
            </ToolBtn>
          </div>
        </section>

        {/* ---------- Sidebar ---------- */}

        <aside className="lg:col-span-3 glass-strong rounded-3xl p-5 overflow-y-auto space-y-5">

          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Loaded file
            </div>

            <h3 className="font-display font-semibold text-lg mt-1 truncate">
              {fileName ?? "None"}
            </h3>

            <p className="text-xs text-muted-foreground">
              {fileStats
                ? `${fileStats.ext} · ${fileStats.size}`
                : "Load a .glb or .gltf file"}
            </p>
          </div>

          <button
            onClick={() =>
              inputRef.current?.click()
            }
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-primary text-white text-sm"
          >
            <Upload className="h-4 w-4" />
            Load GLTF / GLB
          </button>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              • Drag & drop a file onto the
              canvas
            </p>

            <p>
              • Supports .glb and .gltf
            </p>
          </div>

          {fileUrl && (
            <>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                  Camera
                </div>

                <Slider
                  label="Zoom"
                  value={Math.round(
                    (1 -
                      (zoom - 1) / 19) *
                      100
                  )}
                />
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                  Display
                </div>

                <button
                  onClick={() =>
                    setWireframe((w) => !w)
                  }
                  className={`w-full text-xs py-2.5 rounded-xl border border-glass-border transition ${
                    wireframe
                      ? "bg-gradient-primary text-white"
                      : "glass text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {wireframe
                    ? "Wireframe ON"
                    : "Wireframe OFF"}
                </button>
              </div>

              <button className="w-full py-3 rounded-xl bg-gradient-primary text-white text-sm">
                Open in AR
              </button>
            </>
          )}
        </aside>
      </div>
    </AppShell>
  );
}

/* ---------- Tool button ---------- */

function ToolBtn({
  children,
  label,
  active,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`h-9 w-9 rounded-xl grid place-items-center transition ${
        active
          ? "bg-gradient-primary text-white"
          : "hover:bg-white/10 text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

/* ---------- Slider ---------- */

function Slider({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
        <span>{label}</span>

        <span>{value}%</span>
      </div>

      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full bg-gradient-primary"
          style={{
            width: `${value}%`,
          }}
        />
      </div>
    </div>
  );
}
