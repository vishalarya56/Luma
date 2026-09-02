import cors from 'cors'
import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import webpush from 'web-push'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, 'data')
fs.mkdirSync(dataDir, { recursive: true })

function loadJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return fallback
  }
}

const vapidPath = path.join(dataDir, 'vapid.json')
let vapid = loadJson(vapidPath, null)
if (!vapid?.publicKey || !vapid?.privateKey) {
  const keys = webpush.generateVAPIDKeys()
  vapid = { subject: 'mailto:luma@local.app', ...keys }
  fs.writeFileSync(vapidPath, JSON.stringify(vapid, null, 2))
}

webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey)

const subsPath = path.join(dataDir, 'subs.json')
const schedulePath = path.join(dataDir, 'schedule.json')
let subs = loadJson(subsPath, [])
let schedule = loadJson(schedulePath, [])

function persist() {
  fs.writeFileSync(subsPath, JSON.stringify(subs))
  fs.writeFileSync(schedulePath, JSON.stringify(schedule))
}

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, push: true, scheduled: schedule.filter((e) => !e.sent).length })
})

app.get('/api/vapid-public', (_req, res) => {
  res.json({ publicKey: vapid.publicKey, supported: true })
})

app.post('/api/subscribe', (req, res) => {
  const sub = req.body?.subscription || req.body
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return res.status(400).json({ error: 'invalid subscription' })
  }
  subs = subs.filter((s) => s.endpoint !== sub.endpoint)
  subs.push(sub)
  persist()
  res.json({ ok: true })
})

app.post('/api/unsubscribe', (req, res) => {
  const endpoint = req.body?.endpoint
  if (endpoint) {
    subs = subs.filter((s) => s.endpoint !== endpoint)
    schedule = schedule.filter((e) => e.endpoint !== endpoint)
    persist()
  }
  res.json({ ok: true })
})

app.post('/api/schedule', (req, res) => {
  const endpoint = req.body?.endpoint
  const events = Array.isArray(req.body?.events) ? req.body.events : []
  if (!endpoint) return res.status(400).json({ error: 'missing endpoint' })

  const prevSent = new Set(
    schedule.filter((e) => e.endpoint === endpoint && e.sent).map((e) => e.id)
  )
  schedule = schedule.filter((e) => e.endpoint !== endpoint)
  const now = Date.now()
  let count = 0
  for (const ev of events) {
    if (!ev?.id || !ev?.fireAt || !ev?.title) continue
    if (ev.fireAt > now + 14 * 86400000) continue
    schedule.push({
      id: String(ev.id),
      fireAt: Number(ev.fireAt),
      title: String(ev.title).slice(0, 120),
      body: String(ev.body || '').slice(0, 240),
      data: ev.data || {},
      tag: ev.tag || ev.id,
      endpoint,
      sent: prevSent.has(String(ev.id)) || Number(ev.fireAt) < now - 6 * 3600000,
    })
    count++
  }
  persist()
  res.json({ ok: true, scheduled: count })
})

app.post('/api/test', async (req, res) => {
  const endpoint = req.body?.endpoint
  const sub = subs.find((s) => s.endpoint === endpoint) || subs[subs.length - 1]
  if (!sub) return res.status(400).json({ error: 'no subscription' })
  try {
    await webpush.sendNotification(
      sub,
      JSON.stringify({
        title: 'Luma is ready ✨',
        body: 'Notifications are working. You’ll be reminded about your rituals.',
        tag: 'luma-test',
        data: { type: 'test', id: 'test' },
      })
    )
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err?.message || 'push failed' })
  }
})

async function tick() {
  const now = Date.now()
  const due = schedule.filter((e) => !e.sent && Number(e.fireAt) <= now)
  let changed = false
  for (const ev of due) {
    ev.sent = true
    changed = true
    const sub = subs.find((s) => s.endpoint === ev.endpoint)
    if (!sub) continue
    try {
      await webpush.sendNotification(
        sub,
        JSON.stringify({
          title: ev.title,
          body: ev.body,
          tag: ev.tag || ev.id,
          data: { ...(ev.data || {}), id: ev.id },
        })
      )
    } catch (err) {
      const code = err?.statusCode
      if (code === 404 || code === 410) {
        subs = subs.filter((s) => s.endpoint !== sub.endpoint)
        schedule = schedule.filter((e) => e.endpoint !== sub.endpoint)
      }
    }
  }
  if (changed) persist()
}

setInterval(() => {
  tick().catch(() => {})
}, 15000)
tick().catch(() => {})

const PORT = Number(process.env.NOTIFY_PORT || 8787)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[luma-notify] listening on ${PORT}`)
})
