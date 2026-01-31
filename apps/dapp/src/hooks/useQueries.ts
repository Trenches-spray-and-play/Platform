"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Campaign, CampaignSchema, UserSchema, Position, PositionSchema } from "@/lib/schemas";
import { validateApiResponse } from "@/lib/validation";
import { useUIStore } from "@/store/uiStore";
import { z } from "zod";

type User = z.infer<typeof UserSchema>;

// ============================================
// Query Keys
// ============================================
export const queryKeys = {
    user: ["user"] as const,
    positions: ["positions"] as const,
    campaigns: ["campaigns"] as const,
    trenches: ["trenches"] as const,
    tasks: ["tasks"] as const,
    raids: ["raids"] as const,
    contentCampaigns: ["contentCampaigns"] as const,
    submissions: ["submissions"] as const,
    deposits: (userId?: string) => ["deposits", userId] as const,
    campaign: (id: string) => ["campaign", id] as const,
    sprayEntry: (id: string) => ["sprayEntry", id] as const,
    userTasks: ["userTasks"] as const,
    userRaids: ["userRaids"] as const,
};



// ============================================
// Fetchers
// ============================================
async function fetchUser(): Promise<User | null> {
    const res = await fetch("/api/user");
    return validateApiResponse(UserSchema, res);
}

async function fetchPositions(): Promise<Position[]> {
    const res = await fetch("/api/user/positions");
    return validateApiResponse(z.array(PositionSchema), res).then(data => data || []);
}

async function fetchCampaigns(): Promise<Campaign[]> {
    const res = await fetch("/api/trenches");
    const data = await validateApiResponse(z.array(z.any()), res); // API returns trench groups

    // Flatten trench groups
    return (
        data?.flatMap((group: any) =>
            group.campaigns.map((c: any) => ({
                ...c,
                level: group.level,
                entryRange: group.entryRange,
            }))
        ) || []
    );
}

async function fetchTasks(): Promise<any[]> {
    const res = await fetch("/api/tasks");
    if (!res.ok) throw new Error("Failed to fetch tasks");
    const data = await res.json();
    return data.data || [];
}

async function fetchRaids(): Promise<any[]> {
    const res = await fetch("/api/raids");
    if (!res.ok) throw new Error("Failed to fetch raids");
    const data = await res.json();
    return data.data || [];
}

async function fetchContentCampaigns(): Promise<any[]> {
    const res = await fetch("/api/content-campaigns");
    if (!res.ok) throw new Error("Failed to fetch content campaigns");
    const data = await res.json();
    return data.data || [];
}

async function fetchSubmissions(): Promise<any[]> {
    const res = await fetch("/api/user/content-submissions");
    if (!res.ok) throw new Error("Failed to fetch submissions");
    const data = await res.json();
    return data.data || [];
}

async function fetchUserTasks(): Promise<any[]> {
    const res = await fetch("/api/user/tasks");
    if (!res.ok) throw new Error("Failed to fetch user tasks");
    const data = await res.json();
    return data.data || [];
}

async function fetchUserRaids(): Promise<any[]> {
    const res = await fetch("/api/user/raids");
    if (!res.ok) throw new Error("Failed to fetch user raids");
    const data = await res.json();
    return data.data || [];
}

// ============================================
// Hooks
// ============================================

/**
 * Fetch and cache the current user profile.
 */
export function useUser(initialData?: User | null) {
    return useQuery({
        queryKey: queryKeys.user,
        queryFn: fetchUser,
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
        initialData: initialData || undefined,
    });
}

/**
 * Fetch and cache the user's positions.
 */
export function usePositions(initialData?: Position[]) {
    return useQuery({
        queryKey: queryKeys.positions,
        queryFn: fetchPositions,
        staleTime: 30 * 1000, // 30 seconds
        initialData: initialData || undefined,
    });
}

/**
 * Fetch and cache all available campaigns.
 */
export function useCampaigns() {
    return useQuery({
        queryKey: queryKeys.campaigns,
        queryFn: fetchCampaigns,
        staleTime: 5 * 60 * 1000, // 5 minutes (campaigns change infrequently)
    });
}

/**
 * Fetch and cache all active tasks.
 */
export function useTasks() {
    return useQuery({
        queryKey: queryKeys.tasks,
        queryFn: fetchTasks,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Mutation to update current user profile (e.g. wallets).
 */
export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (updateData: any) => {
            const res = await fetch("/api/user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updateData),
            });
            if (!res.ok) throw new Error("Failed to update user");
            return res.json();
        },
        onSuccess: (data) => {
            if (data.success) {
                queryClient.setQueryData(queryKeys.user, data.data);
            } else {
                queryClient.invalidateQueries({ queryKey: queryKeys.user });
            }
        },
    });
}

export function useRaids() {
    return useQuery({
        queryKey: queryKeys.raids,
        queryFn: fetchRaids,
        staleTime: 5 * 60 * 1000,
    });
}

export function useContentCampaigns() {
    return useQuery({
        queryKey: queryKeys.contentCampaigns,
        queryFn: fetchContentCampaigns,
        staleTime: 5 * 60 * 1000,
    });
}

