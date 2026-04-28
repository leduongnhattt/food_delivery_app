"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  enterpriseNotificationsService,
  type EnterpriseNotification,
} from "@/services/enterprise-notifications.service";

let audioCtx: AudioContext | null = null;
let audioArmed = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextCtor =
    (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextCtor) return null;
  if (!audioCtx) audioCtx = new AudioContextCtor();
  return audioCtx;
}

async function armNotificationSound(): Promise<void> {
  const audioContext = getAudioContext();
  if (!audioContext) return;
  try {
    if (audioContext.state === "suspended") await audioContext.resume();
    audioArmed = true;
  } catch {
    // ignore
  }
}

function playNotificationBeep(): void {
  if (!audioArmed) return;
  const audioContext = getAudioContext();
  if (!audioContext) return;
  try {
    const oscillatorNode = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillatorNode.type = "sine";
    oscillatorNode.frequency.value = 880;
    gainNode.gain.value = 0.0001;
    oscillatorNode.connect(gainNode);
    gainNode.connect(audioContext.destination);
    const startTime = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.08, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.18);
    oscillatorNode.start(startTime);
    oscillatorNode.stop(startTime + 0.2);
  } catch {
    // ignore
  }
}

export function useEnterpriseNotifications(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<EnterpriseNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchInProgressRef = useRef(false);
  const lastUnreadCountRef = useRef(0);

  const refresh = useCallback(
    async (args?: { silent?: boolean }) => {
      if (!enabled) return;
      if (fetchInProgressRef.current) return;
      fetchInProgressRef.current = true;
      if (!args?.silent) setLoading(true);
      try {
        const response = await enterpriseNotificationsService.list({ limit: 10 });
        const nextUnreadCount = response.unreadCount ?? 0;
        if (nextUnreadCount > lastUnreadCountRef.current) {
          // New notifications arrived
          if (
            typeof document === "undefined" ||
            document.visibilityState === "visible"
          ) {
            playNotificationBeep();
          }
        }
        lastUnreadCountRef.current = nextUnreadCount;
        setUnreadCount(nextUnreadCount);
        setItems(response.notifications ?? []);
      } finally {
        if (!args?.silent) setLoading(false);
        fetchInProgressRef.current = false;
      }
    },
    [enabled],
  );

  const markRead = useCallback(async (id: string) => {
    await enterpriseNotificationsService.markRead(id);
    setItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, readAt: x.readAt ?? new Date().toISOString() } : x)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    lastUnreadCountRef.current = Math.max(0, lastUnreadCountRef.current - 1);
  }, []);

  const markAllRead = useCallback(async () => {
    await enterpriseNotificationsService.markAllRead();
    setItems((prev) => prev.map((x) => ({ ...x, readAt: x.readAt ?? new Date().toISOString() })));
    setUnreadCount(0);
    lastUnreadCountRef.current = 0;
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    const notificationToDelete = items.find((x) => x.id === id);
    await enterpriseNotificationsService.delete(id);
    setItems((prev) => prev.filter((x) => x.id !== id));
    if (notificationToDelete && !notificationToDelete.readAt) {
      setUnreadCount((c) => Math.max(0, c - 1));
      lastUnreadCountRef.current = Math.max(0, lastUnreadCountRef.current - 1);
    }
  }, [items]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      await refresh({ silent: true });
    };
    const onFocus = () => void tick();
    const onVisibility = () => {
      if (document.visibilityState === "visible") void tick();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    const id = window.setInterval(() => void tick(), 8000);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(id);
    };
  }, [enabled, refresh]);

  return {
    unreadCount,
    items,
    loading,
    refresh,
    markRead,
    markAllRead,
    deleteNotification,
    armSound: armNotificationSound,
  };
}

