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
    <div className="fixed bottom-4 right-4 z-40 max-w-sm">
      <Card className="bg-white shadow-lg border border-gray-200">
                <CardContent className="p-4">
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <Cookie className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-gray-900">
                                    🍪 Cookies
                                </h3>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    Usamos cookies para melhorar sua experiência.
                                    Alguns são essenciais, outros opcionais.
                                </p>
                            </div>
                        </div>

                        {showDetails && (
                            <div className="bg-gray-50 rounded p-2 space-y-2 text-xs">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-3 h-3 text-green-600" />
                                    <span className="font-medium">Essenciais</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Settings className="w-3 h-3 text-blue-600" />
                                    <span className="font-medium">Análise (opcional)</span>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleAcceptAll}
                                    size="sm"
                                    className="bg-cgb-primary hover:bg-cgb-primary-dark text-white text-xs px-3 py-1"
                                >
                                    Aceitar
                                </Button>

                                <Button
                                    onClick={handleAcceptNecessary}
                                    variant="outline"
                                    size="sm"
                                    className="border-gray-300 text-gray-700 hover:bg-gray-50 text-xs px-3 py-1"
                                >
                                    Essenciais
                                </Button>

                                <Button
                                    onClick={handleCustomize}
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-600 hover:text-gray-800 text-xs px-2 py-1"
                                >
                                    {showDetails ? '−' : '+'}
                                </Button>
                            </div>

                            <p className="text-xs text-gray-500">
                                <a href="/politica-privacidade" className="text-cgb-primary hover:underline">
                                    Política de Privacidade
                                </a>
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
