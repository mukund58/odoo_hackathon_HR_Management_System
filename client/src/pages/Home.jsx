import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()
  useEffect(() => {
    // redirect root to /login
    navigate('/login', { replace: true })
  }, [navigate])
  return null
}
