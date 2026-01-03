import { useMemo, useState } from 'react'
import Navbar from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { addTimeOffRequest, loadTimeOff, updateTimeOffStatus } from '@/utils/timeOffStorage'

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

function formatDateCell(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (!Number.isFinite(d.getTime())) return String(value)
  return d.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function TimeOff() {
  const { user } = useAuth()
  const isAdmin = (user?.role || '').toLowerCase() === 'admin' || user?.isAdmin === true

  const [activeTopTab, setActiveTopTab] = useState('timeOff')
  const [activeType, setActiveType] = useState('paid')
  const [searchDraft, setSearchDraft] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  function commitSearch(nextValue) {
    const q = String(nextValue ?? '').trim()
    setSearchQuery(q)
    setSearchDraft('')
  }

  const [requestOpen, setRequestOpen] = useState(false)
  const [requestType, setRequestType] = useState('paid')
  const [requestFrom, setRequestFrom] = useState('')
  const [requestTo, setRequestTo] = useState('')
  const [requestAttachmentName, setRequestAttachmentName] = useState('')
  const [requestTouched, setRequestTouched] = useState(false)

  const currentEmployee = useMemo(() => getCurrentEmployeeFromStorage(user), [user])
  const currentEmployeeId = currentEmployee?.id ?? user?.id ?? user?.employeeId ?? null
  const currentEmployeeName = currentEmployee?.name || user?.name || user?.email || '—'

  const all = useMemo(() => {
    // refreshKey triggers recompute after add/approve/reject
    void refreshKey
    return loadTimeOff()
  }, [refreshKey])

  const rows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return all
      .filter(r => (activeType ? r.type === activeType : true))
      .filter(r => (isAdmin ? true : String(r.employeeId) === String(currentEmployeeId)))
      .filter(r => (q ? String(r.employeeName || '').toLowerCase().includes(q) : true))
  }, [all, activeType, isAdmin, currentEmployeeId, searchQuery])

  function handleNew() {
    setRequestTouched(false)
    setRequestType(activeType)
    setRequestFrom('')
    setRequestTo('')
    setRequestAttachmentName('')
    setRequestOpen(true)
  }

  function setStatus(id, status) {
    updateTimeOffStatus(id, status)
    setRefreshKey(k => k + 1)
  }

  const requestAllocationDays = useMemo(() => {
    if (!requestFrom || !requestTo) return 0
    const start = new Date(`${requestFrom}T00:00:00`)
    const end = new Date(`${requestTo}T00:00:00`)
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return 0
    const diffDays = Math.floor((end.getTime() - start.getTime()) / 86400000)
    return diffDays >= 0 ? diffDays + 1 : 0
  }, [requestFrom, requestTo])

  const requestHasError = useMemo(() => {
    if (!requestTouched) return false
    if (!currentEmployeeId) return true
    if (!requestType) return true
    if (!requestFrom || !requestTo) return true
    if (requestAllocationDays <= 0) return true
    if (requestType === 'sick' && !requestAttachmentName) return true
    return false
  }, [requestTouched, currentEmployeeId, requestType, requestFrom, requestTo, requestAllocationDays, requestAttachmentName])

  function submitRequest() {
    setRequestTouched(true)
    if (requestHasError) return

    const start = new Date(`${requestFrom}T00:00:00`)
    const end = new Date(`${requestTo}T00:00:00`)

    addTimeOffRequest({
      employeeId: currentEmployeeId,
      employeeName: currentEmployeeName,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      type: requestType,
      status: 'pending',
      attachmentName: requestAttachmentName || null,
      allocationDays: requestAllocationDays,
    })

    setRequestOpen(false)
    setRefreshKey(k => k + 1)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="container mx-auto px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={activeTopTab === 'timeOff' ? 'default' : 'ghost'}
                  onClick={() => setActiveTopTab('timeOff')}
                >
                  Time Off
                </Button>
                {isAdmin && (
                  <Button
                    size="sm"
                    variant={activeTopTab === 'allocation' ? 'default' : 'ghost'}
                    onClick={() => setActiveTopTab('allocation')}
                  >
                    Allocation
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {isAdmin && activeTopTab === 'allocation' ? (
                <div className="py-8 text-sm text-muted-foreground">Allocation view coming soon.</div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Button size="sm" onClick={handleNew}>
                        NEW
                      </Button>
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

                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <button
                          type="button"
                          className={activeType === 'paid' ? 'font-medium underline' : 'text-muted-foreground'}
                          onClick={() => setActiveType('paid')}
                        >
                          Paid time off
                        </button>
                        <div className="mt-1 text-xs text-muted-foreground">24 Days Available</div>
                      </div>
                      <div>
                        <button
                          type="button"
                          className={activeType === 'sick' ? 'font-medium underline' : 'text-muted-foreground'}
                          onClick={() => setActiveType('sick')}
                        >
                          Sick time off
                        </button>
                        <div className="mt-1 text-xs text-muted-foreground">07 Days Available</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="py-2 text-left font-medium text-muted-foreground">Name</th>
                          <th className="py-2 text-left font-medium text-muted-foreground">Start Date</th>
                          <th className="py-2 text-left font-medium text-muted-foreground">End Date</th>
                          <th className="py-2 text-left font-medium text-muted-foreground">Time off Type</th>
                          <th className="py-2 text-left font-medium text-muted-foreground">Status</th>
                          {isAdmin && (
                            <th className="py-2 text-left font-medium text-muted-foreground">Action</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={isAdmin ? 6 : 5}
                              className="py-8 text-center text-muted-foreground"
                            >
                              No time off records.
                            </td>
                          </tr>
                        ) : (
                          rows.map(r => (
                            <tr key={r.id} className="border-b last:border-b-0">
                              <td className="py-3">{r.employeeName}</td>
                              <td className="py-3">{formatDateCell(r.startDate)}</td>
                              <td className="py-3">{formatDateCell(r.endDate)}</td>
                              <td className="py-3">{r.type === 'sick' ? 'Sick time off' : 'Paid time off'}</td>
                              <td className="py-3">
                                {r.status === 'approved'
                                  ? 'Approved'
                                  : r.status === 'rejected'
                                    ? 'Rejected'
                                    : 'Pending'}
                              </td>
                              {isAdmin && (
                                <td className="py-3">
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setStatus(r.id, 'rejected')}
                                    >
                                      Reject
                                    </Button>
                                    <Button size="sm" onClick={() => setStatus(r.id, 'approved')}>
                                      Approve
                                    </Button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {isAdmin ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="text-lg font-semibold">Note</div>
              </CardHeader>
              <CardContent>
                <div className="rounded border border-dashed p-4 text-sm text-muted-foreground">
                  Employees can view only their own time off records, while Admins and HR Officers can view time off
                  records &amp; approve/reject them for all employees.
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <div className="text-sm font-medium">TimeOff Types:</div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <div className="space-y-1">
                  <div>- Paid Time off</div>
                  <div>- Sick Leave</div>
                  <div>- Unpaid Leaves</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {requestOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
            <div className="w-full max-w-xl rounded-lg border bg-background shadow">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="text-sm font-medium">Time off Type Request</div>
                <button
                  type="button"
                  className="text-sm text-muted-foreground"
                  aria-label="Close"
                  onClick={() => setRequestOpen(false)}
                >
                  ×
                </button>
              </div>

              <div className="grid gap-4 p-4 text-sm">
                <div className="grid gap-1">
                  <div className="text-muted-foreground">Employee</div>
                  <div className="font-medium">{currentEmployeeName}</div>
                </div>

                <div className="grid gap-1">
                  <div className="text-muted-foreground">Time off Type</div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={requestType === 'paid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setRequestType('paid')}
                    >
                      Paid time off
                    </Button>
                    <Button
                      type="button"
                      variant={requestType === 'sick' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setRequestType('sick')}
                    >
                      Sick time off
                    </Button>
                  </div>
                </div>

                <div className="grid gap-1">
                  <div className="text-muted-foreground">Validity Period</div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-1">
                      <div className="text-xs text-muted-foreground">From</div>
                      <Input
                        type="date"
                        value={requestFrom}
                        onChange={e => {
                          setRequestTouched(true)
                          setRequestFrom(e.target.value)
                        }}
                      />
                    </div>
                    <div className="grid gap-1">
                      <div className="text-xs text-muted-foreground">To</div>
                      <Input
                        type="date"
                        value={requestTo}
                        onChange={e => {
                          setRequestTouched(true)
                          setRequestTo(e.target.value)
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-1">
                  <div className="text-muted-foreground">Allocation</div>
                  <div className="font-medium">
                    {requestAllocationDays.toFixed(2).padStart(5, '0')} Days
                  </div>
                </div>

                <div className="grid gap-1">
                  <div className="text-muted-foreground">Attachment</div>
                  <div className="flex items-center gap-3">
                    <Input
                      type="file"
                      onChange={e => {
                        setRequestTouched(true)
                        const f = e.target.files && e.target.files[0]
                        setRequestAttachmentName(f ? f.name : '')
                      }}
                    />
                    {requestType === 'sick' && (
                      <div className="text-xs text-muted-foreground">(For sick leave certificate)</div>
                    )}
                  </div>
                </div>

                {requestTouched && requestHasError && (
                  <div className="rounded border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    Please fill all fields{requestType === 'sick' ? ' and attach certificate' : ''}.
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <Button size="sm" onClick={submitRequest}>
                    Submit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setRequestOpen(false)}>
                    Discard
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
