import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { getSubscriptions } from "@/lib/subscriptions";

webpush.setVapidDetails(
  "mailto:test@example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { title, body } = await request.json();
    const subscriptions = await getSubscriptions();

    if (subscriptions.length === 0) {
      return NextResponse.json(
        { error: "No subscriptions. Subscribe first." },
        { status: 400 }
      );
    }

    const payload = JSON.stringify({
      title: title || "Test Notification",
      body: body || "This is a test push notification!",
      url: "/",
    });

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        webpush.sendNotification(sub as any, payload)
      )
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({ succeeded, failed });
  } catch {
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
