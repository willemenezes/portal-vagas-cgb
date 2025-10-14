import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Filter, Loader2, ChevronsUpDown } from "lucide-react";
import { useState, useEffect } from "react";

interface JobFiltersProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
}

interface FilterState {
  search: string;
  city: string;
  state: string;
  department: string;
  type: string;
}

interface State {
  id: number;
  sigla: string;
  nome: string;
}

interface City {
  id: number;
  nome: string;
}

const JobFilters = ({ filters, onFilterChange }: JobFiltersProps) => {
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [openCityPopover, setOpenCityPopover] = useState(false);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        setLoadingStates(true);
        const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
        const data = await response.json();
        setStates(data);
      } catch (error) {
        console.error("Erro ao buscar estados:", error);
      } finally {
        setLoadingStates(false);
      }
    };
    fetchStates();
  }, []);

  useEffect(() => {
    if (!filters.state || filters.state === "all") {
      setCities([]);
      return;
    }
    const fetchCities = async () => {
      try {
        setLoadingCities(true);
        const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${filters.state}/municipios?orderBy=nome`);
        const data = await response.json();
        setCities(data);
      } catch (error) {
        console.error("Erro ao buscar cidades:", error);
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, [filters.state]);

  // Usar lista centralizada de departamentos
  const { departments } = require("@/data/departments");

  const types = ["CLT", "Estágio", "Aprendiz", "Terceirizado", "Temporário"];

  const clearFilters = () => {
    (Object.keys(filters) as Array<keyof FilterState>).forEach(key => {
      if (key === 'search') {
        onFilterChange(key, "");
      } else {
        onFilterChange(key, "all");
      }
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== "" && value !== "all");

  return (
    <Card className="card-modern border-0 shadow-medium bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Filter className="w-5 h-5 text-cgb-primary" />
            Filtros
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-4 h-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-modern-sm">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              Estado
            </label>
            <Select value={filters.state} onValueChange={(value) => onFilterChange("state", value)} disabled={loadingStates}>
              <SelectTrigger className="select-modern">
                <SelectValue placeholder={loadingStates ? "Carregando..." : "Todos os estados"} />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 shadow-lg rounded-xl">
                {loadingStates ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                ) : (
                  <>
                    <SelectItem value="all">Todos os estados</SelectItem>
                    {states.map((state) => (
                      <SelectItem key={state.id} value={state.sigla} className="hover:bg-gray-50">{state.nome}</SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              Cidade
            </label>
            <Popover open={openCityPopover} onOpenChange={setOpenCityPopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCityPopover}
                  className="w-full justify-between select-modern"
                  disabled={!filters.state || filters.state === "all" || loadingCities}
                >
                  <span className="truncate">
                    {loadingCities
                      ? "Carregando..."
                      : (filters.city && filters.city !== 'all'
                        ? cities.find(c => c.nome.toLowerCase() === filters.city.toLowerCase())?.nome || "Todas as cidades"
                        : "Todas as cidades")
                    }
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Buscar cidade..." />
                  <CommandList>
                    <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value={"all"}
                        onSelect={() => {
                          onFilterChange("city", "all");
                          setOpenCityPopover(false);
                        }}
                      >
                        Todas as cidades
                      </CommandItem>
                      {cities.map((city) => (
                        <CommandItem
                          key={city.id}
                          value={city.nome}
                          onSelect={(currentValue) => {
                            const newCity = city.nome;
                            onFilterChange("city", filters.city === newCity ? "all" : newCity);
                            setOpenCityPopover(false);
                          }}
                        >
                          {city.nome}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              Área
            </label>
            <Select value={filters.department} onValueChange={(value) => onFilterChange("department", value)}>
              <SelectTrigger className="select-modern">
                <SelectValue placeholder="Todas as áreas" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 shadow-lg rounded-xl">
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept} className="hover:bg-gray-50">{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              Tipo de contrato
            </label>
            <Select value={filters.type} onValueChange={(value) => onFilterChange("type", value)}>
              <SelectTrigger className="select-modern">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 shadow-lg rounded-xl">
                {types.map((type) => (
                  <SelectItem key={type} value={type} className="hover:bg-gray-50">{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Filtros ativos:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(filters).map(([key, value]) =>
                  value && (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-cgb-primary/10 text-cgb-primary text-xs rounded-md"
                    >
                      {value}
                      <button
                        onClick={() => onFilterChange(key as keyof FilterState, "")}
                        className="hover:bg-cgb-primary/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default JobFilters;
