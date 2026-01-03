const STORAGE_KEY = 'si_timeoff'

function safeParse(raw, fallback) {
  try {
    const parsed = JSON.parse(raw)
    return parsed == null ? fallback : parsed
  } catch {
    return fallback
  }
}

export function loadTimeOff() {
  if (typeof localStorage === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  const list = raw ? safeParse(raw, []) : []
  return Array.isArray(list) ? list : []
}

export function saveTimeOff(list) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function addTimeOffRequest(request) {
  const list = loadTimeOff()
  const record = {
    id: request.id ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    employeeId: request.employeeId,
    employeeName: request.employeeName || '—',
    startDate: request.startDate,
    endDate: request.endDate,
    type: request.type || 'paid',
    status: request.status || 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  const next = [record, ...list]
  saveTimeOff(next)
  return record
}

export function updateTimeOffStatus(id, status) {
  const list = loadTimeOff()
  const next = list.map(r => (r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r))
  saveTimeOff(next)
  return next.find(r => r.id === id) || null
}
