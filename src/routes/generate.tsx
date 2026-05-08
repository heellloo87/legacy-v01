import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  Sliders,
  AlertTriangle,
  Check,
  Cpu,
  Gauge,
  Layers,
  Zap,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

import headsetImg from "@/assets/model-headset.jpg";
import watchImg from "@/assets/model-watch.jpg";
import droneImg from "@/assets/model-drone.jpg";
import speakerImg from "@/assets/model-speaker.jpg";
import gloveImg from "@/assets/model-glove.jpg";
import cameraImg from "@/assets/model-camera.jpg";

export const Route = createFileRoute("/generate")({
  head: () => ({
    meta: [{ title: "Generative Design — Legacy AR" }],
  }),

  component: ProtectedGenerate,
});

/* ---------- Protected wrapper ---------- */

function ProtectedGenerate() {
  return (
    <RequireAuth roles={["admin", "designer", "manufacturing_expert"]}>
      <Generate />
    </RequireAuth>
  );
}

/* ---------- Constants ---------- */

const MATERIALS = [
  "Titanium",
  "Aluminum 7075",
  "Carbon Fiber",
  "Magnesium Alloy",
  "PEEK Polymer",
  "Stainless Steel",
];

const GOALS = [
  { id: "weight", label: "Minimum Weight" },
  { id: "strength", label: "Maximum Strength" },
  { id: "volume", label: "Maximum Volume" },
  { id: "cost", label: "Minimum Cost" },
  { id: "thermal", label: "Thermal Efficiency" },
];

const IMAGES = [
  headsetImg,
  watchImg,
  droneImg,
  speakerImg,
  gloveImg,
  cameraImg,
];

type Variant = {
  id: string;
  label: string;
  img: string;
  weight: number;
  stress: number;
  cost: number;
  score: number;
};

/* ---------- Helpers ---------- */

function scoreFor(
  v: Omit<Variant, "score">,
  goals: string[],
  target: number
) {
  let s = 70;

  if (goals.includes("weight")) {
    s += Math.max(0, 25 - Math.abs(v.weight - target) * 30);
  }

  if (goals.includes("strength")) {
    s += (1 - v.stress) * 20;
  }

  if (goals.includes("volume")) {
    s += 10;
  }

  if (goals.includes("cost")) {
    s += Math.max(0, 15 - v.cost * 0.05);
  }

  if (goals.includes("thermal")) {
    s += 8;
  }

  return Math.min(99, Math.round(s / (goals.length || 1) + 40));
}

/* ---------- Page ---------- */

