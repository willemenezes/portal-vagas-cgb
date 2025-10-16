import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, ExternalLink, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

const Header = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Desabilitar scroll do body quando menu mobile estiver aberto
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
      // Adicionar classe para indicar que um modal está aberto
      document.body.classList.add('modal-open');
      
      // Esconder completamente todos os mapas
      const mapContainers = document.querySelectorAll('.leaflet-container');
      mapContainers.forEach(container => {
        (container as HTMLElement).style.visibility = 'hidden';
        (container as HTMLElement).style.opacity = '0';
      });
    } else {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
      
      // Mostrar mapas novamente
      const mapContainers = document.querySelectorAll('.leaflet-container');
      mapContainers.forEach(container => {
        (container as HTMLElement).style.visibility = 'visible';
        (container as HTMLElement).style.opacity = '1';
      });
    }
    
    // Cleanup
    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
      
      // Garantir que mapas estejam visíveis
      const mapContainers = document.querySelectorAll('.leaflet-container');
      mapContainers.forEach(container => {
        (container as HTMLElement).style.visibility = 'visible';
        (container as HTMLElement).style.opacity = '1';
      });
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
        <SheetContent side="left" className="w-[300px] sm:w-[400px] bg-white z-[99999] h-screen overflow-y-auto fixed">
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
