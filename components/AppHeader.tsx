"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut, signIn } from "@/lib/auth-client";
import { useSidebar } from "./SidebarContext";
import {
  Loader2,
  LogOut,
  ChevronDown,
  ChevronRight,
  Sparkles,
  User as UserIcon,
  LucideALargeSmall,
  Drama,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

export function AppHeader() {
  const { data: session, isPending } = useSession();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDropdownOpen]);

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signIn.social({
        provider: "google",
        callbackURL: "/callback",
      });
    } catch (error) {
      console.error("Sign in failed:", error);
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = "/";
          },
        },
      });
    } catch (error) {
      console.error("Sign out failed:", error);
      setIsSigningOut(false);
    }
  };

  // Generate dynamic breadcrumbs from pathname
  const segments = pathname.split("/").filter(Boolean);
  // Filter and format segments after root or 'home'
  const breadcrumbItems = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label = segment.charAt(0).toUpperCase() + segment.slice(1);
    const isLast = index === segments.length - 1;

    return { label, href, isLast };
  });

  return (
    <header className="w-full h-16 border-b border-zinc-200 bg-neutral-50! sticky top-0 z-50">
      <div className="w-full h-full px-4 sm:px-6 flex items-center justify-between">
        {/* Left Side: Logo & Dynamic Breadcrumbs */}
        <div className="flex items-center gap-3">
          <Link
            href="/home"
            className="inline-flex items-center focus:outline-none"
          >
            <img
              src="/logo.svg"
              alt="Logo"
              className="h-8 w-auto object-contain"
            />
          </Link>

          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/60 transition-colors cursor-pointer"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>

          <div className="h-4 w-px bg-zinc-300 ml-1" />

          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs"
          >
            {breadcrumbItems.length > 0 ? (
              breadcrumbItems.map((item, idx) => (
                <React.Fragment key={item.href}>
                  {idx > 0 && (
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                  )}
                  {item.isLast ? (
                    <span className="font-medium text-zinc-900 select-none">
                      {item.label}
                    </span>
                  ) : (
                    <Link
                      href={item.href}
                      className="text-zinc-500 hover:text-zinc-900 transition-colors"
                    >
                      {item.label}
                    </Link>
                  )}
                </React.Fragment>
              ))
            ) : (
              <span className="font-medium text-zinc-900 select-none">
                Home
              </span>
            )}
          </nav>
        </div>

        {/* Right Side: Studio Button & User Dropdown */}
        <div className="flex items-center gap-3">
          {/* Studio Button */}
          <Link
            href="/studio"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-orange-300 hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-lg transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-zinc-200"
          >
            <Drama className="w-4 h-4" />
            <span>Studio</span>
          </Link>

          {/* Profile Dropdown */}
          {isPending ? (
            <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center">
              <Loader2 className="w-3.5 h-3.5 text-zinc-400 animate-spin" />
            </div>
          ) : session?.user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1 sm:pr-2.5 sm:pl-1 rounded-full sm:rounded-lg border border-transparent hover:border-zinc-200 hover:bg-zinc-50 transition-all text-xs font-medium text-zinc-800 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-zinc-200"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User avatar"}
                    className="w-7 h-7 rounded-full object-cover border border-zinc-200"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-xs font-semibold text-zinc-600">
                    {session.user.name?.charAt(0).toUpperCase() || (
                      <UserIcon className="w-3.5 h-3.5" />
                    )}
                  </div>
                )}

                <span className="text-xs font-medium text-zinc-800 hidden sm:inline-block max-w-[120px] truncate">
                  {session.user.name || "Account"}
                </span>

                <ChevronDown
                  className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-150 ${
                    isDropdownOpen ? "rotate-180 text-zinc-600" : ""
                  }`}
                />
              </button>

              {/* Dropdown Popover */}
              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-zinc-200 bg-white p-1 shadow-[0_10px_30px_rgba(0,0,0,0.08)] z-50">
                  <div className="px-3 py-2 border-b border-zinc-100 mb-1">
                    <p className="text-xs font-semibold text-zinc-900 truncate">
                      {session.user.name || "User"}
                    </p>
                    <p className="text-[11px] text-zinc-500 font-mono truncate mt-0.5">
                      {session.user.email}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100/70 rounded-md transition-colors cursor-pointer text-left font-medium disabled:opacity-50"
                  >
                    {isSigningOut ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-500" />
                    ) : (
                      <LogOut className="w-3.5 h-3.5 text-zinc-500" />
                    )}
                    <span>Log out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-900 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-lg transition-colors cursor-pointer"
            >
              {isSigningIn ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-500" />
              ) : null}
              <span>Sign in</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
