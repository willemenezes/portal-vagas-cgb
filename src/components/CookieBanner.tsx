import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Cookie, Shield } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'cgb-cookie-consent';

export const CookieBanner = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Verificar se o usuário já deu consentimento
        const hasConsented = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (!hasConsented) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
            necessary: true,
            analytics: true,
            marketing: false,
            timestamp: new Date().toISOString()
        }));
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 right-4 z-40 max-w-sm">
            <Card className="bg-white shadow-lg border border-gray-200">
                <CardContent className="p-4">
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="flex items-center gap-2">
                                <Cookie className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                <Shield className="w-4 h-4 text-green-600 flex-shrink-0" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-gray-900">
                                    Privacidade e Cookies
                                </h3>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    Utilizamos cookies essenciais para garantir o funcionamento adequado da plataforma e melhorar sua experiência de navegação.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Button
                                onClick={handleAccept}
                                size="sm"
                                className="bg-cgb-primary hover:bg-cgb-primary-dark text-white text-xs px-4 py-2 w-full"
                            >
                                Aceitar Cookies
                            </Button>

                            <p className="text-xs text-gray-500 text-center">
                                Ao continuar navegando, você concorda com nossa{' '}
                                <a href="/politica-privacidade" className="text-cgb-primary hover:underline font-medium">
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
