import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => {
        if (import.meta.env.DEV) {
          const thisOrigin = window.location.origin;
          registrations.forEach((registration) => {
            const isLocalScope = typeof registration.scope === 'string' && registration.scope.startsWith(thisOrigin);
            if (!isLocalScope) return;

            registration.unregister().catch(() => {});
          });
        }
      })
      .catch(() => {});
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
