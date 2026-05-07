import { Bell, Search } from "lucide-react";

export function Topbar({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-20 glass-strong border-b border-glass-border px-6 py-3 flex items-center gap-4">
      <h1 className="text-lg font-display font-semibold">{title}</h1>
      <div className="ml-auto flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 glass rounded-xl px-3 py-2 w-72">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input placeholder="Search projects, files…" className="bg-transparent outline-none text-sm w-full" />
        </div>
        <button className="relative glass rounded-xl p-2.5 hover:bg-white/10 transition">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent animate-pulse" />
        </button>
        <div className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center text-xs font-semibold">AR</div>
      </div>
    </header>
  );
}
