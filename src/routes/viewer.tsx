import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Float, ContactShadows } from "@react-three/drei";
import {
  Maximize2, ZoomIn, ZoomOut, RotateCw, Layers, Sun, Ruler, Grid3x3, Download, Share2,
} from "lucide-react";
import { useRef, useState, Suspense } from "react";
import type { Group } from "three";

export const Route = createFileRoute("/viewer")({
  head: () => ({ meta: [{ title: "3D Viewer — Legacy AR" }] }),
  component: Viewer,
});

/* ---------- Models ---------- */

function HeadsetModel({ wireframe }: { wireframe: boolean }) {
  const ref = useRef<Group>(null!);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.35; });
  const matte = { metalness: 0.6, roughness: 0.35, wireframe };
  return (
    <group ref={ref}>
      {/* Main visor body */}
      <mesh castShadow position={[0, 0.1, 0]}>
        <boxGeometry args={[2.6, 1.0, 0.9]} />
        <meshStandardMaterial color="#1a1030" {...matte} />
      </mesh>
      {/* Front glossy lens panel */}
      <mesh position={[0, 0.1, 0.46]}>
        <boxGeometry args={[2.45, 0.85, 0.05]} />
        <meshPhysicalMaterial color="#0a0418" emissive="#22d3ee" emissiveIntensity={0.6} metalness={1} roughness={0.05} clearcoat={1} wireframe={wireframe} />
      </mesh>
      {/* Lens highlights */}
      <mesh position={[-0.55, 0.15, 0.49]}>
        <circleGeometry args={[0.28, 32]} />
        <meshBasicMaterial color="#a855f7" />
      </mesh>
      <mesh position={[0.55, 0.15, 0.49]}>
        <circleGeometry args={[0.28, 32]} />
        <meshBasicMaterial color="#22d3ee" />
      </mesh>
      {/* Top accent strip */}
      <mesh position={[0, 0.62, 0.2]}>
        <boxGeometry args={[2.2, 0.08, 0.5]} />
        <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.5} {...matte} />
      </mesh>
      {/* Side straps */}
      <mesh position={[-1.45, 0.1, -0.15]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.55, 0.07, 16, 32, Math.PI]} />
        <meshStandardMaterial color="#2a1c4a" {...matte} />
      </mesh>
      <mesh position={[1.45, 0.1, -0.15]} rotation={[0, Math.PI, 0]}>
        <torusGeometry args={[0.55, 0.07, 16, 32, Math.PI]} />
        <meshStandardMaterial color="#2a1c4a" {...matte} />
      </mesh>
      {/* Nose cutout shadow piece */}
      <mesh position={[0, -0.42, 0.4]}>
        <boxGeometry args={[0.5, 0.2, 0.2]} />
        <meshStandardMaterial color="#0a0418" {...matte} />
      </mesh>
    </group>
  );
}

function DroneModel({ wireframe }: { wireframe: boolean }) {
  const ref = useRef<Group>(null!);
  const propsRef = useRef<Group>(null!);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.3;
    if (propsRef.current) propsRef.current.rotation.y += dt * 25;
  });
  const mat = { metalness: 0.7, roughness: 0.3, wireframe };
  return (
    <group ref={ref}>
      {/* Body */}
      <mesh castShadow>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshStandardMaterial color="#1a1030" {...mat} />
      </mesh>
      {/* Camera lens */}
      <mesh position={[0, -0.15, 0.45]}>
        <cylinderGeometry args={[0.18, 0.18, 0.18, 32]} rotation={[Math.PI/2,0,0]} />
        <meshPhysicalMaterial color="#0a0418" emissive="#22d3ee" emissiveIntensity={0.8} metalness={1} roughness={0.05} />
      </mesh>
      {/* Arms + propellers */}
      {[[-1,-1],[1,-1],[-1,1],[1,1]].map(([x,z], i) => (
        <group key={i} position={[x*0.9, 0.1, z*0.9]}>
          <mesh>
            <cylinderGeometry args={[0.05, 0.05, 1.0, 12]} rotation={[0, 0, Math.PI/2]} />
            <meshStandardMaterial color="#2a1c4a" {...mat} />
          </mesh>
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.08, 16]} />
            <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.4} {...mat} />
          </mesh>
          <group ref={i===0 ? propsRef : undefined} position={[0, 0.22, 0]}>
            <mesh>
              <boxGeometry args={[0.7, 0.02, 0.08]} />
              <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.3} transparent opacity={0.8} {...mat} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}

