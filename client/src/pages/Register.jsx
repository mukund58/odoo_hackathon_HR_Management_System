import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
	CardDescription
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
// MagicCard removed — use plain container
import { Eye, EyeOff, UploadCloud, ArrowLeft } from 'lucide-react'
import { fetchProfile, login as apiLogin, signup as apiSignup } from '@/services/api'

export default function Register() {
	const navigate = useNavigate()
	const [company, setCompany] = useState('')
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [phone, setPhone] = useState('')
	const [password, setPassword] = useState('')
	const [confirm, setConfirm] = useState('')
	const [logoPreview, setLogoPreview] = useState(null)
	const [photoFile, setPhotoFile] = useState(null)
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirm, setShowConfirm] = useState(false)
	const [error, setError] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const { setUser, setToken } = useAuth()

	function handleBack() {
		if (typeof window !== 'undefined' && window.history.length > 1) {
			navigate(-1)
			return
		}
		navigate('/')
	}

	function handleLogoChange(e) {
		const f = e.target.files && e.target.files[0]
		if (f) {
			setPhotoFile(f)
			const url = URL.createObjectURL(f)
			setLogoPreview(url)
		} else {
			setPhotoFile(null)
			setLogoPreview(null)
		}
	}

	async function handleSubmit(e) {
		e.preventDefault()
		setError('')
		if (!company || !String(company).trim()) {
			setError('Company name is required')
			return
		}
		if (!name || !String(name).trim()) {
			setError('Name is required')
			return
		}
		if (!phone || !String(phone).trim()) {
			setError('Phone is required')
			return
		}
		if (password !== confirm) {
			setError('Passwords do not match')
			return
		}
		if (!email || !password) {
			setError('Email and password are required')
			return
		}
		setIsSubmitting(true)
		try {
			const fd = new FormData()
			fd.append('companyName', String(company).trim())
			fd.append('name', name)
			fd.append('email', email)
			fd.append('phone', String(phone).trim())
			fd.append('password', password)
			fd.append('confirmPassword', confirm)
			if (photoFile) fd.append('photo', photoFile)

			await apiSignup(fd)

			// Auto-login after signup
			const loginRes = await apiLogin({ auth_id: email, password })
			const token = loginRes?.token
			if (token && setToken) setToken(token)

			const profileRes = await fetchProfile()
			const u = profileRes?.user
			if (u && setUser) {
				const isAdmin = u.is_admin === true || u.isAdmin === true
				const companyLogo = u.company_logo || u.companyLogo || u.logo || u.photo || ''
				setUser({ ...u, isAdmin, role: isAdmin ? 'admin' : 'employee', companyLogo })
				try {
					if (companyLogo) localStorage.setItem('si_company_logo', String(companyLogo))
				} catch {}
			}

			navigate('/employees')
		} catch (err) {
			setError(err.message || 'Registration failed')
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div className="min-h-screen bg-background text-foreground">
			<div className="container mx-auto flex min-h-screen items-center justify-center px-6 py-12">
				<div className="w-full max-w-md">
					<Button type="button" variant="ghost" className="mb-3" onClick={handleBack}>
						<ArrowLeft className="mr-2 h-4 w-4" /> Back
					</Button>

					<Card className="w-full p-0 shadow-none">
						<div className="p-0">
							<CardHeader className="border-border border-b p-4 [.border-b]:pb-4">
								<CardTitle>Create account</CardTitle>
								<CardDescription>
									Fill the form to create your account and start reporting incidents.
								</CardDescription>
							</CardHeader>

							<CardContent className="space-y-5 p-4">
								<form onSubmit={handleSubmit}>
									<div className="grid gap-4">
										<div className="flex items-center space-x-4">
											<div className="flex-1">
												<Label htmlFor="company">Company Name</Label>
												<Input id="company" value={company} onChange={e => setCompany(e.target.value)} placeholder="Company name" />
											</div>

											<div className="w-20 text-center">
												<Label>Logo</Label>
												<label className="group relative inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded border border-dashed p-2">
													<input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
													{logoPreview ? (
														<img src={logoPreview} alt="logo preview" className="h-10 w-10 rounded object-cover" />
													) : (
														<UploadCloud className="h-6 w-6 text-muted-foreground" />
													)}
												</label>
											</div>
										</div>

										<div className="grid gap-2">
											<Label htmlFor="name">Name</Label>
											<Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />
										</div>

										<div className="grid gap-2">
											<Label htmlFor="email">Email</Label>
											<Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" required />
										</div>

										<div className="grid gap-2">
											<Label htmlFor="phone">Phone</Label>
											<Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" />
										</div>

										<div className="grid gap-2">
											<Label htmlFor="password">Password</Label>
											<div className="relative">
												<Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="new-password" />
												<button type="button" className="absolute right-2 top-2 text-sm" onClick={() => setShowPassword(s => !s)} aria-label="Toggle password visibility">
													{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
												</button>
											</div>
										</div>

										<div className="grid gap-2">
											<Label htmlFor="confirm">Confirm Password</Label>
											<div className="relative">
												<Input id="confirm" type={showConfirm ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirm password" required autoComplete="new-password" />
												<button type="button" className="absolute right-2 top-2 text-sm" onClick={() => setShowConfirm(s => !s)} aria-label="Toggle confirm password">
													{showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
												</button>
											</div>
										</div>

										{error && (
											<div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
												{error}
											</div>
										)}
									</div>

									<CardFooter className="border-border mt-4 border-t p-0 pt-4">
										<Button className="w-full" type="submit" disabled={isSubmitting}>
											{isSubmitting ? 'Creating account…' : 'Sign Up'}
										</Button>
									</CardFooter>
								</form>

								<div className="text-center text-sm">
									<Button type="button" variant="link" className="w-full" onClick={() => navigate('/login')}>
										Already have an account? Sign In
									</Button>
								</div>
							</CardContent>
						</div>
					</Card>
				</div>
			</div>
		</div>
	)
}

