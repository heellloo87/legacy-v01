import { Bell, Search, Menu, MessageSquare, TrendingUp, Activity, Check } from "lucide-react";
import { useSidebar } from "./sidebar-context";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/lib/auth";
import { useNotifications, useMarkRead, useMarkAllRead } from "@/hooks/useNotifications.ts";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  comment:  <MessageSquare className="h-3.5 w-3.5 text-accent" />,
  progress: <TrendingUp    className="h-3.5 w-3.5 text-emerald-400" />,
  status:   <Activity      className="h-3.5 w-3.5 text-amber-400" />,
};

export function Topbar({ title }: { title: string }) {
  const { toggle } = useSidebar();
  const { user }   = useAuth();

  const [open, setOpen]       = useState(false);
  const bellRef               = useRef<HTMLButtonElement>(null);
  const dropdownRef           = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });

  const { data: notifications = [] } = useNotifications(user?.id);
  const markRead    = useMarkRead();
  const markAllRead = useMarkAllRead(user?.id);

  const unread = notifications.filter((n) => !n.read).length;

  // Position dropdown below the bell button
  const openDropdown = () => {
    if (bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect();
      setDropdownPos({
        top:   rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen((v) => !v);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        bellRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "AR";

  return (
    <>
      <header className="sticky top-0 z-20 glass-strong border-b border-glass-border px-4 sm:px-6 py-3 flex items-center gap-3">
        <button
          onClick={toggle}
          className="glass rounded-xl p-2.5 hover:bg-white/10 transition"
          aria-label="Toggle menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <h1 className="text-lg font-display font-semibold truncate">{title}</h1>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {/* Search */}
          <div className="hidden md:flex items-center gap-2 glass rounded-xl px-3 py-2 w-72">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input placeholder="Search projects, files…" className="bg-transparent outline-none text-sm w-full" />
          </div>

          {/* Bell — portals the dropdown so z-index never gets clipped */}
          <button
            ref={bellRef}
            onClick={openDropdown}
            className="relative glass rounded-xl p-2.5 hover:bg-white/10 transition"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-accent text-[9px] font-bold grid place-items-center leading-none">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          <div className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center text-xs font-semibold">
            {initials}
          </div>
        </div>
      </header>

      {/* Dropdown portalled to body so sticky/overflow never clips it */}
      {open && createPortal(
        <div
          ref={dropdownRef}
          style={{ position: "fixed", top: dropdownPos.top, right: dropdownPos.right, zIndex: 9999 }}
          className="w-80 glass-strong border border-glass-border rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-glass-border">
            <span className="text-sm font-semibold">Notifications</span>
            {unread > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="flex items-center gap-1 text-[10px] text-accent hover:text-accent/80 transition"
              >
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-glass-border">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => { if (!n.read) markRead.mutate(n.id); }}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition ${n.read ? "opacity-50" : ""}`}
                >
                  <div className="mt-0.5 h-7 w-7 rounded-full glass grid place-items-center shrink-0">
                    {TYPE_ICON[n.type] ?? <Bell className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-snug">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read && (
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-accent shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
