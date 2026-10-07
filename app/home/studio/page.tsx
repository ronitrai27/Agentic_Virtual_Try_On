"use client";

import { useEffect } from "react";
import MinimalTryOn from "@/app/studio/page";
import { useSidebar } from "@/components/SidebarContext";

export default function HomeStudioPage() {
  const { setIsCollapsed } = useSidebar();

  useEffect(() => {
    // Close sidebar smoothly when opening /home/studio
    setIsCollapsed(true);
  }, [setIsCollapsed]);

  return <MinimalTryOn />;
}
