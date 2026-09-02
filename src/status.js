import { addDays, formatISO, formatTime, parseISO, todayISO } from './utils.js'
import { CATEGORIES } from './constants.js'

export function reminderOffsetMinutes(reminder) {
  switch (reminder) {
    case 'at_time':
      return 0
    case '5min':
      return 5
    case '10min':
      return 10
    case '15min':
      return 15
    case '30min':
      return 30
    case '1hour':
      return 60
    case '1day':
      return 1440
    default:
      return null
  }
}

export function taskDateTime(task) {
  if (!task?.date || !task.time) return null
  const [h, m] = task.time.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  const d = parseISO(task.date)
  d.setHours(h, m, 0, 0)
  return d
}

export function eveningDateOn(iso, eveningTime = '21:00') {
  const [h, m] = String(eveningTime).split(':').map(Number)
  const d = parseISO(iso)
  d.setHours(h || 21, m || 0, 0, 0)
  return d
}

export function categoryEmoji(id) {
  return CATEGORIES.find((c) => c.id === id)?.emoji || '✦'
}

export function taskStatus(task, now = new Date(), eveningTime = '21:00') {
  if (task.completed) return 'completed'
  const today = formatISO(now)
  if (task.date > today) return 'upcoming'

  const start = taskDateTime(task)
  if (!start) {
    if (task.date < today) return 'missed'
    const eve = eveningDateOn(task.date, eveningTime)
    if (now >= eve) return 'missed'
    return now.getHours() < 5 ? 'upcoming' : 'in_progress'
  }

  const durationMs = Math.max(15, Number(task.duration) || 30) * 60000
  const end = new Date(start.getTime() + durationMs)
  if (now < start) return 'upcoming'
  if (now >= start && now < end) return 'in_progress'
  return 'missed'
}

export function statusMeta(status) {
  switch (status) {
    case 'completed':
      return { label: 'Completed ✓', cls: 'st-done' }
    case 'missed':
      return { label: 'Missed ⚠️', cls: 'st-missed' }
    case 'in_progress':
      return { label: 'In progress', cls: 'st-now' }
    default:
      return { label: 'Upcoming', cls: 'st-up' }
  }
}

export function withStatus(task, now, eveningTime) {
  const status = taskStatus(task, now, eveningTime)
  return { ...task, status }
}

export function buildNotificationEvents(occurrences, settings, now = new Date()) {
  const events = []
  const today = todayISO()
  const horizon = formatISO(addDays(new Date(), 14))

  if (settings.taskReminders) {
    for (const task of occurrences) {
      if (task.completed || task.ignored) continue
      if (task.date < today || task.date > horizon) continue
      const start = taskDateTime(task)
      if (!start) continue
      const offset = reminderOffsetMinutes(task.reminder)
      const emoji = categoryEmoji(task.category)
      const when = formatTime(task.time)
      const data = {
        type: 'task',
        seriesId: task.seriesId,
        date: task.date,
        occurrenceId: task.occurrenceId,
      }

      if (offset != null) {
        const fireAt = start.getTime() - offset * 60000
        if (fireAt > now.getTime() - 36 * 3600000) {
          const title =
            offset === 0
              ? `${emoji} ${task.title} time`
              : `${task.title} starts in ${offset === 60 ? '1 hour' : offset === 1440 ? '1 day' : offset + ' minutes'} ${emoji}`
          const body =
            offset === 0
              ? `Your ${task.title} task is scheduled for ${when}.`
              : `Your ${task.title} task is scheduled for ${when}.`
          events.push({
            id: `task:${task.occurrenceId}:${task.reminder}`,
            fireAt,
            title,
            body,
            tag: `task:${task.occurrenceId}`,
            data: { ...data, type: offset === 0 ? 'at_time' : 'reminder', id: `task:${task.occurrenceId}:${task.reminder}` },
          })
        }
      }

      if (settings.missedReminder) {
        const missAt = start.getTime() + Math.max(15, Number(task.duration) || 15) * 60000
        if (missAt > now.getTime() - 36 * 3600000) {
          events.push({
            id: `missed:${task.occurrenceId}`,
            fireAt: missAt,
            title: '⚠️ Missed task',
            body: `You haven't completed your ${task.title} task yet.`,
            tag: `missed:${task.occurrenceId}`,
            data: { ...data, type: 'missed', id: `missed:${task.occurrenceId}` },
          })
        }
      }
    }
  }

  const todayTasks = occurrences.filter((t) => t.date === today)
  const incomplete = todayTasks.filter((t) => !t.completed && !t.ignored)
  const eve = eveningDateOn(today, settings.eveningTime || '21:00')

  if (settings.eveningReminder && incomplete.length) {
    events.push({
      id: `evening:${today}`,
      fireAt: eve.getTime(),
      title: "Don't forget your goals 🌙",
      body: `You still have ${incomplete.length} task${incomplete.length === 1 ? '' : 's'} left for today.`,
      tag: `evening:${today}`,
      data: { type: 'evening', date: today, id: `evening:${today}`, count: incomplete.length },
    })
  }

  if (settings.dailySummary && incomplete.length && !settings.eveningReminder) {
    events.push({
      id: `summary:${today}`,
      fireAt: eve.getTime(),
      title: 'Finish strong 💪',
      body: `You still have ${incomplete.length} task${incomplete.length === 1 ? '' : 's'} left today. Complete them before the day ends.`,
      tag: `summary:${today}`,
      data: { type: 'summary', date: today, id: `summary:${today}`, count: incomplete.length },
    })
  } else if (settings.dailySummary && incomplete.length && settings.eveningReminder) {
    // Avoid two evening pushes. Daily summary stays in-app.
  }

  return events.filter((e) => Number.isFinite(e.fireAt))
}

export const NOTIFY_LOG_KEY = 'luma.notifyLog.v1'

export function loadNotifyLog() {
  try {
    return JSON.parse(localStorage.getItem(NOTIFY_LOG_KEY) || '{}')
  } catch {
    return {}
  }
}

export function markNotified(id) {
  const log = loadNotifyLog()
  log[id] = Date.now()
  try {
    localStorage.setItem(NOTIFY_LOG_KEY, JSON.stringify(log))
  } catch {
    /* ignore */
  }
}

export function wasNotified(id) {
  return Boolean(loadNotifyLog()[id])
}
