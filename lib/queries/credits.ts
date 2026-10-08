import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const creditKeys = {
  all: ["user_credits"] as const,
  detail: (userId: string) => [...creditKeys.all, userId] as const,
};

// Client-side helper for stable persistent user ID
export function getStoredUserId(sessionUserId?: string | null): string {
  if (sessionUserId) return sessionUserId;
  if (typeof window === "undefined") return "guest_default";
  
  let guestId = localStorage.getItem("vot_guest_id");
  if (!guestId) {
    guestId = `guest_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
    localStorage.setItem("vot_guest_id", guestId);
  }
  return guestId;
}

export function useCreditsQuery(userId?: string | null) {
  const effectiveUserId = getStoredUserId(userId);

  return useQuery({
    queryKey: creditKeys.detail(effectiveUserId),
    queryFn: async (): Promise<number> => {
      const res = await fetch(`/api/credits?userId=${encodeURIComponent(effectiveUserId)}`);
      if (!res.ok) {
        throw new Error("Failed to fetch credits");
      }
      const data = await res.json();
      return typeof data.credits === "number" ? data.credits : 100;
    },
    staleTime: 1000 * 30, // 30s
  });
}

export function useDeductCreditsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      durationSeconds,
      mode,
    }: {
      userId?: string | null;
      durationSeconds: number;
      mode: "standard" | "fast";
    }) => {
      const effectiveUserId = getStoredUserId(userId);
      const res = await fetch("/api/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: effectiveUserId,
          durationSeconds,
          mode,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to deduct credits");
      }

      return await res.json();
    },
    onSuccess: (data, variables) => {
      const effectiveUserId = getStoredUserId(variables.userId);
      // Optimistically update query cache
      queryClient.setQueryData(
        creditKeys.detail(effectiveUserId),
        data.remainingCredits
      );
      queryClient.invalidateQueries({ queryKey: creditKeys.all });
    },
  });
}
