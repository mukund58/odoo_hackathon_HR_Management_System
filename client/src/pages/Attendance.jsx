import { useEffect, useMemo, useState } from 'react'
import Navbar from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { loadAttendance, formatHmFromMs, formatTime, getLocalDateKey } from '@/utils/attendanceStorage'
import { useAuth } from '@/hooks/useAuth'
import { ChevronDown } from 'lucide-react'
import { getAttendance as getAttendanceApi, getMyAttendance } from '@/services/api'

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function addMonths(date, months) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

function getMonthKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function getCurrentEmployeeFromStorage(user) {
  try {
    const raw = localStorage.getItem('si_employees')
    const list = raw ? JSON.parse(raw) : []
    const arr = Array.isArray(list) ? list : []
    const current = arr.find(e => e?.isCurrent)
    if (current) return current
    if (user?.email) return arr.find(e => String(e?.email || '').toLowerCase() === String(user.email).toLowerCase())
  } catch {}
  return null
}

function countWorkingDaysInMonth(year, monthIndex, workingDaysPerWeek = 5) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()

  let workingDays = 0
  for (let day = 1; day <= daysInMonth; day += 1) {
    const dow = new Date(year, monthIndex, day).getDay() // 0 Sun ... 6 Sat

    if (workingDaysPerWeek >= 6) {
      // Mon-Sat working
      if (dow !== 0) workingDays += 1
    } else {
      // Mon-Fri working
      if (dow !== 0 && dow !== 6) workingDays += 1
    }
  }

  return workingDays
}

