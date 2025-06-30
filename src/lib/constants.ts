export const SELECTION_STATUSES = [
    "Convidado",
    "Cadastrado",
    "Análise de Currículo",
    "Entrevista com RH",
    "Entrevista com Gestor",
    "Validação TJ",
    "Validação Frota",
    "Teste de Atenção",
    "Validação SESMT",
    "Aprovado",
    "Reprovado",
    "Contratado",
] as const;

export type SelectionStatus = typeof SELECTION_STATUSES[number];

export const STATUS_COLORS: Record<SelectionStatus, string> = {
    "Convidado": "bg-blue-100 text-blue-700 border-blue-300",
    "Cadastrado": "bg-gray-200 text-gray-800",
    "Análise de Currículo": "bg-blue-200 text-blue-800",
    "Entrevista com RH": "bg-indigo-200 text-indigo-800",
    "Entrevista com Gestor": "bg-purple-200 text-purple-800",
    "Validação TJ": "bg-yellow-200 text-yellow-800",
    "Validação Frota": "bg-cyan-200 text-cyan-800",
    "Teste de Atenção": "bg-pink-200 text-pink-800",
    "Validação SESMT": "bg-teal-200 text-teal-800",
    "Aprovado": "bg-lime-300 text-lime-800",
    "Reprovado": "bg-red-200 text-red-800",
    "Contratado": "bg-green-300 text-green-800",
}; 