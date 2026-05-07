import type { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { Topbar } from "./Topbar";
import { RequireAuth } from "./RequireAuth";
import { SidebarProvider } from "./sidebar-context";

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <RequireAuth>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Topbar title={title} />
            <main className="flex-1 p-4 sm:p-6">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </RequireAuth>
  );
}
