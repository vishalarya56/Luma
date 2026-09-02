export const CATEGORIES = [
  { id: 'fitness', name: 'Fitness', emoji: '🏋️', color: '#e07a5f' },
  { id: 'work', name: 'Work', emoji: '💼', color: '#7aa2c4' },
  { id: 'personal', name: 'Personal', emoji: '✨', color: '#c9a0dc' },
  { id: 'health', name: 'Health', emoji: '🌿', color: '#81b29a' },
  { id: 'study', name: 'Study', emoji: '📚', color: '#e4b15a' },
  { id: 'home', name: 'Home', emoji: '🏡', color: '#e09f5a' },
  { id: 'finance', name: 'Finance', emoji: '💰', color: '#5ec2b7' },
  { id: 'social', name: 'Social', emoji: '👋', color: '#e07aa0' },
]

export const PRIORITIES = [
  { id: 'high', name: 'High', color: '#e07a5f' },
  { id: 'medium', name: 'Medium', color: '#e4b15a' },
  { id: 'low', name: 'Low', color: '#7aa2c4' },
]

export const REPEAT_OPTIONS = [
  { id: 'none', name: 'Never', hint: 'One-time task' },
  { id: 'daily', name: 'Daily', hint: 'Every day' },
  { id: 'weekdays', name: 'Weekdays', hint: 'Monday to Friday' },
  { id: 'weekly', name: 'Weekly', hint: 'Same day each week' },
  { id: 'biweekly', name: 'Every 2 weeks', hint: 'Fortnightly' },
  { id: 'monthly', name: 'Monthly', hint: 'Same date each month' },
  { id: 'yearly', name: 'Yearly', hint: 'Same date each year' },
]

export const REMINDER_OPTIONS = [
  { id: 'none', name: 'No reminder' },
  { id: 'at_time', name: 'At time of task' },
  { id: '5min', name: '5 minutes before' },
  { id: '10min', name: '10 minutes before' },
  { id: '15min', name: '15 minutes before' },
  { id: '30min', name: '30 minutes before' },
  { id: '1hour', name: '1 hour before' },
  { id: '1day', name: '1 day before' },
]

export const DEFAULT_LEAD_OPTIONS = [
  { id: '5min', name: '5 min' },
  { id: '10min', name: '10 min' },
  { id: '15min', name: '15 min' },
  { id: '30min', name: '30 min' },
  { id: '1hour', name: '1 hour' },
]

export const DURATION_PRESETS = [15, 30, 45, 60, 90, 120]

export const STORAGE_KEY = 'luma.tasks.v1'
