import { Button } from '@/components/ui/button'

export function ProfileTabs({ activeTab, setActiveTab, canViewSalary }) {
  return (
    <div className="flex items-center gap-2 border-b pb-3">
      <Button variant={activeTab === 'resume' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTab('resume')}>
        Resume
      </Button>
      <Button variant={activeTab === 'private' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTab('private')}>
        Private Info
      </Button>
      <Button
        variant={activeTab === 'salary' ? 'default' : 'ghost'}
        size="sm"
        disabled={!canViewSalary}
        onClick={() => {
          if (!canViewSalary) return
          setActiveTab('salary')
        }}
      >
        Salary Info
      </Button>
    </div>
  )
}
