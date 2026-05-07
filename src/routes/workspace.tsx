import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import {
  Send, Upload, Heart, MessageSquare, Share2, Eye, History, Users, Tag, Calendar,
} from "lucide-react";
import headsetImg from "@/assets/model-headset.jpg";

export const Route = createFileRoute("/workspace")({
  head: () => ({ meta: [{ title: "Workspace — Legacy AR" }] }),
  component: Workspace,
});

const comments = [
  { who: "Maya", text: "Love the new bezel curve — feels more premium.", time: "2m", color: "from-primary to-secondary" },
  { who: "Leo", text: "Can we push the cyan glow 10% brighter on the inner rim?", time: "12m", color: "from-secondary to-accent" },
  { who: "Sara", text: "Approved for AR preview ✨", time: "1h", color: "from-accent to-primary" },
];

function Workspace() {
  return (
    <AppShell title="Helios Headset v3">
      <div className="grid lg:grid-cols-12 gap-6 h-[calc(100vh-9rem)]">
        {/* Left: project info */}
        <aside className="lg:col-span-3 glass-strong rounded-3xl p-5 overflow-y-auto">
          <div className="h-32 rounded-2xl relative overflow-hidden">
            <img src={headsetImg} alt="Helios Headset" loading="lazy" width={1024} height={768} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent" />
          </div>
          <h3 className="mt-4 font-display font-semibold text-lg">Helios Headset v3</h3>
          <p className="text-xs text-muted-foreground mt-1">Next-gen AR headset prototype with adaptive lenses.</p>

          <div className="mt-5 space-y-3 text-sm">
            <Meta icon={Tag} label="Category" value="Hardware" />
            <Meta icon={Users} label="Team" value="5 collaborators" />
            <Meta icon={Calendar} label="Updated" value="Today, 18:42" />
            <Meta icon={Eye} label="Visibility" value="Team" />
          </div>

          <div className="mt-5">
            <div className="text-xs text-muted-foreground mb-2">Members</div>
            <div className="flex -space-x-2">
              {["A", "M", "L", "S", "K"].map((m) => (
                <div key={m} className="h-8 w-8 rounded-full bg-gradient-primary border-2 border-background grid place-items-center text-[11px] font-semibold">{m}</div>
              ))}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
            <Stat label="Versions" value="14" />
            <Stat label="Comments" value="38" />
            <Stat label="Renders" value="212" />
            <Stat label="AR views" value="89" />
          </div>
        </aside>

        {/* Center: design preview */}
        <section className="lg:col-span-6 glass-strong rounded-3xl p-5 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button className="glass rounded-lg px-3 py-1.5 text-xs">v14 · current</button>
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
            <img src={headsetImg} alt="Helios Headset preview" loading="lazy" width={1024} height={768} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />
            <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
            <div className="relative animate-float pointer-events-none">
              <div className="h-2 w-2" />
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs">
              <span className="glass rounded-lg px-3 py-1.5">1920 × 1080</span>
              <div className="flex items-center gap-2">
                <button className="glass rounded-lg px-3 py-1.5 inline-flex items-center gap-1"><Heart className="h-3 w-3" /> 24</button>
                <button className="glass rounded-lg px-3 py-1.5 inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" /> 38</button>
              </div>
            </div>
          </div>
        </section>

        {/* Right: collaboration */}
        <aside className="lg:col-span-3 glass-strong rounded-3xl p-5 flex flex-col">
          <h3 className="font-display font-semibold">Activity & Comments</h3>

          <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
            {comments.map((c, i) => (
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
            {["Leo uploaded v14", "Render queue completed", "Maya joined the workspace"].map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {a}
              </div>
            ))}
          </div>

          <div className="mt-4 glass rounded-xl p-2 flex items-center gap-2">
            <input placeholder="Write a comment…" className="bg-transparent outline-none flex-1 text-sm px-2" />
            <button className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center"><Send className="h-3.5 w-3.5" /></button>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

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
