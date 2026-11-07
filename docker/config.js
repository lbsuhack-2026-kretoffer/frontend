// Runtime-конфигурация образа: фронтенд работает через nginx-прокси к API.
// В Docker Compose бэкенд доступен по имени сервиса api:8000 или host.docker.internal:8000.
window.__APP_CONFIG__ = {
  apiBaseUrl: '/api/v1',
  useMocks: false,
  authMode: 'api',
}
