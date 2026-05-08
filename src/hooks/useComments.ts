
// Handles comments scoped to a specific project + version

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Comment = {
  id: string;
  project_id: string;
  user_id: string;
  text: string;
  version: string;
  created_at: string;
  profiles?: { full_name: string | null } | null;
};

/**
 * Fetch comments for a specific project + version.
 * Pass version="all" to get all comments across all versions.
 */
export function useComments(
  projectId: string | undefined,
  version: string = "all"
) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["comments", projectId, version],
    queryFn: async () => {
      let q = supabase
        .from("comments")
        .select("*, profiles(full_name)")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: true });

      // Filter by version unless "all" is requested
      if (version !== "all") {
        q = q.eq("version", version);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as Comment[];
    },
    enabled: !!projectId,
  });

  // Realtime — new comment on this project → refetch
  useEffect(() => {
    if (!projectId) return;
    const channel = supabase
      .channel(`comments:${projectId}:${version}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["comments", projectId] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [projectId, version, qc]);

  return query;
}

/**
 * Add a comment to a specific project + version.
 */
export function useAddComment(
  projectId: string | undefined,
  version: string,
  userId: string | undefined
) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (text: string) => {
      if (!projectId || !userId) throw new Error("Not ready");
      const { error } = await supabase.from("comments").insert({
        project_id: projectId,
        user_id: userId,
        text,
        version,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate both version-specific and "all" queries
      qc.invalidateQueries({ queryKey: ["comments", projectId] });
    },
  });
}

/**
 * Get comment counts grouped by version for a project.
 * Useful for showing badges on version history.
 */
export function useCommentCountsByVersion(projectId: string | undefined) {
  return useQuery({
    queryKey: ["comment-counts", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("version")
        .eq("project_id", projectId!);
      if (error) throw error;

      // Count per version
      const counts: Record<string, number> = {};
      data.forEach((c) => {
        counts[c.version] = (counts[c.version] ?? 0) + 1;
      });
      return counts;
    },
    enabled: !!projectId,
  });
}
