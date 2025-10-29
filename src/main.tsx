import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Analytics } from '@vercel/analytics/react'
import { injectSpeedInsights } from '@vercel/speed-insights'

// Coleta de métricas de experiência real (RES) pela Vercel
injectSpeedInsights()

createRoot(document.getElementById("root")!).render(
    <>
        <App />
        <Analytics />
    </>
);
