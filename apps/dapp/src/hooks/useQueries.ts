"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ============================================
// Query Keys
// ============================================
export const queryKeys = {
    user: ["user"] as const,
    positions: ["positions"] as const,
    campaigns: ["campaigns"] as const,
    trenches: ["trenches"] as const,
    tasks: ["tasks"] as const,
    deposits: (userId?: string) => ["deposits", userId] as const,
    campaign: (id: string) => ["campaign", id] as const,
    sprayEntry: (id: string) => ["sprayEntry", id] as const,
};

// ============================================
// Types
// ============================================
interface User {
    id: string;
    handle: string;
    balance: string;
    beliefScore: number;
    boostPoints: number;
}

interface Campaign {
    id: string;
    name: string;
    level: "RAPID" | "MID" | "DEEP";
    tokenSymbol: string;
    tokenAddress: string;
    chainName: string;
    roiMultiplier: string;
    reserves: string | null;
    entryRange: { min: number; max: number };
}

interface Position {
    id: string;
    type: "active" | "secured" | "enlisted";
    trenchId?: string;
    trenchName?: string;
    trenchLevel?: string;
    status: string;
    joinedAt: string;
    entryAmount?: number;
    maxPayout?: number;
    expectedPayoutAt?: string;
    formattedCountdown?: string;
}

// ============================================
// Fetchers
// ============================================
async function fetchUser(): Promise<User | null> {
    const res = await fetch("/api/user");
    if (!res.ok) throw new Error("Failed to fetch user");
    const data = await res.json();
    return data.data || null;
}

async function fetchPositions(): Promise<Position[]> {
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

// ============================================
// Hooks
// ============================================

/**
 * Fetch and cache the current user profile.
 */
export function useUser() {
    return useQuery({
        queryKey: queryKeys.user,
        queryFn: fetchUser,
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
    });
}

/**
 * Fetch and cache the user's positions.
 */
export function usePositions() {
    return useQuery({
        queryKey: queryKeys.positions,
        queryFn: fetchPositions,
        staleTime: 30 * 1000, // 30 seconds
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
 * Hook for custom cache invalidation.
 */
export function useInvalidateQueries() {
    const queryClient = useQueryClient();

    return {
        invalidateUser: () => queryClient.invalidateQueries({ queryKey: queryKeys.user }),
        invalidatePositions: () => queryClient.invalidateQueries({ queryKey: queryKeys.positions }),
        invalidateCampaigns: () => queryClient.invalidateQueries({ queryKey: queryKeys.campaigns }),
        invalidateTasks: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks }),
        invalidateAll: () => queryClient.invalidateQueries(),
    };
}
