"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useSidebar } from "./SidebarContext";
import {
  Home,
  Wand2,
  Shirt,
  Compass,
  Plus,
  User as UserIcon,
  Crown,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

interface SidebarProps {
  children?: React.ReactNode;
  headerContent?: React.ReactNode;
}

export function Sidebar({ children, headerContent }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const navItems = [
    { label: "Home", href: "/home", icon: Home },
    { label: "Studio", href: "/home/studio", icon: Wand2 },
    { label: "Wardrobe", href: "/home/wardrobe", icon: Shirt },
    { label: "Discover", href: "/home/discover", icon: Compass },
  ];

  return (
    <aside
      className={`h-full border-r border-zinc-200 bg-neutral-50 flex flex-col justify-between shrink-0 select-none overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] z-30 ${
        isCollapsed ? "w-[72px]" : "w-60"
      }`}
    >
      {/* 1. Header & Navigation */}
      <div className="flex-1 p-3 overflow-y-auto overflow-x-hidden space-y-4">
        {/* Toggle Button & Header */}
        <div
          className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} px-1 mb-2`}
        >
          {!isCollapsed && (
            <span className="text-sm font-semibold uppercase tracking-wider ">
              Menu
            </span>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg  transition-colors cursor-pointer"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {headerContent}

        {/* Nav links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/home" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.label}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center ${
                  isCollapsed
                    ? "justify-center px-0 py-2.5"
                    : "gap-3 px-3 py-2.5"
                } rounded-xl text-sm font-medium transition-all group relative ${
                  isActive
                    ? "bg-linear-to-r from-white via-orange-300/30 to-orange-300 text-neutral-900 shadow-2xs font-semibold"
                    : "text-neutral-700 hover:bg-neutral-200/50 hover:text-neutral-900"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                    isActive ? "text-neutral-900" : "text-neutral-600"
                  }`}
                />

                {!isCollapsed && (
                  <span className="truncate transition-opacity duration-200">
                    {item.label}
                  </span>
                )}

                {/* Collapsed Tooltip Hover */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1 bg-neutral-900 text-white text-xs font-medium rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-lg">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
        {children}
      </div>

      {/* 2. Sidebar Footer */}
      <div className="p-3 bg-neutral-50/80 border-t border-zinc-200/60 space-y-3 font-inter">
        {/* Out of Credits Section */}
        {isCollapsed ? (
          /* Compact Collapsed Credit Crown */
          <div className="flex justify-center group relative">
            <button
              type="button"
              className="p-2.5 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-600 border border-orange-200/80 transition-colors shadow-2xs cursor-pointer"
              title="Purchase More Credits"
            >
              <Crown className="w-6 h-6 fill-orange-500 text-orange-600" />
            </button>
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-neutral-900 text-white text-base rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-lg">
              <p className="font-semibold">Out of Credits?</p>
              <p className="text-[10px] text-zinc-300">Top up studio credits</p>
            </div>
          </div>
        ) : (
          /* Expanded Full Credit Card */
          <div className="relative overflow-hidden rounded-xl p-4 bg-linear-to-br from-amber-500/10 via-orange-500/10 to-amber-600/15 border border-amber-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-base font-bold text-amber-950">
                <Crown className="w-6 h-6 text-amber-600 fill-amber-500" />
                <span>Out of Credits ?</span>
              </div>
            </div>
            <p className="text-[11px] text-amber-900/80 mb-3 leading-snug">
              Need more generations? Top up your studio credits anytime.
            </p>
            <button
              type="button"
              className="w-full py-1.5 px-3 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium text-xs rounded-lg shadow-2xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Purchase More Credits</span>
            </button>
          </div>
        )}

        {/* User profile card */}
        <div
          className={`flex items-center ${
            isCollapsed ? "justify-center p-1.5" : "justify-between p-2"
          } rounded-xl border border-zinc-200/80 bg-white gap-2 shadow-2xs`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className="w-7 h-7 rounded-full object-cover border border-zinc-200 shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-xs font-semibold text-zinc-700 shrink-0">
                {session?.user?.name?.charAt(0).toUpperCase() || (
                  <UserIcon className="w-3.5 h-3.5 text-zinc-600" />
                )}
              </div>
            )}
            {!isCollapsed && (
              <p className="text-xs font-medium text-zinc-900 truncate leading-none">
                {session?.user?.name || "User"}
              </p>
            )}
          </div>

          {!isCollapsed && (
            <div className="flex items-center gap-1 border border-neutral-200 bg-orange-300/80 py-1 px-2 rounded-md text-[10px] font-inter shrink-0">
              Credits: <span>100</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
