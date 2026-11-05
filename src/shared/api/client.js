import { getSessionUser } from '@/features/auth/session'
import { config } from '@/shared/config'

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

function buildUrl(path, query) {
  const base = config.apiBaseUrl.replace(/\/$/, '')
  const url = new URL(`${base}${path.startsWith('/') ? path : `/${path}`}`, window.location.origin)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue
      if (Array.isArray(value)) {
        value.forEach((item) => url.searchParams.append(key, item))
      } else {
        url.searchParams.set(key, String(value))
      }
    }
  }
  return url.toString()
}

async function parseBody(response) {
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) return null
  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function request(path, options = {}) {
  const { method = 'GET', body, query, headers, signal } = options
  const user = getSessionUser()

  const response = await fetch(buildUrl(path, query), {
    method,
    credentials: 'include',
    signal,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(user?.id && config.authMode === 'mock' ? { 'X-Demo-User': user.id } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })

  if (response.status === 204) return null

  const payload = await parseBody(response)

  if (!response.ok) {
    const message =
      payload?.detail ||
      payload?.message ||
      (response.status === 401
        ? 'Сессия истекла, войдите снова'
        : response.status === 403
          ? 'Недостаточно прав для этого действия'
          : 'Не удалось выполнить запрос')
    throw new ApiError(message, response.status, payload)
  }

  return payload
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
}
