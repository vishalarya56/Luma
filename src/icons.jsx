export function IconToday({ on }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="5" width="16" height="15" rx="3" />
      <path d="M8 3.5v3M16 3.5v3M4 9.5h16" />
      {on && <circle cx="12" cy="14.5" r="1.6" fill="currentColor" stroke="none" />}
    </svg>
  )
}

export function IconCal() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="5" width="17" height="15" rx="3" />
      <path d="M8 3.5v3M16 3.5v3M3.5 10h17" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01" strokeLinecap="round" />
    </svg>
  )
}

export function IconUpcoming() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4.5l3 1.8" />
    </svg>
  )
}

export function IconHabits() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 20c4-3.2 6.5-6.2 6.5-9.4A4.4 4.4 0 0012 6.5 4.4 4.4 0 005.5 10.6C5.5 13.8 8 16.8 12 20z" />
    </svg>
  )
}

export function IconStats() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M5 19V10M10 19V5M15 19v-7M20 19V8" />
    </svg>
  )
}

export function IconPlus() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function IconDots() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="6" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="12" cy="18" r="1.7" />
    </svg>
  )
}

export function IconCheck() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l5 5L19 7" />
    </svg>
  )
}

export function IconBack() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  )
}

export function IconEdit() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 20h4l11-11-4-4L4 16v4z" />
      <path d="M13 7l4 4" />
    </svg>
  )
}

export function IconTrash() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M5 8h14M10 8V6h4v2M8 8l.8 12h6.4L16 8" />
    </svg>
  )
}

export function IconCopy() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M5 16V6a2 2 0 012-2h10" />
    </svg>
  )
}

export function IconBell() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 9a6 6 0 1112 0c0 6 2 7 2 7H4s2-1 2-7" />
      <path d="M10 19a2 2 0 004 0" />
    </svg>
  )
}

export function IconRepeat() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M17 3l4 4-4 4" />
      <path d="M7 21l-4-4 4-4" />
      <path d="M21 7H10a5 5 0 00-5 5" />
      <path d="M3 17h11a5 5 0 005-5" />
    </svg>
  )
}

export function IconClock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4.5l3 1.6" strokeLinecap="round" />
    </svg>
  )
}

export function IconChevron({ dir = 'left' }) {
  const rot = dir === 'right' ? 180 : dir === 'up' ? 90 : dir === 'down' ? -90 : 0
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ transform: `rotate(${rot}deg)` }}>
      <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconSignal() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
      <rect x="0" y="8" width="3" height="4" rx="0.6" />
      <rect x="4.3" y="5.5" width="3" height="6.5" rx="0.6" />
      <rect x="8.6" y="3" width="3" height="9" rx="0.6" />
      <rect x="12.9" y="0.5" width="3" height="11.5" rx="0.6" />
    </svg>
  )
}

export function IconWifi() {
  return (
    <svg width="15" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M5 10c4-4 10-4 14 0" />
      <path d="M8 13.2c2.4-2.3 5.6-2.3 8 0" />
      <circle cx="12" cy="17" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconGear() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3V20.5M4.9 6.5l1.6 1.6M17.5 16.9l1.6 1.6M3.5 12h2.2M18.3 12H20.5M4.9 17.5l1.6-1.6M17.5 7.1l1.6-1.6" strokeLinecap="round" />
    </svg>
  )
}

export function IconWarn() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 9v4.5" />
      <circle cx="12" cy="17.2" r="0.8" fill="currentColor" stroke="none" />
      <path d="M10.2 4.8L2.8 18.2A2 2 0 004.6 21h14.8a2 2 0 001.8-2.8L13.8 4.8a2 2 0 00-3.6 0z" />
    </svg>
  )
}

export function IconBattery() {
  return (
    <svg width="24" height="12" viewBox="0 0 28 14">
      <rect x="0.7" y="0.7" width="23" height="12.6" rx="3" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <rect x="3" y="3" width="16" height="8" rx="1.4" fill="currentColor" />
      <rect x="24.5" y="4.2" width="2.4" height="5.6" rx="0.8" fill="currentColor" />
    </svg>
  )
}
