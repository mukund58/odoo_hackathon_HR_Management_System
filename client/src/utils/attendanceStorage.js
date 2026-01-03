const STORAGE_KEY = 'si_attendance'

function safeParse(raw, fallback) {
  try {
    const parsed = JSON.parse(raw)
    return parsed == null ? fallback : parsed
  } catch {
    return fallback
  }
}

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function loadAttendance() {
  if (typeof localStorage === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  const list = raw ? safeParse(raw, []) : []
  return Array.isArray(list) ? list : []
}

export function saveAttendance(list) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function upsertAttendanceRecord(partial) {
  const list = loadAttendance()
  const idx = list.findIndex(
    r => String(r.employeeId) === String(partial.employeeId) && r.date === partial.date
  )

  if (idx >= 0) {
    const next = [...list]
    next[idx] = { ...next[idx], ...partial, updatedAt: new Date().toISOString() }
    saveAttendance(next)
    return next[idx]
  }

  const record = {
    employeeId: partial.employeeId,
    employeeName: partial.employeeName || '—',
    date: partial.date,
    checkInAt: partial.checkInAt || null,
    checkOutAt: partial.checkOutAt || null,
    workedMs: partial.workedMs || 0,
    extraMs: partial.extraMs || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const next = [record, ...list]
  saveAttendance(next)
  return record
}

export function formatHmFromMs(ms) {
  const n = Number(ms)
  if (!Number.isFinite(n) || n <= 0) return '00:00'
  const totalMinutes = Math.floor(n / 60000)
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0')
  const minutes = String(totalMinutes % 60).padStart(2, '0')
  return `${hours}:${minutes}`
}

export function formatTime(dateIso) {
  if (!dateIso) return '—'
  const d = new Date(dateIso)
  if (!Number.isFinite(d.getTime())) return '—'
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
