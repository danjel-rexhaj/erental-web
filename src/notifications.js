import { useEffect, useRef, useState, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import { API_BASE, apiFetch } from "./api";

const HUB_URL = API_BASE.replace(/\/api$/, "") + "/hubs/notifications";

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