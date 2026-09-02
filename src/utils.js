export function pad(n) {
  return String(n).padStart(2, '0')
}

export function formatISO(date) {
  const d = date instanceof Date ? date : new Date(date)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function parseISO(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayISO() {
  return formatISO(new Date())
}

export function addDays(date, n) {
  const d = new Date(date instanceof Date ? date : parseISO(date))
  d.setDate(d.getDate() + n)
  return d
}

export function addMonths(date, n) {
  const d = new Date(date instanceof Date ? date : parseISO(date))
  const day = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + n)
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(day, last))
  return d
}

export function addYears(date, n) {
  return addMonths(date, n * 12)
}

export function startOfMonth(date) {
  const d = new Date(date instanceof Date ? date : parseISO(date))
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export function endOfMonth(date) {
  const d = new Date(date instanceof Date ? date : parseISO(date))
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

export function isSameDay(a, b) {
  return formatISO(a) === formatISO(b)
}

export function daysBetween(a, b) {
  const da = parseISO(typeof a === 'string' ? a : formatISO(a))
  const db = parseISO(typeof b === 'string' ? b : formatISO(b))
  return Math.round((db - da) / 86400000)
}

export function compareISO(a, b) {
  return a < b ? -1 : a > b ? 1 : 0
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function weekdayName(date, short = false) {
  const d = date instanceof Date ? date : parseISO(date)
  return (short ? WEEKDAYS_SHORT : WEEKDAYS)[d.getDay()]
}

export function monthName(date, short = false) {
  const d = date instanceof Date ? date : parseISO(date)
  return (short ? MONTHS_SHORT : MONTHS)[d.getMonth()]
}

export function formatLongDate(iso) {
  const d = parseISO(iso)
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
}

export function formatMediumDate(iso) {
  const d = parseISO(iso)
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`
}

export function formatPrettyDate(iso) {
  const today = todayISO()
  const tomorrow = formatISO(addDays(new Date(), 1))
  const yesterday = formatISO(addDays(new Date(), -1))
  if (iso === today) return 'Today'
  if (iso === tomorrow) return 'Tomorrow'
  if (iso === yesterday) return 'Yesterday'
  const d = parseISO(iso)
  const t = parseISO(today)
  if (d.getFullYear() === t.getFullYear()) {
    return `${WEEKDAYS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
  }
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`
}

export function formatTime(hhmm) {
  if (!hhmm) return 'All day'
  const [h, m] = hhmm.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hr = ((h + 11) % 12) + 1
  return `${hr}:${pad(m)} ${ampm}`
}

export function formatDuration(mins) {
  if (!mins) return 'No duration'
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (!m) return h === 1 ? '1 hour' : `${h} hours`
  return `${h}h ${m}m`
}

export function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Good night'
}

export function formatClock(date = new Date()) {
  const h = date.getHours()
  const m = pad(date.getMinutes())
  const hr = ((h + 11) % 12) + 1
  return `${hr}:${m}`
}

export function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 't_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function nextOccurrence(date, repeat) {
  const d = date instanceof Date ? new Date(date) : parseISO(date)
  switch (repeat) {
    case 'daily':
      return addDays(d, 1)
    case 'weekdays': {
      let n = addDays(d, 1)
      while (n.getDay() === 0 || n.getDay() === 6) n = addDays(n, 1)
      return n
    }
    case 'weekly':
      return addDays(d, 7)
    case 'biweekly':
      return addDays(d, 14)
    case 'monthly':
      return addMonths(d, 1)
    case 'yearly':
      return addYears(d, 1)
    default:
      return null
  }
}

export function occursOn(series, iso) {
  if (series.repeat === 'none') return series.date === iso
  if (iso < series.date) return false
  if (series.until && iso > series.until) return false
  const start = parseISO(series.date)
  const target = parseISO(iso)
  switch (series.repeat) {
    case 'daily':
      return true
    case 'weekdays': {
      const day = target.getDay()
      return day !== 0 && day !== 6
    }
    case 'weekly':
      return target.getDay() === start.getDay()
    case 'biweekly': {
      if (target.getDay() !== start.getDay()) return false
      const diff = daysBetween(start, target)
      return diff % 14 === 0
    }
    case 'monthly': {
      const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
      const expected = Math.min(start.getDate(), last)
      return target.getDate() === expected
    }
    case 'yearly':
      return target.getMonth() === start.getMonth() && target.getDate() === start.getDate()
    default:
      return false
  }
}

export function expandSeries(series, fromISO, toISO) {
  const results = []
  if (series.repeat === 'none') {
    if (series.date >= fromISO && series.date <= toISO) {
      results.push(makeOccurrence(series, series.date))
    }
    return results
  }

  let cursor = parseISO(series.date)
  const from = parseISO(fromISO)
  const to = parseISO(toISO)
  const until = series.until ? parseISO(series.until) : null
  let guard = 0

  if (cursor < from) {
    if (series.repeat === 'daily') {
      cursor = new Date(from)
    } else if (series.repeat === 'weekdays') {
      cursor = new Date(from)
      while (cursor.getDay() === 0 || cursor.getDay() === 6) cursor = addDays(cursor, 1)
    } else {
      while (cursor < from && guard < 800) {
        const n = nextOccurrence(cursor, series.repeat)
        if (!n) break
        cursor = n
        guard++
      }
    }
  }

  guard = 0
  while (cursor <= to && guard < 800) {
    if (until && cursor > until) break
    const iso = formatISO(cursor)
    if (iso >= series.date && iso >= fromISO) {
      const ex = series.exceptions?.[iso]
      if (!ex || ex.type !== 'deleted') {
        results.push(makeOccurrence(series, iso))
      }
    }
    const n = nextOccurrence(cursor, series.repeat)
    if (!n || formatISO(n) === iso) break
    cursor = n
    guard++
  }
  return results
}

export function makeOccurrence(series, iso) {
  const ex = series.exceptions?.[iso]
  const base = {
    seriesId: series.id,
    date: iso,
    occurrenceId: `${series.id}__${iso}`,
    title: series.title,
    notes: series.notes || '',
    time: series.time || '',
    category: series.category,
    priority: series.priority,
    repeat: series.repeat,
    reminder: series.reminder || 'none',
    duration: series.duration || 0,
    until: series.until || null,
    createdAt: series.createdAt,
    updatedAt: series.updatedAt,
    isRecurring: series.repeat !== 'none',
    isException: false,
    completed: Boolean(series.completedDates?.[iso]),
    completedAt: series.completedDates?.[iso] || null,
    ignored: Boolean(series.ignoredDates?.[iso]),
  }
  if (ex && ex.type === 'modified') {
    return {
      ...base,
      ...ex.fields,
      date: iso,
      isException: true,
      completed: ex.fields.completed ?? base.completed,
      ignored: base.ignored,
    }
  }
  return base
}

export function timeToMinutes(hhmm) {
  if (!hhmm) return 24 * 60 + 1
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function sortOccurrences(list) {
  return [...list].sort((a, b) => {
    if (a.date !== b.date) return compareISO(a.date, b.date)
    const ta = timeToMinutes(a.time)
    const tb = timeToMinutes(b.time)
    if (ta !== tb) return ta - tb
    return (a.title || '').localeCompare(b.title || '')
  })
}

export function groupByDate(list) {
  const map = new Map()
  for (const item of list) {
    if (!map.has(item.date)) map.set(item.date, [])
    map.get(item.date).push(item)
  }
  return map
}

export function vibrate(ms = 12) {
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* ignore */
  }
}
