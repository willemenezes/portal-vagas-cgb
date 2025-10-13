-- Migração: Adicionar controle de departamentos para gerentes
-- Data: 2025-10-13
-- Objetivo: Permitir que gerentes vejam apenas vagas dos departamentos atribuídos

-- 1. Adicionar campo assigned_departments à tabela rh_users
ALTER TABLE public.rh_users 
ADD COLUMN IF NOT EXISTS assigned_departments TEXT[] DEFAULT NULL;

-- 2. Comentário para documentação
COMMENT ON COLUMN public.rh_users.assigned_departments IS 
'Array de departamentos que o gerente pode aprovar vagas. NULL = todos os departamentos (compatibilidade)';

-- 3. Índice para performance em consultas com arrays
CREATE INDEX IF NOT EXISTS idx_rh_users_assigned_departments 
ON public.rh_users USING GIN (assigned_departments);

-- 4. Verificar estrutura atualizada
-- SELECT 
--   column_name, 
--   data_type, 
--   is_nullable, 
--   column_default
-- FROM information_schema.columns 
-- WHERE table_name = 'rh_users' 
--   AND table_schema = 'public'
-- ORDER BY ordinal_position;

-- 5. Para gerentes existentes, deixar NULL (verão todos os departamentos)
-- Isso garante compatibilidade total com o sistema atual
UPDATE public.rh_users 
SET assigned_departments = NULL 
WHERE role IN ('manager', 'gerente') 
  AND assigned_departments IS NULL;

-- 6. Verificar resultado da migração
-- SELECT 
--   full_name,
--   role,
--   assigned_states,
--   assigned_cities,
--   assigned_departments,
--   CASE 
--     WHEN assigned_departments IS NULL THEN 'Vê todos os departamentos (compatibilidade)'
--     WHEN array_length(assigned_departments, 1) IS NULL THEN 'Array vazio'
--     ELSE array_to_string(assigned_departments, ', ')
--   END as departamentos_permitidos
-- FROM public.rh_users 
-- WHERE role IN ('manager', 'gerente')
-- ORDER BY full_name;

-- 7. Criar função auxiliar para verificar acesso por departamento
CREATE OR REPLACE FUNCTION public.manager_has_department_access(
  manager_user_id UUID,
  target_department TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  manager_departments TEXT[];
BEGIN
  -- Buscar departamentos atribuídos ao gerente
  SELECT assigned_departments INTO manager_departments
  FROM public.rh_users 
  WHERE user_id = manager_user_id 
    AND role IN ('manager', 'gerente');
  
  -- Se não encontrou o gerente, negar acesso
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Se assigned_departments é NULL, tem acesso a todos (compatibilidade)
  IF manager_departments IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Se array está vazio, negar acesso
  IF array_length(manager_departments, 1) IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar se o departamento está na lista
  RETURN target_department = ANY(manager_departments);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Comentário na função
COMMENT ON FUNCTION public.manager_has_department_access(UUID, TEXT) IS 
'Verifica se um gerente tem permissão para aprovar vagas de um departamento específico';

-- 9. Conceder permissões necessárias
GRANT EXECUTE ON FUNCTION public.manager_has_department_access(UUID, TEXT) TO authenticated;

-- 10. Log da migração
DO $$
BEGIN
  RAISE NOTICE 'Migração 20251013_add_assigned_departments aplicada com sucesso';
  RAISE NOTICE 'Campo assigned_departments adicionado à tabela rh_users';
  RAISE NOTICE 'Função manager_has_department_access criada';
  RAISE NOTICE 'Gerentes existentes mantêm compatibilidade (assigned_departments = NULL)';
END $$;
