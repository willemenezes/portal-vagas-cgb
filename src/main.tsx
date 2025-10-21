import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Analytics } from '@vercel/analytics/react'

// Componente para Analytics Condicional
const ConditionalAnalytics = () => {
    // Verificar se é usuário interno
    const isInternalUser = document.cookie.includes('internal_user=true');
    
    if (isInternalUser) {
        console.log('🍪 [Analytics] Usuário interno detectado - Analytics desabilitado');
        return null;
    }
    
    console.log('🍪 [Analytics] Usuário externo detectado - Analytics ativo');
    return <Analytics />;
};

createRoot(document.getElementById("root")!).render(
    <>
        <App />
        <ConditionalAnalytics />
    </>
);
