import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, FolderPlus, Users, Box, Settings, LogOut, Sparkles, X, Wand2,
} from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useSidebar } from "./sidebar-context";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Create Project", url: "/projects/new", icon: FolderPlus },
  { title: "Workspace", url: "/workspace", icon: Users },
  { title: "AI Generate", url: "/generate", icon: Wand2 },
  { title: "3D Viewer", url: "/viewer", icon: Box },
];

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const nav = useNavigate();
  const { signOut } = useAuth();
  const { open, setOpen } = useSidebar();

  return (
    <>
      {/* Backdrop (mobile only) */}
      <div
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-30 bg-background/60 backdrop-blur-sm lg:hidden transition-opacity",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      />

      <aside
        className={cn(
          "fixed lg:sticky top-0 z-40 h-screen w-64 shrink-0 flex flex-col glass-strong border-r border-glass-border p-4 gap-2 transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full lg:hidden"
        )}
      >
        <div className="flex items-center justify-between px-2 py-3">
          <Logo />
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2 mb-1 px-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Workspace</div>
        <nav className="flex flex-col gap-1">
          {items.map((it) => {
            const active = path === it.url || (it.url !== "/dashboard" && path.startsWith(it.url));
            return (
              <Link
                key={it.url}
                to={it.url}
                onClick={() => { if (window.matchMedia("(max-width: 1023px)").matches) setOpen(false); }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                  active
                    ? "bg-gradient-primary text-white shadow-[0_0_20px_-8px_oklch(0.65_0.24_295/70%)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                <it.icon className="h-4 w-4" />
                <span>{it.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto glass rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-accent text-xs"><Sparkles className="h-4 w-4" /> Pro Tier</div>
          <p className="text-xs text-muted-foreground">Unlock unlimited AR projects & real-time collab.</p>
          <button className="w-full text-xs py-2 rounded-lg bg-gradient-primary text-white">Upgrade</button>
        </div>

        <div className="flex items-center justify-between px-2 pt-2">
          <Link to="/dashboard" className="text-muted-foreground hover:text-foreground p-2"><Settings className="h-4 w-4" /></Link>
          <button
            onClick={async () => { await signOut(); nav({ to: "/login" }); }}
            className="text-muted-foreground hover:text-destructive p-2"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>
    </>
  );
}
