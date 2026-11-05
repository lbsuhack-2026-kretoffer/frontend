import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { config } from '@/shared/config'

async function bootstrap() {
  if (config.useMocks) {
    try {
      const { worker } = await import('@/mocks/browser')
      await worker.start({
        // Пропускаем навигацию и статику, предупреждаем только о неизвестных запросах к API.
        onUnhandledFrame({ frame, defaults }) {
          const url = frame?.data?.request?.url
          if (typeof url === 'string' && url.includes('/api/')) defaults.warn()
        },
        serviceWorker: { url: '/mockServiceWorker.js' },
      })
    } catch (error) {
      console.error('[msw] Не удалось запустить моки:', error)
    }
  }

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

bootstrap()
