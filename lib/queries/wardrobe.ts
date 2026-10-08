import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Domain-shaped query keys for Wardrobe resources
 */
export const wardrobeKeys = {
  all: ["wardrobe"] as const,
  lists: () => [...wardrobeKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) => [...wardrobeKeys.lists(), { filters }] as const,
  details: () => [...wardrobeKeys.all, "detail"] as const,
  detail: (id: string) => [...wardrobeKeys.details(), id] as const,
};

export interface WardrobeItem {
  id: string;
  title: string;
  type: string;
  image_data: string;
  created_at: string;
}

export interface SaveWardrobeInput {
  title?: string;
  type?: string;
  image_data: string;
}

/**
 * Colocated server-state fetcher
 */
export async function fetchWardrobeItems(): Promise<WardrobeItem[]> {
  const res = await fetch("/api/wardrobe");
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to fetch wardrobe items" }));
    throw new Error(err.error || "Failed to fetch wardrobe items");
  }
  const data = await res.json();
  return data.items || [];
}

/**
 * Colocated server-state writer
 */
export async function saveWardrobeItem(input: SaveWardrobeInput): Promise<WardrobeItem> {
  const res = await fetch("/api/wardrobe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: input.title || "Prompt generated",
      type: input.type || "prompt",
      image_data: input.image_data,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Database save failed" }));
    throw new Error(err.error || "Database save failed");
  }

  const data = await res.json();
  return data.item;
}

/**
 * Custom hook to read and cache wardrobe server state
 */
export function useWardrobeQuery() {
  return useQuery({
    queryKey: wardrobeKeys.lists(),
    queryFn: fetchWardrobeItems,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Custom hook for wardrobe mutations with optimistic cache updates and targeted invalidations
 */
export function useSaveWardrobeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveWardrobeItem,
    onSuccess: (savedItem) => {
      // Direct cache update for instant UI feedback
      queryClient.setQueryData<WardrobeItem[]>(wardrobeKeys.lists(), (previousItems = []) => [
        savedItem,
        ...previousItems.filter((item) => item.id !== savedItem.id),
      ]);
      // Targeted invalidation to synchronize with Neon Postgres
      queryClient.invalidateQueries({ queryKey: wardrobeKeys.all });
    },
  });
}

/**
 * Colocated server-state deleter (supports batch deletion)
 */
export async function deleteWardrobeItems(ids: string[]): Promise<void> {
  const res = await fetch("/api/wardrobe", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to delete items" }));
    throw new Error(err.error || "Failed to delete wardrobe items");
  }
}

/**
 * Custom hook for batch or single deletion of wardrobe items
 */
export function useDeleteWardrobeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWardrobeItems,
    onMutate: async (deletedIds) => {
      await queryClient.cancelQueries({ queryKey: wardrobeKeys.lists() });
      const previousItems = queryClient.getQueryData<WardrobeItem[]>(wardrobeKeys.lists());

      if (previousItems) {
        queryClient.setQueryData<WardrobeItem[]>(
          wardrobeKeys.lists(),
          previousItems.filter((item) => !deletedIds.includes(item.id))
        );
      }

      return { previousItems };
    },
    onError: (_err, _deletedIds, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(wardrobeKeys.lists(), context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: wardrobeKeys.all });
    },
  });
}
