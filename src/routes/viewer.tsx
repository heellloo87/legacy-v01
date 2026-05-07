import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Float, MeshDistortMaterial } from "@react-three/drei";
import {
  Maximize2, ZoomIn, ZoomOut, RotateCw, Layers, Sun, Ruler, Grid3x3, Download, Share2,
} from "lucide-react";
import { useRef, useState, Suspense } from "react";
import type { Mesh } from "three";
import { useFrame } from "@react-three/fiber";

export const Route = createFileRoute("/viewer")({
  head: () => ({ meta: [{ title: "3D Viewer — Legacy AR" }] }),
  component: Viewer,
});

function Model({ wireframe }: { wireframe: boolean }) {
  const ref = useRef<Mesh>(null!);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.3;
  });
  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={1.2}>
      <mesh ref={ref} castShadow>
        <icosahedronGeometry args={[1.4, 4]} />
        <MeshDistortMaterial
          color="#a855f7"
          emissive="#22d3ee"
          emissiveIntensity={0.4}
          metalness={0.85}
          roughness={0.15}
          distort={0.35}
          speed={1.5}
          wireframe={wireframe}
        />
      </mesh>
    </Float>
  );
}

function Viewer() {
  const [zoom, setZoom] = useState(5);
  const [wireframe, setWireframe] = useState(false);

  return (
    <AppShell title="3D Viewer">
      <div className="grid lg:grid-cols-12 gap-6 h-[calc(100vh-9rem)]">
        <section className="lg:col-span-9 glass-strong rounded-3xl p-3 relative overflow-hidden">
          <div className="absolute top-5 left-5 z-10 flex items-center gap-2">
            <span className="glass rounded-lg px-3 py-1.5 text-xs">Helios Core · v14</span>
            <span className="glass rounded-lg px-2 py-1.5 text-[10px] text-accent inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" /> LIVE</span>
          </div>
          <div className="absolute top-5 right-5 z-10 flex items-center gap-2">
            <button className="glass rounded-lg p-2 hover:bg-white/10"><Share2 className="h-4 w-4" /></button>
            <button className="glass rounded-lg p-2 hover:bg-white/10"><Download className="h-4 w-4" /></button>
            <button className="glass rounded-lg p-2 hover:bg-white/10"><Maximize2 className="h-4 w-4" /></button>
          </div>

          <div className="h-full w-full rounded-2xl overflow-hidden grid-bg relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-accent/15" />
            <Canvas camera={{ position: [0, 0, zoom], fov: 50 }} shadows dpr={[1, 2]}>
              <ambientLight intensity={0.4} />
              <pointLight position={[5, 5, 5]} intensity={1.2} color="#a855f7" />
              <pointLight position={[-5, -3, -3]} intensity={0.8} color="#22d3ee" />
              <Suspense fallback={null}>
                <Model wireframe={wireframe} />
                <Environment preset="night" />
              </Suspense>
              <OrbitControls enablePan enableZoom enableRotate />
            </Canvas>
          </div>

          {/* Floating control dock */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 glass-strong rounded-2xl p-2 flex items-center gap-1 shadow-[0_0_30px_-8px_oklch(0.78_0.18_200/50%)]">
            <ToolBtn label="Rotate"><RotateCw className="h-4 w-4" /></ToolBtn>
            <ToolBtn label="Zoom in" onClick={() => setZoom((z) => Math.max(2, z - 0.5))}><ZoomIn className="h-4 w-4" /></ToolBtn>
            <ToolBtn label="Zoom out" onClick={() => setZoom((z) => Math.min(12, z + 0.5))}><ZoomOut className="h-4 w-4" /></ToolBtn>
            <div className="w-px h-6 bg-glass-border mx-1" />
            <ToolBtn label="Wireframe" active={wireframe} onClick={() => setWireframe((w) => !w)}><Grid3x3 className="h-4 w-4" /></ToolBtn>
            <ToolBtn label="Lighting"><Sun className="h-4 w-4" /></ToolBtn>
            <ToolBtn label="Measure"><Ruler className="h-4 w-4" /></ToolBtn>
            <ToolBtn label="Layers"><Layers className="h-4 w-4" /></ToolBtn>
          </div>
        </section>

        {/* Object details */}
        <aside className="lg:col-span-3 glass-strong rounded-3xl p-5 overflow-y-auto space-y-5">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Object</div>
            <h3 className="font-display font-semibold text-lg mt-1">Helios Core</h3>
            <p className="text-xs text-muted-foreground">Adaptive lens module · Iteration 14</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <Spec label="Vertices" value="24,812" />
            <Spec label="Faces" value="12,406" />
            <Spec label="Materials" value="3" />
            <Spec label="Size" value="4.8 MB" />
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Materials</div>
            <div className="space-y-2">
              {[
                { n: "Plasma Shell", c: "from-primary to-secondary" },
                { n: "Cyan Glow", c: "from-accent to-secondary" },
                { n: "Carbon Frame", c: "from-secondary to-primary" },
              ].map((m) => (
                <div key={m.n} className="glass rounded-xl p-2.5 flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${m.c}`} />
                  <div className="text-xs">{m.n}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Camera</div>
            <Slider label="Zoom" value={Math.round((12 - zoom) / 10 * 100)} />
            <Slider label="Exposure" value={62} />
            <Slider label="Glow" value={78} />
          </div>

          <button className="w-full py-3 rounded-xl bg-gradient-primary text-white text-sm shadow-[0_0_30px_-8px_oklch(0.65_0.24_295/70%)]">
            Open in AR
          </button>
        </aside>
      </div>
    </AppShell>
  );
}

function ToolBtn({ children, label, active, onClick }: { children: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`h-9 w-9 rounded-xl grid place-items-center transition ${active ? "bg-gradient-primary text-white" : "hover:bg-white/10 text-muted-foreground hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-3">
      <div className="text-sm font-display font-semibold">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function Slider({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
        <span>{label}</span><span>{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full bg-gradient-primary" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
