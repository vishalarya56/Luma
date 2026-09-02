import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { STORAGE_KEY } from './constants.js'
import {
  addDays,
  expandSeries,
  formatISO,
  makeOccurrence,
  parseISO,
  sortOccurrences,
  todayISO,
  uid,
} from './utils.js'

const TaskContext = createContext(null)

function emptySeries(fields) {
  const now = new Date().toISOString()
  return {
    id: uid(),
    title: fields.title?.trim() || 'Untitled task',
    notes: fields.notes?.trim() || '',
    date: fields.date || todayISO(),
    time: fields.time || '',
    category: fields.category || 'personal',
    priority: fields.priority || 'medium',
    repeat: fields.repeat || 'none',
    reminder: fields.reminder || 'none',
    duration: Number(fields.duration) || 0,
    until: fields.until || null,
    exceptions: {},
    completedDates: {},
    ignoredDates: {},
    createdAt: now,
    updatedAt: now,
  }
}

function buildSeed() {
  const today = new Date()
  const iso = formatISO(today)
  const yesterday = formatISO(addDays(today, -1))
  const weekdayStart = formatISO(addDays(today, -28))

  const completedMostDays = (startISO, rate = 0.78) => {
    const map = {}
    let d = parseISO(startISO)
    const end = parseISO(iso)
    let i = 0
    while (d < end) {
      const key = formatISO(d)
      const day = d.getDay()
      if (day !== 0 && (i % 7 !== 3) && Math.random() < rate + 0.15) {
        map[key] = `${key}T07:12:00.000Z`
      } else if (Math.random() < rate) {
        map[key] = `${key}T07:12:00.000Z`
      }
      d = addDays(d, 1)
      i++
    }
    return map
  }

  const gymStart = (() => {
    const d = new Date(today)
    const delta = (d.getDay() - 3 + 7) % 7
    d.setDate(d.getDate() - delta - 21)
    return formatISO(d)
  })()

  const gymCompleted = {}
  {
    let d = parseISO(gymStart)
    const end = parseISO(iso)
    while (d < end) {
      gymCompleted[formatISO(d)] = true
      d = addDays(d, 7)
    }
  }

  const standupStart = weekdayStart
  const standupCompleted = {}
  {
    let d = parseISO(standupStart)
    const end = parseISO(iso)
    while (d < end) {
      const day = d.getDay()
      if (day !== 0 && day !== 6) standupCompleted[formatISO(d)] = true
      d = addDays(d, 1)
    }
  }

  return [
    emptySeries({
      title: 'Go to Gym',
      notes: 'Push day — bench, overhead press, triceps. Don’t skip the warm-up.',
      date: gymStart,
      time: '17:00',
      category: 'fitness',
      priority: 'high',
      repeat: 'weekly',
      reminder: '30min',
      duration: 60,
    }),
    emptySeries({
      title: 'Morning meditation',
      notes: 'Ten minutes of breathwork by the window. Phone in another room.',
      date: formatISO(addDays(today, -30)),
      time: '07:00',
      category: 'health',
      priority: 'medium',
      repeat: 'daily',
      reminder: 'at_time',
      duration: 15,
    }),
    emptySeries({
      title: 'Team standup',
      notes: 'Share yesterday, today, and blockers. Keep it tight.',
      date: standupStart,
      time: '10:00',
      category: 'work',
      priority: 'medium',
      repeat: 'weekdays',
      reminder: '5min',
      duration: 15,
    }),
    emptySeries({
      title: 'Review project proposal',
      notes: 'Q4 campaign deck — check the budget slide and the timeline.',
      date: iso,
      time: '14:00',
      category: 'work',
      priority: 'high',
      repeat: 'none',
      reminder: '1hour',
      duration: 90,
    }),
    emptySeries({
      title: 'Buy groceries',
      notes: 'Milk, spinach, eggs, oats, tomatoes, dark chocolate.',
      date: iso,
      time: '19:00',
      category: 'home',
      priority: 'low',
      repeat: 'none',
      reminder: 'none',
      duration: 45,
    }),
    emptySeries({
      title: 'Read 20 pages',
      notes: 'Continue Atomic Habits — identity and systems.',
      date: formatISO(addDays(today, -12)),
      time: '21:30',
      category: 'study',
      priority: 'low',
      repeat: 'daily',
      reminder: 'none',
      duration: 30,
    }),
    emptySeries({
      title: 'Call mom',
      notes: 'Ask about the garden and Sunday lunch.',
      date: formatISO(addDays(today, 1)),
      time: '18:30',
      category: 'social',
      priority: 'medium',
      repeat: 'none',
      reminder: '15min',
      duration: 30,
    }),
    emptySeries({
      title: 'Weekly budget review',
      notes: 'Reconcile cards, update the savings envelope, check subscriptions.',
      date: formatISO(addDays(today, 3)),
      time: '11:00',
      category: 'finance',
      priority: 'high',
      repeat: 'monthly',
      reminder: '1hour',
      duration: 45,
    }),
    emptySeries({
      title: 'Evening walk',
      notes: 'A slow loop around the park. Leave the headphones at home.',
      date: formatISO(addDays(today, -18)),
      time: '18:15',
      category: 'health',
      priority: 'low',
      repeat: 'daily',
      reminder: 'none',
      duration: 30,
    }),
    emptySeries({
      title: 'Design critique',
      notes: 'Walk through the new onboarding with the team.',
      date: formatISO(addDays(today, 2)),
      time: '16:00',
      category: 'work',
      priority: 'medium',
      repeat: 'none',
      reminder: '15min',
      duration: 60,
    }),
    emptySeries({
      title: 'Water the plants',
      notes: 'Fern, pothos, and the little succulent on the sill.',
      date: yesterday,
      time: '09:00',
      category: 'home',
      priority: 'low',
      repeat: 'none',
      reminder: 'none',
      duration: 10,
    }),
  ].map((s, idx) => {
    if (s.title === 'Morning meditation') s.completedDates = completedMostDays(s.date, 0.82)
    if (s.title === 'Read 20 pages') s.completedDates = completedMostDays(s.date, 0.6)
    if (s.title === 'Evening walk') s.completedDates = completedMostDays(s.date, 0.7)
    if (s.title === 'Go to Gym') s.completedDates = gymCompleted
    if (s.title === 'Team standup') s.completedDates = standupCompleted
    if (s.title === 'Water the plants') s.completedDates = { [yesterday]: true }
    s.id = 'seed_' + (idx + 1)
    return s
  })
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length) return parsed
    }
  } catch {
    /* ignore */
  }
  return buildSeed()
}

