import { useState, useEffect, useRef } from "react";

type WakeupStatus = "waking" | "ready" | "error";

const HEALTH_URL = `${import.meta.env.VITE_API_URL ?? ""}/api/healthz`;
const WAKE_TIMEOUT_MS = 30_000;
const SLOW_THRESHOLD_MS = 800;

export function useServerWakeup() {
  const [status, setStatus] = useState<WakeupStatus>("waking");
  const [isSlowStart, setIsSlowStart] = useState(false);
  const pingedRef = useRef(false);

  useEffect(() => {
    if (pingedRef.current) return;
    pingedRef.current = true;

    const slowTimer = setTimeout(() => setIsSlowStart(true), SLOW_THRESHOLD_MS);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WAKE_TIMEOUT_MS);

    fetch(HEALTH_URL, { signal: controller.signal })
      .then((res) => {
        if (res.ok) setStatus("ready");
        else setStatus("error");
      })
      .catch(() => setStatus("error"))
      .finally(() => {
        clearTimeout(slowTimer);
        clearTimeout(timeoutId);
        setIsSlowStart(false);
      });

    return () => {
      controller.abort();
      clearTimeout(slowTimer);
      clearTimeout(timeoutId);
    };
  }, []);

  return { status, isSlowStart };
}
