const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, headers })
  } catch (error) {
    console.error(`Could not reach portal API at ${path}`, error)
    throw new Error('Could not reach the portal service. Check your connection and try again.')
  }

  const body = await response.text()
  let result: T & { error?: string }
  try {
    result = JSON.parse(body) as T & { error?: string }
  } catch {
    throw new Error('The portal service returned an invalid response. Please try again later.')
  }
  if (!response.ok) throw new Error(result.error || `Request failed with status ${response.status}.`)
  return result
}

export { API_BASE }
