import { queueNotification } from "@/lib/redis";
import { NextResponse } from "next/server";

/**
 * Internal test endpoint to trigger mock notifications.
 * Usage: POST /api/sse/test
 * Body: { userId: string, type: string, message: string, amount?: string, token?: string }
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, type, message, amount, token } = body;

        if (!userId) {
            return NextResponse.json({ success: false, error: "userId required" }, { status: 400 });
        }

        await queueNotification(userId, {
            type: (type as any) || "system",
            message: message || "This is a test notification",
            data: {
                amount: amount || "100.00",
                token: token || "USDC",
                timestamp: Date.now(),
            },
            timestamp: Date.now(),
        });

        return NextResponse.json({ success: true, message: "Notification queued" });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
