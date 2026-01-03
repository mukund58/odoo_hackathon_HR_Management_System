import { useEffect, useState } from 'react'
import { AuthContext } from './auth-context'
import { fetchProfile, logout as apiLogout, setApiAuthToken } from '@/services/api'

function normalizeApiUser(raw) {
  if (!raw || typeof raw !== 'object') return null
  const isAdmin = raw.is_admin === true || raw.isAdmin === true
  const role = isAdmin ? 'admin' : 'employee'
  const companyLogo = raw.company_logo || raw.companyLogo || raw.logo || raw.photo || ''
  return {
    ...raw,
    isAdmin,
    role,
    companyLogo,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('si_user')
      const parsed = raw ? JSON.parse(raw) : null
      if (parsed && !parsed.role && parsed.email) {
        return { ...parsed, role: /admin/i.test(parsed.email) ? 'admin' : 'employee' }
      }
      return parsed
    } catch {
      return null
    }
  })

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('si_token')
    } catch {
      return null
    }
  })

  useEffect(() => {
    try {
      if (user) localStorage.setItem('si_user', JSON.stringify(user))
      else localStorage.removeItem('si_user')
    } catch {}
  }, [user])

  useEffect(() => {
    try {
      if (token) localStorage.setItem('si_token', token)
      else localStorage.removeItem('si_token')
    } catch {}
    setApiAuthToken(token)
  }, [token])

  // If we have a token but no user (or stale user), hydrate from backend.
  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      if (!token) return
      try {
        const res = await fetchProfile()
        const apiUser = res?.user ? normalizeApiUser(res.user) : null
        if (!cancelled && apiUser) {
          setUser(apiUser)
          try {
            if (apiUser.companyLogo) localStorage.setItem('si_company_logo', String(apiUser.companyLogo))
          } catch {}
        }
      } catch {
        // If token is invalid/expired, clear local session.
        if (!cancelled) {
          setUser(null)
          setToken(null)
        }
      }
    }

    // Only call if we don't have a reasonably complete user.
    if (token && (!user || (!user.id && !user.email))) {
      hydrate()
    }

    return () => {
      cancelled = true
    }
  }, [token])

  async function logout() {
    try {
      await apiLogout()
    } catch {
      // ignore logout network errors; still clear local session
    }
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, token, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
