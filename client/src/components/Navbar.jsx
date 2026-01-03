import { useState } from "react"
import { Menu, X, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useTheme } from "next-themes"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { getLocalDateKey, upsertAttendanceRecord } from "@/utils/attendanceStorage"
import { checkIn, checkOut } from "@/services/api"

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null) // "checkin" | "checkout" | null
  const [navSearchDraft, setNavSearchDraft] = useState("")
  const [navSearchQuery, setNavSearchQuery] = useState("")
  const { theme, setTheme } = useTheme()
  const { user, logout, setUser } = useAuth()
  const navigate = useNavigate()


  function commitNavSearch(nextValue) {
    const q = String(nextValue ?? "").trim()
    setNavSearchQuery(q)
    setNavSearchDraft("")
  }

  async function applyCheckInOutToggle() {
    if (!setUser) return
    if (!user) {
      navigate("/login")
      return
    }

    const now = new Date()
    const todayKey = getLocalDateKey(now)

    const willCheckout = Boolean(user?.attendance?.checkedInAt)

    // Hit backend first so server state stays authoritative
    try {
      const res = willCheckout ? await checkOut() : await checkIn()
      const apiUser = res?.user
      if (apiUser && setUser) {
        setUser(prev => ({
          ...(prev || {}),
          ...(apiUser || {}),
          is_active: apiUser?.is_active === true,
          status: apiUser?.is_active === true ? "present" : "absent",
        }))
      }
    } catch {
      return
    }

    setUser(prev => {
      const current = prev || {}
      const attendance = current.attendance || {}

      const workDate = attendance.workDate === todayKey ? todayKey : todayKey
      const workedMsToday = attendance.workDate === todayKey ? Number(attendance.workedMsToday || 0) : 0
      const checkedInAt = attendance.workDate === todayKey ? attendance.checkedInAt : null

      const employeeId = current.id || current.employeeId || current.empId || null
      const employeeName = current.name || current.fullName || current.email || '—'

      // If currently checked in -> check out and accumulate worked time
      if (checkedInAt) {
        const started = new Date(checkedInAt)
        const deltaMs = Number.isFinite(started.getTime()) ? Math.max(0, now.getTime() - started.getTime()) : 0
        const nextWorked = workedMsToday + deltaMs

        if (employeeId != null) {
          upsertAttendanceRecord({
            employeeId,
            employeeName,
            date: todayKey,
            checkInAt: checkedInAt,
            checkOutAt: now.toISOString(),
            workedMs: nextWorked,
          })
        }

        return {
          ...current,
          status: "absent",
          attendance: {
            workDate,
            checkedInAt: null,
            lastCheckOutAt: now.toISOString(),
            workedMsToday: nextWorked,
          },
        }
      }

      // Otherwise -> check in and start counting hours

      if (employeeId != null) {
        upsertAttendanceRecord({
          employeeId,
          employeeName,
          date: todayKey,
          checkInAt: now.toISOString(),
          checkOutAt: null,
          workedMs: workedMsToday,
        })
      }

      return {
        ...current,
        status: "present",
        attendance: {
          workDate,
          checkedInAt: now.toISOString(),
          lastCheckInAt: now.toISOString(),
          workedMsToday,
        },
      }
    })
  }

  function requestToggleConfirmation() {
    if (!user) {
      navigate("/login")
      return
    }
    const isCheckedIn = Boolean(user?.attendance?.checkedInAt)
    setPendingAction(isCheckedIn ? "checkout" : "checkin")
    setConfirmOpen(true)
  }

  function go(to) {
    setOpen(false)
    setMenuOpen(false)
    navigate(to)
  }

  async function handleLogout() {
    setMenuOpen(false)
    setOpen(false)
    if (logout) await logout()
    else if (setUser) setUser(null)
    navigate("/")
  }

  function goToProfile() {
    setMenuOpen(false)
    setOpen(false)

    try {
      const raw = localStorage.getItem("si_employees")
      if (raw) {
        const list = JSON.parse(raw)
        const current = Array.isArray(list) ? list.find(e => e?.isCurrent) : null
        if (current?.id != null) {
          navigate(`/employees/${current.id}`)
          return
        }
      }
    } catch {}

    navigate("/employees")
  }

  const statusDotClass =
    user?.is_active === true || user?.status === "present"
      ? "bg-green-500"
      : user?.status === "leave"
        ? "bg-yellow-400"
        : "bg-red-500"

  return (
    <nav className="border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center px-6">
        {/* Left: logo */}
        <div className="flex items-center">
          <button
            type="button"
            className="flex items-center gap-2 font-semibold"
            onClick={() => go("/")}
          >
            <img src="/logo.png" alt="Smart Incident logo" className="h-8 w-auto" />
          </button>
        </div>

        {/* Center: tabs and search */}
        <div className="mx-6 hidden flex-1 items-center gap-4 md:flex">
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="px-3 py-1 text-sm">
              Company
            </Button>
            <Button
              variant="ghost"
              className="bg-muted/20 px-3 py-1 text-sm"
              onClick={() => go("/employees")}
            >
              Employees
            </Button>
            <Button variant="ghost" className="px-3 py-1 text-sm" onClick={() => go("/attendance")}>
              Attendance
            </Button>
            <Button variant="ghost" className="px-3 py-1 text-sm" onClick={() => go("/time-off")}>
              Time Off
            </Button>
          </div>

          <div className="ml-6 w-72">
            <Label htmlFor="nav-search" className="sr-only">
              Search
            </Label>
            <Input
              id="nav-search"
              placeholder={navSearchQuery ? `Search: ${navSearchQuery}` : "Search"}
              value={navSearchDraft}
              onChange={e => setNavSearchDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  commitNavSearch(e.currentTarget.value)
                }
              }}
              onBlur={() => {
                if (navSearchDraft !== "") commitNavSearch(navSearchDraft)
              }}
            />
          </div>
        </div>

        {/* Right: controls */}
        <div className="ml-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </Button>

          <button
            type="button"
            onClick={requestToggleConfirmation}
            className={`mx-2 h-4 w-4 self-center rounded-full border-2 border-white ${statusDotClass}`}
            aria-label={user?.attendance?.checkedInAt ? "Check out" : "Check in"}
            title={user?.attendance?.checkedInAt ? "Check out" : "Check in"}
          />

          <AlertDialog
            open={confirmOpen}
            onOpenChange={openState => {
              setConfirmOpen(openState)
              if (!openState) setPendingAction(null)
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {pendingAction === "checkout" ? "Confirm Check Out" : "Confirm Check In"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {pendingAction === "checkout"
                    ? "Do you want to Check Out?"
                    : "Do you want to Check In?"}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setConfirmOpen(false)
                    setPendingAction(null)
                    void applyCheckInOutToggle()
                  }}
                >
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(s => !s)}
              className="inline-flex h-9 w-9 items-center justify-center rounded bg-muted text-muted-foreground"
              aria-label="User menu"
            >
              {user?.email ? user.email.charAt(0).toUpperCase() : "U"}
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-40 rounded-md border bg-background p-2 shadow">
                <button
                  type="button"
                  className="block w-full px-2 py-1 text-left text-sm"
                  onClick={goToProfile}
                >
                  My Profile
                </button>
                <button
                  type="button"
                  className="block w-full px-2 py-1 text-left text-sm"
                  onClick={handleLogout}
                >
                  Log Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setOpen(s => !s)}>
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="space-y-3 border-t px-6 py-4 md:hidden">
          {user ? (
            <>
              <Button variant="ghost" className="w-full" onClick={() => go("/employees")}>
                Employees
              </Button>
              <Button variant="ghost" className="w-full" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" className="w-full" onClick={() => go("/login")}>
                Login
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => go("/register")}>
                Sign Up
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            Toggle Theme
          </Button>
        </div>
      )}
    </nav>
  )
}
