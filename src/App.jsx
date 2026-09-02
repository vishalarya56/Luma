import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActionSheet,
  BottomNav,
  ConfirmDelete,
  Fab,
  RecurringScope,
  RescheduleSheet,
  StatusBar,
  TaskDetails,
  TaskForm,
  Toast,
  useToast,
} from './components.jsx'
import { NotifyEngine } from './NotifyEngine.jsx'
import { CalendarScreen, HabitsScreen, HomeScreen, SettingsScreen, StatsScreen, UpcomingScreen } from './screens.jsx'
import { SettingsProvider, useSettings } from './settings.jsx'
import { withStatus } from './status.js'
import { TaskProvider, useTasks } from './store.jsx'
import { formatPrettyDate, todayISO, vibrate } from './utils.js'

function Shell() {
  const {
    getOccurrence,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
    duplicateFrom,
    ignoreMissed,
    rescheduleTask,
  } = useTasks()
  const { settings } = useSettings()

  const [screen, setScreen] = useState('home')
  const [selectedDate, setSelectedDate] = useState(todayISO)
  const [toast, setToast] = useToast()
  const [now, setNow] = useState(() => new Date())

  const [details, setDetails] = useState(null)
  const [menu, setMenu] = useState(null)
  const [form, setForm] = useState(null)
  const [scopePrompt, setScopePrompt] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [reschedule, setReschedule] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(t)
  }, [])

  const toggleRef = useRef(toggleComplete)
  toggleRef.current = toggleComplete

  useEffect(() => {
    const applyNav = (url) => {
      try {
        const u = new URL(url, window.location.origin)
        const seriesId = u.searchParams.get('seriesId')
        const date = u.searchParams.get('date')
        const action = u.searchParams.get('action')
        if (seriesId && date) {
          if (action === 'complete') {
            toggleRef.current(seriesId, date)
            setToast('Marked complete ✓')
          }
          setDetails({ seriesId, date })
          if (action === 'reschedule') setReschedule({ seriesId, date })
        } else if (u.searchParams.get('open') === 'evening' || u.searchParams.get('open') === 'summary') {
          setScreen('home')
        }
      } catch {
        /* ignore */
      }
    }

    const params = new URLSearchParams(window.location.search)
    if (params.get('seriesId') || params.get('open')) applyNav(window.location.href)

    const onMsg = (event) => {
      if (event.data?.type === 'NOTIFICATION_NAV' && event.data.url) applyNav(event.data.url)
    }
    navigator.serviceWorker?.addEventListener?.('message', onMsg)
    return () => navigator.serviceWorker?.removeEventListener?.('message', onMsg)
  }, [toggleComplete, setToast])

  const stamp = (task) => (task ? withStatus(task, now, settings.eveningTime) : null)

  const liveDetails = useMemo(() => {
    if (!details) return null
    return stamp(getOccurrence(details.seriesId, details.date) || details)
  }, [details, getOccurrence, now, settings.eveningTime])

  const openDetails = (task) => {
    setMenu(null)
    setDetails({ seriesId: task.seriesId, date: task.date })
  }

  const openMenu = (task) => {
    setMenu({ seriesId: task.seriesId, date: task.date })
  }

  const liveMenu = stamp(menu ? getOccurrence(menu.seriesId, menu.date) : null)
  const liveReschedule = stamp(reschedule ? getOccurrence(reschedule.seriesId, reschedule.date) : null)

  const beginEdit = (task) => {
    setMenu(null)
    if (task.isRecurring) {
      setScopePrompt({
        kind: 'edit',
        seriesId: task.seriesId,
        date: task.date,
        title: 'What do you want to edit?',
      })
    } else {
      setForm({
        mode: 'edit',
        scope: 'all',
        seriesId: task.seriesId,
        date: task.date,
        initial: { ...task },
      })
    }
  }

  const beginDelete = (task) => {
    setMenu(null)
    if (task.isRecurring) {
      setScopePrompt({
        kind: 'delete',
        seriesId: task.seriesId,
        date: task.date,
        title: 'What do you want to delete?',
      })
    } else {
      setConfirm({ seriesId: task.seriesId, date: task.date, scope: 'all' })
    }
  }

  const beginDuplicate = (task) => {
    setMenu(null)
    const initial = duplicateFrom(task.seriesId, task.date)
    setForm({
      mode: 'add',
      scope: null,
      seriesId: null,
      date: task.date,
      initial,
    })
  }

  const beginReschedule = (task) => {
    setMenu(null)
    setReschedule({ seriesId: task.seriesId, date: task.date })
  }

  const handleToggle = (task) => {
    toggleComplete(task.seriesId, task.date)
    vibrate(8)
    const next = !task.completed
    setToast(next ? 'Marked complete ✓' : 'Marked incomplete')
  }

  const handleSave = (fields) => {
    if (!form) return
    if (form.mode === 'edit') {
      updateTask(form.seriesId, form.date, fields, form.scope || 'this')
      setToast('Task updated successfully ✓')
      if (details) {
        const moved = form.scope === 'this' && fields.date && fields.date !== form.date
        setDetails(moved ? null : { seriesId: form.seriesId, date: fields.date || form.date })
      }
    } else {
      const created = addTask(fields)
      setToast('Task created successfully ✓')
      setDetails({ seriesId: created.id, date: created.date })
    }
    setForm(null)
  }

  const confirmDelete = () => {
    if (!confirm) return
    deleteTask(confirm.seriesId, confirm.date, confirm.scope || 'this')
    setConfirm(null)
    setDetails(null)
    setToast('Task deleted')
    vibrate(18)
  }

  const listHandlers = {
    onOpen: openDetails,
    onMenu: openMenu,
    onToggle: handleToggle,
  }

  return (
    <div className="app-shell">
      <div className="phone" data-theme={settings.theme === 'light' ? 'light' : 'dark'}>
        <StatusBar />
        <NotifyEngine />

        {screen === 'home' && (
          <HomeScreen {...listHandlers} now={now} onOpenSettings={() => setSettingsOpen(true)} />
        )}
        {screen === 'calendar' && (
          <CalendarScreen selectedDate={selectedDate} setSelectedDate={setSelectedDate} {...listHandlers} />
        )}
        {screen === 'upcoming' && <UpcomingScreen {...listHandlers} />}
        {screen === 'habits' && <HabitsScreen {...listHandlers} now={now} />}
        {screen === 'stats' && <StatsScreen />}

        {!details && !form && !settingsOpen && screen !== 'stats' && (
          <Fab
            onClick={() =>
              setForm({
                mode: 'add',
                initial: {
                  title: '',
                  notes: '',
                  date: screen === 'calendar' ? selectedDate : todayISO(),
                  time: '',
                  category: 'personal',
                  priority: 'medium',
                  repeat: 'none',
                  reminder: settings.defaultReminder || '15min',
                  duration: 30,
                },
              })
            }
          />
        )}

        <BottomNav screen={screen} onChange={setScreen} />

        {liveDetails && !form && !settingsOpen && (
          <TaskDetails
            task={liveDetails}
            onClose={() => setDetails(null)}
            onEdit={() => beginEdit(liveDetails)}
            onDuplicate={() => beginDuplicate(liveDetails)}
            onDelete={() => beginDelete(liveDetails)}
            onToggle={handleToggle}
            onReschedule={() => beginReschedule(liveDetails)}
            onIgnore={() => {
              ignoreMissed(liveDetails.seriesId, liveDetails.date)
              setToast('Missed task ignored')
            }}
          />
        )}

        {form && (
          <TaskForm
            mode={form.mode}
            initial={form.initial}
            scope={form.scope}
            onCancel={() => setForm(null)}
            onSave={handleSave}
          />
        )}

        {settingsOpen && (
          <SettingsScreen onClose={() => setSettingsOpen(false)} onToast={setToast} />
        )}

        {liveMenu && !form && !scopePrompt && !confirm && !reschedule && !settingsOpen && (
          <ActionSheet
            task={liveMenu}
            onClose={() => setMenu(null)}
            onEdit={() => beginEdit(liveMenu)}
            onComplete={() => {
              handleToggle(liveMenu)
              setMenu(null)
            }}
            onDuplicate={() => beginDuplicate(liveMenu)}
            onDelete={() => beginDelete(liveMenu)}
            onReschedule={() => beginReschedule(liveMenu)}
          />
        )}

        {scopePrompt && (
          <RecurringScope
            title={scopePrompt.title}
            dateLabel={formatPrettyDate(scopePrompt.date).toLowerCase()}
            onCancel={() => setScopePrompt(null)}
            onContinue={(scope) => {
              const task = getOccurrence(scopePrompt.seriesId, scopePrompt.date)
              const sp = scopePrompt
              setScopePrompt(null)
              if (!task) return
              if (sp.kind === 'edit') {
                setForm({
                  mode: 'edit',
                  scope,
                  seriesId: sp.seriesId,
                  date: sp.date,
                  initial: { ...task },
                })
              } else {
                setConfirm({ seriesId: sp.seriesId, date: sp.date, scope })
              }
            }}
          />
        )}

        {confirm && (
          <ConfirmDelete onCancel={() => setConfirm(null)} onConfirm={confirmDelete} />
        )}

        {liveReschedule && (
          <RescheduleSheet
            task={liveReschedule}
            onCancel={() => setReschedule(null)}
            onConfirm={({ date, time }) => {
              const sameDay = date === liveReschedule.date
              rescheduleTask(liveReschedule.seriesId, liveReschedule.date, { date, time })
              setReschedule(null)
              setDetails(sameDay ? { seriesId: liveReschedule.seriesId, date } : null)
              setToast('Task rescheduled ✓')
            }}
          />
        )}

        <Toast message={toast} />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <SettingsProvider>
      <TaskProvider>
        <Shell />
      </TaskProvider>
    </SettingsProvider>
  )
}
