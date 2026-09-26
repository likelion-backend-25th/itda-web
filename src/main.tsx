import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { restoreAppTheme } from '@/data/appTheme'
import './index.css'
import App from './App.tsx'

restoreAppTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
