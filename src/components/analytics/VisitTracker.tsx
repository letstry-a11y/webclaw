"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const SESSION_KEY = "medbot_visit_session";

function getSessionId() {
  const existing = sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const sessionId = crypto.randomUUID();
  sessionStorage.setItem(SESSION_KEY, sessionId);
  return sessionId;
}

export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    const visitId = crypto.randomUUID();
    const sessionId = getSessionId();
    const startedAt = Date.now();
    let lastDuration = 0;

    const payload = (event: "start" | "heartbeat" | "end") => ({
      event,
      visitId,
      sessionId,
      path: pathname,
      pageTitle: document.title,
      referrer: event === "start" ? document.referrer : "",
      durationSeconds: Math.max(0, Math.floor((Date.now() - startedAt) / 1000)),
    });

    const send = (event: "start" | "heartbeat" | "end") => {
      const body = payload(event);
      if (event !== "start" && body.durationSeconds === lastDuration) return;
      lastDuration = body.durationSeconds;

      if (event === "end" && navigator.sendBeacon) {
        navigator.sendBeacon("/api/analytics/visit", new Blob([JSON.stringify(body)], { type: "application/json" }));
        return;
      }
      void fetch("/api/analytics/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        keepalive: true,
      }).catch(() => undefined);
    };

    send("start");
    const heartbeat = window.setInterval(() => send("heartbeat"), 15_000);
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") send("heartbeat");
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", handleVisibility);
      send("end");
    };
  }, [pathname]);

  return null;
}
