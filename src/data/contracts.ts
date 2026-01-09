// Lista centralizada de contratos da empresa (CT)
export const contracts = [
  "144 - Porto de Moz",
  "150 - Norte",
  "151 - Nordeste",
  "152 - Oeste",
  "152 - Centro",
  "153 - Sul",
  "153 - Sudeste",
  "159 - Amapá",
  "163 - Amapá",
  "168 - Amapá",
  "171 - Centro-Oeste",
  "174 - Amapá",
];

// Função helper para obter o número do contrato (antes do hífen)
export function getContractNumber(contract: string): string {
  const match = contract.match(/^(\d+)\s*-/);
  return match ? match[1] : contract;
}

// Função helper para obter a descrição do contrato (após o hífen)
export function getContractDescription(contract: string): string {
  const match = contract.match(/-\s*(.+)$/);
  return match ? match[1].trim() : contract;
}

