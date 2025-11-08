import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { TranslationProvider } from './i18n/TranslationProvider'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TranslationProvider>
      <App />
    </TranslationProvider>
  </React.StrictMode>
)