export function TaskProvider({ children }) {
  const [series, setSeries] = useState(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(series))
    } catch {
      /* ignore */
    }
  }, [series])

  const api = useMemo(() => {
    const getSeries = (id) => series.find((s) => s.id === id) || null

    const occurrencesInRange = (fromISO, toISO) => {
      const all = []
      for (const s of series) {
        all.push(...expandSeries(s, fromISO, toISO))
      }
      return sortOccurrences(all)
    }

    const getOccurrence = (seriesId, date) => {
      const s = getSeries(seriesId)
      if (!s) return null
      if (s.repeat === 'none' && s.date !== date) {
        if (s.date === date) return makeOccurrence(s, date)
      }
      const list = expandSeries(s, date, date)
      return list[0] || makeOccurrence(s, date)
    }

    const addTask = (fields) => {
      const s = emptySeries(fields)
      setSeries((prev) => [s, ...prev])
      return s
    }

    const applyFields = (target, fields) => {
      const next = { ...target, updatedAt: new Date().toISOString() }
      const keys = ['title', 'notes', 'time', 'category', 'priority', 'reminder', 'duration', 'repeat', 'date']
      for (const k of keys) {
        if (fields[k] !== undefined) next[k] = k === 'title' || k === 'notes' ? String(fields[k]) : fields[k]
      }
      if (fields.duration !== undefined) next.duration = Number(fields.duration) || 0
      return next
    }

    const updateTask = (seriesId, date, fields, scope = 'this') => {
      setSeries((prev) => {
        const current = prev.find((s) => s.id === seriesId)
        if (!current) return prev

        if (current.repeat === 'none' || scope === 'all') {
          return prev.map((s) => {
            if (s.id !== seriesId) return s
            const next = applyFields(s, fields)
            if (fields.date && fields.date !== s.date && s.repeat === 'none') {
              if (s.completedDates?.[s.date] && fields.date !== s.date) {
                next.completedDates = { ...s.completedDates, [fields.date]: s.completedDates[s.date] }
              }
            }
            return next
          })
        }

        if (scope === 'this') {
          const moved = fields.date && fields.date !== date
          if (moved) {
            const occFields = {
              title: fields.title ?? current.title,
              notes: fields.notes ?? current.notes,
              time: fields.time ?? current.time,
              category: fields.category ?? current.category,
              priority: fields.priority ?? current.priority,
              reminder: fields.reminder ?? current.reminder,
              duration: fields.duration ?? current.duration,
              date: fields.date,
              repeat: 'none',
            }
            const neu = emptySeries(occFields)
            if (current.completedDates?.[date]) {
              neu.completedDates = { [fields.date]: current.completedDates[date] }
            }
            return prev
              .map((s) => {
                if (s.id !== seriesId) return s
                return {
                  ...s,
                  exceptions: { ...(s.exceptions || {}), [date]: { type: 'deleted' } },
                  updatedAt: new Date().toISOString(),
                }
              })
              .concat(neu)
          }
          return prev.map((s) => {
            if (s.id !== seriesId) return s
            const exceptions = { ...(s.exceptions || {}) }
            const existing = exceptions[date]
            const prevFields = existing?.type === 'modified' ? existing.fields : {}
            exceptions[date] = {
              type: 'modified',
              fields: {
                ...prevFields,
                title: fields.title ?? prevFields.title ?? s.title,
                notes: fields.notes ?? prevFields.notes ?? s.notes,
                time: fields.time ?? prevFields.time ?? s.time,
                category: fields.category ?? prevFields.category ?? s.category,
                priority: fields.priority ?? prevFields.priority ?? s.priority,
                reminder: fields.reminder ?? prevFields.reminder ?? s.reminder,
                duration: fields.duration ?? prevFields.duration ?? s.duration,
              },
            }
            return { ...s, exceptions, updatedAt: new Date().toISOString() }
          })
        }

        if (scope === 'future') {
          const until = formatISO(addDays(parseISO(date), -1))
          const old = {
            ...current,
            until: until < current.date ? current.date : until,
            updatedAt: new Date().toISOString(),
          }
          if (old.until < old.date) {
            // series hasn't started producing past occurrences — just update it
            return prev.map((s) => (s.id === seriesId ? applyFields({ ...s, date }, fields) : s))
          }
          const keptCompleted = {}
          for (const [k, v] of Object.entries(current.completedDates || {})) {
            if (k < date) keptCompleted[k] = v
          }
          old.completedDates = keptCompleted
          const keptEx = {}
          for (const [k, v] of Object.entries(current.exceptions || {})) {
            if (k < date) keptEx[k] = v
          }
          old.exceptions = keptEx

          const futureCompleted = {}
          for (const [k, v] of Object.entries(current.completedDates || {})) {
            if (k >= date) futureCompleted[k] = v
          }
          const futureEx = {}
          for (const [k, v] of Object.entries(current.exceptions || {})) {
            if (k >= date) futureEx[k] = v
          }

          const neu = applyFields(emptySeries({ ...current, ...fields, date }), fields)
          neu.completedDates = futureCompleted
          neu.exceptions = futureEx
          neu.until = current.until || null
          return prev.map((s) => (s.id === seriesId ? old : s)).concat(neu)
        }

        return prev
      })
    }

    const deleteTask = (seriesId, date, scope = 'this') => {
      setSeries((prev) => {
        const current = prev.find((s) => s.id === seriesId)
        if (!current) return prev

        if (current.repeat === 'none' || scope === 'all') {
          return prev.filter((s) => s.id !== seriesId)
        }

        if (scope === 'this') {
          return prev.map((s) => {
            if (s.id !== seriesId) return s
            return {
              ...s,
              exceptions: { ...(s.exceptions || {}), [date]: { type: 'deleted' } },
              updatedAt: new Date().toISOString(),
            }
          })
        }

        if (scope === 'future') {
          const until = formatISO(addDays(parseISO(date), -1))
          if (until < current.date) return prev.filter((s) => s.id !== seriesId)
          return prev.map((s) => {
            if (s.id !== seriesId) return s
            const keptCompleted = {}
            for (const [k, v] of Object.entries(s.completedDates || {})) {
              if (k < date) keptCompleted[k] = v
            }
            const keptEx = {}
            for (const [k, v] of Object.entries(s.exceptions || {})) {
              if (k < date) keptEx[k] = v
            }
            return {
              ...s,
              until,
              completedDates: keptCompleted,
              exceptions: keptEx,
              updatedAt: new Date().toISOString(),
            }
          })
        }
        return prev
      })
    }

    const toggleComplete = (seriesId, date) => {
      setSeries((prev) =>
        prev.map((s) => {
          if (s.id !== seriesId) return s
          const completedDates = { ...(s.completedDates || {}) }
          const exceptions = { ...(s.exceptions || {}) }
          const occEx = exceptions[date]
          if (occEx?.type === 'modified') {
            const currently = occEx.fields.completed ?? Boolean(completedDates[date])
            occEx.fields = { ...occEx.fields, completed: !currently }
            if (!currently) completedDates[date] = new Date().toISOString()
            else delete completedDates[date]
            return { ...s, completedDates, exceptions: { ...exceptions, [date]: occEx }, updatedAt: new Date().toISOString() }
          }
          if (completedDates[date]) {
            delete completedDates[date]
          } else {
            completedDates[date] = new Date().toISOString()
          }
          return { ...s, completedDates, updatedAt: new Date().toISOString() }
        })
      )
    }

    const ignoreMissed = (seriesId, date) => {
      setSeries((prev) =>
        prev.map((s) => {
          if (s.id !== seriesId) return s
          return {
            ...s,
            ignoredDates: { ...(s.ignoredDates || {}), [date]: true },
            updatedAt: new Date().toISOString(),
          }
        })
      )
    }

    const rescheduleTask = (seriesId, date, { date: newDate, time: newTime }) => {
      const current = getSeries(seriesId)
      if (!current) return
      const fields = {
        date: newDate || date,
        time: newTime === undefined ? undefined : newTime,
      }
      const scope = current.repeat === 'none' ? 'all' : 'this'
      updateTask(seriesId, date, fields, scope)
    }

    const duplicateFrom = (seriesId, date) => {
      const occ = getOccurrence(seriesId, date)
      if (!occ) return null
      return {
        title: occ.title.endsWith(' (copy)') ? occ.title : `${occ.title} (copy)`,
        notes: occ.notes,
        date: occ.date,
        time: occ.time,
        category: occ.category,
        priority: occ.priority,
        repeat: 'none',
        reminder: occ.reminder,
        duration: occ.duration,
      }
    }

    return {
      series,
      getSeries,
      occurrencesInRange,
      getOccurrence,
      addTask,
      updateTask,
      deleteTask,
      toggleComplete,
      ignoreMissed,
      rescheduleTask,
      duplicateFrom,
    }
  }, [series])

  return <TaskContext.Provider value={api}>{children}</TaskContext.Provider>
}

export function useTasks() {
  const ctx = useContext(TaskContext)
  if (!ctx) throw new Error('useTasks must be used within TaskProvider')
  return ctx
}
