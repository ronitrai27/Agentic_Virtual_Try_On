"use client";

import React, { useState } from "react";
import { authClient, signIn, signOut, useSession } from "@/lib/auth-client";
import { LogIn, LogOut, Loader2, Sparkles, User as UserIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function AuthButton({ className = "" }: { className?: string }) {
  const { data: session, isPending } = useSession();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signIn.social({
        provider: "google",
        callbackURL: "/home",
      });
    } catch (error) {
      console.error("Sign in error:", error);
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
      console.error("Sign out error:", error);
      setIsSigningOut(false);
    }
  };

  if (isPending) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 text-xs ${className}`}>
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  if (session?.user) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <Link
          href="/home"
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-700/60 transition-all text-xs text-zinc-200 font-medium group"
        >
          {session.user.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || "User"}
              className="w-6 h-6 rounded-full border border-purple-500/40 object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-[10px] font-bold text-purple-300">
              {session.user.name?.charAt(0).toUpperCase() || <UserIcon className="w-3 h-3" />}
            </div>
          )}
          <span className="max-w-[100px] truncate group-hover:text-purple-300 transition-colors">
            {session.user.name || session.user.email}
          </span>
        </Link>

        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-400 hover:text-rose-400 transition"
          title="Sign Out"
        >
          {isSigningOut ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleGoogleSignIn}
      disabled={isSigningIn}
      className={`relative inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-600/25 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {isSigningIn ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Signing in...</span>
        </>
      ) : (
        <>
          {/* Google "G" Icon */}
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.1-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
            />
          </svg>
          <span>Sign in with Google</span>
        </>
      )}
    </button>
  );
}
