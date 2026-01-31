"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Campaign, User, UserPosition } from "@/lib/types";
import { useUIStore } from "@/store/uiStore";

// Lazy import Zod validation helpers only when needed
const loadValidation = async () => {
    const { UserSchema, UserPositionSchema } = await import("@/lib/schemas");
    const { validateApiResponse } = await import("@/lib/validation");
    return { UserSchema, UserPositionSchema, validateApiResponse };
};

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
    if (!res.ok) throw new Error("Failed to fetch user");
    const data = await res.json();
    return data.data || null;
}

async function fetchPositions(): Promise<UserPosition[]> {
    const res = await fetch("/api/user/positions");
    if (!res.ok) throw new Error("Failed to fetch positions");
    const data = await res.json();
    return data.data || [];
}

async function fetchCampaigns(): Promise<Campaign[]> {
    const res = await fetch("/api/trenches");
    if (!res.ok) throw new Error("Failed to fetch campaigns");
    const data = await res.json();

    // Flatten trench groups
    return (
        data.data?.flatMap((group: any) =>
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

async function fetchDeposits(userId?: string): Promise<any[]> {
    const url = userId ? `/api/deposits?userId=${userId}` : "/api/deposits";
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch deposits");
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
// Query Hooks
// ============================================
export function useUser(initialData?: User | null) {
    return useQuery({
        queryKey: queryKeys.user,
        queryFn: fetchUser,
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
        initialData: initialData || undefined,
    });
}

export function usePositions(initialData?: UserPosition[]) {
    return useQuery({
        queryKey: queryKeys.positions,
        queryFn: fetchPositions,
        staleTime: 30 * 1000, // 30 seconds
        initialData: initialData || undefined,
    });
}

export function useCampaigns() {
    return useQuery({
        queryKey: queryKeys.campaigns,
        queryFn: fetchCampaigns,
        staleTime: 5 * 60 * 1000, // 5 minutes (campaigns change infrequently)
    });
}

export function useTasks() {
    return useQuery({
        queryKey: queryKeys.tasks,
        queryFn: fetchTasks,
        staleTime: 5 * 60 * 1000, // 5 minutes
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

export function useDeposits(userId?: string) {
    return useQuery({
        queryKey: queryKeys.deposits(userId),
        queryFn: () => fetchDeposits(userId),
        staleTime: 30 * 1000,
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

// ============================================
// Mutation Hooks
// ============================================
export function useUpdateUser() {
    const queryClient = useQueryClient();
    const addToast = useUIStore((state) => state.addToast);

    return useMutation({
        mutationFn: async (data: { handle?: string; walletEvm?: string; walletSol?: string }) => {
            const res = await fetch("/api/user", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to update user");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.user });
            addToast("Profile updated successfully", "success");
        },
        onError: (error: Error) => {
            addToast(error.message || "Failed to update profile", "error");
        },
    });
}

export function useSpray() {
    const queryClient = useQueryClient();
    const addToast = useUIStore((state) => state.addToast);

    return useMutation({
        mutationFn: async (data: { trenchId: string; amount: number; level: string }) => {
            const res = await fetch("/api/spray", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Spray failed");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.positions });
            queryClient.invalidateQueries({ queryKey: queryKeys.user });
            addToast("Spray successful!", "success");
        },
        onError: (error: Error) => {
            addToast(error.message || "Spray failed", "error");
        },
    });
}

export function useCompleteTask() {
    const queryClient = useQueryClient();
    const addToast = useUIStore((state) => state.addToast);

    return useMutation({
        mutationFn: async ({ taskId }: { taskId: string }) => {
            const res = await fetch(`/api/tasks/${taskId}/complete`, {
                method: "POST",
            });
            if (!res.ok) throw new Error("Failed to complete task");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.userTasks });
            queryClient.invalidateQueries({ queryKey: queryKeys.user });
            addToast("Task completed!", "success");
        },
        onError: (error: Error) => {
            addToast(error.message || "Failed to complete task", "error");
        },
    });
}

export function useCompleteRaid() {
    const queryClient = useQueryClient();
    const addToast = useUIStore((state) => state.addToast);

    return useMutation({
        mutationFn: async (raidId: string) => {
            const res = await fetch(`/api/raids/${raidId}/complete`, {
                method: "POST",
            });
            if (!res.ok) throw new Error("Failed to complete raid");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.userRaids });
            queryClient.invalidateQueries({ queryKey: queryKeys.user });
            addToast("Raid completed!", "success");
        },
        onError: (error: Error) => {
            addToast(error.message || "Failed to complete raid", "error");
        },
    });
}

// ============================================
// Additional Hooks (for compatibility)
// ============================================
export function useCampaign(id: string) {
    return useQuery({
        queryKey: queryKeys.campaign(id),
        queryFn: async (): Promise<Campaign | null> => {
            const res = await fetch(`/api/campaigns/${id}`);
            if (!res.ok) throw new Error("Failed to fetch campaign");
            const data = await res.json();
            return data.data || null;
        },
        staleTime: 5 * 60 * 1000,
        enabled: !!id,
    });
}

export function useApplySpray() {
    const queryClient = useQueryClient();
    const addToast = useUIStore((state) => state.addToast);

    return useMutation({
        mutationFn: async (data: { trenchId: string; amount: number; level: string }) => {
            const res = await fetch("/api/spray/apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to apply spray");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.positions });
            addToast("Spray applied successfully!", "success");
        },
        onError: (error: Error) => {
            addToast(error.message || "Failed to apply spray", "error");
        },
    });
}

export function useSubmitContent() {
    const queryClient = useQueryClient();
    const addToast = useUIStore((state) => state.addToast);

    return useMutation({
        mutationFn: async (data: { campaignId: string; url: string; platform: string }) => {
            const res = await fetch("/api/content-submissions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contentCampaignId: data.campaignId,
                    url: data.url,
                    platform: data.platform,
                }),
            });
            if (!res.ok) throw new Error("Failed to submit content");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.submissions });
            addToast("Content submitted successfully!", "success");
        },
        onError: (error: Error) => {
            addToast(error.message || "Failed to submit content", "error");
        },
    });
}

export function useInvalidateQueries() {
    const queryClient = useQueryClient();
    return {
        invalidateUser: () => queryClient.invalidateQueries({ queryKey: queryKeys.user }),
        invalidatePositions: () => queryClient.invalidateQueries({ queryKey: queryKeys.positions }),
        invalidateCampaigns: () => queryClient.invalidateQueries({ queryKey: queryKeys.campaigns }),
        invalidateAll: () => queryClient.invalidateQueries(),
    };
}
