import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import JobCard from "@/components/JobCard";
import JobFilters from "@/components/JobFilters";
import JobsMap from "@/components/JobsMap";
import MapStats from "@/components/MapStats";
import { useJobsRobust } from "@/hooks/useJobsRobust";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Briefcase, MapPin, Filter, ArrowRight, AlertTriangle, X } from "lucide-react";
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'

interface FilterState {
  search: string;
  city: string;
  state: string;
  department: string;
  type: string;
}

const Index = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showAntiScamPopup, setShowAntiScamPopup] = useState<boolean>(false);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    city: "all",
    state: "all",
    department: "all",
    type: "all"
  });

  const autoplay = useRef(Autoplay({ delay: 3000, stopOnInteraction: false }));
  const [emblaRef] = useEmblaCarousel({ loop: true }, [autoplay.current]);

  // Usando hook robusto com tratamento completo de erros
  const { data: jobs = [], isLoading, error, refetch } = useJobsRobust();

  // Mostrar popup anti-golpe após 1.5 segundos
  useEffect(() => {
    const hasSeenPopup = localStorage.getItem('cgb-anti-scam-popup-seen');
    if (!hasSeenPopup) {
      const timer = setTimeout(() => {
        setShowAntiScamPopup(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCloseAntiScamPopup = () => {
    setShowAntiScamPopup(false);
    localStorage.setItem('cgb-anti-scam-popup-seen', 'true');
  };



  const filteredJobs = jobs.filter((job) => {
    // Sempre excluir o "Banco de Talentos" da lista pública
    if (job.title === "Banco de Talentos") {
      return false;
    }

    const matchesDepartment = filters.department === "all" || filters.department === "" || job.department === filters.department;
    const matchesState = filters.state === "all" || filters.state === "" || job.state === filters.state;
    const matchesType = filters.type === "all" || filters.type === "" || job.type === filters.type;
    const matchesCity = filters.city === "all" || filters.city === "" || job.city === filters.city;

    // Busca tanto pelo searchTerm da barra de busca quanto pelo filters.search dos filtros
    const searchText = searchTerm || filters.search;
    const matchesSearch = searchText === "" ||
      job.title.toLowerCase().includes(searchText.toLowerCase()) ||
      job.department.toLowerCase().includes(searchText.toLowerCase()) ||
      job.city.toLowerCase().includes(searchText.toLowerCase()) ||
      job.description.toLowerCase().includes(searchText.toLowerCase());

    return matchesDepartment && matchesState && matchesType && matchesCity && matchesSearch;
  });

  const handleSearch = () => {
    // Aplicar termo de busca nos filtros
    setFilters({ ...filters, search: searchTerm });

    // Scroll para a seção de vagas
    const allJobsSection = document.getElementById('all-jobs');
    if (allJobsSection) {
      allJobsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prevFilters => {
      const newFilters = { ...prevFilters, [key]: value };
      if (key === "state" && value !== prevFilters.state) {
        newFilters.city = "all";
      }
      return newFilters;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Anti-Scam Popup */}
      {showAntiScamPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border-l-8 border-cgb-accent">
            {/* Header com ícone de alerta */}
            <div className="bg-gradient-to-r from-cgb-primary to-cgb-accent p-6 relative">
              <button
                onClick={handleCloseAntiScamPopup}
                className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-4">
                <div className="bg-white/20 rounded-full p-3">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Aviso Importante</h3>
                  <p className="text-white/90 text-sm">Proteja-se contra golpes</p>
                </div>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <p className="text-gray-800 font-medium leading-relaxed">
                  Esclarecemos que <strong className="text-cgb-primary">não realizamos nenhum tipo de cobrança</strong> para participação em nossos processos seletivos.
                </p>

                <p className="text-gray-700 leading-relaxed">
                  Todas as candidaturas devem ser feitas <strong>exclusivamente</strong> no site:
                </p>

                <div className="bg-cgb-primary/5 border border-cgb-primary/20 rounded-lg p-3">
                  <p className="text-cgb-primary font-bold text-center text-lg">
                    www.cgbvagas.com.br
                  </p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 font-semibold text-center">
                    🚨 Fique atento a tentativas de golpe!
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <Button
                  onClick={handleCloseAntiScamPopup}
                  className="w-full bg-cgb-primary hover:bg-cgb-primary-dark text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Entendi, continuar navegando
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 relative z-10">


        {/* Modern Hero Section */}
        <section className="relative py-16 lg:py-24 rounded-2xl overflow-hidden">
          <div
            className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,rgba(106,11,39,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(106,11,39,0.1)_1px,transparent_1px)] bg-[size:2rem_2rem] animate-grid"
          ></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left">
                {/* Badge */}
                <div className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-cgb-accent/10 border border-cgb-accent/20 shadow-md rounded-full text-cgb-primary-dark font-semibold mb-8 backdrop-blur-sm">
                  <img src="/CGB.png" alt="Ícone CGB" className="h-5 w-5" />
                  <span className="text-base font-semibold">Portal de Carreiras</span>
                </div>

                {/* Hero Title */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                  <span className="block text-cgb-primary">
                    Oportunidades que transformam vidas
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-lg sm:text-xl text-gray-600 mb-12 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Conectamos talentos excepcionais com oportunidades únicas na CGB Energia.
                </p>
              </div>

              {/* Logo CGB de Olho para o Futuro */}
              <div className="flex justify-center items-center mt-8 lg:mt-0">
                <img
                  src="/CGB ENERGIA LOGO.png"
                  alt="CGB Energia Logo"
                  className="h-24 sm:h-28 md:h-32 lg:h-36 xl:h-40 w-auto object-contain"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Map Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-4 mb-4">
                <h2 className="text-3xl font-bold tracking-tight text-gray-800 sm:text-4xl">
                  Vagas pelo Brasil
                </h2>
                <button
                  onClick={() => refetch()}
                  className="flex items-center gap-2 px-4 py-2 bg-cgb-primary hover:bg-cgb-primary-dark text-white rounded-lg transition-colors duration-200 text-sm"
                  title="Atualizar dados do mapa"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Atualizar
                </button>
              </div>
              <div className="mt-4 flex justify-center">
                <div className="h-1 w-24 rounded-full bg-gradient-to-r from-cgb-primary-light to-cgb-accent"></div>
              </div>
              <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                Explore oportunidades em todo o país através do nosso mapa interativo
              </p>
            </div>

            {/* Mini Dashboard */}
            <MapStats jobs={jobs} />

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
              <JobsMap jobs={jobs} />
            </div>

            <div className="text-center mt-8">
              <p className="text-sm text-gray-500">
                Clique nos marcadores para ver as vagas disponíveis em cada cidade
              </p>
            </div>
          </div>
        </section>

        {/* Featured Jobs Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-gray-800 sm:text-4xl">
                Vagas em Destaque
              </h2>
              <div className="mt-4 flex justify-center">
                <div className="h-1 w-24 rounded-full bg-gradient-to-r from-cgb-primary-light to-cgb-accent"></div>
              </div>
              <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                Oportunidades selecionadas especialmente para você
              </p>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cgb-primary"></div>
                <p className="mt-2 text-gray-600">Carregando vagas...</p>
              </div>
            ) : jobs.length > 0 ? (
              <>
                <div className="overflow-hidden" ref={emblaRef}>
                  <div className="flex">
                    {jobs.slice(0, 6).map((job) => (
                      <div key={job.id} className="flex-shrink-0 w-full sm:w-1/2 lg:w-1/3 p-3">
                        <div className="h-full w-full bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200 flex flex-col">
                          <div className="flex-grow">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg text-gray-900 mb-2 h-14 line-clamp-2">
                                  {job.title}
                                </h3>
                                <div className="flex items-center text-gray-600 mb-2">
                                  <MapPin className="w-4 h-4 mr-1" />
                                  <span className="text-sm">{job.city}, {job.state}</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                  <Briefcase className="w-4 h-4 mr-1" />
                                  <span className="text-sm">{job.department}</span>
                                </div>
                              </div>
                              <div className="text-right text-sm text-gray-500">
                                {job.posted ? (
                                  <div className="flex flex-col items-end">
                                    <span>há</span>
                                    <span>{job.posted}</span>
                                  </div>
                                ) : 'N/A'}
                              </div>
                            </div>

                            <p className="text-gray-600 text-sm mb-4 line-clamp-2 h-10">
                              {job.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                                {job.type}
                              </span>
                              <span className="text-xs text-gray-500">
                                {job.applicants || 0} candidatos
                              </span>
                            </div>
                            <Link
                              to={`/vaga/${job.id}`}
                              className="text-cgb-primary hover:text-cgb-primary-dark font-medium text-sm transition-colors"
                            >
                              Ver detalhes →
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-center mt-8">
                  <Button
                    onClick={() => document.getElementById('all-jobs')?.scrollIntoView({ behavior: 'smooth' })}
                    variant="outline"
                    className="border-cgb-primary text-cgb-primary hover:bg-cgb-primary hover:text-white transition-colors px-8 py-3 rounded-xl"
                  >
                    Ver Todas as Vagas
                  </Button>
                </div>
              </>
            ) : (
              !isLoading && (
                <div className="text-center py-12">
                  <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-semibold text-gray-800">Nenhuma vaga em destaque no momento</h3>
                </div>
              )
            )}
          </div>
        </section>

        {/* All Jobs & Filters Section */}
        <section id="all-jobs" className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

            {/* Filters Column */}
            <div className="lg:col-span-1 lg:sticky lg:top-8 bg-white rounded-2xl shadow-lg border border-gray-100 p-1">
              <JobFilters filters={filters} onFilterChange={handleFilterChange} />
            </div>

            {/* Jobs List Column */}
            <div className="lg:col-span-3">
              <div className="space-y-6">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4 mb-4"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/3 float-right"></div>
                    </div>
                  ))
                ) : filteredJobs.length > 0 ? (
                  filteredJobs.map((job) => <JobCard key={job.id} job={job} />)
                ) : (
                  <div className="text-center py-16 col-span-full">
                    <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 font-semibold text-xl">Nenhuma vaga encontrada</p>
                    <p className="text-gray-500 mt-2">Tente ajustar seus filtros ou volte mais tarde.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-cgb-primary">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Não encontrou a vaga ideal?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Cadastre seu currículo aqui e seja o primeiro a saber sobre novas oportunidades
            </p>
            <Button
              asChild
              className="bg-white text-cgb-primary hover:bg-gray-100 font-semibold px-8 py-4 text-lg rounded-xl transition-colors"
            >
              <Link to="/cadastrar-curriculo">
                Cadastre Seu Currículo
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              {/* Logo */}
              <div className="flex justify-center mb-8">
                <img
                  src="/CGB ENERGIA LOGO.png"
                  alt="CGB Energia"
                  className="h-16 w-auto object-contain drop-shadow-sm hover:scale-105 transition-transform"
                />
              </div>

              {/* Company Info */}
              <div className="space-y-4 mb-8">
                <p className="text-gray-900 text-2xl font-bold">
                  Portal de Carreiras
                </p>
                <p className="text-gray-500 max-w-2xl mx-auto">
                  Conectando talentos excepcionais com oportunidades únicas.
                </p>
              </div>

              {/* Links */}
              <div className="flex flex-wrap justify-center gap-6 mb-8">
                <Link
                  to="/"
                  className="text-gray-600 hover:text-cgb-primary transition-colors font-medium"
                >
                  Vagas
                </Link>
                <Link
                  to="/cadastrar-curriculo"
                  className="text-gray-600 hover:text-cgb-primary transition-colors font-medium"
                >
                  Cadastre Seu Currículo
                </Link>
                <a
                  href="https://cgbengenharia.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-cgb-primary transition-colors font-medium"
                >
                  Sobre a CGB
                </a>
              </div>

              {/* Copyright */}
              <div className="border-t border-gray-200 pt-8">
                <p className="text-gray-500 text-sm font-medium">
                  © 2025 <span className="text-cgb-primary font-bold">GRUPO CGB</span>. Todos os direitos reservados.
                </p>
                <p className="text-gray-400 text-xs mt-2">
                  Portal de Carreiras - Sistema de Gestão de Talentos
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
