import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { useEmployeeFromStorage } from '@/hooks/useEmployeeFromStorage'
import { useSalaryConfig } from '@/hooks/useSalaryConfig'
import { ProfileTabs } from '@/components/profile/ProfileTabs'
import { ResumeTab } from '@/components/profile/ResumeTab'
import { PrivateInfoTab } from '@/components/profile/PrivateInfoTab'
import { SalaryInfoTab } from '@/components/profile/SalaryInfoTab'
import { ProfileHeaderCard } from '@/components/profile/ProfileHeaderCard'

export default function EmployeeView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('private')
  const { user } = useAuth()

  const { employee, loadingEmployee } = useEmployeeFromStorage(id)

  const { salaryConfig, wageAmount, salaryComputed, setSalaryField, setComponentValue } = useSalaryConfig(id)

  // For testing: always show Salary Info.
  // To restore admin-only behavior, replace `canViewSalary` with:
  //   user?.role === 'admin' || user?.isAdmin === true
  const canViewSalary = useMemo(() => {
    return true
  }, [])

  const primaryName = employee?.name || user?.name || 'My Profile'
  const loginId = employee?.loginId || (user?.email ? user.email.split('@')[0] : '—')
  const email = employee?.email || user?.email || '—'
  const mobile = employee?.mobile || user?.phone || '—'
  const company = employee?.company || user?.company || '—'
  const department = employee?.department || '—'
  const manager = employee?.manager || '—'
  const location = employee?.location || '—'

  if (loadingEmployee) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="container mx-auto px-6 py-10">
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">Loading…</p>
          </div>
        </div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="container mx-auto px-6 py-10">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <p className="mb-4">Employee not found.</p>
              <Button onClick={() => navigate(-1)}>Back</Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ProfileHeaderCard
        employeeId={employee?.id ?? id}
        profileImage={employee?.profileImage}
        primaryName={primaryName}
        loginId={loginId}
        email={email}
        mobile={mobile}
        company={company}
        department={department}
        manager={manager}
        location={location}
        onBack={() => navigate(-1)}
      />

      <div className="container mx-auto px-6">
        <Card>
          <CardContent>
            <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} canViewSalary={canViewSalary} />

            {activeTab === 'resume' && (
              <ResumeTab
                employeeId={employee?.id ?? id}
                initialAbout={employee?.resumeAbout}
                initialLoveJob={employee?.resumeLoveJob}
                initialHobbies={employee?.resumeHobbies}
              />
            )}
            {activeTab === 'private' && <PrivateInfoTab employee={employee} />}
            {activeTab === 'salary' && canViewSalary && (
              <SalaryInfoTab
                salaryConfig={salaryConfig}
                wageAmount={wageAmount}
                salaryComputed={salaryComputed}
                setSalaryField={setSalaryField}
                setComponentValue={setComponentValue}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
