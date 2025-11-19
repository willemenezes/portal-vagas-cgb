import { useState, useEffect, useRef } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { jobTitles } from "@/data/job-titles";

interface JobTitleSelectProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  maxLength?: number;
  showCharCount?: boolean;
  id?: string;
}

export function JobTitleSelect({
  value,
  onChange,
  required = false,
  maxLength = 255,
  showCharCount = false,
  id = "title",
}: JobTitleSelectProps) {
  const [open, setOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const commandListRef = useRef<HTMLDivElement>(null);
  const isOtherSelected = value === "Outro" || (!jobTitles.includes(value) && value !== "");

  // Inicializar customTitle quando o valor não está na lista
  useEffect(() => {
    if (value && !jobTitles.includes(value) && value !== "Outro") {
      // Valor customizado que não está na lista
      if (customTitle !== value) {
        setCustomTitle(value);
      }
    } else if (value === "Outro") {
      // Se selecionou "Outro", manter customTitle vazio para o usuário digitar
      // Não fazer nada aqui, deixar o usuário digitar
    } else if (jobTitles.includes(value)) {
      // Se selecionou um cargo da lista, limpar título customizado
      if (customTitle !== "") {
        setCustomTitle("");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);


  const handleSelect = (selectedValue: string) => {
    if (selectedValue === "Outro") {
      onChange("Outro");
      setOpen(false);
      setCustomTitle("");
    } else {
      onChange(selectedValue);
      setOpen(false);
      setCustomTitle("");
    }
  };

  const handleCustomTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (maxLength && newValue.length <= maxLength) {
      setCustomTitle(newValue);
      onChange(newValue);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Título da Vaga{required ? " *" : ""}</Label>
      
      {isOtherSelected && value !== "Outro" ? (
        // Mostrar input quando já tem um título customizado
        <div className="space-y-2">
          <Input
            id={id}
            value={value}
            onChange={handleCustomTitleChange}
            placeholder="Digite o título da vaga"
            required={required}
            maxLength={maxLength}
          />
          {showCharCount && (
            <p className="text-xs text-gray-500">{value.length}/{maxLength}</p>
          )}
        </div>
      ) : (
        // Mostrar popover com lista de cargos
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {value || "Selecione o cargo"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[400px] p-0" 
            align="start"
            onWheel={(e) => {
              // Encontrar o elemento scrollável dentro do PopoverContent
              const target = e.currentTarget;
              const scrollableElement = target.querySelector('[cmdk-list]') as HTMLElement || 
                                       target.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement ||
                                       commandListRef.current;
              
              if (scrollableElement && scrollableElement.scrollHeight > scrollableElement.clientHeight) {
                e.stopPropagation();
                const isAtTop = scrollableElement.scrollTop === 0;
                const isAtBottom = scrollableElement.scrollTop + scrollableElement.clientHeight >= scrollableElement.scrollHeight - 1;
                
                if (!((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0))) {
                  scrollableElement.scrollTop += e.deltaY;
                  e.preventDefault();
                }
              }
            }}
          >
            <Command>
              <CommandInput placeholder="Pesquisar cargo..." />
              <CommandList 
                ref={commandListRef}
                className="max-h-[300px] overflow-y-auto overflow-x-hidden"
              >
                <CommandEmpty>Nenhum cargo encontrado.</CommandEmpty>
                <CommandGroup>
                  {jobTitles.map((title) => (
                    <CommandItem
                      key={title}
                      value={title}
                      onSelect={() => handleSelect(title)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === title ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {title}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}

      {/* Mostrar input quando "Outro" for selecionado */}
      {value === "Outro" && (
        <div className="space-y-2 mt-2">
          <Input
            id={`${id}-custom`}
            value={customTitle}
            onChange={handleCustomTitleChange}
            placeholder="Digite o título da vaga"
            required={required}
            maxLength={maxLength}
          />
          {showCharCount && (
            <p className="text-xs text-gray-500">{customTitle.length}/{maxLength}</p>
          )}
        </div>
      )}

      {showCharCount && !isOtherSelected && value !== "Outro" && (
        <p className="text-xs text-gray-500">{value.length}/{maxLength}</p>
      )}
    </div>
  );
}

