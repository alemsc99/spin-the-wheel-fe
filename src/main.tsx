import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { TranslationProvider } from './i18n/TranslationProvider'
import { HelmetProvider } from 'react-helmet-async'
import posthog from 'posthog-js'

posthog.init('phc_B3NBaN3DFIywYW6JBKoc62Bp552jTxhYwtl18g7vmy8',
    {
        api_host: 'https://eu.i.posthog.com',
        person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
        autocapture: true, // enable automatic capture of pageviews and clicks
    }
)

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <TranslationProvider>
        <App />
      </TranslationProvider>
    </HelmetProvider>
  </React.StrictMode>
)
