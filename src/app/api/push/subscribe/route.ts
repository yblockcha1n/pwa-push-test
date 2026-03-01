import { NextRequest, NextResponse } from "next/server";
import { addSubscription } from "@/lib/subscriptions";

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json();
    await addSubscription(subscription);
    return NextResponse.json({ message: "Subscribed" }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
