import { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import PrivateRoute from './routes/PrivateRoute'
import Loader from './components/Loader'

const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const EmployeeView = lazy(() => import('./pages/EmployeeView'))
const Attendance = lazy(() => import('./pages/Attendance'))
const TimeOff = lazy(() => import('./pages/TimeOff'))

export default function App() {
  const location = useLocation()

  useEffect(() => {
    const prefetch = () => {
      import('./pages/Login')
      import('./pages/Register')
    }

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const id = window.requestIdleCallback(prefetch, { timeout: 1500 })
      return () => window.cancelIdleCallback?.(id)
    }

    const t = setTimeout(prefetch, 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <Routes location={location} key={location.pathname}>
      <Route
        path="/"
        element={
          <Suspense fallback={<Loader />}>
            <Login />
          </Suspense>
        }
      />
      <Route
        path="/login"
        element={
          <Suspense fallback={<Loader />}>
            <Login />
          </Suspense>
        }
      />
      <Route
        path="/register"
        element={
          <Suspense fallback={<Loader />}>
            <Register />
          </Suspense>
        }
      />

      <Route element={<PrivateRoute />}>
        <Route
          path="/attendance"
          element={
            <Suspense fallback={<Loader />}>
              <Attendance />
            </Suspense>
          }
        />
        <Route
          path="/time-off"
          element={
            <Suspense fallback={<Loader />}>
              <TimeOff />
            </Suspense>
          }
        />
        <Route
          path="/employees"
          element={
            <Suspense fallback={<Loader />}>
              <Dashboard />
            </Suspense>
          }
        />
        {/* compatibility redirect: old /dashboard -> /employees */}
        <Route
          path="/dashboard"
          element={<Navigate to="/employees" replace />}
        />
        <Route
          path="/employees/:id"
          element={
            <Suspense fallback={<Loader />}>
              <EmployeeView />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  )
}
