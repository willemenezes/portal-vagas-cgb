# Reorganização do Layout - Página Inicial

## Alteração Solicitada
Mover a seção "Vagas em Destaque" para ficar abaixo da seção "Vagas pelo Brasil" (mapa interativo).

## Nova Ordem das Seções

### ✅ Layout Atualizado:

1. **Hero Section** 
   - Logo CGB Energia
   - Título principal: "Oportunidades que transformam vidas"
   - Subtítulo e call-to-action

2. **Vagas pelo Brasil** (Mapa Interativo)
   - Mini dashboard com estatísticas
   - Mapa interativo com marcadores
   - Instruções de uso
   - Fundo: branco

3. **Vagas em Destaque** ⬅️ **MOVIDO PARA CÁ**
   - Carrossel com 6 vagas principais
   - Cards com informações detalhadas
   - Botão "Ver Todas as Vagas"
   - Fundo: cinza claro (bg-gray-50)

4. **Todas as Vagas**
   - Filtros laterais
   - Lista completa de vagas
   - Sistema de busca
   - Fundo: branco

5. **Call-to-Action**
   - Banco de Talentos
   - Fundo: cor primária CGB

6. **Footer**
   - Informações da empresa
   - Links úteis

## Benefícios da Nova Ordem

### 🎯 **Fluxo de Navegação Melhorado:**
1. **Visão Geral** → Usuário vê o mapa com distribuição geográfica
2. **Destaque** → Depois vê as vagas em destaque selecionadas
3. **Exploração** → Por fim, pode filtrar e explorar todas as vagas

### 🗺️ **Mapa Como Introdução:**
- O mapa agora serve como uma "prévia" visual das oportunidades
- Usuário entende rapidamente a abrangência geográfica da empresa
- Cria expectativa para ver as vagas em detalhes

### 📱 **Experiência Mobile:**
- Ordem lógica mantida em dispositivos móveis
- Transições suaves entre seções
- Cores alternadas para melhor separação visual

## Alterações Técnicas

### Arquivo Modificado:
- `src/pages/Index.tsx`

### Mudanças Realizadas:
1. **Removida** seção "Vagas em Destaque" da posição original (após Hero)
2. **Adicionada** seção "Vagas em Destaque" após seção do mapa
3. **Ajustada** cor de fundo da seção "Todas as Vagas" para branco
4. **Mantida** funcionalidade do carrossel e todos os recursos

### Cores das Seções:
- Hero: gradiente de fundo
- Mapa: fundo branco
- Vagas em Destaque: fundo cinza claro
- Todas as Vagas: fundo branco
- CTA: fundo cor primária
- Footer: fundo branco

## Funcionalidades Preservadas

✅ **Carrossel automático** nas vagas em destaque  
✅ **Botão "Ver Todas as Vagas"** com scroll suave  
✅ **Responsividade** em todos os dispositivos  
✅ **Filtros e busca** funcionando normalmente  
✅ **Mapa interativo** com todas as funcionalidades  
✅ **Links e navegação** mantidos  

## Resultado Final

A página agora tem um fluxo mais intuitivo:
- **Apresentação** → **Visão Geográfica** → **Destaques** → **Exploração Completa**

Esta ordem permite que o usuário:
1. Entenda a proposta da empresa
2. Veja onde há oportunidades geograficamente
3. Conheça as vagas principais em destaque
4. Explore todas as opções disponíveis

---

**Status:** ✅ **Reorganização Concluída**  
**Data:** Dezembro 2024  
**Build:** Testado e funcionando perfeitamente 