import { useEffect, useRef, useState, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import { API_BASE, apiFetch } from "./api";

const HUB_URL = API_BASE.replace(/\/api$/, "") + "/hubs/notifications";

// Two-tone chime synthesized on the fly (no audio asset to ship/load) for a new notification
// arriving while the tab is open -- separate from the OS-level push sound, which only fires when
// the tab/app isn't focused. Silently no-ops if the browser's autoplay policy hasn't yet granted
// audio (needs at least one prior user gesture on the page, e.g. any click).
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    [880, 1108].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * 0.11;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.15, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.3);
    });
  } catch { /* autoplay blocked or AudioContext unavailable -- fine, sound is a nicety */ }
}

export function useNotifications(token, onAvailabilityChanged, onNotification) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  // Set only once the connection actually reaches "Connected", so consumers that receive this
  // (e.g. CarDetail joining a car's group) never invoke a hub method before it's ready.
  const [connection, setConnection] = useState(null);
  const connectionRef = useRef(null);
  const availabilityCbRef = useRef(onAvailabilityChanged);
  availabilityCbRef.current = onAvailabilityChanged;
  const notificationCbRef = useRef(onNotification);
  notificationCbRef.current = onNotification;

  useEffect(() => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
    } else {
      apiFetch("/Notifications", token)
        .then((list) => {
          setNotifications(list);
          setUnreadCount(list.filter((n) => !n.isRead).length);
        })
        .catch(() => {});
    }

    // The hub itself isn't [Authorize]-gated (car availability updates are public), so the
    // connection is opened even when logged out — only the accessTokenFactory is conditional.
    let cancelled = false;
    const conn = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, token ? { accessTokenFactory: () => token } : {})
      .withAutomaticReconnect()
      .build();

    conn.on("notification", (data) => {
      setNotifications((prev) => [{ ...data, isRead: false }, ...prev].slice(0, 30));
      setUnreadCount((c) => c + 1);
      playNotificationSound();
      if (notificationCbRef.current) notificationCbRef.current(data);
    });

    conn.on("availabilityChanged", (data) => {
      if (availabilityCbRef.current) availabilityCbRef.current(data);
    });

    conn.start()
      .then(() => { if (!cancelled) setConnection(conn); })
      .catch((err) => { if (!cancelled) console.error("SignalR error:", err); });
    connectionRef.current = conn;

    return () => {
      cancelled = true;
      setConnection(null);
      conn.stop();
    };
  }, [token]);

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    apiFetch("/Notifications/mark-read", token, { method: "PUT" }).catch(() => {});
  }, [token]);

  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    apiFetch(`/Notifications/${id}`, token, { method: "DELETE" }).catch(() => {});
  }, [token]);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    apiFetch("/Notifications", token, { method: "DELETE" }).catch(() => {});
  }, [token]);

  return { notifications, unreadCount, markAllRead, dismissNotification, clearAllNotifications, connection };
}