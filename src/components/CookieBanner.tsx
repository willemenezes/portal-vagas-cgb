import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Cookie, X, Shield, Settings } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'cgb-cookie-consent';

export const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Verificar se o usuário já deu consentimento
    const hasConsented = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!hasConsented) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      necessary: true,
      analytics: true,
      marketing: false,
      timestamp: new Date().toISOString()
    }));
    setIsVisible(false);
  };

  const handleAcceptNecessary = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString()
    }));
    setIsVisible(false);
  };

  const handleCustomize = () => {
    setShowDetails(!showDetails);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-gray-200 shadow-lg">
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Cookie className="w-8 h-8 text-amber-600" />
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  🍪 Uso de Cookies
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Utilizamos cookies para melhorar sua experiência em nosso site, 
                  analisar o tráfego e personalizar conteúdo. Alguns cookies são 
                  essenciais para o funcionamento do site, outros nos ajudam a 
                  entender como você interage conosco.
                </p>
              </div>

              {showDetails && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">Cookies Necessários</h4>
                      <p className="text-sm text-gray-600">
                        Essenciais para o funcionamento do site (autenticação, preferências)
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">Cookies de Análise</h4>
                      <p className="text-sm text-gray-600">
                        Nos ajudam a entender como você usa o site (opcional)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={handleAcceptAll}
                  className="bg-cgb-primary hover:bg-cgb-primary-dark text-white"
                >
                  Aceitar Todos
                </Button>
                
                <Button 
                  onClick={handleAcceptNecessary}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Apenas Necessários
                </Button>
                
                <Button 
                  onClick={handleCustomize}
                  variant="ghost"
                  className="text-gray-600 hover:text-gray-800"
                >
                  {showDetails ? 'Ocultar Detalhes' : 'Personalizar'}
                </Button>
              </div>

              <div className="text-xs text-gray-500">
                <p>
                  Ao continuar navegando, você concorda com nossa{' '}
                  <a href="/politica-privacidade" className="text-cgb-primary hover:underline">
                    Política de Privacidade
                  </a>
                  {' '}e uso de cookies conforme a LGPD.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