function Generate() {
  const { role } = useAuth();

  const [material, setMaterial] = useState("Titanium");
  const [weight, setWeight] = useState("1.2");
  const [goals, setGoals] = useState<string[]>([
    "weight",
    "strength",
  ]);

  const [editing, setEditing] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [variants, setVariants] = useState<Variant[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const conflict =
    goals.includes("weight") && goals.includes("volume");

  const weightNum = parseFloat(weight);

  const constraintsValid =
    !!material &&
    !isNaN(weightNum) &&
    weightNum > 0 &&
    goals.length > 0 &&
    !conflict;

  const canGenerate =
    role === "admin" ||
    role === "designer" ||
    role === "manufacturing_expert";

  const toggleGoal = (id: string) => {
    if (!editing) return;

    setGoals((g) =>
      g.includes(id)
        ? g.filter((x) => x !== id)
        : [...g, id]
    );
  };

  const generate = () => {
    if (!canGenerate) {
      toast.error("You do not have permission");
      return;
    }

    if (!constraintsValid) {
      toast.error(
        "Define all constraints before generating."
      );
      return;
    }

    setGenerating(true);
    setVariants([]);
    setSelected(null);

    toast.success("AI generation started");
  };

  useEffect(() => {
    if (!generating) return;

    const tick = () => {
      setVariants((prev) => {
        if (prev.length >= 10) {
          setGenerating(false);
          toast.success("Generation complete");
          return prev;
        }

        const i = prev.length;

        const base: Omit<Variant, "score"> = {
          id: `v-${Date.now()}-${i}`,
          label: String.fromCharCode(65 + i),
          img: IMAGES[i % IMAGES.length],
          weight: +(
            weightNum +
            (Math.random() - 0.5) * 0.4
          ).toFixed(2),
          stress: +Math.random().toFixed(2),
          cost: Math.round(120 + Math.random() * 280),
        };

        return [
          ...prev,
          {
            ...base,
            score: scoreFor(base, goals, weightNum),
          },
        ];
      });
    };

    tick();

    const id = setInterval(tick, 5000);

    return () => clearInterval(id);
  }, [generating, weightNum, goals]);

  const sorted = useMemo(
    () => [...variants].sort((a, b) => b.score - a.score),
    [variants]
  );

  const selectVariant = (id: string) => {
    setSelected(id);

    const v = variants.find((x) => x.id === id);

    toast.success(
      `Variant ${v?.label} saved as Primary Version`
    );
  };

  return (
    <AppShell title="Generative Design">
      <div className="grid lg:grid-cols-12 gap-6">

        {/* ---------- Sidebar ---------- */}

        <aside className="lg:col-span-4 glass-strong rounded-3xl p-5 space-y-5 h-fit">

          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold flex items-center gap-2">
              <Sliders className="h-4 w-4 text-accent" />
              Design Constraints
            </h3>

            <button
              onClick={() => setEditing((e) => !e)}
              className={`text-xs px-3 py-1.5 rounded-lg border border-glass-border transition ${
                editing
                  ? "bg-gradient-primary text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {editing ? "Done" : "Edit Parameters"}
            </button>
          </div>

          {/* Role badge */}
          <div className="glass rounded-xl px-3 py-2 flex items-center gap-2 text-xs">
            <ShieldCheck className="h-4 w-4 text-accent" />
            Current Role:
            <span className="capitalize text-accent font-medium">
              {role ?? "viewer"}
            </span>
          </div>

          {/* Material */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Layers className="h-3 w-3" />
              Primary Material
            </label>

            <select
              disabled={!editing}
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className="w-full bg-card/50 border border-glass-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-accent disabled:opacity-70"
            >
              {MATERIALS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Weight */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Gauge className="h-3 w-3" />
              Weight Target (kg)
            </label>

            <input
              disabled={!editing}
              type="number"
              step="0.1"
              min="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full bg-card/50 border border-glass-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-accent disabled:opacity-70"
            />
          </div>

          {/* Goals */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Zap className="h-3 w-3" />
              Optimization Goals
            </label>

            <div className="flex flex-wrap gap-2">
              {GOALS.map((g) => {
                const on = goals.includes(g.id);

                return (
                  <button
                    key={g.id}
                    onClick={() => toggleGoal(g.id)}
                    disabled={!editing}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      on
                        ? "bg-gradient-primary text-white border-transparent"
                        : "border-glass-border text-muted-foreground hover:text-foreground"
                    } disabled:cursor-not-allowed`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>

            {conflict && (
              <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Conflict detected between minimum weight and
                  maximum volume.
                </span>
              </div>
            )}
          </div>

          {/* Generate */}
          <button
            onClick={generate}
            disabled={
              !constraintsValid ||
              generating ||
              !canGenerate
            }
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-primary text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}

            {generating
              ? `Generating… (${variants.length}/10)`
              : "Generate Designs"}
          </button>

          {!canGenerate && (
            <div className="text-xs text-destructive">
              Your role does not allow AI generation.
            </div>
          )}
        </aside>

        {/* ---------- Variants ---------- */}

        <section className="lg:col-span-8 space-y-4">

          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold flex items-center gap-2">
              <Cpu className="h-4 w-4 text-accent" />
              AI Generated Variants
            </h3>

            <span className="text-xs text-muted-foreground">
              {variants.length} of 10
            </span>
          </div>

          {sorted.length === 0 ? (
            <div className="glass-strong rounded-3xl p-12 text-center text-muted-foreground">
              <Sparkles className="h-10 w-10 mx-auto mb-3 text-accent opacity-60" />

              <p className="text-sm">
                Configure constraints and generate variants.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {sorted.map((v) => {
                const isSel = selected === v.id;

                return (
                  <div
                    key={v.id}
                    className={`group glass-strong rounded-2xl overflow-hidden border transition-all ${
                      isSel
                        ? "border-accent shadow-[0_0_30px_-8px_oklch(0.75_0.18_200/80%)]"
                        : "border-glass-border hover:border-accent/50"
                    }`}
                  >
                    <div className="relative h-36 overflow-hidden">
                      <img
                        src={v.img}
                        alt={`Variant ${v.label}`}
                        className="absolute inset-0 h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />

                      <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/50 backdrop-blur text-xs font-display">
                        Variant {v.label}
                      </div>

                      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md bg-gradient-primary text-white text-xs font-semibold">
                        <Sparkles className="h-3 w-3" />
                        {v.score}
                      </div>
                    </div>

                    <div className="p-3 space-y-2">

                      <div className="grid grid-cols-3 gap-2 text-[11px]">
                        <Stat
                          label="Weight"
                          value={`${v.weight}kg`}
                        />

                        <Stat
                          label="Stress"
                          value={v.stress.toFixed(2)}
                        />

                        <Stat
                          label="Cost"
                          value={`$${v.cost}`}
                        />
                      </div>

                      <button
                        onClick={() => selectVariant(v.id)}
                        className={`w-full text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                          isSel
                            ? "bg-accent/20 text-accent border border-accent/40"
                            : "bg-gradient-primary text-white"
                        }`}
                      >
                        {isSel ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            Primary Version
                          </>
                        ) : (
                          "Select"
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

/* ---------- Small stat ---------- */

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-card/40 rounded-md px-2 py-1.5 border border-glass-border">
      <div className="text-muted-foreground">
        {label}
      </div>

      <div className="font-display">
        {value}
      </div>
    </div>
  );
}
