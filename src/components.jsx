import { useEffect, useMemo, useState } from 'react'
import { CATEGORIES, DURATION_PRESETS, PRIORITIES, REMINDER_OPTIONS, REPEAT_OPTIONS } from './constants.js'
import {
  IconBack,
  IconBattery,
  IconBell,
  IconCal,
  IconCheck,
  IconHabits,
  IconClock,
  IconCopy,
  IconDots,
  IconEdit,
  IconPlus,
  IconRepeat,
  IconSignal,
  IconStats,
  IconToday,
  IconTrash,
  IconUpcoming,
  IconWifi,
} from './icons.jsx'
import { statusMeta } from './status.js'
import {
  addDays,
  formatClock,
  formatDuration,
  formatISO,
  formatLongDate,
  formatPrettyDate,
  formatTime,
  todayISO,
  vibrate,
} from './utils.js'

export function categoryOf(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[2]
}
export function priorityOf(id) {
  return PRIORITIES.find((p) => p.id === id) || PRIORITIES[1]
}
export function repeatOf(id) {
  return REPEAT_OPTIONS.find((r) => r.id === id) || REPEAT_OPTIONS[0]
}
export function reminderOf(id) {
  return REMINDER_OPTIONS.find((r) => r.id === id) || REMINDER_OPTIONS[0]
}

