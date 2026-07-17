import { useEffect, useRef, useState, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import { API_BASE, apiFetch } from "./api";

const HUB_URL = API_BASE.replace(/\/api$/, "") + "/hubs/notifications";

export function useNotifications(token, onAvailabilityChanged, onNotification) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const connectionRef = useRef(null);
  const availabilityCbRef = useRef(onAvailabilityChanged);
  availabilityCbRef.current = onAvailabilityChanged;
  const notificationCbRef = useRef(onNotification);
  notificationCbRef.current = onNotification;

  useEffect(() => {
    if (!token) {
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    apiFetch("/Notifications", token)
      .then((list) => {
        setNotifications(list);
        setUnreadCount(list.filter((n) => !n.isRead).length);
      })
      .catch(() => {});

    let cancelled = false;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .build();

    connection.on("notification", (data) => {
      setNotifications((prev) => [{ ...data, isRead: false }, ...prev].slice(0, 30));
      setUnreadCount((c) => c + 1);
      if (notificationCbRef.current) notificationCbRef.current(data);
    });

    connection.on("availabilityChanged", (data) => {
      if (availabilityCbRef.current) availabilityCbRef.current(data);
    });

    connection.start().catch((err) => {
      if (!cancelled) console.error("SignalR error:", err);
    });
    connectionRef.current = connection;

    return () => {
      cancelled = true;
      connection.stop();
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

  return { notifications, unreadCount, markAllRead, dismissNotification, clearAllNotifications };
}