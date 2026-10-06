"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import {
  Home,
  Wand2,
  Shirt,
  Compass,
  Zap,
  Plus,
  User as UserIcon,
} from "lucide-react";

interface SidebarProps {
  children?: React.ReactNode;
  headerContent?: React.ReactNode;
}

export function Sidebar({ children, headerContent }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { label: "Home", href: "/home", icon: Home },
    { label: "Studio", href: "/home/studio", icon: Wand2 },
    { label: "Wardrobe", href: "/home/wardrobe", icon: Shirt },
    { label: "Discover", href: "/home/discover", icon: Compass },
  ];

  return (
    <aside className="w-60 h-[calc(100vh-3.5rem)] border-r border-zinc-200 bg-neutral-50 flex flex-col justify-between shrink-0 select-none sticky top-14">
      {/* 1. Header Content & Navigations */}
      <div className="flex-1 mt-6 p-3 overflow-y-auto space-y-4">
        {headerContent}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/home" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-linear-to-r from-white via-orange-300/30 to-orange-300 text-neutral-800 shadow-xs"
                    : "text-neutral-800! hover:bg-zinc-100"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-neutral-800" : "text-neutral-800"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        {children}
      </div>

      {/* 2. Sidebar Footer */}
      <div className="p-3 border-t border-zinc-100 bg-zinc-50/50 space-y-3">
        {/* Purchase More Credits Card */}
        <div className="relative overflow-hidden rounded-2xl p-3.5 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-amber-600/15 border border-amber-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
              <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              <span>Credits Balance</span>
            </div>
            <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-500 text-white rounded-full shadow-2xs">
              100
            </span>
          </div>
          <p className="text-[11px] text-amber-900/80 mb-3 leading-tight">
            Need more generations? Top up your studio credits anytime.
          </p>
          <button
            type="button"
            className="w-full py-2 px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Purchase More Credits
          </button>
        </div>

        {/* User profile card */}
        <div className="flex items-center justify-between p-2 rounded-xl border border-zinc-200/80 bg-white">
          <div className="flex items-center gap-2 min-w-0">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className="w-7 h-7 rounded-full object-cover border border-zinc-200"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-xs font-semibold text-zinc-700">
                {session?.user?.name?.charAt(0).toUpperCase() || (
                  <UserIcon className="w-3.5 h-3.5 text-zinc-600" />
                )}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-900 truncate leading-none">
                {session?.user?.name || "User"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