export function useSubmissions() {
    return useQuery({
        queryKey: queryKeys.submissions,
        queryFn: fetchSubmissions,
        staleTime: 1 * 60 * 1000,
    });
}

export function useSubmitContent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (submitData: { campaignId: string; url: string; platform: string }) => {
            const res = await fetch("/api/user/content-submissions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(submitData),
            });
            if (!res.ok) throw new Error("Failed to submit content");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.submissions });
        },
    });
}

export function useUserTasks() {
    return useQuery({
        queryKey: queryKeys.userTasks,
        queryFn: fetchUserTasks,
        staleTime: 60 * 1000,
    });
}

export function useUserRaids() {
    return useQuery({
        queryKey: queryKeys.userRaids,
        queryFn: fetchUserRaids,
        staleTime: 60 * 1000,
    });
}

/**
 * Fetch a single campaign by ID.
 */
export function useCampaign(id: string) {
    const { data: campaigns, ...rest } = useCampaigns();
    const campaign = campaigns?.find((c) => c.id === id);
    return { data: campaign, ...rest };
}

/**
 * Mutation for the full spray flow: create -> finalize -> optional auto-boost.
 */
export function useApplySpray() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            trenchId,
            amount,
            level,
            useAutoBoost,
        }: {
            trenchId: string;
            amount: number;
            level: string;
            useAutoBoost?: boolean;
        }) => {
            // Step 1: Create spray entry
            const sprayRes = await fetch("/api/spray", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ trenchId, amount, level }),
            });
            const sprayData = await sprayRes.json();
            if (!sprayRes.ok) throw new Error(sprayData.error || "Failed to create spray entry");

            const sprayEntryId = sprayData.data.sprayEntryId;

            // Step 2: Finalize
            const finalizeRes = await fetch("/api/spray/finalize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sprayEntryId }),
            });
            const finalizeData = await finalizeRes.json();
            if (!finalizeRes.ok) {
                if (finalizeData.remainingTasks) {
                    throw { type: "TASKS_REQUIRED", remaining: finalizeData.remainingTasks };
                }
                throw new Error(finalizeData.error || "Failed to finalize entry");
            }

            // Step 3: Optional Auto-Boost
            if (useAutoBoost && finalizeData.data?.participantId) {
                try {
                    await fetch(`/api/user/positions/${finalizeData.data.participantId}/auto-boost`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ enabled: true }),
                    });
                } catch (e) {
                    console.error("Auto-boost failed:", e);
                }
            }

            return finalizeData.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.user });
            queryClient.invalidateQueries({ queryKey: queryKeys.positions });
        },
    });
}

/**
 * Hook for custom cache invalidation.
 */
export function useInvalidateQueries() {
    const queryClient = useQueryClient();

    return {
        invalidateUser: () => queryClient.invalidateQueries({ queryKey: queryKeys.user }),
        invalidatePositions: () => queryClient.invalidateQueries({ queryKey: queryKeys.positions }),
        invalidateCampaigns: () => queryClient.invalidateQueries({ queryKey: queryKeys.campaigns }),
        invalidateTasks: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks }),
        invalidateRaids: () => queryClient.invalidateQueries({ queryKey: queryKeys.raids }),
        invalidateContent: () => queryClient.invalidateQueries({ queryKey: queryKeys.contentCampaigns }),
        invalidateSubmissions: () => queryClient.invalidateQueries({ queryKey: queryKeys.submissions }),
        invalidateUserTasks: () => queryClient.invalidateQueries({ queryKey: queryKeys.userTasks }),
        invalidateUserRaids: () => queryClient.invalidateQueries({ queryKey: queryKeys.userRaids }),
        invalidateAll: () => queryClient.invalidateQueries(),
    };
}
/**
 * Mutation to complete a task.
 */
export function useCompleteTask() {
    const queryClient = useQueryClient();
    const addToast = useUIStore((state) => state.addToast);

    return useMutation({
        mutationFn: async ({ taskId, sprayEntryId }: { taskId: string; sprayEntryId?: string }) => {
            const res = await fetch("/api/user/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ taskId, sprayEntryId }),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to complete task");
            }
            return res.json();
        },
        onSuccess: (data) => {
            addToast(`Task completed! +${data.reward || 0} BP`, "success");
            queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
            queryClient.invalidateQueries({ queryKey: queryKeys.user }); // Award BP
        },
        onError: (error: Error) => {
            addToast(error.message, "error");
        },
    });
}

/**
 * Mutation to complete a raid.
 */
export function useCompleteRaid() {
    const queryClient = useQueryClient();
    const addToast = useUIStore((state) => state.addToast);

    return useMutation({
        mutationFn: async (raidId: string) => {
            const res = await fetch("/api/user/raids", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ raidId }),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to complete raid");
            }
            return res.json();
        },
        onSuccess: (data) => {
            addToast(`Raid completed! +${data.bpAwarded || 0} BP`, "success");
            queryClient.invalidateQueries({ queryKey: queryKeys.raids });
            queryClient.invalidateQueries({ queryKey: queryKeys.user }); // Award BP
        },
        onError: (error: Error) => {
            addToast(error.message, "error");
        },
    });
}
