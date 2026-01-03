import axios from "axios"

// Compute API URL:
// - If `VITE_API_URL` is not provided, use the Vite proxy path `/api`.
// - If provided but does not include `/api` path, append `/api` so requests
//   reach the backend mount at `/api` (backend mounts routes under `/api`).
const rawApiUrl = import.meta.env.VITE_API_URL
let computedApiUrl = rawApiUrl ? rawApiUrl.replace(/\/$/, "") : "/api"
if (rawApiUrl && !rawApiUrl.includes("/api")) {
  computedApiUrl = `${rawApiUrl.replace(/\/$/, "")}/api`
}
export const API_URL = computedApiUrl
export const apiUrlConfigured = Boolean(import.meta.env.VITE_API_URL)

// Origin for non-API assets (e.g. /uploads/...).
// If VITE_API_URL is not set, rely on Vite dev proxy paths.
export const API_ORIGIN = (() => {
  if (!rawApiUrl) return ""
  const trimmed = rawApiUrl.replace(/\/$/, "")
  return trimmed.endsWith("/api") ? trimmed.slice(0, -4) : trimmed
})()

export function resolveFileUrl(pathOrUrl) {
  const v = String(pathOrUrl || "").trim()
  if (!v) return ""
  if (/^(data:|blob:|https?:\/\/)/i.test(v)) return v

  // Normalize Windows slashes and ensure leading slash.
  const normalized = v.replace(/\\/g, "/")
  const withSlash = normalized.startsWith("/") ? normalized : `/${normalized}`

  // Prefer absolute backend origin when configured; otherwise use same-origin
  // and rely on Vite proxy (/uploads -> backend) in dev.
  if (API_ORIGIN) return `${API_ORIGIN}${withSlash}`
  return withSlash
}

export const api = axios.create({
  baseURL: API_URL.endsWith('/auth') ? API_URL : `${API_URL.replace(/\/$/, '')}/auth`,
  withCredentials: true,
})

function extractAxiosErrorMessage(err) {
  const status = err?.response?.status
  const payload = err?.response?.data

  if (payload && typeof payload === 'object') {
    const msg = payload.message || payload.error || payload.details
    if (msg) return String(msg)
    try {
      return JSON.stringify(payload)
    } catch {
      // fall through
    }
  }

  if (typeof payload === 'string' && payload.trim()) return payload

  if (status) return `Request failed with ${status}`
  return err?.message || 'Request failed'
}

export function setApiAuthToken(token) {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`
  else delete api.defaults.headers.common.Authorization
}

api.interceptors.request.use(config => {
  const token = typeof window !== "undefined" ? localStorage.getItem("si_token") : null
  if (token && !config.headers?.Authorization) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

function joinUrl(base, endpoint) {
  const normalizedEndpoint = endpoint?.startsWith("/") ? endpoint : `/${endpoint}`
  return `${base}${normalizedEndpoint}`
}

export async function apiRequest(endpoint, options = {}) {
  const method = (options.method || "GET").toUpperCase()
  const headers = { ...(options.headers || {}) }

  let data = options.body
  if (data && typeof data === "string") {
    try {
      data = JSON.parse(data)
    } catch {
      // keep as string
    }
  }

  try {
    const res = await api.request({
      url: joinUrl("", endpoint),
      method,
      headers,
      data,
    })
    return res.data
  } catch (err) {
    const status = err?.response?.status
    const payload = err?.response?.data
    const message =
      (payload && typeof payload === "object" && (payload.message || payload.error)) ||
      (typeof payload === "string" && payload) ||
      (status ? `Request failed with ${status}` : "Request failed")
    throw new Error(message)
  }
}

export async function signup(payload) {
  // Express route uses `upload.single('photo')` so send multipart/form-data.
  const body = payload instanceof FormData ? payload : (() => {
    const fd = new FormData()
    if (payload && typeof payload === 'object') {
      Object.entries(payload).forEach(([k, v]) => {
        if (v === undefined || v === null) return
        fd.append(k, v)
      })
    }
    return fd
  })()

  try {
    const res = await api.post("/signup", body)
    return res.data
  } catch (err) {
    throw new Error(extractAxiosErrorMessage(err))
  }
}

export async function login(payload) {
  try {
    const res = await api.post("/login", payload)
    return res.data
  } catch (err) {
    throw new Error(extractAxiosErrorMessage(err))
  }
}

export async function logout() {
  try {
    const res = await api.post("/logout")
    return res.data
  } catch (err) {
    throw new Error(extractAxiosErrorMessage(err))
  }
}

export async function fetchProfile() {
  try {
    const res = await api.get("/profile")
    return res.data
  } catch (err) {
    throw new Error(extractAxiosErrorMessage(err))
  }
}

export async function getAllUsers() {
  try {
    const res = await api.get("/getallusers")
    return res.data
  } catch (err) {
    throw new Error(extractAxiosErrorMessage(err))
  }
}

export async function getAllEmployees() {
  try {
    const res = await api.get("/getallemps")
    return res.data
  } catch (err) {
    throw new Error(extractAxiosErrorMessage(err))
  }
}

export async function checkIn() {
  try {
    const res = await api.get("/checkin")
    return res.data
  } catch (err) {
    throw new Error(extractAxiosErrorMessage(err))
  }
}

export async function checkOut() {
  try {
    const res = await api.get("/checkout")
    return res.data
  } catch (err) {
    throw new Error(extractAxiosErrorMessage(err))
  }
}

export async function getAttendance() {
  try {
    const res = await api.get("/getattendance")
    return res.data
  } catch (err) {
    throw new Error(extractAxiosErrorMessage(err))
  }
}

export async function getMyAttendance() {
  try {
    const res = await api.get('/myattendance')
    return res.data
  } catch (err) {
    throw new Error(extractAxiosErrorMessage(err))
  }
}
