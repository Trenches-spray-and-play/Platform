import { dequeueNotification } from "@/lib/redis";
import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// SSE Configuration
const POLLING_INTERVAL = 30000; // Poll every 30 seconds (was 2 seconds)
const MAX_CONNECTION_TIME = 5 * 60 * 1000; // Close connection after 5 minutes (force reconnect)

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
        return new NextResponse("Missing userId", { status: 400 });
    }

    // Check if Redis is configured
    const hasRedis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (!hasRedis) {
        // Return a minimal SSE connection that does nothing
        // This prevents client errors while avoiding Redis polling
        const stream = new ReadableStream({
            start(controller) {
                const encoder = new TextEncoder();
                const message = JSON.stringify({ 
                    type: "connected", 
                    mode: "polling-disabled",
                    timestamp: Date.now() 
                });
                controller.enqueue(encoder.encode(`data: ${message}\n\n`));
                
                // Close connection after sending initial message
                setTimeout(() => {
                    controller.close();
                }, 1000);
            },
        });

        return new NextResponse(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });
    }

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            let connectionStartTime = Date.now();
            let isActive = true;

            // Send initial connection message
            const initialMessage = JSON.stringify({ 
                type: "connected", 
                timestamp: Date.now(),
                pollInterval: POLLING_INTERVAL 
            });
            controller.enqueue(encoder.encode(`data: ${initialMessage}\n\n`));

            // Send heartbeat every 30 seconds to keep connection alive
            const heartbeatInterval = setInterval(() => {
                if (!isActive) return;
                
                try {
                    const heartbeat = JSON.stringify({ 
                        type: "heartbeat", 
                        timestamp: Date.now() 
                    });
                    controller.enqueue(encoder.encode(`data: ${heartbeat}\n\n`));
                } catch (err) {
                    // Connection likely closed
                    isActive = false;
                }
            }, 30000);

            // Poll Redis for notifications (every 30 seconds, not 2)
            const pollInterval = setInterval(async () => {
                if (!isActive) return;

                // Check max connection time
                if (Date.now() - connectionStartTime > MAX_CONNECTION_TIME) {
                    isActive = false;
                    clearInterval(pollInterval);
                    clearInterval(heartbeatInterval);
                    try {
                        const closeMessage = JSON.stringify({ 
                            type: "connection_reset", 
                            reason: "max_duration_reached" 
                        });
                        controller.enqueue(encoder.encode(`data: ${closeMessage}\n\n`));
                        controller.close();
                    } catch (err) {
                        // Already closed
                    }
                    return;
                }

                try {
                    const notification = await dequeueNotification(userId);
                    if (notification) {
                        controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify(notification)}\n\n`)
                        );
                    }
                } catch (err) {
                    console.error("SSE Redis polling error:", err);
                    // Don't crash on Redis errors, just log and continue
                }
            }, POLLING_INTERVAL);

            // Cleanup on disconnect
            request.signal.addEventListener("abort", () => {
                isActive = false;
                clearInterval(pollInterval);
                clearInterval(heartbeatInterval);
                try {
                    controller.close();
                } catch (err) {
                    // Already closed
                }
            });
        },
    });

    return new NextResponse(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}
