import Navbar from "@/components/Navbar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuth } from "@/hooks/useAuth"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect } from "react"
import { checkIn, checkOut, getAllUsers } from "@/services/api"

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, setUser } = useAuth()

  const [queryDraft, setQueryDraft] = useState("")
  const [queryApplied, setQueryApplied] = useState("")

  function commitSearch(nextValue) {
    const q = String(nextValue ?? '').trim()
    setQueryApplied(q)
    setQueryDraft('')
  }
  const [employees, setEmployees] = useState(() => {
    try {
      const raw = localStorage.getItem('si_employees')
      if (raw) {
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
      }
    } catch {}
    return []
  })

  // Load employees from backend (company-scoped) and cache into localStorage
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await getAllUsers()
        const list = Array.isArray(res?.users) ? res.users : []
        const next = list.map(u => {
          const id = u?.id
          const isActive = u?.is_active === true
          return {
            id,
            name: u?.name || '—',
            email: u?.email || '',
            phone: u?.phone || '',
            loginId: u?.login_id || '',
            company: u?.company_name || '',
            isAdmin: u?.is_admin === true,
            status: isActive ? 'present' : 'absent',
            since: '',
            profileImage: u?.photo || '',
            isCurrent: user?.id != null && String(user.id) === String(id),
          }
        })
        if (!cancelled) setEmployees(next)
      } catch {
        // keep local cache if API fails
      }
    }

    if (user) load()
    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    try {
      localStorage.setItem('si_employees', JSON.stringify(employees))
    } catch {}
  }, [employees])

  async function toggleCheckIn(id) {
    // Backend only supports check-in/out for the logged-in user
    if (!user?.id || String(user.id) !== String(id)) return

    try {
      const isCheckedIn = user?.is_active === true || user?.status === 'present'
      const res = isCheckedIn ? await checkOut() : await checkIn()
      const apiUser = res?.user
      const nextActive = apiUser?.is_active === true
      const nextStatus = nextActive ? 'present' : 'absent'

      if (setUser) {
        setUser(prev => ({
          ...(prev || {}),
          ...(apiUser || {}),
          is_active: nextActive,
          status: nextStatus,
        }))
      }

      setEmployees(prev =>
        prev.map(emp => {
          if (String(emp.id) !== String(id)) return emp
          return { ...emp, status: nextStatus }
        })
      )
    } catch {
      // ignore; navbar dialog already handles confirmation UX
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="container mx-auto px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="logo" className="h-10" />
            <div>
              <h2 className="text-2xl font-semibold">Employees</h2>
              <p className="text-sm text-muted-foreground">Welcome{user?.email ? `, ${user.email}` : ''} — manage attendance and profiles.</p>
            </div>
            <div className="ml-6 flex items-center gap-2">

            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button className="bg-pink-400 text-white">NEW</Button>
            <div className="w-56">
              <Label htmlFor="search" className="sr-only">Search</Label>
              <Input
                id="search"
                placeholder={queryApplied ? `Search: ${queryApplied}` : 'Search'}
                value={queryDraft}
                onChange={e => setQueryDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    commitSearch(e.currentTarget.value)
                  }
                }}
                onBlur={() => {
                  if (queryDraft !== '') commitSearch(queryDraft)
                }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {employees.length === 0 ? (
            <div className="col-span-full rounded border bg-card p-6 text-sm text-muted-foreground">
              No employees found.
            </div>
          ) : (
            employees
              .filter(emp => emp.name.toLowerCase().includes(queryApplied.toLowerCase()))
              .map(emp => (
                <div
                  key={emp.id}
                  className="rounded border p-4 bg-card cursor-pointer"
                  onClick={() => navigate(`/employees/${emp.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-none bg-gray-200 flex items-center justify-center text-xl">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold">{emp.name}</div>
                        <div className="text-sm text-muted-foreground">Employee</div>
                      </div>
                    </div>
                    <div>
                      <span
                        className={`inline-block h-3 w-3 rounded-full ${emp.status === 'present' ? 'bg-green-500' : emp.status === 'leave' ? 'bg-yellow-400' : 'bg-red-500'}`}
                      ></span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Since: {emp.since || '—'}</div>
                    {user?.id != null && String(user.id) === String(emp.id) ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={e => {
                            e.stopPropagation()
                            toggleCheckIn(emp.id)
                          }}
                        >
                          {emp.status === 'present' ? 'Check Out' : 'Check In'}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))
          )}
        </div>
      </main>
    </div>
  )
}
