"use client";

import React from "react";
import { useSession } from "@/lib/auth-client";
import { User as UserIcon } from "lucide-react";

interface SidebarProps {
  children?: React.ReactNode;
  headerContent?: React.ReactNode;
}

export function Sidebar({ children, headerContent }: SidebarProps) {
  const { data: session } = useSession();

  return (
    <aside className="w-60 h-[calc(100vh-3.5rem)] border-r border-zinc-200 bg-white flex flex-col justify-between shrink-0 select-none sticky top-14">
      {/* 1. Sidebar Header */}
      <div className="h-11 px-3 border-b border-zinc-100 flex items-center justify-between text-xs text-zinc-400 font-medium">
        {headerContent || (
          <span className="tracking-tight uppercase text-[10px] font-semibold text-zinc-400"></span>
        )}
      </div>

      {/* 2. Sidebar Content */}
      <div className="flex-1 p-3 overflow-y-auto">{children}</div>

      {/* 3. Sidebar Footer */}
      <div className="p-3 border-t border-zinc-100 bg-neutral-100">
        <div className="flex items-center justify-between p-2 rounded-lg border border-zinc-200 bg-white hover:border-zinc-300 transition-colors">
          <div className="flex items-center gap-2 min-w-0">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className="w-6.5 h-6.5 rounded-full object-cover border border-zinc-200"
              />
            ) : (
              <div className="w-6.5 h-6.5 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[11px] font-semibold text-zinc-700">
                {session?.user?.name?.charAt(0).toUpperCase() || (
                  <UserIcon className="w-3 h-3" />
                )}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-900 truncate max-w-[80px] leading-none">
                {session?.user?.name || "User"}
              </p>
            </div>
          </div>

          {/* Minimal 100 Credits Badge */}
          <span className="px-2 py-0.5 text-[11px] shrink-0 font-inter font-medium bg-orange-300 border border-zinc-200 rounded-md">
            Credits: 100
          </span>
        </div>
      </div>
    </aside>
  );
}
