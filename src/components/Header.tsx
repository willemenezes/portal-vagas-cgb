import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, ExternalLink, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

const Header = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // SOLUÇÃO EXTREMA: Desabilitar scroll e remover mapas quando menu mobile estiver aberto
  useEffect(() => {
    if (isMenuOpen) {
      // Salvar posição atual do scroll
      const scrollY = window.scrollY;
      
      // Travar body completamente
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.height = '100vh';
      
      // Adicionar classe para indicar que um modal está aberto
      document.body.classList.add('modal-open');
      
      // FORÇA BRUTA: Esconder TUDO que pode interferir
      const problematicElements = document.querySelectorAll(`
        .leaflet-container,
        .leaflet-map-pane,
        .leaflet-tile-pane,
        .leaflet-overlay-pane,
        .leaflet-marker-pane,
        .leaflet-popup-pane,
        .leaflet-tooltip-pane,
        .leaflet-control-container,
        canvas,
        svg:not([data-radix-dialog-overlay] svg):not([role="dialog"] svg),
        iframe,
        embed,
        object
      `);
      
      problematicElements.forEach((el) => {
        const element = el as HTMLElement;
        element.style.display = 'none';
        element.style.visibility = 'hidden';
        element.style.opacity = '0';
        element.style.zIndex = '-99999';
        element.style.pointerEvents = 'none';
        element.setAttribute('data-hidden-by-modal', 'true');
      });
      
      // Criar overlay escuro sobre toda a página
      const overlay = document.createElement('div');
      overlay.id = 'modal-overlay-backdrop';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        z-index: 99997;
        pointer-events: none;
      `;
      document.body.appendChild(overlay);
      
    } else {
      // Restaurar elementos escondidos
      const hiddenElements = document.querySelectorAll('[data-hidden-by-modal="true"]');
      hiddenElements.forEach((el) => {
        const element = el as HTMLElement;
        element.style.display = '';
        element.style.visibility = '';
        element.style.opacity = '';
        element.style.zIndex = '';
        element.style.pointerEvents = '';
        element.removeAttribute('data-hidden-by-modal');
      });
      
      // Remover overlay
      const overlay = document.getElementById('modal-overlay-backdrop');
      if (overlay) {
        overlay.remove();
      }
      
      // Restaurar scroll
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.height = '';
      
      document.body.classList.remove('modal-open');
      
      // Restaurar posição do scroll
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    
    // Cleanup
    return () => {
      // Restaurar elementos escondidos
      const hiddenElements = document.querySelectorAll('[data-hidden-by-modal="true"]');
      hiddenElements.forEach((el) => {
        const element = el as HTMLElement;
        element.style.display = '';
        element.style.visibility = '';
        element.style.opacity = '';
        element.style.zIndex = '';
        element.style.pointerEvents = '';
        element.removeAttribute('data-hidden-by-modal');
      });
      
      // Remover overlay
      const overlay = document.getElementById('modal-overlay-backdrop');
      if (overlay) {
        overlay.remove();
      }
      
      // Restaurar body
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.classList.remove('modal-open');
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
            <Link to="/" className={navLinkClasses("/" )}>
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
