import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Ctx = { open: boolean; setOpen: (v: boolean) => void; toggle: () => void };
const SidebarCtx = createContext<Ctx | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);

  // Default: closed on mobile, open on desktop
  useEffect(() => {
    if (typeof window === "undefined") return;
    setOpen(window.matchMedia("(min-width: 1024px)").matches);
  }, []);

  return (
    <SidebarCtx.Provider value={{ open, setOpen, toggle: () => setOpen(!open) }}>
      {children}
    </SidebarCtx.Provider>
  );
}

export function useSidebar() {
  const v = useContext(SidebarCtx);
  if (!v) throw new Error("useSidebar must be used inside SidebarProvider");
  return v;
}
