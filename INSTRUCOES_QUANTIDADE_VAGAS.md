# 🚀 Implementação: Sistema de Quantidade e Validade de Vagas

## 📋 **RESUMO DAS MELHORIAS**

Implementei um sistema completo de **vagas em lote** com **controle de quantidade** e **validade automática de 20 dias**, baseado nas melhores práticas de plataformas como LinkedIn Jobs e Indeed.

### ✅ **FUNCIONALIDADES IMPLEMENTADAS:**

1. **Campo "Quantidade de Vagas"** no formulário de criação
2. **Controle interno** para gestores/RH (veem quantidade real)
3. **Exibição única** no portal público (mesmo com múltiplas vagas)
4. **Validade automática** de 20 dias corridos
5. **Dashboard com métricas** de vencimento
6. **Indicadores visuais** de status e expiração

---

## 🔧 **MIGRAÇÃO SQL OBRIGATÓRIA**

**⚠️ IMPORTANTE:** Execute esta migração no painel do Supabase antes de usar as novas funcionalidades.

### **Passo 1: Acesse o SQL Editor**
1. Vá para: https://supabase.com/dashboard/project/csgmamxhqkqdknohfsfj/sql
2. Clique em "New Query"
3. Cole o código SQL abaixo:

```sql
-- Migração: Sistema de Quantidade e Validade de Vagas
-- Data: Janeiro 2025

-- 1. Adicionar campos na tabela job_requests
ALTER TABLE public.job_requests 
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- 2. Adicionar campos na tabela jobs
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS quantity_filled INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_jobs_expires_at ON public.jobs(expires_at);
CREATE INDEX IF NOT EXISTS idx_job_requests_expires_at ON public.job_requests(expires_at);

-- 4. Função para calcular data de expiração (20 dias corridos)
CREATE OR REPLACE FUNCTION calculate_expiry_date()
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE SQL
AS $$
  SELECT (NOW() + INTERVAL '20 days');
$$;

-- 5. Trigger para definir data de expiração automaticamente nos job_requests
CREATE OR REPLACE FUNCTION set_job_request_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := calculate_expiry_date();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_set_job_request_expiry
  BEFORE INSERT ON public.job_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_job_request_expiry();

-- 6. Trigger para definir data de expiração automaticamente nos jobs
CREATE OR REPLACE FUNCTION set_job_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := calculate_expiry_date();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_set_job_expiry
  BEFORE INSERT ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION set_job_expiry();

-- 7. View para vagas com status de expiração
CREATE OR REPLACE VIEW public.jobs_with_expiry_status AS
SELECT 
  j.*,
  CASE 
    WHEN j.expires_at < NOW() THEN 'expired'
    WHEN j.expires_at < (NOW() + INTERVAL '3 days') THEN 'expiring_soon'
    ELSE 'active'
  END as expiry_status,
  EXTRACT(DAYS FROM (j.expires_at - NOW())) as days_until_expiry,
  (j.quantity - j.quantity_filled) as remaining_positions
FROM public.jobs j;

-- 8. View para relatórios de expiração
CREATE OR REPLACE VIEW public.expiry_report AS
SELECT 
  COUNT(*) FILTER (WHERE expires_at < NOW()) as expired_jobs,
  COUNT(*) FILTER (WHERE expires_at < (NOW() + INTERVAL '3 days') AND expires_at >= NOW()) as expiring_soon,
  COUNT(*) FILTER (WHERE expires_at >= (NOW() + INTERVAL '3 days')) as active_jobs,
  COUNT(*) as total_jobs,
  SUM(quantity) as total_positions,
  SUM(quantity_filled) as filled_positions,
  SUM(quantity - quantity_filled) as remaining_positions
FROM public.jobs
WHERE status = 'published';

-- 9. Comentários para documentação
COMMENT ON COLUMN public.job_requests.quantity IS 'Quantidade de vagas solicitadas para a mesma posição';
COMMENT ON COLUMN public.job_requests.expires_at IS 'Data de expiração da solicitação (20 dias corridos)';
COMMENT ON COLUMN public.jobs.quantity IS 'Quantidade total de vagas disponíveis';
COMMENT ON COLUMN public.jobs.quantity_filled IS 'Quantidade de vagas já preenchidas';
COMMENT ON COLUMN public.jobs.expires_at IS 'Data de expiração da vaga (20 dias corridos)';
```

