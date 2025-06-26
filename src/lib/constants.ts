export const SELECTION_STATUSES = [
    "Cadastrado",
    "Análise de Currículo",
    "Pré-selecionado",
    "Em Entrevista",
    "Teste Técnico",
    "Validação de Frota",
    "Avaliação Psicológica",
    "Validação de SESMT",
    "Aguardando Retorno",
    "Aprovado",
    "Reprovado",
] as const;

export type SelectionStatus = typeof SELECTION_STATUSES[number];

export const STATUS_COLORS: Record<SelectionStatus, string> = {
    "Cadastrado": "bg-gray-200 text-gray-800",
    "Análise de Currículo": "bg-blue-200 text-blue-800",
    "Pré-selecionado": "bg-indigo-200 text-indigo-800",
    "Em Entrevista": "bg-purple-200 text-purple-800",
    "Teste Técnico": "bg-yellow-200 text-yellow-800",
    "Validação de Frota": "bg-cyan-200 text-cyan-800",
    "Avaliação Psicológica": "bg-pink-200 text-pink-800",
    "Validação de SESMT": "bg-teal-200 text-teal-800",
    "Aguardando Retorno": "bg-orange-200 text-orange-800",
    "Aprovado": "bg-green-200 text-green-800",
    "Reprovado": "bg-red-200 text-red-800",
}; 