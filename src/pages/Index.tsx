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
import { Search, Briefcase, MapPin, Filter, ArrowRight, AlertTriangle, X, Users, TrendingUp, Star, CheckCircle } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-b from-cgb-cream via-white to-cgb-pearl">
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
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Background with gradient and pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-cgb-cream via-white to-cgb-pearl"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(106,11,39,0.05)_0%,transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(196,83,111,0.03)_0%,transparent_50%)]"></div>

          {/* Background Image - Horizontal and Semi-transparent */}
          <div className="absolute inset-0 opacity-25">
            <img
              src="/CGBRH2.png"
              alt="CGB RH Background"
              className="w-full h-full object-cover object-center"
            />
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <div className="space-y-8">

              {/* Badge */}
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/90 backdrop-blur-sm border border-cgb-accent/20 shadow-soft rounded-full text-cgb-primary-dark font-semibold">
                <div className="w-2 h-2 bg-cgb-accent rounded-full animate-pulse"></div>
                <img src="/CGB.png" alt="Ícone CGB" className="h-5 w-5" />
                <span className="text-base font-semibold">Portal de Carreiras</span>
              </div>

              {/* Hero Title */}
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.2] tracking-tight">
                  <span className="block text-gray-900">Oportunidades que</span>
                  <span className="block bg-gradient-to-r from-cgb-primary via-cgb-primary-light to-cgb-accent bg-clip-text text-transparent">
                    transformam vidas
                  </span>
                </h1>
              </div>

              {/* Subtitle */}
              <p className="text-xl sm:text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed font-light">
                Conectamos talentos excepcionais com oportunidades únicas no Grupo CGB.
                <span className="text-cgb-primary font-medium"> Sua carreira começa aqui.</span>
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
                <div className="text-center">
                  <div className="text-3xl font-bold text-cgb-primary">{jobs.length}+</div>
                  <div className="text-sm text-gray-600 font-medium">Vagas Abertas</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-cgb-primary">100+</div>
                  <div className="text-sm text-gray-600 font-medium">Cidades</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-cgb-primary">15+</div>
                  <div className="text-sm text-gray-600 font-medium">Departamentos</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex justify-center">
                <Button
                  onClick={() => document.getElementById('all-jobs')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-cgb-primary hover:bg-cgb-primary-dark text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-medium hover:shadow-strong transition-all duration-300 hover:scale-105"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Explorar Vagas
                </Button>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-cgb-primary/30 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-cgb-primary/50 rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </section>

        {/* Interactive Map Section */}
        <section className="py-20 bg-gradient-to-b from-white to-cgb-pearl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-cgb-primary/5 border border-cgb-primary/20 rounded-full mb-6">
                <MapPin className="w-5 h-5 text-cgb-primary" />
                <span className="text-cgb-primary font-semibold">Exploração Nacional</span>
              </div>

              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                Vagas pelo <span className="text-cgb-primary">Brasil</span>
              </h2>

              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="h-1 w-16 rounded-full bg-gradient-to-r from-cgb-primary to-cgb-accent"></div>
                <div className="h-1 w-8 rounded-full bg-cgb-accent/50"></div>
                <div className="h-1 w-16 rounded-full bg-gradient-to-r from-cgb-accent to-cgb-primary"></div>
              </div>

              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Explore oportunidades em todo o país através do nosso mapa interativo.
                <span className="text-cgb-primary font-medium"> Descubra onde sua carreira pode crescer.</span>
              </p>

              <div className="mt-8">
                <button
                  onClick={() => refetch()}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-cgb-primary text-cgb-primary hover:bg-cgb-primary hover:text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-soft hover:shadow-medium"
                  title="Atualizar dados do mapa"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Atualizar Dados
                </button>
              </div>
            </div>

            {/* Enhanced Stats */}
            <div className="mb-12">
              <MapStats jobs={jobs} />
            </div>

            {/* Map Container */}
            <div className="relative">
              <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-strong overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cgb-primary via-cgb-accent to-cgb-primary"></div>
                <JobsMap jobs={jobs} />
              </div>

              {/* Map overlay info */}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-soft border border-white/20">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-cgb-primary rounded-full"></div>
                  <span className="font-medium">Clique nos marcadores para ver vagas</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Jobs Section */}
        <section className="py-20 bg-gradient-to-b from-cgb-pearl to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-cgb-accent/10 border border-cgb-accent/20 rounded-full mb-6">
                <Star className="w-5 h-5 text-cgb-accent" />
                <span className="text-cgb-accent font-semibold">Oportunidades Selecionadas</span>
              </div>

              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                Vagas em <span className="text-cgb-primary">Destaque</span>
              </h2>

              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="h-1 w-16 rounded-full bg-gradient-to-r from-cgb-accent to-cgb-primary"></div>
                <div className="h-1 w-8 rounded-full bg-cgb-primary/50"></div>
                <div className="h-1 w-16 rounded-full bg-gradient-to-r from-cgb-primary to-cgb-accent"></div>
              </div>

              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Oportunidades selecionadas especialmente para você.
                <span className="text-cgb-primary font-medium"> Encontre sua próxima conquista profissional.</span>
              </p>
            </div>

            {isLoading ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-cgb-primary border-t-transparent"></div>
                  <p className="text-gray-600 font-medium">Carregando oportunidades...</p>
                </div>
              </div>
            ) : jobs.length > 0 ? (
              <>
                <div className="overflow-hidden" ref={emblaRef}>
                  <div className="flex gap-6">
                    {jobs.slice(0, 6).map((job, index) => (
                      <div key={job.id} className="flex-shrink-0 w-full sm:w-1/2 lg:w-1/3">
                        <div className="group h-full bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-strong transition-all duration-300 hover:scale-105 hover:border-cgb-primary/20 relative overflow-hidden">
                          {/* Decorative gradient */}
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cgb-primary via-cgb-accent to-cgb-primary"></div>

                          {/* Featured badge ocultado */}

                          <div className="flex-grow">
                            <div className="mb-6">
                              <h3 className="font-bold text-xl text-gray-900 mb-3 line-clamp-2 group-hover:text-cgb-primary transition-colors">
                                {job.title}
                              </h3>

                              <div className="space-y-2 mb-4">
                                <div className="flex items-center text-gray-600">
                                  <MapPin className="w-4 h-4 mr-2 text-cgb-primary" />
                                  <span className="text-sm font-medium">{job.city}, {job.state}</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                  <Briefcase className="w-4 h-4 mr-2 text-cgb-primary" />
                                  <span className="text-sm font-medium">{job.department}</span>
                                </div>
                              </div>

                              <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                                {job.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 bg-cgb-primary/10 text-cgb-primary rounded-lg text-xs font-semibold">
                                {job.type}
                              </span>
                            </div>
                            <Link
                              to={`/vaga/${job.id}`}
                              className="text-cgb-primary hover:text-cgb-primary-dark font-semibold text-sm transition-colors flex items-center gap-1 group-hover:gap-2"
                            >
                              Ver detalhes
                              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-center mt-12">
                  <Button
                    onClick={() => document.getElementById('all-jobs')?.scrollIntoView({ behavior: 'smooth' })}
                    className="bg-cgb-primary hover:bg-cgb-primary-dark text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-medium hover:shadow-strong transition-all duration-300 hover:scale-105"
                  >
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Ver Todas as Vagas
                  </Button>
                </div>
              </>
            ) : (
              !isLoading && (
                <div className="text-center py-16">
                  <div className="bg-cgb-pearl rounded-3xl p-12 max-w-md mx-auto">
                    <Briefcase className="mx-auto h-16 w-16 text-cgb-primary/50 mb-6" />
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Nenhuma vaga em destaque no momento</h3>
                    <p className="text-gray-600">Volte em breve para novas oportunidades!</p>
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        {/* All Jobs & Filters Section */}
        <section id="all-jobs" className="py-20 bg-gradient-to-b from-white to-cgb-pearl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-cgb-primary/5 border border-cgb-primary/20 rounded-full mb-6">
                <Filter className="w-5 h-5 text-cgb-primary" />
                <span className="text-cgb-primary font-semibold">Busca Avançada</span>
              </div>

              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                Todas as <span className="text-cgb-primary">Oportunidades</span>
              </h2>

              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="h-1 w-16 rounded-full bg-gradient-to-r from-cgb-primary to-cgb-accent"></div>
                <div className="h-1 w-8 rounded-full bg-cgb-accent/50"></div>
                <div className="h-1 w-16 rounded-full bg-gradient-to-r from-cgb-accent to-cgb-primary"></div>
              </div>

              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Use nossos filtros para encontrar a vaga perfeita para você.
                <span className="text-cgb-primary font-medium"> Sua próxima oportunidade está aqui.</span>
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
              {/* Enhanced Filters Column */}
              <div className="lg:col-span-1">
                <div className="sticky top-8 bg-white rounded-3xl shadow-strong border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-cgb-primary to-cgb-accent p-4">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                      <Filter className="w-5 h-5" />
                      Filtros
                    </h3>
                  </div>
                  <div className="p-1">
                    <JobFilters filters={filters} onFilterChange={handleFilterChange} />
                  </div>
                </div>
              </div>

              {/* Enhanced Jobs List Column */}
              <div className="lg:col-span-3">
                <div className="space-y-6">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="bg-white p-8 rounded-2xl border border-gray-200 animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
                        <div className="h-10 bg-gray-200 rounded w-1/3 float-right"></div>
                      </div>
                    ))
                  ) : filteredJobs.length > 0 ? (
                    filteredJobs.map((job) => <JobCard key={job.id} job={job} />)
                  ) : (
                    <div className="text-center py-20">
                      <div className="bg-cgb-pearl rounded-3xl p-16 max-w-lg mx-auto">
                        <Briefcase className="w-20 h-20 text-cgb-primary/50 mx-auto mb-6" />
                        <h3 className="text-2xl font-bold text-gray-800 mb-4">Nenhuma vaga encontrada</h3>
                        <p className="text-gray-600 mb-6">Tente ajustar seus filtros ou volte mais tarde para novas oportunidades.</p>
                        <Button
                          onClick={() => {
                            setFilters({
                              search: "",
                              city: "all",
                              state: "all",
                              department: "all",
                              type: "all"
                            });
                            setSearchTerm("");
                          }}
                          className="bg-cgb-primary hover:bg-cgb-primary-dark text-white px-6 py-3 rounded-xl font-semibold"
                        >
                          Limpar Filtros
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced CTA Section */}
        <section className="py-24 bg-gradient-to-br from-cgb-primary via-cgb-primary-dark to-cgb-primary-light relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.05)_0%,transparent_50%)]"></div>

          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="space-y-8">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full border border-white/20">
                <Users className="w-10 h-10 text-white" />
              </div>

              {/* Title */}
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Não encontrou a vaga ideal?
              </h2>

              {/* Subtitle */}
              <p className="text-xl sm:text-2xl text-white/90 max-w-4xl mx-auto leading-relaxed font-light">
                Cadastre seu currículo aqui e seja o primeiro a saber sobre novas oportunidades.
                <span className="text-white font-medium"> Sua carreira merece o melhor!</span>
              </p>

              {/* Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
                <div className="flex items-center gap-3 text-white/90">
                  <CheckCircle className="w-6 h-6 text-white flex-shrink-0" />
                  <span className="font-medium">Notificações automáticas</span>
                </div>
                <div className="flex items-center gap-3 text-white/90">
                  <CheckCircle className="w-6 h-6 text-white flex-shrink-0" />
                  <span className="font-medium">Acesso exclusivo</span>
                </div>
                <div className="flex items-center gap-3 text-white/90">
                  <CheckCircle className="w-6 h-6 text-white flex-shrink-0" />
                  <span className="font-medium">Processo simplificado</span>
                </div>
              </div>

              {/* CTA Button */}
              <div className="pt-8">
                <Button
                  asChild
                  className="bg-white text-cgb-primary hover:bg-gray-100 font-bold px-12 py-6 text-xl rounded-2xl shadow-strong hover:shadow-glow transition-all duration-300 hover:scale-105"
                >
                  <Link to="/cadastrar-curriculo">
                    <Users className="w-6 h-6 mr-3" />
                    Cadastre Seu Currículo
                    <ArrowRight className="w-6 h-6 ml-3" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Footer */}
        <footer className="bg-gradient-to-b from-white to-cgb-pearl border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center space-y-12">
              {/* Logo Section */}
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="bg-white rounded-3xl p-6 shadow-soft border border-gray-200">
                      <img
                        src="/CGBRH2.png"
                        alt="CGB RH Logo"
                        className="h-20 w-auto object-contain drop-shadow-sm hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-3xl font-bold text-gray-900">
                    Portal de <span className="text-cgb-primary">Carreiras</span>
                  </h3>
                  <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
                    Conectando talentos excepcionais com oportunidades únicas no Grupo CGB.
                    <span className="text-cgb-primary font-medium"> Sua carreira é nossa prioridade.</span>
                  </p>
                </div>
              </div>

              {/* Links Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
                <Link
                  to="/"
                  className="group flex items-center justify-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-cgb-primary/20 hover:shadow-medium transition-all duration-300 hover:scale-105"
                >
                  <Briefcase className="w-5 h-5 text-cgb-primary group-hover:scale-110 transition-transform" />
                  <span className="text-gray-700 hover:text-cgb-primary transition-colors font-semibold">
                    Vagas Abertas
                  </span>
                </Link>

                <Link
                  to="/cadastrar-curriculo"
                  className="group flex items-center justify-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-cgb-primary/20 hover:shadow-medium transition-all duration-300 hover:scale-105"
                >
                  <Users className="w-5 h-5 text-cgb-primary group-hover:scale-110 transition-transform" />
                  <span className="text-gray-700 hover:text-cgb-primary transition-colors font-semibold">
                    Cadastre Seu Currículo
                  </span>
                </Link>

                <a
                  href="https://cgbengenharia.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-cgb-primary/20 hover:shadow-medium transition-all duration-300 hover:scale-105"
                >
                  <ArrowRight className="w-5 h-5 text-cgb-primary group-hover:scale-110 transition-transform" />
                  <span className="text-gray-700 hover:text-cgb-primary transition-colors font-semibold">
                    Sobre a CGB
                  </span>
                </a>
              </div>

              {/* Copyright Section */}
              <div className="border-t border-gray-200 pt-8">
                <div className="space-y-4">
                  <p className="text-gray-600 font-semibold text-lg">
                    © 2025 <span className="text-cgb-primary font-bold">GRUPO CGB</span>. Todos os direitos reservados.
                  </p>
                  <p className="text-gray-500 text-sm">
                    Portal de Carreiras - Sistema de Gestão de Talentos
                  </p>

                  {/* Trust indicators */}
                  <div className="flex justify-center items-center gap-6 pt-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Site Seguro</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Processo Gratuito</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Dados Protegidos</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
