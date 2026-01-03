import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import { fetchProfile, login as apiLogin } from '@/services/api'

export default function Login() {
  const navigate = useNavigate()
  const { setUser, setToken } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/')
  }

  async function handleEmailAuth(e) {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      setError('')

      const authId = String(email || '').trim()
      const pwd = String(password || '')
      if (!authId || !pwd) {
        setError('Please enter your email/login ID and password.')
        return
      }

      const loginRes = await apiLogin({ auth_id: authId, password: pwd })
      const token = loginRes?.token
      if (!token) {
        throw new Error(loginRes?.message || 'Login failed')
      }
      if (setToken) setToken(token)

      const profileRes = await fetchProfile()
      const u = profileRes?.user
      if (u && setUser) {
        const isAdmin = u.is_admin === true || u.isAdmin === true
        setUser({ ...u, isAdmin, role: isAdmin ? 'admin' : 'employee' })
      }

      navigate('/employees')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Button
            type="button"
            variant="ghost"
            className="mb-3"
            onClick={handleBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <Card className="w-full  p-0 shadow-none">
            <div className="p-0">
              <CardHeader className="border-border border-b p-4 [.border-b]:pb-4">
                <CardTitle>Login</CardTitle>
                <CardDescription>
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5 p-4">
                <form onSubmit={handleEmailAuth}>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email or Login ID</Label>
                      <Input
                        id="email"
                        type="text"
                        placeholder="name@example.com or LOGINID"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        autoComplete="username"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                      />
                    </div>

                    {error && (
                      <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {error}
                      </div>
                    )}
                  </div>

                  <CardFooter className="border-border mt-4 border-t p-0 pt-4">
                    <Button className="w-full" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Signing in…' : 'Sign in'}
                    </Button>
                  </CardFooter>
                </form>

                <Button
                  type="button"
                  variant="link"
                  className="w-full"
                  onClick={() => {
                    setError('')
                    navigate('/register')
                  }}
                >
                  No account? Create one
                </Button>
              </CardContent>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

