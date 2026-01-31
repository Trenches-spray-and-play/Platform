import { QueryClient } from "@tanstack/react-query";

/**
 * Shared QueryClient instance for the application.
 * This is created once and reused across all requests.
 */
function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // Data is considered fresh for 30 seconds
                staleTime: 30 * 1000,
                // Cache data for 5 minutes even when unused
                gcTime: 5 * 60 * 1000,
                // Retry failed requests 2 times with exponential backoff
                retry: 2,
                retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
                // Don't refetch on window focus by default (can be overridden per query)
                refetchOnWindowFocus: false,
                // Don't refetch on reconnect by default
                refetchOnReconnect: false,
            },
            mutations: {
                // Retry mutations once
                retry: 1,
            },
        },
    });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
    if (typeof window === "undefined") {
        // Server: always make a new query client
        return makeQueryClient();
    } else {
        // Browser: make a new query client if we don't already have one
        // This prevents creating a new client for every navigation
        if (!browserQueryClient) browserQueryClient = makeQueryClient();
        return browserQueryClient;
    }
}
