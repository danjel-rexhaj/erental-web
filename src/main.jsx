import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import App from './App.jsx'
import { LangProvider } from './i18n.jsx'

registerSW({ immediate: true })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LangProvider>
      <App />
      <Analytics />
    </LangProvider>
  </StrictMode>,
)
