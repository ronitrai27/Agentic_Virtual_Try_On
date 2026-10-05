"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import OnboardCard from "@/components/OnboardCard";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!isPending) {
      if (session?.user) {
        // Wait 5 seconds on callback before redirecting to /home
        const timer = setTimeout(() => {
          setRedirecting(true);
          router.replace("/home");
        }, 5000);

        return () => clearTimeout(timer);
      } else {
        router.replace("/");
      }
    }
  }, [session, isPending, router]);

  const fullName = session?.user?.name || "User";
  const firstName = fullName.split(" ")[0];
  const email = session?.user?.email || "Verifying credentials...";

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
      }}
      className="min-h-screen bg-white text-zinc-900 flex flex-col items-center justify-center p-6"
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          width: "100%",
          maxWidth: "360px",
        }}
        className="flex flex-col items-center text-center max-w-sm w-full"
      >
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "700",
            marginBottom: "4px",
            color: "#09090b",
          }}
          className="text-2xl font-bold tracking-tight text-zinc-900 mb-1"
        >
          Welcome, {firstName}
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "#71717a",
            marginBottom: "32px",
          }}
          className="text-sm text-neutral-500 mb-8"
        >
          {email}
        </p>

        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            margin: "16px 0",
          }}
        >
          <OnboardCard
            duration={4000}
            step1="Google Account Verified"
            step2="Preparing Workspace"
            step3="Launching Studio"
          />
        </div>

        <p
          style={{ fontSize: "12px", color: "#a1a1aa", marginTop: "24px" }}
          className="text-xs text-neutral-900! mt-6"
        >
          {redirecting ? "Redirecting to /home..." : "Almost ready..."}
        </p>
      </div>
    </main>
  );
}
