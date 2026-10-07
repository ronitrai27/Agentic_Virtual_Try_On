import React from "react";
import { AppHeader } from "@/components/AppHeader";
import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider } from "@/components/SidebarContext";
import { ToastProvider } from "@/components/Toast";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <SidebarProvider>
        <div className="h-screen bg-white text-zinc-900 flex flex-col font-sans selection:bg-zinc-100 overflow-hidden">
          <AppHeader />
          <div className="flex flex-1 w-full overflow-hidden">
            <Sidebar />
            <main className="flex-1 bg-white overflow-y-auto h-full">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ToastProvider>
  );
}
