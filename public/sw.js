/* Luma service worker — push + notification clicks. No fetch caching. */
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

function openApp(url) {
  return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    for (const client of clients) {
      if ('focus' in client) {
        client.postMessage({ type: 'NOTIFICATION_NAV', url })
        return client.focus()
      }
    }
    if (self.clients.openWindow) return self.clients.openWindow(url)
    return undefined
  })
}

self.addEventListener('push', (event) => {
  let payload = { title: 'Luma', body: 'You have a reminder.', data: {}, tag: 'luma' }
  try {
    if (event.data) payload = { ...payload, ...event.data.json() }
  } catch {
    try {
      payload.body = event.data.text()
    } catch {
      /* keep defaults */
    }
  }

  const data = payload.data || {}
  const actions = []
  if (data.type === 'missed') {
    actions.push({ action: 'complete', title: 'Complete now' })
    actions.push({ action: 'open', title: 'Open' })
  } else if (data.type === 'evening' || data.type === 'summary') {
    actions.push({ action: 'open', title: "Complete today's tasks" })
  } else {
    actions.push({ action: 'open', title: 'Open task' })
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Luma', {
      body: payload.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data,
      tag: payload.tag || data.id || 'luma',
      renotify: true,
      vibrate: [80, 40, 80],
      actions,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const data = event.notification.data || {}
  const action = event.action || 'open'
  const params = new URLSearchParams({
    open: data.type || 'task',
    seriesId: data.seriesId || '',
    date: data.date || '',
    action,
  })
  const url = '/?' + params.toString()
  event.waitUntil(openApp(url))
})

self.addEventListener('message', (event) => {
  const msg = event.data
  if (msg?.type === 'SHOW_NOTIFICATION') {
    event.waitUntil(
      self.registration.showNotification(msg.title, {
        body: msg.body || '',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: msg.data || {},
        tag: msg.tag || msg.data?.id || 'luma',
        renotify: Boolean(msg.renotify),
        vibrate: [80, 40, 80],
      })
    )
  }
})
