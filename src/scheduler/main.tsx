import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SchedulerPage } from './SchedulerPage'
import '../styles/tailwind.css'

const rootElement = document.getElementById('root')

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <SchedulerPage />
    </StrictMode>
  )
}
