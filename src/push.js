import { apiFetch } from "./api";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function pushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

// Only call Notification.requestPermission() from a real user click (a button tap) -- browsers
// increasingly ignore or auto-deny permission prompts triggered without a user gesture. When
// permission is already granted from a previous session, this is safe to call silently on app
// load too, since requestPermission() resolves immediately with no UI in that case.
export async function subscribeToPush(token) {
  if (!pushSupported()) return false;

  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") return false;

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    const { publicKey } = await apiFetch("/Push/vapid-public-key", null);
    if (!publicKey) return false;
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  const json = subscription.toJSON();
  await apiFetch("/Push/subscribe", token, {
    method: "POST",
    body: JSON.stringify({ endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth, userAgent: navigator.userAgent }),
  });
  return true;
}

export async function unsubscribeFromPush(token) {
  if (!pushSupported()) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    await apiFetch(`/Push/subscribe?endpoint=${encodeURIComponent(endpoint)}`, token, { method: "DELETE" });
  } catch { /* best-effort cleanup, never block logout on this */ }
}
