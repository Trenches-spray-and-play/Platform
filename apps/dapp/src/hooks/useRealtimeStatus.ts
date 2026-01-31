import { useEffect, useRef, useCallback } from "react";
import { useUIStore } from "@/store/uiStore";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./useQueries";

/**
 * Hook to handle real-time notifications for deposits and positions via SSE.
 * Optimized to prevent performance issues:
 * - Connection closes after 5 minutes (server-side) and reconnects
 * - Polling interval reduced to 30 seconds
 * - Graceful handling when Redis is not configured
 */
export function useRealtimeStatus(userId: string | undefined) {
    const addToast = useUIStore((state) => state.addToast);
    const queryClient = useQueryClient();
    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMessage = useCallback((event: MessageEvent) => {
        try {
            const data = JSON.parse(event.data);

            switch (data.type) {
                case "connected":
                    if (data.mode === "polling-disabled") {
                        console.log("SSE connected (polling disabled - Redis not configured)");
                    } else {
                        console.log("SSE connected for user:", userId, "poll interval:", data.pollInterval);
                    }
                    break;

                case "heartbeat":
                    // Heartbeat received, connection is alive
                    break;

                case "deposit_confirmed":
                    addToast(
                        `Deposit confirmed: +${data.data?.amount || "—"} ${data.data?.token || "USDC"}`,
                        "success"
                    );
                    // Refresh user balance and deposits
                    queryClient.invalidateQueries({ queryKey: queryKeys.user });
                    queryClient.invalidateQueries({ queryKey: queryKeys.deposits(userId) });
                    break;

                case "position_filled":
                    addToast(data.message || "Your position has been filled!", "success");
                    // Refresh positions and dashboard data
                    queryClient.invalidateQueries({ queryKey: queryKeys.positions });
                    queryClient.invalidateQueries({ queryKey: queryKeys.user });
                    break;

                case "campaign_started":
                    addToast(`New campaign started: ${data.data?.name || "Check dashboard"}`, "info");
                    queryClient.invalidateQueries({ queryKey: queryKeys.campaigns });
                    break;

                case "system":
                    addToast(data.message, "info");
                    break;

                case "connection_reset":
                    console.log("SSE connection reset by server:", data.reason);
                    // Server closed connection, client will auto-reconnect
                    break;

                default:
                    console.log("Unknown SSE event type:", data.type);
            }
        } catch (err) {
            console.error("Error parsing SSE message:", err);
        }
    }, [userId, addToast, queryClient]);

    useEffect(() => {
        if (!userId) {
            // Clean up existing connection
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
            return;
        }

        // Close existing connection if any
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        const connect = () => {
            try {
                const eventSource = new EventSource(`/api/sse?userId=${userId}`);
                eventSourceRef.current = eventSource;

                eventSource.onmessage = handleMessage;

                eventSource.onerror = (err) => {
                    console.warn("SSE connection error:", err);
                    // Close and clean up
                    eventSource.close();
                    eventSourceRef.current = null;
                    
                    // Reconnect after 5 seconds (with backoff)
                    reconnectTimeoutRef.current = setTimeout(() => {
                        if (userId) {
                            connect();
                        }
                    }, 5000);
                };
            } catch (err) {
                console.error("Failed to create SSE connection:", err);
            }
        };

        connect();

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
        };
    }, [userId, handleMessage]);
}
