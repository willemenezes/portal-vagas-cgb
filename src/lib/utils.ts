import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sanitizeFilename(filename: string): string {
  // Remove acentos e caracteres especiais
  const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
  const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------'
  const p = new RegExp(a.split('').join('|'), 'g')

  const sanitized = filename.toString().toLowerCase()
    .replace(/\s+/g, '-') // Substitui espaços por -
    .replace(p, c => b.charAt(a.indexOf(c))) // Substitui caracteres especiais
    .replace(/&/g, '-and-') // Substitui & por 'and'
    .replace(/[^\w\-.]+/g, '') // Remove todos os caracteres não-alfanuméricos, exceto . e -
    .replace(/\-\-+/g, '-') // Substitui múltiplos - por um único -
    .replace(/^-+/, '') // Remove hífens do início
    .replace(/-+$/, ''); // Remove hífens do fim

  // Mantém a extensão do arquivo
  const parts = sanitized.split('.');
  if (parts.length > 1) {
    const ext = parts.pop();
    return `${parts.join('')}.${ext}`;
  }
  return sanitized;
}
