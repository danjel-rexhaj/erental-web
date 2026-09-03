import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { Analytics } from '@vercel/analytics/react'
import 'flag-icons/css/flag-icons.min.css'
import './index.css'
import App from './App.jsx'
import Maintenance from './Maintenance.jsx'
import { LangProvider } from './i18n.jsx'

registerSW({ immediate: true })

// Flip VITE_MAINTENANCE_MODE=true on Vercel (redeploy required, same as any other VITE_ env var)
// to swap the whole site -- web and installed PWA alike, since it's the same bundle -- to a
// static "back shortly" page with zero API/router involvement. Flip back the same way afterward.
const MAINTENANCE_MODE = import.meta.env.VITE_MAINTENANCE_MODE === 'true'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {MAINTENANCE_MODE ? (
      <Maintenance />
    ) : (
      <LangProvider>
        <App />
        <Analytics />
      </LangProvider>
    )}
  </StrictMode>,
)
