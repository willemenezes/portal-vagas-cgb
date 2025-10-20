import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, ExternalLink, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

const Header = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // SOLUÇÃO DEFINITIVA: Remover mapas do DOM completamente quando menu mobile aberto
  useEffect(() => {
    if (isMenuOpen) {
      // Salvar posição do scroll
      const scrollY = window.scrollY;

      // Travar body
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      // SOLUÇÃO DEFINITIVA: REMOVER MAPAS DO DOM
      const mapContainers = document.querySelectorAll('.leaflet-container');
      const removedMaps: { element: Element; parent: Element; nextSibling: Node | null }[] = [];

      mapContainers.forEach((mapContainer) => {
        const parent = mapContainer.parentElement;
        const nextSibling = mapContainer.nextSibling;

        if (parent) {
          // Salvar referência para restaurar depois
          removedMaps.push({ element: mapContainer, parent, nextSibling });

          // REMOVER COMPLETAMENTE DO DOM
          parent.removeChild(mapContainer);

          // Criar placeholder temporário
          const placeholder = document.createElement('div');
          placeholder.id = 'map-removed-placeholder';
          placeholder.style.cssText = `
            height: 400px;
            background: rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #666;
            font-size: 14px;
            border-radius: 12px;
          `;
          placeholder.textContent = 'Mapa temporariamente oculto';

          if (nextSibling) {
            parent.insertBefore(placeholder, nextSibling);
          } else {
            parent.appendChild(placeholder);
          }
        }
      });

      // Salvar no window para restaurar depois
      (window as any).__removedMaps = removedMaps;

    } else {
      // RESTAURAR MAPAS NO DOM
      const removedMaps = (window as any).__removedMaps || [];

      // Remover placeholders
      const placeholders = document.querySelectorAll('#map-removed-placeholder');
      placeholders.forEach(p => p.remove());

      // Restaurar mapas
      removedMaps.forEach(({ element, parent, nextSibling }: any) => {
        try {
          if (nextSibling && nextSibling.parentNode === parent) {
            parent.insertBefore(element, nextSibling);
          } else {
            parent.appendChild(element);
          }
        } catch (error) {
          console.warn('Erro ao restaurar mapa:', error);
        }
      });

      // Limpar referências
      delete (window as any).__removedMaps;

      // Restaurar scroll
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';

      // Restaurar posição do scroll
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }

      // Forçar re-render dos mapas após 100ms
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    }

    // Cleanup
    return () => {
      // Restaurar tudo se componente for desmontado
      const removedMaps = (window as any).__removedMaps || [];
      const placeholders = document.querySelectorAll('#map-removed-placeholder');

      placeholders.forEach(p => p.remove());

      removedMaps.forEach(({ element, parent, nextSibling }: any) => {
        try {
          if (parent && element) {
            if (nextSibling && nextSibling.parentNode === parent) {
              parent.insertBefore(element, nextSibling);
            } else {
              parent.appendChild(element);
            }
          }
        } catch (error) {
          console.warn('Erro no cleanup:', error);
        }
      });

      delete (window as any).__removedMaps;

      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [isMenuOpen]);

  const navLinkClasses = (path: string) =>
    `relative px-4 py-2 text-sm font-medium transition-colors duration-300 ${location.pathname === path
      ? "text-white bg-cgb-primary rounded-lg shadow-soft"
      : "text-gray-700 hover:text-cgb-primary"
    }`;

  const textLinkClasses =
    "relative text-sm font-medium text-gray-700 hover:text-cgb-primary transition-colors duration-300 after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-0 after:h-0.5 after:bg-cgb-primary after:transition-all after:duration-300 hover:after:w-full";

  const mobileNavLinkClasses = (path: string) =>
    `block px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${location.pathname === path
      ? "text-white bg-gradient-to-r from-cgb-primary to-cgb-accent"
      : "text-gray-700 hover:text-cgb-primary hover:bg-black/5 font-medium"
    }`;

  return (
    <header className="bg-gray-200 border-b border-gray-300 sticky top-0 z-50 shadow-md backdrop-blur-sm">
      <div className="container-modern">
        <div className="flex h-20 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/CGB.png"
              alt="CGB Vagas Logo"
              className="h-8 w-auto"
            />
            <span className="text-xl font-bold text-gray-800 hidden sm:inline">
              CGB VAGAS
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className={navLinkClasses("/")}>
              Vagas Abertas
            </Link>
            <Link to="/cadastrar-curriculo" className={textLinkClasses}>
              Cadastre Seu Currículo
            </Link>
            <a
              href="https://cgbengenharia.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className={`${textLinkClasses} flex items-center gap-1.5`}
            >
              Sobre a CGB
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </nav>

          {/* Mobile Menu Button & Login Button Container */}
          <div className="flex items-center gap-2">
            {/* Login Button - Destacado */}
            <div className="hidden md:flex">
              <Link to="/admin">
                <Button className="bg-cgb-primary hover:bg-cgb-primary-dark text-white font-bold px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transform transition-all duration-300">
                  <User className="w-4 h-4 mr-2" />
                  Acesso RH
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:text-cgb-primary hover:bg-black/5"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile Menu (Sheet) */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent
          side="left"
          className="w-[300px] sm:w-[400px] bg-white z-[99999] h-screen overflow-y-auto fixed"
          aria-describedby="mobile-menu-description"
        >
          <SheetHeader className="mb-8 sticky top-0 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 z-10">
            <SheetTitle>
              <div className="flex items-center gap-3">
                <img
                  src="/CGBRH2.png"
                  alt="CGB Energia Logo"
                  className="h-10"
                />
                <span className="font-bold text-xl text-cgb-primary">
                  CGB Vagas
                </span>
              </div>
            </SheetTitle>
            <div id="mobile-menu-description" className="sr-only">
              Menu de navegação mobile para acessar vagas, cadastro de currículo e área administrativa
            </div>
          </SheetHeader>
          <nav className="flex flex-col space-y-4 pb-28">
            <Link
              to="/"
              className={mobileNavLinkClasses("/")}
              onClick={() => setIsMenuOpen(false)}
            >
              Vagas Abertas
            </Link>
            <Link
              to="/cadastrar-curriculo"
              className={mobileNavLinkClasses("/cadastrar-curriculo")}
              onClick={() => setIsMenuOpen(false)}
            >
              Cadastre Seu Currículo
            </Link>
            <a
              href="https://cgbengenharia.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className={`${mobileNavLinkClasses(
                "/sobre"
              )} flex items-center justify-between`}
            >
              <span>Sobre a CGB</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            <Separator className="my-4" />
            <Link to="/admin" onClick={() => setIsMenuOpen(false)}>
              <Button className="w-full bg-cgb-primary hover:bg-cgb-primary-dark text-white font-bold py-3 rounded-lg shadow-md transition-all duration-300">
                <User className="w-4 h-4 mr-2" />
                Acesso RH
              </Button>
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
};

export default Header;
