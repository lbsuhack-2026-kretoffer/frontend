const runtimeConfig =
  typeof window !== 'undefined' && window.__APP_CONFIG__ ? window.__APP_CONFIG__ : {}

const env = import.meta.env

export const config = {
  appName: 'Школьный Баланс-Пит',
  apiBaseUrl: runtimeConfig.apiBaseUrl || env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  useMocks: runtimeConfig.useMocks ?? env.VITE_USE_MOCKS === 'true',
  authMode: runtimeConfig.authMode || env.VITE_AUTH_MODE || 'api',
}
