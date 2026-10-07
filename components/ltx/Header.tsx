"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signIn, useSession } from "@/lib/auth-client";
import { User as UserIcon, Loader2 } from "lucide-react";

export const Header: React.FC = () => {
  const { data: session, isPending } = useSession();
  const [loading, setLoading] = useState(false);

  const handleTryItNow = async () => {
    try {
      setLoading(true);
      await signIn.social({
        provider: "google",
        callbackURL: "/callback",
      });
    } catch (err) {
      console.error("Sign in failed:", err);
      setLoading(false);
    }
  };

  return (
    <header className="stage-header" role="banner">
      <div className="header-left">
        <Link aria-label="Home" href="/" className="logo-link">
          <img
            src="/logo.svg"
            alt="Logo"
            className="h-7 sm:h-8 w-auto object-contain"
          />
        </Link>

        <nav className="meta" aria-label="Main Navigation">
          <a href="#use-cases" className="nav-link">
            Use Cases
          </a>
          <a href="#about" className="nav-link">
            About Us
          </a>
        </nav>
      </div>

      <div>
        {isPending ? (
          <div
            className="try-now-btn"
            style={{ opacity: 0.8, pointerEvents: "none" }}
          >
            <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
          </div>
        ) : session?.user ? (
          <Link
            href="/callback"
            className="try-now-btn"
            aria-label="Continue to Dashboard"
          >
            {session.user.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || "User avatar"}
                className="w-5.5 h-5.5 rounded-full object-cover border border-zinc-200"
              />
            ) : (
              <div className="w-5.5 h-5.5 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[10px] font-semibold text-zinc-700">
                {session.user.name?.charAt(0).toUpperCase() || (
                  <UserIcon className="w-3 h-3 text-zinc-600" />
                )}
              </div>
            )}
            <span>Continue</span>
          </Link>
        ) : (
          <button
            onClick={handleTryItNow}
            disabled={loading}
            className="try-now-btn"
            aria-label="Try VTOL FIT now"
          >
            {loading ? "Signing in..." : "Try it now"}
          </button>
        )}
      </div>
    </header>
  );
};