export default function Attendance() {
  const { user } = useAuth()
  const [activeView, setActiveView] = useState('date')
  const [searchDraft, setSearchDraft] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateKey, setDateKey] = useState(() => getLocalDateKey(new Date()))
  const [monthKey, setMonthKey] = useState(() => getMonthKey(new Date()))
  const [selectedDateKey, setSelectedDateKey] = useState(() => getLocalDateKey(new Date()))

  const [adminServerRows, setAdminServerRows] = useState([])
  const [adminServerLoading, setAdminServerLoading] = useState(false)
  const [adminServerError, setAdminServerError] = useState('')
  const [employeeServerRows, setEmployeeServerRows] = useState([])
  const [employeeServerLoading, setEmployeeServerLoading] = useState(false)
  const [employeeServerError, setEmployeeServerError] = useState('')
  

  function commitSearch(nextValue) {
    const q = String(nextValue ?? '').trim()
    setSearchQuery(q)
    setSearchDraft('')
  }

  // Reload when user changes (dot toggle) or filters change.
  const all = useMemo(() => loadAttendance(), [user, dateKey, monthKey])

  const isAdmin = (user?.role || '').toLowerCase() === 'admin' || user?.isAdmin === true
  const currentEmployee = useMemo(() => getCurrentEmployeeFromStorage(user), [user])
  const currentEmployeeId = currentEmployee?.id ?? user?.id ?? user?.employeeId ?? null
  const currentEmployeeName = currentEmployee?.name || user?.name || user?.email || '—'

  useEffect(() => {
    if (!isAdmin) return
    let cancelled = false

    async function loadAdminAttendance() {
      setAdminServerLoading(true)
      setAdminServerError('')
      try {
        const res = await getAttendanceApi()
        const list = Array.isArray(res?.attendance) ? res.attendance : []
        const rows = list.map(r => {
          const workHoursValue = r?.work_hours
          const workHours =
            workHoursValue == null || workHoursValue === '' ? '—' : `${Number(workHoursValue).toFixed(2)}h`

          return {
            id: r?.id,
            employeeId: r?.employee_id,
            employeeName: r?.name || r?.login_id || '—',
            loginId: r?.login_id || '',
            date: '',
            checkIn: r?.check_in || '—',
            checkOut: r?.check_out || '—',
            workHours,
            extraHours: '—',
            status: r?.status,
          }
        })

        if (!cancelled) setAdminServerRows(rows)
      } catch (err) {
        if (!cancelled) setAdminServerError(err?.message || 'Failed to load attendance')
      } finally {
        if (!cancelled) setAdminServerLoading(false)
      }
    }

    loadAdminAttendance()
    return () => {
      cancelled = true
    }
  }, [isAdmin, user, dateKey])

  const adminRows = useMemo(() => {
    // Prefer backend attendance for admins (server is source of truth)
    if (isAdmin) {
      const q = searchQuery.trim().toLowerCase()
      return adminServerRows.filter(r =>
        q
          ? String(r.employeeName || '').toLowerCase().includes(q) ||
            String(r.loginId || '').toLowerCase().includes(q)
          : true
      )
    }

    const q = searchQuery.trim().toLowerCase()
    return all
      .filter(r => r.date === dateKey)
      .filter(r => (q ? String(r.employeeName || '').toLowerCase().includes(q) : true))
      .map(r => {
        const workedMs = Number(r.workedMs || 0)
        const extraMs = Number(r.extraMs || 0)
        return {
          ...r,
          checkIn: formatTime(r.checkInAt),
          checkOut: formatTime(r.checkOutAt),
          workHours: formatHmFromMs(workedMs),
          extraHours: formatHmFromMs(extraMs),
        }
      })
  }, [all, dateKey, searchQuery, isAdmin, adminServerRows])

  const employeeRows = useMemo(() => {
    if (currentEmployeeId == null) return []
    // If we fetched server rows for this employee, prefer them
    if (!isAdmin && employeeServerRows && employeeServerRows.length > 0) {
      const q = searchQuery.trim().toLowerCase()
      return employeeServerRows.filter(r => (q ? String(r.employeeName || '').toLowerCase().includes(q) : true))
        .filter(r => String(r.date || '').startsWith(monthKey))
        .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    }
    const q = searchQuery.trim().toLowerCase()
    return all
      .filter(r => String(r.employeeId) === String(currentEmployeeId))
      .filter(r => String(r.date || '').startsWith(monthKey))
      .filter(r => (q ? String(r.employeeName || '').toLowerCase().includes(q) : true))
      .map(r => {
        const workedMs = Number(r.workedMs || 0)
        const extraMs = Number(r.extraMs || 0)
        return {
          ...r,
          checkIn: formatTime(r.checkInAt),
          checkOut: formatTime(r.checkOutAt),
          workHours: formatHmFromMs(workedMs),
          extraHours: formatHmFromMs(extraMs),
        }
      })
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
  }, [all, currentEmployeeId, monthKey, searchQuery])


  const displayDate = useMemo(() => {
    const d = new Date(`${dateKey}T00:00:00`)
    if (!Number.isFinite(d.getTime())) return dateKey
    return d.toLocaleDateString([], { day: '2-digit', month: 'long', year: 'numeric' })
  }, [dateKey])

  const displayMonth = useMemo(() => {
    const d = new Date(`${monthKey}-01T00:00:00`)
    if (!Number.isFinite(d.getTime())) return monthKey
    return d.toLocaleDateString([], { month: 'short' })
  }, [monthKey])

  const selectedDisplayDate = useMemo(() => {
    const d = new Date(`${selectedDateKey}T00:00:00`)
    if (!Number.isFinite(d.getTime())) return selectedDateKey
    return d.toLocaleDateString([], { day: '2-digit', month: 'long', year: 'numeric' })
  }, [selectedDateKey])

  useEffect(() => {
    if (isAdmin) return
    const el = typeof document !== 'undefined' ? document.getElementById(`att-row-${selectedDateKey}`) : null
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest' })
    }
  }, [isAdmin, selectedDateKey, employeeRows.length])

  const employeeSummary = useMemo(() => {
    const d = new Date(`${monthKey}-01T00:00:00`)
    const year = d.getFullYear()
    const monthIndex = d.getMonth()

    let workingDaysPerWeek = 5
    if (currentEmployeeId != null) {
      try {
        const raw = localStorage.getItem(`si_salary_${currentEmployeeId}`)
        const cfg = raw ? JSON.parse(raw) : null
        const n = Number(cfg?.workingDaysPerWeek)
        if (Number.isFinite(n) && n >= 1 && n <= 7) workingDaysPerWeek = n
      } catch {}
    }

    const totalWorkingDays = countWorkingDaysInMonth(year, monthIndex, workingDaysPerWeek)
    const daysPresent = employeeRows.filter(r => Number(r.workedMs || 0) > 0 || r.checkOutAt).length
    const leavesCount = 0

    return { totalWorkingDays, daysPresent, leavesCount }
  }, [employeeRows, monthKey, currentEmployeeId])

  // Load attendance for current (non-admin) user from server when available

  useEffect(() => {
    if (isAdmin) return
    let cancelled = false

    async function loadMyAttendance() {
      setEmployeeServerLoading(true)
      setEmployeeServerError('')
      try {
        const res = await getMyAttendance()
        const list = Array.isArray(res?.attendance) ? res.attendance : []
        const rows = list.map(r => {
          // Attempt to derive a date key from check_in if it's an ISO timestamp.
          let dateKey = ''
          const possibleDate = r?.check_in || r?.checkIn || r?.checkInAt
          if (possibleDate && typeof possibleDate === 'string') {
            const d = new Date(possibleDate)
            if (Number.isFinite(d.getTime())) dateKey = getLocalDateKey(d)
          }
          if (!dateKey) dateKey = getLocalDateKey(new Date())

          // work_hours might be in hours (number) or missing; prefer numeric
          const worked = Number(r?.work_hours ?? r?.workedMs ?? 0)
          const workHours = worked ? formatHmFromMs(worked) : '—'

          return {
            id: r?.id,
            employeeId: r?.employee_id,
            employeeName: r?.name || r?.login_id || '—',
            date: dateKey,
            checkIn: r?.check_in || r?.checkIn || '—',
            checkOut: r?.check_out || r?.checkOut || '—',
            workHours,
            extraHours: '—',
            workedMs: Number(r?.workedMs || 0),
            checkOutAt: r?.check_out_at || r?.checkOutAt || null,
            checkInAt: r?.check_in_at || r?.checkInAt || null,
          }
        })

        if (!cancelled) setEmployeeServerRows(rows)
      } catch (err) {
        if (!cancelled) setEmployeeServerError(err?.message || 'Failed to load attendance')
      } finally {
        if (!cancelled) setEmployeeServerLoading(false)
      }
    }

    loadMyAttendance()
    return () => {
      cancelled = true
    }
  }, [isAdmin, user, monthKey])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Attendance</h2>
          <div className="w-64">
            <Input
              placeholder={searchQuery ? `Search: ${searchQuery}` : 'Search'}
              value={searchDraft}
              onChange={e => setSearchDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  commitSearch(e.currentTarget.value)
                }
              }}
              onBlur={() => {
                if (searchDraft !== '') commitSearch(searchDraft)
              }}
            />
          </div>
        </div>

        <Card className="mt-4">
          <CardHeader className="pb-3">
            {isAdmin ? (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Previous day"
                    onClick={() => setDateKey(getLocalDateKey(addDays(new Date(`${dateKey}T00:00:00`), -1)))}
                  >
                    ←
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Next day"
                    onClick={() => setDateKey(getLocalDateKey(addDays(new Date(`${dateKey}T00:00:00`), 1)))}
                  >
                    →
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => setActiveView('date')}
                  >
                    Date <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setActiveView('day')}>
                    Day
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Previous day"
                    onClick={() => {
                      const next = getLocalDateKey(addDays(new Date(`${selectedDateKey}T00:00:00`), -1))
                      setSelectedDateKey(next)
                      setMonthKey(getMonthKey(new Date(`${next}T00:00:00`)))
                    }}
                  >
                    ←
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Next day"
                    onClick={() => {
                      const next = getLocalDateKey(addDays(new Date(`${selectedDateKey}T00:00:00`), 1))
                      setSelectedDateKey(next)
                      setMonthKey(getMonthKey(new Date(`${next}T00:00:00`)))
                    }}
                  >
                    →
                  </Button>
                </div>

                <Button variant="outline" size="sm">
                  {displayMonth}
                </Button>

                <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
                  <div className="rounded border px-3 py-1 text-sm">
                    <div className="text-xs text-muted-foreground">Count of days present</div>
                    <div className="font-medium">{employeeSummary.daysPresent}</div>
                  </div>
                  <div className="rounded border px-3 py-1 text-sm">
                    <div className="text-xs text-muted-foreground">Leaves count</div>
                    <div className="font-medium">{employeeSummary.leavesCount}</div>
                  </div>
                  <div className="rounded border px-3 py-1 text-sm">
                    <div className="text-xs text-muted-foreground">Total working days</div>
                    <div className="font-medium">{employeeSummary.totalWorkingDays}</div>
                  </div>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent>
            <div className="mb-4 text-sm text-muted-foreground">
              {isAdmin ? displayDate : selectedDisplayDate}
            </div>

            {isAdmin && adminServerError ? (
              <div className="mb-4 rounded border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {adminServerError}
              </div>
            ) : null}

            {!isAdmin && employeeServerError ? (
              <div className="mb-4 rounded border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {employeeServerError}
              </div>
            ) : null}

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b">
                    {isAdmin ? (
                      <th className="py-2 text-left font-medium text-muted-foreground">Emp</th>
                    ) : (
                      <th className="py-2 text-left font-medium text-muted-foreground">Date</th>
                    )}
                    <th className="py-2 text-left font-medium text-muted-foreground">Check In</th>
                    <th className="py-2 text-left font-medium text-muted-foreground">Check Out</th>
                    <th className="py-2 text-left font-medium text-muted-foreground">Work Hours</th>
                    <th className="py-2 text-left font-medium text-muted-foreground">Extra hours</th>
                  </tr>
                </thead>
                <tbody>
                  {adminServerLoading && isAdmin ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">Loading…</td>
                    </tr>
                  ) : null}

                  {!isAdmin && employeeServerLoading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">Loading…</td>
                    </tr>
                  ) : null}

                  {!(adminServerLoading && isAdmin) && !(!isAdmin && employeeServerLoading) && (isAdmin ? adminRows : employeeRows).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">No attendance records{isAdmin ? '.' : ' for this date.'}</td>
                    </tr>
                  ) : null}

                  {!(adminServerLoading && isAdmin) && !(!isAdmin && employeeServerLoading) && (isAdmin ? adminRows : employeeRows).length > 0 ? (
                    (isAdmin ? adminRows : employeeRows).map(r => (
                      <tr
                        key={isAdmin ? String(r.id ?? `${r.employeeId}-${r.checkIn}-${r.checkOut}`) : `${r.employeeId}-${r.date}`}
                        id={!isAdmin ? `att-row-${r.date}` : undefined}
                        className={`border-b last:border-b-0 ${!isAdmin && r.date === selectedDateKey ? 'bg-muted/30' : ''}`}
                      >
                        {isAdmin ? <td className="py-3">{r.employeeName}</td> : <td className="py-3">{r.date}</td>}
                        <td className="py-3">{r.checkIn}</td>
                        <td className="py-3">{r.checkOut}</td>
                        <td className="py-3">{r.workHours}</td>
                        <td className="py-3">{r.extraHours}</td>
                      </tr>
                    ))
                  ) : null}
                </tbody>
              </table>
            </div>

            {isAdmin && activeView === 'day' && (
              <div className="mt-4 text-xs text-muted-foreground">Day view is currently the same as Date view.</div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
