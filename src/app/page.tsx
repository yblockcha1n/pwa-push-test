"use client";

import { useState, useEffect } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) {
    arr[i] = raw.charCodeAt(i);
  }
  return arr;
}

export default function Home() {
  const [swReg, setSwReg] = useState<ServiceWorkerRegistration | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [hasSW, setHasSW] = useState(false);
  const [hasPush, setHasPush] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) =>
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as unknown as { standalone?: boolean }).standalone === true
    );
    setHasSW("serviceWorker" in navigator);
    setHasPush("PushManager" in window);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          setSwReg(reg);
          addLog("Service Worker registered");
          return reg.pushManager.getSubscription();
        })
        .then((sub) => {
          if (sub) {
            setIsSubscribed(true);
            addLog("Already subscribed");
          }
        })
        .catch((err) => addLog(`SW error: ${err.message}`));
    } else {
      addLog("Service Worker not supported");
    }
  }, []);

  const handleSubscribe = async () => {
    try {
      setSubscribing(true);
      setError("");

      const permission = await Notification.requestPermission();
      addLog(`Permission: ${permission}`);
      if (permission !== "granted") throw new Error("Permission denied");
      if (!swReg) throw new Error("SW not registered");

      const key = urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      );
      const subscription = await swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key.buffer as ArrayBuffer,
      });
      addLog("Push subscription created");

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!res.ok) throw new Error("Failed to save subscription");

      setIsSubscribed(true);
      addLog("Subscribed successfully");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      addLog(`Subscribe error: ${msg}`);
    } finally {
      setSubscribing(false);
    }
  };

  const handleSend = async () => {
    try {
      setSending(true);
      setError("");

      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Hello from PWA!",
          body: "This is a test push notification.",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");

      addLog(`Sent! (${data.succeeded} ok, ${data.failed} failed)`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      addLog(`Send error: ${msg}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 font-sans">
      <h1 className="text-3xl font-bold">PWA Push Test</h1>

      <div className="w-full max-w-sm rounded-lg bg-zinc-100 p-4 text-sm dark:bg-zinc-900">
        <p>iOS: {isIOS ? "Yes" : "No"}</p>
        <p>Standalone: {isStandalone ? "Yes" : "No"}</p>
        <p>SW: {hasSW ? "Yes" : "No"}</p>
        <p>Push: {hasPush ? "Yes" : "No"}</p>
        <p>Subscribed: {isSubscribed ? "Yes" : "No"}</p>
      </div>

      {isIOS && !isStandalone && (
        <div className="w-full max-w-sm rounded-lg bg-amber-100 p-4 text-sm text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
          Push notifications require adding this app to your Home Screen.
        </div>
      )}

      <div className="flex w-full max-w-sm flex-col gap-3">
        <button
          onClick={handleSubscribe}
          disabled={isSubscribed || subscribing}
          className="rounded-full bg-blue-600 px-6 py-3 text-lg font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubscribed ? "Subscribed" : subscribing ? "Subscribing..." : "Subscribe to Push"}
        </button>

        <button
          onClick={handleSend}
          disabled={!isSubscribed || sending}
          className="rounded-full bg-green-600 px-6 py-3 text-lg font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? "Sending..." : "Send Test Notification"}
        </button>
      </div>

      {error && (
        <div className="w-full max-w-sm rounded-lg bg-red-100 p-4 text-sm text-red-900 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="w-full max-w-sm">
        <h2 className="mb-2 text-sm font-semibold">Debug Log</h2>
        <div className="h-40 overflow-y-auto rounded-lg bg-zinc-950 p-3 font-mono text-xs text-green-400">
          {log.length === 0 ? (
            <p className="text-zinc-500">Waiting...</p>
          ) : (
            log.map((entry, i) => <p key={i}>{entry}</p>)
          )}
        </div>
      </div>
    </div>
  );
}
