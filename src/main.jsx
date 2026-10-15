import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import 'flag-icons/css/flag-icons.min.css'
import './index.css'
import App from './App.jsx'
import Maintenance from './Maintenance.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import { LangProvider } from './i18n.jsx'

registerSW({ immediate: true })

// Phones (Samsung Internet especially) don't always scroll a focused field above the on-screen
// keyboard. Once the keyboard has finished opening, if the field sits under it, bring it into view.
if (window.visualViewport && matchMedia('(pointer: coarse)').matches) {
  document.addEventListener('focusin', (e) => {
    const el = e.target
    if (!el.matches?.('input:not([type=checkbox]):not([type=radio]), textarea, select')) return
    setTimeout(() => {
      if (document.activeElement !== el) return
      const vv = window.visualViewport
      const r = el.getBoundingClientRect()
      if (r.bottom > vv.offsetTop + vv.height - 8 || r.top < vv.offsetTop) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }, 350)
  })
}

// Flip VITE_MAINTENANCE_MODE=true on Vercel (redeploy required, same as any other VITE_ env var)
// to swap the whole site -- web and installed PWA alike, since it's the same bundle -- to a
// static "back shortly" page with zero API/router involvement. Flip back the same way afterward.
const MAINTENANCE_MODE = import.meta.env.VITE_MAINTENANCE_MODE === 'true'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {MAINTENANCE_MODE ? (
      <Maintenance />
    ) : (
      <ErrorBoundary>
        <LangProvider>
          <App />
          <Analytics />
          <SpeedInsights />
        </LangProvider>
      </ErrorBoundary>
    )}
  </StrictMode>,
)
