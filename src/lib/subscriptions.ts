import { supabase } from "./supabase";

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function addSubscription(sub: PushSubscriptionData) {
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      endpoint: sub.endpoint,
      keys_p256dh: sub.keys.p256dh,
      keys_auth: sub.keys.auth,
    },
    { onConflict: "endpoint" }
  );
  if (error) throw error;
}

export async function getSubscriptions(): Promise<PushSubscriptionData[]> {
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, keys_p256dh, keys_auth");
  if (error) throw error;

  return (data ?? []).map((row) => ({
    endpoint: row.endpoint,
    keys: {
      p256dh: row.keys_p256dh,
      auth: row.keys_auth,
    },
  }));
}
