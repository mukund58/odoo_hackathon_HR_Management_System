import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Pencil } from 'lucide-react'

function persistEmployeeFields(employeeId, patch) {
  if (employeeId == null) return
  try {
    const raw = localStorage.getItem('si_employees')
    const list = raw ? JSON.parse(raw) : []
    const arr = Array.isArray(list) ? list : []
    const next = arr.map(emp => (String(emp?.id) === String(employeeId) ? { ...emp, ...patch } : emp))
    localStorage.setItem('si_employees', JSON.stringify(next))
  } catch {
    // ignore storage errors
  }
}

function SectionCard({
  title,
  ariaLabel,
  value,
  isEditing,
  draft,
  error,
  onStartEdit,
  onDraftChange,
  onSave,
  onCancel,
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm">{title}</CardTitle>
          {!isEditing ? (
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label={ariaLabel} onClick={onStartEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="text-sm">
        {isEditing ? (
          <div className="grid gap-2">
            <textarea
              value={draft}
              onChange={e => onDraftChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Escape') {
                  e.preventDefault()
                  onCancel()
                }
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  onSave()
                }
              }}
              className="min-h-[88px] w-full resize-none rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={title}
              autoFocus
            />
            {error ? <div className="text-xs text-destructive">{error}</div> : null}
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" onClick={onSave}>
                Save
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <div className="text-xs text-muted-foreground">Tip: Ctrl/⌘ + Enter to save, Esc to cancel</div>
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground">{value ? value : 'No information added yet.'}</div>
        )}
      </CardContent>
    </Card>
  )
}

export function ResumeTab({ employeeId, initialAbout, initialLoveJob, initialHobbies }) {
  const [about, setAbout] = useState(initialAbout || '')
  const [loveJob, setLoveJob] = useState(initialLoveJob || '')
  const [hobbies, setHobbies] = useState(initialHobbies || '')

  const [editingKey, setEditingKey] = useState(null)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (editingKey) return
    setAbout(initialAbout || '')
    setLoveJob(initialLoveJob || '')
    setHobbies(initialHobbies || '')
  }, [editingKey, initialAbout, initialLoveJob, initialHobbies])

  const currentValue = useMemo(() => {
    if (editingKey === 'about') return about
    if (editingKey === 'loveJob') return loveJob
    if (editingKey === 'hobbies') return hobbies
    return ''
  }, [editingKey, about, loveJob, hobbies])

  function startEdit(key) {
    setError('')
    setEditingKey(key)
    if (key === 'about') setDraft(about || '')
    if (key === 'loveJob') setDraft(loveJob || '')
    if (key === 'hobbies') setDraft(hobbies || '')
  }

  function cancelEdit() {
    setError('')
    setDraft('')
    setEditingKey(null)
  }

  function saveEdit() {
    const next = String(draft || '').trim()
    if (next.length > 500) {
      setError('Too long (max 500 characters).')
      return
    }

    setError('')
    if (editingKey === 'about') {
      setAbout(next)
      persistEmployeeFields(employeeId, { resumeAbout: next })
    }
    if (editingKey === 'loveJob') {
      setLoveJob(next)
      persistEmployeeFields(employeeId, { resumeLoveJob: next })
    }
    if (editingKey === 'hobbies') {
      setHobbies(next)
      persistEmployeeFields(employeeId, { resumeHobbies: next })
    }

    setDraft('')
    setEditingKey(null)
  }

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <div className="grid gap-4">
        <SectionCard
          title="About"
          ariaLabel="Edit About"
          value={about}
          isEditing={editingKey === 'about'}
          draft={editingKey === 'about' ? draft : currentValue}
          error={editingKey === 'about' ? error : ''}
          onStartEdit={() => startEdit('about')}
          onDraftChange={setDraft}
          onSave={saveEdit}
          onCancel={cancelEdit}
        />

        <SectionCard
          title="What I love about my job"
          ariaLabel="Edit What I love about my job"
          value={loveJob}
          isEditing={editingKey === 'loveJob'}
          draft={editingKey === 'loveJob' ? draft : currentValue}
          error={editingKey === 'loveJob' ? error : ''}
          onStartEdit={() => startEdit('loveJob')}
          onDraftChange={setDraft}
          onSave={saveEdit}
          onCancel={cancelEdit}
        />

        <SectionCard
          title="My interests and hobbies"
          ariaLabel="Edit My interests and hobbies"
          value={hobbies}
          isEditing={editingKey === 'hobbies'}
          draft={editingKey === 'hobbies' ? draft : currentValue}
          error={editingKey === 'hobbies' ? error : ''}
          onStartEdit={() => startEdit('hobbies')}
          onDraftChange={setDraft}
          onSave={saveEdit}
          onCancel={cancelEdit}
        />
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Skills</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <div className="rounded border border-dashed p-3">+ Add skills</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Certification</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <div className="rounded border border-dashed p-3">+ Add certification</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
