-- Sistema Inteligente de Finalização de Vagas
-- Executar em: https://supabase.com/dashboard/project/csgmamxhqkqdknohfsfj/sql

-- 1. Função para atualizar contagem de vagas preenchidas
CREATE OR REPLACE FUNCTION update_job_filled_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar se o status mudou para 'Contratado' ou 'Aprovado'
    IF NEW.status IN ('Contratado', 'Aprovado') AND OLD.status != NEW.status THEN
        -- Incrementar quantity_filled na vaga correspondente
        UPDATE public.jobs 
        SET 
            quantity_filled = COALESCE(quantity_filled, 0) + 1,
            updated_at = NOW()
        WHERE id = NEW.job_id;
        
        -- Verificar se todas as posições foram preenchidas
        UPDATE public.jobs 
        SET 
            status = 'closed',
            approval_status = 'concluido',
            updated_at = NOW()
        WHERE id = NEW.job_id 
        AND COALESCE(quantity_filled, 0) >= COALESCE(quantity, 1);
        
        RAISE NOTICE 'Vaga atualizada: job_id=%, candidato=%, novo_status=%', NEW.job_id, NEW.name, NEW.status;
        
    -- Verificar se o status saiu de 'Contratado' ou 'Aprovado' (reverter contagem)
    ELSIF OLD.status IN ('Contratado', 'Aprovado') AND NEW.status NOT IN ('Contratado', 'Aprovado') THEN
        -- Decrementar quantity_filled na vaga correspondente
        UPDATE public.jobs 
        SET 
            quantity_filled = GREATEST(COALESCE(quantity_filled, 0) - 1, 0),
            updated_at = NOW()
        WHERE id = NEW.job_id;
        
        -- Reativar vaga se necessário
        UPDATE public.jobs 
        SET 
            status = 'active',
            approval_status = 'ativo',
            updated_at = NOW()
        WHERE id = NEW.job_id 
        AND approval_status = 'concluido'
        AND COALESCE(quantity_filled, 0) < COALESCE(quantity, 1);
        
        RAISE NOTICE 'Contagem revertida: job_id=%, candidato=%, status_anterior=%', NEW.job_id, NEW.name, OLD.status;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Criar trigger na tabela candidates
DROP TRIGGER IF EXISTS trigger_update_job_completion ON public.candidates;
CREATE TRIGGER trigger_update_job_completion
    AFTER UPDATE OF status ON public.candidates
    FOR EACH ROW
    WHEN (NEW.job_id IS NOT NULL)
    EXECUTE FUNCTION update_job_filled_count();

-- 3. Adicionar 'concluido' ao enum approval_status se não existir
DO $$ 
BEGIN
    -- Verificar se o tipo approval_status existe e adicionar 'concluido'
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_status') THEN
        BEGIN
            ALTER TYPE approval_status ADD VALUE IF NOT EXISTS 'concluido';
        EXCEPTION WHEN others THEN
            RAISE NOTICE 'Valor concluido já existe no enum approval_status';
        END;
    END IF;
END $$;

-- 4. Função para recalcular vagas (caso necessário)
CREATE OR REPLACE FUNCTION recalculate_job_completion()
RETURNS void AS $$
BEGIN
    -- Recalcular quantity_filled para todas as vagas
    UPDATE public.jobs 
    SET quantity_filled = (
        SELECT COUNT(*) 
        FROM public.candidates 
        WHERE candidates.job_id = jobs.id 
        AND candidates.status IN ('Contratado', 'Aprovado')
    );
    
    -- Atualizar status das vagas baseado na contagem
    UPDATE public.jobs 
    SET 
        status = CASE 
            WHEN COALESCE(quantity_filled, 0) >= COALESCE(quantity, 1) THEN 'closed'
            ELSE 'active'
        END,
        approval_status = CASE 
            WHEN COALESCE(quantity_filled, 0) >= COALESCE(quantity, 1) THEN 'concluido'
            ELSE 'ativo'
        END
    WHERE status IN ('active', 'closed') OR approval_status IN ('ativo', 'concluido');
    
    RAISE NOTICE 'Recálculo de vagas concluído';
END;
$$ LANGUAGE plpgsql;

-- 5. Executar recálculo inicial (opcional)
-- SELECT recalculate_job_completion();

-- 6. Verificar estrutura atual
SELECT 
    j.id,
    j.title,
    j.quantity,
    j.quantity_filled,
    j.status,
    j.approval_status,
    COUNT(c.id) as candidatos_aprovados
FROM public.jobs j
LEFT JOIN public.candidates c ON c.job_id = j.id AND c.status IN ('Contratado', 'Aprovado')
WHERE j.title = 'TESTE05'
GROUP BY j.id, j.title, j.quantity, j.quantity_filled, j.status, j.approval_status;
