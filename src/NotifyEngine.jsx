import { useEffect, useRef, useState } from 'react'
import {
  backendHealth,
  dueEvents,
  permissionState,
  pushSupported,
  registerServiceWorker,
  requestPermission,
  showLocalNotification,
  subscribePush,
  syncSchedule,
} from './notifications.js'
import { useSettings } from './settings.jsx'
import { useTasks } from './store.jsx'
import { addDays, formatISO, todayISO } from './utils.js'

function range(api) {
  return api.occurrencesInRange(todayISO(), formatISO(addDays(new Date(), 14)))
}

export function NotifyEngine() {
  const api = useTasks()
  const { settings } = useSettings()
  const [reg, setReg] = useState(null)
  const syncing = useRef(false)

  useEffect(() => {
    let alive = true
    registerServiceWorker().then((r) => {
      if (alive) setReg(r)
    })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!reg) return
    if (permissionState() !== 'granted') return

    let cancelled = false
    ;(async () => {
      if (syncing.current) return
      syncing.current = true
      try {
        if (pushSupported()) {
          const health = await backendHealth()
          if (health.ok) {
            try {
              await subscribePush(reg)
            } catch {
              /* local notifications still work */
            }
            if (!cancelled) await syncSchedule(reg, range(api), settings)
          }
        }
      } finally {
        syncing.current = false
      }
    })()
    return () => {
      cancelled = true
    }
  }, [reg, api.series, settings, api])

  useEffect(() => {
    if (!reg) return
    if (permissionState() !== 'granted') return

    const tick = async () => {
      const due = dueEvents(range(api), settings, new Date())
      for (const ev of due) {
        await showLocalNotification(reg, ev)
      }
    }
    tick()
    const id = setInterval(tick, 20000)
    const onVis = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [reg, settings, api])

  return null
}

export async function enableNotifications() {
  const perm = await requestPermission()
  if (perm.state !== 'granted') return perm
  const reg = await registerServiceWorker()
  if (pushSupported() && reg) {
    const health = await backendHealth()
    if (health.ok) {
      try {
        await subscribePush(reg)
      } catch (err) {
        return { state: 'granted', pushError: err?.message, reg }
      }
    }
  }
  return { state: 'granted', reg }
}