### **Passo 2: Executar a Migração**
1. Clique em **"Run"** para executar a migração
2. Aguarde a confirmação de sucesso
3. Verifique se não há erros na saída

---

## 🎯 **COMO USAR AS NOVAS FUNCIONALIDADES**

### **1. Criando Vagas com Quantidade**
- No formulário de criação de vagas, agora há um campo **"Quantidade de Vagas"**
- Digite quantas vagas iguais você precisa (máximo: 50)
- Exemplo: 3 vagas de "Agente Leiturista" para Belém-PA

### **2. Controle para Gestores**
- **Gestores/RH veem:** "3 vagas de Agente Leiturista (2/3 preenchidas)"
- **Portal público vê:** Apenas 1 vaga de "Agente Leiturista"
- **Dashboard mostra:** Métricas detalhadas de quantidade e validade

### **3. Sistema de Validade**
- **Todas as vagas expiram automaticamente em 20 dias**
- **Indicadores visuais:**
  - 🟢 **Verde:** Mais de 3 dias restantes
  - 🟡 **Amarelo:** 3 dias ou menos (expirando em breve)
  - 🔴 **Vermelho:** Expirada (ação necessária)

### **4. Dashboard de Controle**
- **Seção "Controle de Validade das Vagas"** no Dashboard
- **Métricas incluem:**
  - Vagas expiradas
  - Vagas expirando em breve
  - Vagas ativas
  - Taxa de preenchimento
  - Posições restantes

---

## 📊 **VANTAGENS DO SISTEMA**

### **Para Coordenadores:**
- ✅ Criar múltiplas vagas iguais de uma vez
- ✅ Menos trabalho manual repetitivo
- ✅ Controle centralizado de quantidade

### **Para Gestores/RH:**
- ✅ Visibilidade completa de quantidade real
- ✅ Controle de preenchimento por vaga
- ✅ Alertas de vencimento automáticos
- ✅ Métricas detalhadas no dashboard

### **Para Candidatos:**
- ✅ Interface limpa sem redundância
- ✅ Uma vaga por posição no portal
- ✅ Experiência de candidatura simplificada

### **Para o Sistema:**
- ✅ Dados organizados e consistentes
- ✅ Relatórios precisos
- ✅ Gestão automática de validade
- ✅ Performance otimizada

---

## 🧪 **TESTE RECOMENDADO**

Após executar a migração:

1. **Crie uma nova solicitação** com quantidade > 1
2. **Verifique no dashboard** se aparece corretamente
3. **Confirme no portal público** se mostra apenas 1 vaga
4. **Observe os indicadores** de quantidade e validade

---

## ⚠️ **IMPORTANTE**

- **Execute a migração SQL antes** de usar as funcionalidades
- **Todas as funcionalidades existentes** continuam funcionando normalmente
- **Vagas antigas** receberão valores padrão (quantidade: 1)
- **Sistema é retrocompatível** - não quebra nada existente

---

## 🎉 **RESULTADO FINAL**

Com essas implementações, você terá um sistema de vagas **profissional**, **eficiente** e **fácil de gerenciar**, similar aos melhores portais de emprego do mercado, mas adaptado às necessidades específicas da CGB Engenharia.

**O sistema agora suporta:**
- ✅ Vagas em lote com controle inteligente
- ✅ Validade automática de 20 dias
- ✅ Dashboard completo com métricas
- ✅ Indicadores visuais informativos
- ✅ Experiência otimizada para todos os usuários







