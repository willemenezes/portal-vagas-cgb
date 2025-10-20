// Opções padrão de carga horária para o mercado brasileiro
export const WORKLOAD_OPTIONS = [
    // Cargas horárias semanais padrão
    { value: "20h/semana", label: "20h/semana" },
    { value: "22h/semana", label: "22h/semana" },
    { value: "30h/semana", label: "30h/semana" },
    { value: "40h/semana", label: "40h/semana" },
    { value: "44h/semana", label: "44h/semana" },

    // Cargas horárias diárias
    { value: "6h/dia", label: "6h/dia" },
    { value: "8h/dia", label: "8h/dia" },
    { value: "10h/dia", label: "10h/dia" },
    { value: "12h/dia", label: "12h/dia" },

    // Períodos e modalidades
    { value: "Meio Período", label: "Meio Período" },
    { value: "Período Integral", label: "Período Integral" },
    { value: "Turno Noturno", label: "Turno Noturno" },

    // Escalas especiais
    { value: "Escala 12x36", label: "Escala 12x36" },
    { value: "Escala 6x1", label: "Escala 6x1" },
    { value: "Escala 5x2", label: "Escala 5x2" },

    // Modalidades de trabalho
    { value: "Home Office", label: "Home Office" },
    { value: "Híbrido", label: "Híbrido" },
    { value: "Presencial", label: "Presencial" },

    // Outras opções comuns
    { value: "Flexível", label: "Flexível" },
    { value: "Por demanda", label: "Por demanda" },
    { value: "Estágio", label: "Estágio" },
] as const;

// Valor padrão recomendado
export const DEFAULT_WORKLOAD = "40h/semana";

// Função para obter apenas os valores (para Select components)
export const getWorkloadValues = () => WORKLOAD_OPTIONS.map(option => option.value);

// Função para obter apenas os labels (para exibição)
export const getWorkloadLabels = () => WORKLOAD_OPTIONS.map(option => option.label);



























