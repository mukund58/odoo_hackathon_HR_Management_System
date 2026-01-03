import { useEffect, useMemo, useRef, useState } from 'react'
import Navbar from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Pencil } from 'lucide-react'
import { resolveFileUrl } from '@/services/api'

export function ProfileHeaderCard({
  employeeId,
  profileImage,
  primaryName,
  loginId,
  email,
  mobile,
  company,
  department,
  manager,
  location,
  onBack,
}) {
  const fileInputRef = useRef(null)
  const [photoError, setPhotoError] = useState('')
  const [photoDataUrl, setPhotoDataUrl] = useState(profileImage || '')

  const [displayName, setDisplayName] = useState(primaryName || '')

  const [isEditingName, setIsEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(primaryName || '')
  const [nameError, setNameError] = useState('')

  useEffect(() => {
    setPhotoDataUrl(profileImage || '')
  }, [profileImage])

  useEffect(() => {
    if (!isEditingName) setDisplayName(primaryName || '')
  }, [primaryName, isEditingName])

  useEffect(() => {
    if (!isEditingName) setNameDraft(primaryName || '')
  }, [primaryName, isEditingName])

  const initials = useMemo(() => (displayName || 'U').charAt(0).toUpperCase(), [displayName])

  function startEditName() {
    setNameError('')
    setNameDraft(primaryName || '')
    setIsEditingName(true)
  }

  function cancelEditName() {
    setNameError('')
    setNameDraft(primaryName || '')
    setIsEditingName(false)
  }

  function saveName() {
    const nextName = String(nameDraft || '').trim()
    if (!nextName) {
      setNameError('Name is required.')
      return
    }
    if (nextName.length > 60) {
      setNameError('Name is too long (max 60 characters).')
      return
    }

    setNameError('')
    setDisplayName(nextName)
    setIsEditingName(false)

    if (employeeId == null) return
    try {
      const raw = localStorage.getItem('si_employees')
      const list = raw ? JSON.parse(raw) : []
      const arr = Array.isArray(list) ? list : []
      const next = arr.map(emp =>
        String(emp?.id) === String(employeeId) ? { ...emp, name: nextName } : emp
      )
      localStorage.setItem('si_employees', JSON.stringify(next))
    } catch {
      // ignore storage errors
    }
  }

  function openFilePicker() {
    setPhotoError('')
    if (fileInputRef.current) fileInputRef.current.click()
  }

  function onFileChange(e) {
    const file = e.target.files && e.target.files[0]
    // allow re-selecting same file later
    e.target.value = ''

    if (!file) return

    const maxBytes = 2 * 1024 * 1024 // 2MB
    const isImage = typeof file.type === 'string' && file.type.startsWith('image/')

    if (!isImage) {
      setPhotoError('Please select a valid image file (PNG, JPG, WEBP).')
      return
    }
    if (file.size > maxBytes) {
      setPhotoError('Image is too large. Max size is 2MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : ''
      if (!dataUrl) {
        setPhotoError('Failed to read image file. Please try again.')
        return
      }

      setPhotoDataUrl(dataUrl)
      setPhotoError('')

      // Persist per-employee in localStorage
      if (employeeId == null) return
      try {
        const raw = localStorage.getItem('si_employees')
        const list = raw ? JSON.parse(raw) : []
        const arr = Array.isArray(list) ? list : []
        const next = arr.map(emp =>
          String(emp?.id) === String(employeeId) ? { ...emp, profileImage: dataUrl } : emp
        )
        localStorage.setItem('si_employees', JSON.stringify(next))
      } catch {
        // ignore storage errors
      }
    }
    reader.onerror = () => setPhotoError('Failed to read image file. Please try again.')
    reader.readAsDataURL(file)
  }

  return (
    <>
      <Navbar />

      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
          <h1 className="text-lg font-semibold">My Profile</h1>
        </div>

        <CardHeader className="mt-4 pb-4">
          <div className="grid gap-4 md:grid-cols-[280px_1fr] md:items-start">
            <div className="flex items-start gap-4">
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={openFilePicker}
                  className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-none bg-muted text-3xl"
                  aria-label="Change profile photo"
                  title="Change profile photo"
                >
                  {photoDataUrl ? (
                    <img src={resolveFileUrl(photoDataUrl)} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute bottom-1.5 right-1.5 h-8 w-8 rounded-full border bg-background"
                  aria-label="Edit profile photo"
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    openFilePicker()
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onFileChange}
                  />
                </button>

                {photoError ? (
                  <div className="mt-2 text-xs text-destructive">{photoError}</div>
                ) : null}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  {isEditingName ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          value={nameDraft}
                          onChange={e => setNameDraft(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              saveName()
                            }
                            if (e.key === 'Escape') {
                              e.preventDefault()
                              cancelEditName()
                            }
                          }}
                          className="h-9 w-64"
                          aria-label="Name"
                          autoFocus
                        />
                        <Button type="button" size="sm" onClick={saveName}>
                          Save
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={cancelEditName}>
                          Cancel
                        </Button>
                      </div>
                      {nameError ? <div className="text-xs text-destructive">{nameError}</div> : null}
                    </div>
                  ) : (
                    <>
                      <div className="text-xl font-semibold leading-tight">{displayName}</div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Edit name"
                        onClick={startEditName}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  <div className="flex gap-2">
                    <span className="w-20">Login ID</span>
                    <span>{loginId}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-20">Email</span>
                    <span>{email}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-20">Mobile</span>
                    <span>{mobile}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <div className="flex gap-2">
                <span className="w-24">Company</span>
                <span>{company}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-24">Department</span>
                <span>{department}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-24">Manager</span>
                <span>{manager}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-24">Location</span>
                <span>{location}</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </div>
    </>
  )
}
