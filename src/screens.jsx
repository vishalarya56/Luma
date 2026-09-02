import { useEffect, useMemo, useState } from 'react'
import { CATEGORIES, DEFAULT_LEAD_OPTIONS } from './constants.js'
import { EmptyState, ProgressRing, TaskList, categoryOf, repeatOf } from './components.jsx'
import { IconBack, IconCheck, IconChevron, IconGear } from './icons.jsx'
import {
  DENIED_HELP,
  backendHealth,
  notificationsSupported,
  permissionState,
  pushSupported,
  registerServiceWorker,
  sendTestPush,
  serviceWorkerSupported,
} from './notifications.js'
import { enableNotifications } from './NotifyEngine.jsx'
import { useSettings } from './settings.jsx'
import { eveningDateOn, withStatus } from './status.js'
import { useTasks } from './store.jsx'
import {
  addDays,
  formatISO,
  formatLongDate,
  formatPrettyDate,
  formatTime,
  greeting,
  monthName,
  parseISO,
  startOfMonth,
  todayISO,
  weekdayName,
} from './utils.js'

export function HomeScreen({ onOpenSettings, now, ...handlers }) {
  const { occurrencesInRange } = useTasks()
  const { settings } = useSettings()
  const today = todayISO()
  const tomorrow = formatISO(addDays(new Date(), 1))
  const raw = occurrencesInRange(today, today)
  const tasks = raw.map((t) => withStatus(t, now, settings.eveningTime)).sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    return 0
  })
  const timed = [...tasks].sort((a, b) => {
    const ta = a.time || '99:99'
    const tb = b.time || '99:99'
    return ta.localeCompare(tb)
  })
  const done = tasks.filter((t) => t.completed).length
  const missed = tasks.filter((t) => t.status === 'missed' && !t.completed)
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0
  const d = now instanceof Date ? now : new Date()
  const eve = eveningDateOn(today, settings.eveningTime)
  const showSummary = settings.dailySummary && tasks.length > 0 && d >= eve
  const tomorrowTasks = occurrencesInRange(tomorrow, tomorrow)

  return (
    <div className="screen screen-enter">
      <div className="home-head">
        <div>
          <div className="kicker">{greeting()}</div>
          <h1>
            {weekdayName(d)}
            <br />
            {d.getDate()} {monthName(d, true)}
          </h1>
          <div className="sub">A quieter day begins with a clear list.</div>
        </div>
        <div className="head-actions">
          <button className="gear-btn" onClick={onOpenSettings} aria-label="Settings">
            <IconGear />
          </button>
          <ProgressRing done={done} total={tasks.length} />
        </div>
      </div>

      <div className="focus-card">
        <div className="row">
          <span className="label">Today’s tasks</span>
          <span className="count">
            {done} / {tasks.length}
          </span>
        </div>
        <div className="progress-line">
          Completed {done} · {pct}%
        </div>
        <div className="bar">
          <span style={{ width: tasks.length ? `${pct}%` : '0%' }} />
        </div>
      </div>

      {missed.length > 0 && (
        <div className="missed-strip">
          ⚠️ {missed.length} missed task{missed.length === 1 ? '' : 's'} — tap to complete, reschedule, or ignore.
        </div>
      )}

      {showSummary && (
        <div className="summary-card">
          <div className="kicker">Today’s progress</div>
          <h3>Daily summary</h3>
          <div className="summary-stats">
            <div><strong>{tasks.length}</strong><span>Tasks</span></div>
            <div><strong>{done}</strong><span>Completed</span></div>
            <div><strong>{missed.length}</strong><span>Missed</span></div>
            <div><strong>{pct}%</strong><span>Done</span></div>
          </div>
          {tomorrowTasks.length > 0 && (
            <>
              <div className="section-label" style={{ marginTop: 14 }}>Tomorrow’s tasks</div>
              <ul className="mini-list">
                {tomorrowTasks.slice(0, 4).map((t) => (
                  <li key={t.occurrenceId}>
                    <span>{formatTime(t.time)}</span>
                    {t.title}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <div className="section-label">By time</div>
      {tasks.length === 0 ? (
        <EmptyState
          emoji="🌅"
          title="A clear morning"
          text="Nothing scheduled for today. Tap + to plant the first ritual."
        />
      ) : (
        <TaskList tasks={timed} {...handlers} />
      )}
    </div>
  )
}

export function CalendarScreen({ selectedDate, setSelectedDate, ...handlers }) {
  const { occurrencesInRange } = useTasks()
  const [cursor, setCursor] = useState(() => startOfMonth(parseISO(selectedDate)))

  const monthStart = startOfMonth(cursor)
  const startWeekday = monthStart.getDay()
  const gridStart = addDays(monthStart, -startWeekday)
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  const from = formatISO(cells[0])
  const to = formatISO(cells[41])
  const occ = occurrencesInRange(from, to)

  const byDate = useMemo(() => {
    const map = {}
    for (const t of occ) {
      if (!map[t.date]) map[t.date] = []
      map[t.date].push(t)
    }
    return map
  }, [occ])

  const { settings } = useSettings()
  const dayTasks = (byDate[selectedDate] || []).map((t) => withStatus(t, new Date(), settings.eveningTime))
  const today = todayISO()

  const shiftMonth = (n) => {
    const d = new Date(cursor)
    d.setDate(1)
    d.setMonth(d.getMonth() + n)
    setCursor(d)
  }

  return (
    <div className="screen screen-enter">
      <div className="cal-head">
        <h1>
          {monthName(cursor)} {cursor.getFullYear()}
        </h1>
        <div className="cal-nav">
          <button onClick={() => shiftMonth(-1)} aria-label="Previous month">
            <IconChevron />
          </button>
          <button onClick={() => shiftMonth(1)} aria-label="Next month">
            <IconChevron dir="right" />
          </button>
        </div>
      </div>

      <div className="cal-weekdays">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <div className="cal-grid">
        {cells.map((d) => {
          const iso = formatISO(d)
          const mute = d.getMonth() !== cursor.getMonth()
          const sel = iso === selectedDate
          const isToday = iso === today
          const dots = (byDate[iso] || []).slice(0, 3)
          return (
            <button
              key={iso}
              className={'cal-cell' + (mute ? ' mute' : '') + (sel ? ' sel' : '') + (isToday && !sel ? ' today' : '')}
              onClick={() => setSelectedDate(iso)}
            >
              {d.getDate()}
              <div className="dots">
                {dots.map((t) => (
                  <span key={t.occurrenceId} style={{ background: sel ? '#1a1408' : undefined }} />
                ))}
              </div>
            </button>
          )
        })}
      </div>

      <div className="selected-day-title">{formatLongDate(selectedDate)}</div>
      {dayTasks.length ? (
        <TaskList tasks={dayTasks} {...handlers} />
      ) : (
        <EmptyState emoji="🕯" title="Nothing planned" text="An open day. Add a task, or let it stay empty." />
      )}
    </div>
  )
}

export function UpcomingScreen(handlers) {
  const { occurrencesInRange } = useTasks()
  const { settings } = useSettings()
  const today = todayISO()
  const end = formatISO(addDays(new Date(), 14))
  const tasks = occurrencesInRange(today, end)
    .filter((t) => t.date > today)
    .map((t) => withStatus(t, new Date(), settings.eveningTime))

  const groups = useMemo(() => {
    const map = new Map()
    for (const t of tasks) {
      if (!map.has(t.date)) map.set(t.date, [])
      map.get(t.date).push(t)
    }
    return [...map.entries()]
  }, [tasks])

  return (
    <div className="screen screen-enter">
      <h1 className="page-title">Upcoming</h1>
      <p className="page-sub">The next two weeks, in order of appearance.</p>
      {groups.length === 0 ? (
        <EmptyState emoji="🌙" title="Clear horizon" text="No upcoming tasks in the next 14 days." />
      ) : (
        groups.map(([date, items]) => (
          <div className="date-group" key={date}>
            <div className="date-group-h">
              <strong>{formatPrettyDate(date)}</strong>
              <span>{items.length} task{items.length === 1 ? '' : 's'}</span>
            </div>
            <TaskList tasks={items} {...handlers} />
          </div>
        ))
      )}
    </div>
  )
}

export function HabitsScreen({ now, ...handlers }) {
  const { series, occurrencesInRange } = useTasks()
  const today = todayISO()
  const from = formatISO(addDays(new Date(), -28))
  const history = occurrencesInRange(from, today)

  const habits = series
    .filter((s) => s.repeat && s.repeat !== 'none')
    .map((s) => {
      const mine = history.filter((t) => t.seriesId === s.id)
      const todayOcc = mine.find((t) => t.date === today) || null
      let streak = 0
      const byDate = new Map(mine.map((t) => [t.date, t]))
      let d = new Date(now instanceof Date ? now : new Date())
      for (let i = 0; i < 60; i++) {
        const iso = formatISO(d)
        const occ = byDate.get(iso)
        if (!occ) {
          if (iso === today) {
            d = addDays(d, -1)
            continue
          }
          break
        }
        if (occ.completed) streak++
        else if (iso !== today) break
        d = addDays(d, -1)
      }
      const week = []
      for (let i = 6; i >= 0; i--) {
        const iso = formatISO(addDays(new Date(), -i))
        const occ = byDate.get(iso)
        week.push({ iso, done: Boolean(occ?.completed), exists: Boolean(occ) })
      }
      const done28 = mine.filter((t) => t.completed).length
      const total28 = mine.length
      return { series: s, todayOcc, streak, week, done28, total28 }
    })
    .filter((h) => h.todayOcc || h.total28 > 0)

  return (
    <div className="screen screen-enter">
      <h1 className="page-title">Habits</h1>
      <p className="page-sub">Routines that repeat. Check them off today without rewriting the series.</p>
      {habits.length === 0 ? (
        <EmptyState
          emoji="🔥"
          title="No rituals yet"
          text="Create a task and set Repeat to daily, weekly, or weekdays — it will live here."
        />
      ) : (
        <div className="habit-list">
          {habits.map((h) => {
            const cat = categoryOf(h.series.category)
            const todayTask = h.todayOcc
            return (
              <div key={h.series.id} className={'habit-card' + (todayTask?.completed ? ' done' : '')}>
                <button
                  className={'check' + (todayTask?.completed ? ' on' : '')}
                  onClick={() => todayTask && handlers.onToggle(todayTask)}
                  disabled={!todayTask}
                  aria-label="Complete today"
                >
                  <span className="visually-hidden" />
                </button>
                <button
                  className="habit-main"
                  onClick={() => todayTask && handlers.onOpen(todayTask)}
                >
                  <div className="habit-top">
                    <div>
                      <div className="task-title">{h.series.title}</div>
                      <div className="task-meta">
                        <span className="chip">{cat.emoji} {cat.name}</span>
                        <span className="chip repeat">{repeatOf(h.series.repeat).name}</span>
                        {h.series.time ? <span className="chip time">{formatTime(h.series.time)}</span> : null}
                      </div>
                    </div>
                    <div className="habit-streak">
                      <strong>{h.streak}</strong>
                      <span>streak</span>
                    </div>
                  </div>
                  <div className="habit-week">
                    {h.week.map((d) => (
                      <span
                        key={d.iso}
                        className={'hd' + (d.done ? ' on' : '') + (!d.exists ? ' mute' : '')}
                        title={d.iso}
                      />
                    ))}
                  </div>
                  <div className="habit-foot">
                    {h.done28}/{h.total28} in 4 weeks
                    {todayTask ? (todayTask.completed ? ' · done today' : ' · due today') : ' · not today'}
                  </div>
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function StatsScreen() {
  const { occurrencesInRange } = useTasks()
  const today = todayISO()
  const from = formatISO(addDays(new Date(), -28))
  const to = today
  const range = occurrencesInRange(from, to)
  const completed = range.filter((t) => t.completed)
  const rate = range.length ? Math.round((completed.length / range.length) * 100) : 0

  let streak = 0
  {
    let d = new Date()
    for (let i = 0; i < 60; i++) {
      const iso = formatISO(d)
      const dayTasks = range.filter((t) => t.date === iso)
      if (!dayTasks.length) {
        if (iso === today) {
          d = addDays(d, -1)
          continue
        }
        break
      }
      if (dayTasks.every((t) => t.completed)) streak++
      else break
      d = addDays(d, -1)
    }
  }

  const week = []
  for (let i = 6; i >= 0; i--) {
    const iso = formatISO(addDays(new Date(), -i))
    const day = range.filter((t) => t.date === iso)
    week.push({
      iso,
      label: weekdayName(iso, true).slice(0, 2),
      done: day.filter((t) => t.completed).length,
      total: day.length,
    })
  }
  const maxDone = Math.max(1, ...week.map((w) => w.done))

  const catCounts = CATEGORIES.map((c) => ({
    ...c,
    n: completed.filter((t) => t.category === c.id).length,
  })).filter((c) => c.n > 0)
  const maxCat = Math.max(1, ...catCounts.map((c) => c.n))

  const minutes = completed.reduce((s, t) => s + (Number(t.duration) || 0), 0)

  return (
    <div className="screen screen-enter">
      <h1 className="page-title">Insights</h1>
      <p className="page-sub">The last four weeks, quietly measured.</p>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="lbl">Completion</div>
          <div className="num">{rate}%</div>
          <div className="hint">{completed.length} of {range.length} done</div>
        </div>
        <div className="stat-card">
          <div className="lbl">Streak</div>
          <div className="num">{streak}</div>
          <div className="hint">{streak === 1 ? 'day' : 'days'} in a row</div>
        </div>
        <div className="stat-card">
          <div className="lbl">Focused time</div>
          <div className="num">{Math.round(minutes / 60)}h</div>
          <div className="hint">{minutes} minutes logged</div>
        </div>
        <div className="stat-card">
          <div className="lbl">This week</div>
          <div className="num">{week.reduce((s, w) => s + w.done, 0)}</div>
          <div className="hint">tasks completed</div>
        </div>

        <div className="stat-card wide">
          <div className="lbl">Week in bars</div>
          <div className="week-bars">
            {week.map((w) => (
              <div className="week-bar" key={w.iso}>
                <div
                  className={'col' + (w.done ? '' : ' empty')}
                  style={{ height: w.done ? `${Math.max(12, (w.done / maxDone) * 72)}px` : undefined }}
                />
                <div className="d">{w.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="stat-card wide">
          <div className="lbl">By category</div>
          {catCounts.length === 0 && <div className="hint" style={{ marginTop: 10 }}>Complete a few tasks to see the mix.</div>}
          {catCounts
            .sort((a, b) => b.n - a.n)
            .map((c) => (
              <div className="cat-row" key={c.id}>
                <span>{c.emoji}</span>
                <span className="name">{c.name}</span>
                <div className="mini-bar">
                  <span style={{ width: `${(c.n / maxCat) * 100}%`, background: c.color }} />
                </div>
                <span className="n">{c.n}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

function Toggle({ on, onChange }) {
  return (
    <button
      className={'toggle' + (on ? ' on' : '')}
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
    >
      <span />
    </button>
  )
}

export function SettingsScreen({ onClose, onToast }) {
  const { settings, updateSettings } = useSettings()
  const [perm, setPerm] = useState(permissionState)
  const [health, setHealth] = useState({ ok: false })
  const [busy, setBusy] = useState(false)
  const [swReady, setSwReady] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setPerm(permissionState())
    backendHealth().then(setHealth)
    if (serviceWorkerSupported()) {
      registerServiceWorker().then((r) => setSwReady(Boolean(r)))
    }
  }, [])

  const enable = async () => {
    setBusy(true)
    setError('')
    const result = await enableNotifications()
    setPerm(result.state)
    setBusy(false)
    if (result.state === 'denied') {
      setError(DENIED_HELP)
      return
    }
    if (result.state === 'unsupported') {
      setError(result.error || 'Notifications are not supported in this browser.')
      return
    }
    if (result.state === 'granted') {
      const h = await backendHealth()
      setHealth(h)
      if (result.pushError) {
        setError('Permission granted. Closed-app push failed: ' + result.pushError)
      } else if (!h.ok) {
        setError('Permission granted. The notify server is offline — reminders still fire while Luma is open.')
      } else {
        onToast?.('Notifications enabled ✓')
      }
    }
  }

  const test = async () => {
    setBusy(true)
    setError('')
    try {
      if (permissionState() !== 'granted') {
        await enable()
      }
      const reg = await registerServiceWorker()
      const h = await backendHealth()
      if (h.ok && pushSupported() && permissionState() === 'granted') {
        await sendTestPush(reg)
        onToast?.('Test notification sent ✓')
      } else if (permissionState() === 'granted' && reg) {
        await reg.showNotification('Luma is ready ✨', {
          body: 'Local notifications work. Closed-app push needs the notify server.',
          icon: '/icon-192.png',
        })
        onToast?.('Local test notification shown ✓')
      } else {
        setError('Enable notifications first.')
      }
    } catch (err) {
      setError(err?.message || 'Test failed')
    }
    setBusy(false)
  }

  const toggleMaster = async (on) => {
    updateSettings({ taskReminders: on })
    if (on && permissionState() !== 'granted') await enable()
  }

  return (
    <div className="sheet-full">
      <div className="sheet-bar">
        <button className="ghost" onClick={onClose} aria-label="Back">
          <IconBack />
        </button>
        <h2>Settings</h2>
        <span className="ghost" />
      </div>
      <div className="body">
        <div className="kicker">Appearance</div>
        <h3 className="settings-title">Look & feel</h3>
        <p className="page-sub">Dark is the default. Light is a warm paper theme — same type, same gold.</p>
        <div className="theme-seg">
          <button
            className={settings.theme !== 'light' ? 'on' : ''}
            onClick={() => updateSettings({ theme: 'dark' })}
          >
            Dark mode
          </button>
          <button
            className={settings.theme === 'light' ? 'on' : ''}
            onClick={() => updateSettings({ theme: 'light' })}
          >
            Light mode
          </button>
        </div>

        <div className="kicker" style={{ marginTop: 22 }}>Notifications</div>
        <h3 className="settings-title">Reminders that actually arrive</h3>
        <p className="page-sub">Luma uses the Web Notifications API, a service worker, and Web Push so reminders can fire even when the app is closed.</p>

        {perm === 'denied' && <div className="perm-banner bad">{DENIED_HELP}</div>}
        {perm === 'unsupported' && (
          <div className="perm-banner bad">This browser cannot show notifications. Try Chrome or Edge on Android, or Safari 16.4+ on an installed Home Screen app.</div>
        )}
        {error && <div className="perm-banner bad">{error}</div>}
        {perm === 'granted' && !error && <div className="perm-banner ok">Notifications are allowed on this device.</div>}

        <div className="settings-card">
          <div className="set-row">
            <div>
              <div className="t">Task reminders</div>
              <div className="h">At the task time, and before it</div>
            </div>
            <Toggle on={settings.taskReminders} onChange={toggleMaster} />
          </div>
          <div className="set-row col">
            <div className="t">Reminder before task</div>
            <div className="h">Default lead time for new tasks</div>
            <div className="lead-row">
              {DEFAULT_LEAD_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  className={settings.defaultReminder === o.id ? 'on' : ''}
                  onClick={() => updateSettings({ defaultReminder: o.id })}
                >
                  {o.name}
                </button>
              ))}
            </div>
          </div>
          <div className="set-row">
            <div>
              <div className="t">Evening reminder</div>
              <div className="h">Nudge only if tasks are still open</div>
            </div>
            <Toggle on={settings.eveningReminder} onChange={(v) => updateSettings({ eveningReminder: v })} />
          </div>
          <div className="set-row">
            <div>
              <div className="t">Evening reminder time</div>
              <div className="h">Default 9:00 PM</div>
            </div>
            <div className="native-wrap compact">
              <input
                type="time"
                value={settings.eveningTime}
                onChange={(e) => updateSettings({ eveningTime: e.target.value || '21:00' })}
              />
            </div>
          </div>
          <div className="set-row">
            <div>
              <div className="t">Missed task reminder</div>
              <div className="h">Once, if a timed task slips by</div>
            </div>
            <Toggle on={settings.missedReminder} onChange={(v) => updateSettings({ missedReminder: v })} />
          </div>
          <div className="set-row">
            <div>
              <div className="t">Daily summary</div>
              <div className="h">In-app wrap-up at evening time</div>
            </div>
            <Toggle on={settings.dailySummary} onChange={(v) => updateSettings({ dailySummary: v })} />
          </div>
        </div>

        <div className="details-actions" style={{ marginTop: 16 }}>
          {perm !== 'granted' && (
            <button className="big-btn edit" disabled={busy} onClick={enable}>
              {busy ? 'Requesting…' : 'Enable notifications'}
            </button>
          )}
          <button className="big-btn soft" disabled={busy} onClick={test}>
            Send test notification
          </button>
        </div>

        <div className="settings-card" style={{ marginTop: 18 }}>
          <div className="kicker">Status</div>
          <div className="cap-list">
            <div><span>Permission</span><strong>{perm}</strong></div>
            <div><span>Notifications API</span><strong>{notificationsSupported() ? 'yes' : 'no'}</strong></div>
            <div><span>Service worker</span><strong>{swReady ? 'ready' : serviceWorkerSupported() ? 'registering' : 'no'}</strong></div>
            <div><span>Web Push</span><strong>{pushSupported() ? 'yes' : 'no'}</strong></div>
            <div><span>Notify server</span><strong>{health.ok ? 'connected' : 'offline'}</strong></div>
          </div>
          <p className="tiny-help">
            Closed-app reminders need this page on HTTPS, notification permission, and the Luma notify server running. While the app is open, due reminders still show as real system notifications through the service worker.
          </p>
        </div>
      </div>
    </div>
  )
}