export function StatusBar() {
  const [clock, setClock] = useState(formatClock)
  useEffect(() => {
    const t = setInterval(() => setClock(formatClock()), 10000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="status-bar">
      <span>{clock}</span>
      <div className="status-icons">
        <IconSignal />
        <IconWifi />
        <IconBattery />
      </div>
    </div>
  )
}

export function BottomNav({ screen, onChange }) {
  const items = [
    { id: 'home', label: 'Today', icon: <IconToday on={screen === 'home'} /> },
    { id: 'calendar', label: 'Calendar', icon: <IconCal /> },
    { id: 'habits', label: 'Habits', icon: <IconHabits /> },
    { id: 'upcoming', label: 'Soon', icon: <IconUpcoming /> },
    { id: 'stats', label: 'Stats', icon: <IconStats /> },
  ]
  return (
    <nav className="nav">
      {items.map((it) => (
        <button
          key={it.id}
          className={'nav-item' + (screen === it.id ? ' on' : '')}
          onClick={() => onChange(it.id)}
        >
          {it.icon}
          {it.label}
        </button>
      ))}
    </nav>
  )
}

export function Fab({ onClick }) {
  return (
    <button className="fab" onClick={onClick} aria-label="Add task">
      <IconPlus />
    </button>
  )
}

export function TaskCard({ task, onOpen, onMenu, onToggle }) {
  const cat = categoryOf(task.category)
  const st = statusMeta(task.status || (task.completed ? 'completed' : 'upcoming'))
  return (
    <div className={'task-card' + (task.completed ? ' done' : '') + (task.status === 'missed' ? ' missed' : '') + (task.status === 'in_progress' ? ' now' : '')}>
      <span className="task-accent" style={{ background: cat.color }} />
      <button
        className={'check' + (task.completed ? ' on' : '')}
        onClick={(e) => {
          e.stopPropagation()
          vibrate(10)
          onToggle(task)
        }}
        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        <IconCheck />
      </button>
      <button className="task-main" onClick={() => onOpen(task)} style={{ background: 'none', border: 0, textAlign: 'left', width: '100%', color: 'inherit' }}>
        <div className="task-title">{task.title}</div>
        <div className="task-meta">
          <span className="chip time">
            <IconClock /> {formatTime(task.time)}
          </span>
          <span className="chip">
            {cat.emoji} {cat.name}
          </span>
          <span className={'chip ' + st.cls}>{st.label}</span>
          {task.isRecurring && (
            <span className="chip repeat">
              <IconRepeat /> {repeatOf(task.repeat).name}
            </span>
          )}
        </div>
      </button>
      <button
        className="icon-btn"
        aria-label="Task menu"
        onClick={(e) => {
          e.stopPropagation()
          onMenu(task)
        }}
      >
        <IconDots />
      </button>
    </div>
  )
}

export function EmptyState({ title, text, emoji = '✦' }) {
  return (
    <div className="empty">
      <div className="orb">{emoji}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  )
}

export function TaskDetails({ task, onClose, onEdit, onDuplicate, onDelete, onToggle, onReschedule, onIgnore }) {
  if (!task) return null
  const cat = categoryOf(task.category)
  const st = statusMeta(task.status || (task.completed ? 'completed' : 'upcoming'))
  return (
    <div className="sheet-full">
      <div className="sheet-bar">
        <button className="ghost" onClick={onClose} aria-label="Back">
          <IconBack />
        </button>
        <h2>Task details</h2>
        <button className="ghost" onClick={onEdit} aria-label="Edit">
          <IconEdit />
        </button>
      </div>
      <div className="body">
        <div className="details-hero">
          <div className="cat">
            {cat.emoji} {cat.name}
          </div>
          <h1>{task.title}</h1>
          <div className="when">
            {formatLongDate(task.date)} · {formatTime(task.time)}
          </div>
        </div>

        {task.completed && <div className="done-banner">Completed ✓ — history preserved</div>}
        {task.status === 'missed' && !task.completed && (
          <div className="missed-banner">
            Missed ⚠️ — this time has passed. It was not auto-completed.
            <div className="missed-actions">
              <button onClick={() => onToggle(task)}>Complete now</button>
              <button onClick={onReschedule}>Reschedule</button>
              <button onClick={onIgnore}>Ignore</button>
            </div>
          </div>
        )}
        {task.status === 'in_progress' && !task.completed && (
          <div className="now-banner">In progress — happening now</div>
        )}
        <div className={'status-pill ' + st.cls}>{st.label}</div>

        <div className="info-grid">
          <div className="info-cell">
            <div className="k">Priority</div>
            <div className="v" style={{ color: priorityOf(task.priority).color }}>
              {priorityOf(task.priority).name}
            </div>
          </div>
          <div className="info-cell">
            <div className="k">Duration</div>
            <div className="v">{formatDuration(task.duration)}</div>
          </div>
          <div className="info-cell">
            <div className="k">Repeat</div>
            <div className="v">{repeatOf(task.repeat).name}</div>
          </div>
          <div className="info-cell">
            <div className="k">Reminder</div>
            <div className="v">{reminderOf(task.reminder).name}</div>
          </div>
        </div>

        <div className="notes-block">
          <div className="k">Notes</div>
          <p>{task.notes?.trim() ? task.notes : 'No notes yet. Add a detail when you edit this task.'}</p>
        </div>

        <div className="details-actions">
          <button className="big-btn edit" onClick={onEdit}>
            <IconEdit /> Edit task
          </button>
          <button className="big-btn soft" onClick={() => onToggle(task)}>
            {task.completed ? 'Mark as incomplete' : 'Mark complete'}
          </button>
          <button className="big-btn soft" onClick={onDuplicate}>
            <IconCopy /> Duplicate
          </button>
          <button className="big-btn warn" onClick={onDelete}>
            <IconTrash /> Delete task
          </button>
        </div>
      </div>
    </div>
  )
}

const BLANK_FORM = {
  title: '',
  notes: '',
  date: '',
  time: '',
  category: 'personal',
  priority: 'medium',
  repeat: 'none',
  reminder: 'none',
  duration: 30,
}

export function TaskForm({ mode, initial, scope, onCancel, onSave }) {
  const [form, setForm] = useState(() => ({
    ...BLANK_FORM,
    ...initial,
    date: initial?.date || BLANK_FORM.date,
  }))

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const canSave = form.title.trim().length > 0 && form.date

  const scopeLabel =
    scope === 'this'
      ? 'Editing only this occurrence'
      : scope === 'future'
        ? 'Editing this and future occurrences'
        : scope === 'all'
          ? 'Editing the entire recurring series'
          : null

  return (
    <div className="sheet-full">
      <div className="sheet-bar">
        <button className="ghost" onClick={onCancel}>
          Cancel
        </button>
        <h2>{mode === 'edit' ? 'Edit task' : 'New task'}</h2>
        <button className="save" disabled={!canSave} onClick={() => canSave && onSave(form)}>
          {mode === 'edit' ? 'Save changes' : 'Add'}
        </button>
      </div>
      <div className="body">
        {scopeLabel && <div className="recurring-note">{scopeLabel}. Completion history is kept wherever it still applies.</div>}

        <div className="field">
          <textarea
            className="title-input"
            rows={2}
            placeholder="Task name"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            autoFocus={mode !== 'edit'}
          />
        </div>

        <div className="field">
          <label>Description / notes</label>
          <textarea
            className="notes-input"
            placeholder="Add a note, a checklist, a why…"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        </div>

        <div className="row-2">
          <div className="field">
            <label>Date</label>
            <div className="native-wrap">
              <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Time</label>
            <div className="native-wrap">
              {form.time ? (
                <input type="time" value={form.time} onChange={(e) => set('time', e.target.value)} />
              ) : (
                <span className="ph">All day</span>
              )}
            </div>
            <button className="clear-time" onClick={() => set('time', form.time ? '' : '09:00')}>
              {form.time ? 'Make all-day' : 'Set a time'}
            </button>
          </div>
        </div>

        <div className="field">
          <label>Category</label>
          <div className="cat-grid">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                className={'cat-pick' + (form.category === c.id ? ' on' : '')}
                onClick={() => set('category', c.id)}
              >
                <span className="em">{c.emoji}</span>
                <span className="nm">{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Priority</label>
          <div className="seg">
            {PRIORITIES.map((p) => (
              <button
                key={p.id}
                className={(form.priority === p.id ? 'on ' : '') + p.id}
                onClick={() => set('priority', p.id)}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {scope !== 'this' && (
          <div className="field">
            <label>Repeat / recurring</label>
            <div className="option-list">
              {REPEAT_OPTIONS.map((r) => (
                <button
                  key={r.id}
                  className={'option-row' + (form.repeat === r.id ? ' on' : '')}
                  onClick={() => set('repeat', r.id)}
                >
                  <div className="left">
                    <div className="t">{r.name}</div>
                    <div className="h">{r.hint}</div>
                  </div>
                  {form.repeat === r.id && (
                    <span style={{ color: 'var(--gold)' }}>
                      <IconCheck />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="field">
          <label>Reminder</label>
          <div className="option-list">
            {REMINDER_OPTIONS.map((r) => (
              <button
                key={r.id}
                className={'option-row' + (form.reminder === r.id ? ' on' : '')}
                onClick={() => set('reminder', r.id)}
              >
                <div className="left">
                  <div className="t">{r.name}</div>
                </div>
                {form.reminder === r.id && <IconBell />}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Task duration</label>
          <div className="dur-row">
            <div className="stepper">
              <button onClick={() => set('duration', Math.max(0, (Number(form.duration) || 0) - 15))}>−</button>
              <div className="val">{formatDuration(Number(form.duration) || 0)}</div>
              <button onClick={() => set('duration', (Number(form.duration) || 0) + 15)}>+</button>
            </div>
          </div>
          <div className="dur-presets">
            {DURATION_PRESETS.map((m) => (
              <button key={m} className={Number(form.duration) === m ? 'on' : ''} onClick={() => set('duration', m)}>
                {formatDuration(m)}
              </button>
            ))}
          </div>
        </div>

        <div className="form-foot">
          <button
            className="big-btn edit"
            disabled={!canSave}
            onClick={() => canSave && onSave(form)}
            style={{ width: '100%', opacity: canSave ? 1 : 0.45 }}
          >
            {mode === 'edit' ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ActionSheet({ task, onClose, onEdit, onComplete, onDuplicate, onDelete, onReschedule }) {
  if (!task) return null
  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <div className="bottom-sheet">
        <div className="handle" />
        <div style={{ padding: '0 8px 10px', fontWeight: 700, fontSize: 15 }}>{task.title}</div>
        <button className="action-item" onClick={onEdit}>
          <span className="ico"><IconEdit /></span>
          Edit task
        </button>
        <button className="action-item" onClick={onComplete}>
          <span className="ico"><IconCheck /></span>
          {task.completed ? 'Mark incomplete' : 'Mark complete'}
        </button>
        {task.status === 'missed' && !task.completed && (
          <button className="action-item" onClick={onReschedule}>
            <span className="ico"><IconClock /></span>
            Reschedule
          </button>
        )}
        <button className="action-item" onClick={onDuplicate}>
          <span className="ico"><IconCopy /></span>
          Duplicate
        </button>
        <button className="action-item danger" onClick={onDelete}>
          <span className="ico"><IconTrash /></span>
          Delete
        </button>
      </div>
    </>
  )
}

export function ConfirmDelete({ onCancel, onConfirm }) {
  return (
    <>
      <div className="backdrop" onClick={onCancel} />
      <div className="modal">
        <h3>Delete this task?</h3>
        <p>Are you sure you want to delete this task? This cannot be undone with a single tap — choose Delete to confirm.</p>
        <div className="modal-actions">
          <button className="btn ghost" onClick={onCancel}>Cancel</button>
          <button className="btn danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </>
  )
}

export function RecurringScope({ title = 'What do you want to change?', dateLabel, onCancel, onContinue }) {
  const [scope, setScope] = useState('this')
  const options = [
    { id: 'this', t: 'Only this occurrence', d: dateLabel ? `Just ${dateLabel}` : 'Change only the selected day' },
    { id: 'future', t: 'This and future occurrences', d: 'From this day onward — past stays as it was' },
    { id: 'all', t: 'Entire recurring series', d: 'All past and future occurrences in this routine' },
  ]
  return (
    <>
      <div className="backdrop" onClick={onCancel} />
      <div className="bottom-sheet">
        <div className="handle" />
        <h3 style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 600, margin: '4px 4px 14px' }}>{title}</h3>
        {options.map((o) => (
          <button key={o.id} className={'scope-option' + (scope === o.id ? ' on' : '')} onClick={() => setScope(o.id)}>
            <span className="radio" />
            <span>
              <div className="t">{o.t}</div>
              <div className="d">{o.d}</div>
            </span>
          </button>
        ))}
        <div className="modal-actions" style={{ marginTop: 12 }}>
          <button className="btn ghost" onClick={onCancel}>Cancel</button>
          <button className="btn primary" onClick={() => onContinue(scope)}>Continue</button>
        </div>
      </div>
    </>
  )
}

export function Toast({ message }) {
  if (!message) return null
  return <div className="toast">{message}</div>
}

export function ProgressRing({ done, total }) {
  const pct = total ? done / total : 0
  const r = 26
  const c = 2 * Math.PI * r
  const offset = c * (1 - pct)
  return (
    <div className="progress-ring" aria-hidden>
      <svg viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(244,239,230,0.08)" strokeWidth="6" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="#e4b15a"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="label">{total ? Math.round(pct * 100) + '%' : '—'}</div>
    </div>
  )
}

export function useToast() {
  const [message, setMessage] = useState('')
  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => setMessage(''), 2400)
    return () => clearTimeout(t)
  }, [message])
  return [message, setMessage]
}

export function TaskList({ tasks, onOpen, onMenu, onToggle, empty }) {
  if (!tasks.length) return empty || null
  return (
    <div className="task-list">
      {tasks.map((t) => (
        <TaskCard key={t.occurrenceId} task={t} onOpen={onOpen} onMenu={onMenu} onToggle={onToggle} />
      ))}
    </div>
  )
}

export function timeBucket(task) {
  if (!task.time) return 'Anytime'
  const h = Number(task.time.slice(0, 2))
  if (h < 12) return 'Morning'
  if (h < 17) return 'Afternoon'
  return 'Evening'
}

export function RescheduleSheet({ task, onCancel, onConfirm }) {
  const later = (() => {
    const d = new Date()
    d.setHours(d.getHours() + 1, 0, 0, 0)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  })()
  const [mode, setMode] = useState('later')
  const [date, setDate] = useState(task?.date || todayISO())
  const [time, setTime] = useState(task?.time || later)

  if (!task) return null

  const apply = () => {
    if (mode === 'later') onConfirm({ date: todayISO(), time })
    else if (mode === 'tomorrow') onConfirm({ date: formatISO(addDays(new Date(), 1)), time: task.time || time })
    else onConfirm({ date, time })
  }

  return (
    <>
      <div className="backdrop" onClick={onCancel} />
      <div className="bottom-sheet">
        <div className="handle" />
        <h3 style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 600, margin: '4px 4px 14px' }}>Reschedule</h3>
        <p style={{ color: 'var(--text-2)', fontSize: 13.5, margin: '0 4px 14px' }}>
          Move “{task.title}” without marking it complete.
        </p>
        {[
          { id: 'later', t: 'Later today', d: 'Pick a new time this evening' },
          { id: 'tomorrow', t: 'Tomorrow', d: 'Keep the same time, next day' },
          { id: 'custom', t: 'Custom date & time', d: 'Choose exactly when' },
        ].map((o) => (
          <button key={o.id} className={'scope-option' + (mode === o.id ? ' on' : '')} onClick={() => setMode(o.id)}>
            <span className="radio" />
            <span>
              <div className="t">{o.t}</div>
              <div className="d">{o.d}</div>
            </span>
          </button>
        ))}
        {(mode === 'later' || mode === 'custom') && (
          <div className="row-2" style={{ marginTop: 8 }}>
            {mode === 'custom' && (
              <div className="field">
                <label>Date</label>
                <div className="native-wrap">
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              </div>
            )}
            <div className="field">
              <label>Time</label>
              <div className="native-wrap">
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>
          </div>
        )}
        <div className="modal-actions" style={{ marginTop: 12 }}>
          <button className="btn ghost" onClick={onCancel}>Cancel</button>
          <button className="btn primary" onClick={apply}>Reschedule</button>
        </div>
      </div>
    </>
  )
}

export function GroupedToday({ tasks, ...handlers }) {
  const groups = useMemo(() => {
    const order = ['Morning', 'Afternoon', 'Evening', 'Anytime']
    const map = { Morning: [], Afternoon: [], Evening: [], Anytime: [] }
    for (const t of tasks) map[timeBucket(t)].push(t)
    return order.filter((k) => map[k].length).map((k) => ({ k, items: map[k] }))
  }, [tasks])

  if (!tasks.length) return null
  return (
    <>
      {groups.map((g) => (
        <div key={g.k}>
          <div className="section-label">{g.k}</div>
          <TaskList tasks={g.items} {...handlers} />
        </div>
      ))}
    </>
  )
}
