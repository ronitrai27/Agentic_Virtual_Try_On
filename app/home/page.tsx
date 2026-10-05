"use client";

import React, { useState } from "react";
import { useSession, signOut, signIn } from "@/lib/auth-client";
import { Loader2, LogOut, User as UserIcon } from "lucide-react";

export default function HomePage() {
  const { data: session, isPending } = useSession();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

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

  if (isPending) {
    return (
      <main
        style={{
          minHeight: "100vh",
          backgroundColor: "#ffffff",
          color: "#18181b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#ffffff",
        color: "#18181b",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
      className="min-h-screen bg-white text-zinc-900 flex flex-col items-center justify-center p-6"
    >
      {session?.user ? (
        <div
          style={{
            width: "100%",
            maxWidth: "380px",
            borderRadius: "16px",
            backgroundColor: "#ffffff",
            border: "1px solid #e4e4e7",
            padding: "32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          }}
          className="w-full max-w-sm rounded-2xl bg-white border border-zinc-200 p-8 flex flex-col items-center text-center shadow-sm"
        >
          {session.user.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || "User"}
              style={{ width: "80px", height: "80px", borderRadius: "9999px", marginBottom: "16px", objectFit: "cover", border: "1px solid #e4e4e7" }}
            />
          ) : (
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "9999px",
                backgroundColor: "#f4f4f5",
                border: "1px solid #e4e4e7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                fontWeight: "bold",
                color: "#52525b",
                marginBottom: "16px",
              }}
            >
              {session.user.name?.charAt(0).toUpperCase() || <UserIcon className="w-8 h-8" />}
            </div>
          )}

          <h1 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "4px", color: "#09090b" }}>
            {session.user.name || "User"}
          </h1>
          <p style={{ fontSize: "14px", color: "#71717a", marginBottom: "24px", fontFamily: "monospace" }}>
            {session.user.email}
          </p>

          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px 16px",
              borderRadius: "12px",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              fontWeight: "500",
              fontSize: "14px",
              cursor: isSigningOut ? "not-allowed" : "pointer",
            }}
          >
            {isSigningOut ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            <span>Log Out</span>
          </button>
        </div>
      ) : (
        <div
          style={{
            width: "100%",
            maxWidth: "380px",
            borderRadius: "16px",
            backgroundColor: "#ffffff",
            border: "1px solid #e4e4e7",
            padding: "32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          }}
        >
          <h1 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "8px", color: "#09090b" }}>Welcome</h1>
          <p style={{ fontSize: "14px", color: "#71717a", marginBottom: "24px" }}>
            Sign in with your Google account to continue.
          </p>

          <button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              padding: "12px 20px",
              borderRadius: "12px",
              backgroundColor: "#18181b",
              color: "#ffffff",
              fontWeight: "600",
              fontSize: "14px",
              border: "none",
              cursor: isSigningIn ? "not-allowed" : "pointer",
            }}
          >
            {isSigningIn ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            )}
            <span>Sign in with Google</span>
          </button>
        </div>
      )}
    </main>
  );
}