function WatchModel({ wireframe }: { wireframe: boolean }) {
  const ref = useRef<Group>(null!);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.4; });
  const mat = { metalness: 0.85, roughness: 0.2, wireframe };
  return (
    <group ref={ref} rotation={[0.3, 0, 0]}>
      {/* Case */}
      <mesh castShadow>
        <cylinderGeometry args={[0.9, 0.9, 0.3, 64]} />
        <meshStandardMaterial color="#2a1c4a" {...mat} />
      </mesh>
      {/* Screen */}
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.78, 0.78, 0.02, 64]} />
        <meshPhysicalMaterial color="#0a0418" emissive="#22d3ee" emissiveIntensity={0.5} metalness={1} roughness={0.05} clearcoat={1} />
      </mesh>
      {/* Crown */}
      <mesh position={[0.95, 0, 0]} rotation={[0, 0, Math.PI/2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.18, 24]} />
        <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.4} {...mat} />
      </mesh>
      {/* Straps */}
      {[1, -1].map((s) => (
        <mesh key={s} position={[0, -0.05, s * 1.2]}>
          <boxGeometry args={[1.4, 0.2, 1.2]} />
          <meshStandardMaterial color="#1a1030" {...mat} />
        </mesh>
      ))}
    </group>
  );
}

const MODELS = {
  headset: { name: "Helios Headset", component: HeadsetModel, vertices: "24,812", faces: "12,406" },
  drone: { name: "Aero Drone X1", component: DroneModel, vertices: "18,440", faces: "9,220" },
  watch: { name: "Pulse Watch", component: WatchModel, vertices: "14,902", faces: "7,451" },
} as const;
type ModelKey = keyof typeof MODELS;

/* ---------- Page ---------- */

function Viewer() {
  const [zoom, setZoom] = useState(5);
  const [wireframe, setWireframe] = useState(false);
  const [modelKey, setModelKey] = useState<ModelKey>("headset");
  const Model = MODELS[modelKey].component;

  return (
    <AppShell title="3D Viewer">
      <div className="grid lg:grid-cols-12 gap-6 h-[calc(100vh-9rem)]">
        <section className="lg:col-span-9 glass-strong rounded-3xl p-3 relative overflow-hidden">
          <div className="absolute top-5 left-5 z-10 flex items-center gap-2">
            <span className="glass rounded-lg px-3 py-1.5 text-xs">{MODELS[modelKey].name} · v14</span>
            <span className="glass rounded-lg px-2 py-1.5 text-[10px] text-accent inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" /> LIVE</span>
          </div>
          <div className="absolute top-5 right-5 z-10 flex items-center gap-2">
            <button className="glass rounded-lg p-2 hover:bg-white/10"><Share2 className="h-4 w-4" /></button>
            <button className="glass rounded-lg p-2 hover:bg-white/10"><Download className="h-4 w-4" /></button>
            <button className="glass rounded-lg p-2 hover:bg-white/10"><Maximize2 className="h-4 w-4" /></button>
          </div>

          <div className="h-full w-full rounded-2xl overflow-hidden grid-bg relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-accent/15" />
            <Canvas camera={{ position: [0, 0.6, zoom], fov: 50 }} shadows dpr={[1, 2]}>
              <ambientLight intensity={0.5} />
              <pointLight position={[5, 5, 5]} intensity={1.4} color="#a855f7" />
              <pointLight position={[-5, -3, -3]} intensity={0.9} color="#22d3ee" />
              <spotLight position={[0, 6, 4]} intensity={1.2} angle={0.5} penumbra={0.5} castShadow />
              <Suspense fallback={null}>
                <Float speed={1.3} rotationIntensity={0.15} floatIntensity={0.6}>
                  <Model wireframe={wireframe} />
                </Float>
                <ContactShadows position={[0, -1.1, 0]} opacity={0.5} scale={8} blur={2.4} far={3} />
                <Environment preset="city" />
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
            <h3 className="font-display font-semibold text-lg mt-1">{MODELS[modelKey].name}</h3>
            <p className="text-xs text-muted-foreground">Adaptive prototype · Iteration 14</p>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Switch Model</div>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(MODELS) as ModelKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setModelKey(k)}
                  className={`text-[11px] py-2 rounded-lg capitalize transition ${modelKey === k ? "bg-gradient-primary text-white" : "glass text-muted-foreground hover:text-foreground"}`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <Spec label="Vertices" value={MODELS[modelKey].vertices} />
            <Spec label="Faces" value={MODELS[modelKey].faces} />
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
