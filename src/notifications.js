import { buildNotificationEvents, markNotified, wasNotified } from './status.js'
import { todayISO } from './utils.js'

export function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function serviceWorkerSupported() {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator
}

export function pushSupported() {
  return serviceWorkerSupported() && 'PushManager' in window && 'Notification' in window
}

export function permissionState() {
  if (!notificationsSupported()) return 'unsupported'
  return Notification.permission
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export async function registerServiceWorker() {
  if (!serviceWorkerSupported()) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
    await navigator.serviceWorker.ready
    return reg
  } catch (err) {
    console.warn('Service worker registration failed:', err)
    return null
  }
}

export async function backendHealth() {
  try {
    const res = await fetch('/api/health', { cache: 'no-store' })
    if (!res.ok) return { ok: false }
    return await res.json()
  } catch {
    return { ok: false }
  }
}

export async function fetchVapidKey() {
  const res = await fetch('/api/vapid-public', { cache: 'no-store' })
  if (!res.ok) throw new Error('Could not reach the notification server')
  const data = await res.json()
  if (!data.publicKey) throw new Error('Server did not provide a VAPID key')
  return data.publicKey
}

export async function requestPermission() {
  if (!notificationsSupported()) {
    return { state: 'unsupported', error: 'This browser does not support notifications.' }
  }
  if (Notification.permission === 'granted') return { state: 'granted' }
  if (Notification.permission === 'denied') return { state: 'denied' }
  try {
    const result = await Notification.requestPermission()
    return { state: result }
  } catch (err) {
    return { state: Notification.permission, error: err?.message }
  }
}

export async function subscribePush(reg) {
  if (!pushSupported()) throw new Error('Push messaging is not supported in this browser.')
  const publicKey = await fetchVapidKey()
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
  }
  const res = await fetch('/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription: sub.toJSON() }),
  })
  if (!res.ok) throw new Error('Could not save the push subscription')
  return sub
}

export async function unsubscribePush(reg) {
  try {
    const sub = await reg?.pushManager?.getSubscription()
    if (sub) {
      await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      }).catch(() => {})
      await sub.unsubscribe()
    }
  } catch {
    /* ignore */
  }
}

export async function syncSchedule(reg, occurrences, settings) {
  if (!reg) return { ok: false, reason: 'no-sw' }
  const now = Date.now()
  const events = buildNotificationEvents(occurrences, settings, new Date()).filter(
    (e) => e.fireAt > now - 30000
  )
  const sub = await reg.pushManager?.getSubscription?.()
  if (!sub) return { ok: false, reason: 'no-subscription', count: events.length }
  const res = await fetch('/api/schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: sub.endpoint, events }),
  })
  if (!res.ok) return { ok: false, reason: 'schedule-failed' }
  const data = await res.json()
  return { ok: true, count: data.scheduled }
}

export async function sendTestPush(reg) {
  const sub = await reg?.pushManager?.getSubscription?.()
  if (!sub) throw new Error('Subscribe to push first')
  const res = await fetch('/api/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Test push failed')
  return true
}

export async function showLocalNotification(reg, event) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return false
  if (wasNotified(event.id)) return false
  const options = {
    body: event.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: event.data,
    tag: event.tag || event.id,
    renotify: true,
  }
  try {
    if (reg?.showNotification) {
      await reg.showNotification(event.title, options)
    } else {
      new Notification(event.title, options)
    }
    markNotified(event.id)
    return true
  } catch (err) {
    console.warn('Notification failed:', err)
    return false
  }
}

export function dueEvents(occurrences, settings, now = new Date()) {
  return buildNotificationEvents(occurrences, settings, now).filter((e) => {
    if (wasNotified(e.id)) return false
    if (e.fireAt > now.getTime()) return false
    const type = e.data?.type
    if (type === 'evening' || type === 'summary') {
      const incomplete = occurrences.filter((t) => t.date === todayISO() && !t.completed && !t.ignored)
      return incomplete.length > 0
    }
    const occ = occurrences.find((t) => t.occurrenceId === e.data?.occurrenceId)
    if (!occ || occ.completed || occ.ignored) return false
    if (type === 'missed') return now.getTime() - e.fireAt < 2 * 3600000
    return now.getTime() - e.fireAt < 20 * 60000
  })
}

export const DENIED_HELP =
  'Notifications are blocked for this site. On Android Chrome: Settings → Site settings → Notifications, then allow Luma. On iPhone, install Luma to the Home Screen first, then allow notifications.'
