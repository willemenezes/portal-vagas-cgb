-- Adicionar política de exclusão para job_requests
-- Permite que solicitadores excluam suas próprias solicitações pendentes
-- E permite que gerentes/admins excluam qualquer solicitação

CREATE POLICY "Solicitadores podem excluir solicitações pendentes" ON public.job_requests
    FOR DELETE USING (
        (auth.uid()::text = requested_by AND status = 'pendente') OR
        EXISTS (
            SELECT 1 FROM public.rh_users 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'gerente', 'manager')
        )
    );

-- Verificar políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'job_requests' 
ORDER BY policyname; 