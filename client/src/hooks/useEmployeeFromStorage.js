import { useEffect, useState } from 'react'

export function useEmployeeFromStorage(employeeId) {
  const [employee, setEmployee] = useState(null)
  const [loadingEmployee, setLoadingEmployee] = useState(true)

  useEffect(() => {
    setLoadingEmployee(true)
    try {
      const raw = localStorage.getItem('si_employees')
      const list = raw ? JSON.parse(raw) : []
      const emp = list.find(e => String(e.id) === String(employeeId))
      setEmployee(emp || null)
    } catch {
      setEmployee(null)
    } finally {
      setLoadingEmployee(false)
    }
  }, [employeeId])

  return { employee, loadingEmployee }
}
