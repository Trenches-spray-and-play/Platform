import { dequeueNotification } from "@/lib/redis";
import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
        return new NextResponse("Missing userId", { status: 400 });
    }

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();

            // Send initial connection message to keep connection alive and confirm setup
            const initialMessage = JSON.stringify({ type: "connected", timestamp: Date.now() });
            controller.enqueue(encoder.encode(`data: ${initialMessage}\n\n`));

            // Poll Redis for notifications
            const interval = setInterval(async () => {
                try {
                    const notification = await dequeueNotification(userId);
                    if (notification) {
                        controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify(notification)}\n\n`)
                        );
                    }
                } catch (err) {
                    console.error("SSE Redis polling error:", err);
                }
            }, 2000); // Poll every 2 seconds to be gentle on Upstash REST API

            // Cleanup on disconnect
            request.signal.addEventListener("abort", () => {
                clearInterval(interval);
                controller.close();
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
