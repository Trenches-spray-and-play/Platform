import { useEffect, useRef } from "react";
import { useUIStore } from "@/store/uiStore";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./useQueries";

/**
 * Hook to handle real-time notifications for deposits and positions via SSE.
 */
export function useRealtimeStatus(userId: string | undefined) {
    const addToast = useUIStore((state) => state.addToast);
    const queryClient = useQueryClient();
    const eventSourceRef = useRef<EventSource | null>(null);

    useEffect(() => {
        if (!userId) {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
            return;
        }

        // Close existing connection if any
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        const eventSource = new EventSource(`/api/sse?userId=${userId}`);
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                switch (data.type) {
                    case "connected":
                        console.log("SSE connected for user:", userId);
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

                    default:
                        console.log("Unknown SSE event type:", data.type);
                }
            } catch (err) {
                console.error("Error parsing SSE message:", err);
            }
        };

        eventSource.onerror = (err) => {
            console.warn("SSE connection error, browser will auto-reconnect:", err);
            // EventSource automatically handles reconnection, but we can log it
        };

        return () => {
            eventSource.close();
            eventSourceRef.current = null;
        };
    }, [userId, addToast, queryClient]);
}
