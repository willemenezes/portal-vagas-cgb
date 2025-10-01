import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCreateCandidateNote } from '@/hooks/useCandidateNotes';
import { useAuth } from '@/hooks/useAuth';
import { INVITED_STATUS } from '@/lib/constants';

// Hook para convidar candidato existente para uma nova vaga
export const useInviteCandidate = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const createNote = useCreateCandidateNote();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async ({ 
            candidateId, 
            newJobId, 
            candidateName 
        }: { 
            candidateId: string; 
            newJobId: string; 
            candidateName: string;
        }) => {
            console.log('🎯 [useInviteCandidate] Iniciando convite:', {
                candidateId,
                newJobId,
                candidateName
            });

            // 1. Buscar dados do candidato atual
            const { data: currentCandidate, error: candidateError } = await supabase
                .from('candidates')
                .select('*')
                .eq('id', candidateId)
                .single();

            if (candidateError) {
                console.error('❌ [useInviteCandidate] Erro ao buscar candidato:', candidateError);
                throw candidateError;
            }

            // 2. Buscar dados da nova vaga
            const { data: newJob, error: jobError } = await supabase
                .from('jobs')
                .select('*')
                .eq('id', newJobId)
                .single();

            if (jobError) {
                console.error('❌ [useInviteCandidate] Erro ao buscar vaga:', jobError);
                throw jobError;
            }

            console.log('📋 [useInviteCandidate] Dados encontrados:', {
                currentJob: currentCandidate.job_id,
                newJob: newJob.title,
                currentStatus: currentCandidate.status
            });

            // 3. Atualizar candidato com nova vaga
            const updateData = {
                job_id: newJobId,
                status: INVITED_STATUS as any,
                updated_at: new Date().toISOString(),
                // Manter dados pessoais existentes
                name: currentCandidate.name,
                email: currentCandidate.email,
                phone: currentCandidate.phone,
                city: currentCandidate.city || newJob.city,
                state: currentCandidate.state || newJob.state,
                // Atualizar cargo desejado
                desiredJob: newJob.title
            };

            const { data: updatedCandidate, error: updateError } = await supabase
                .from('candidates')
                .update(updateData)
                .eq('id', candidateId)
                .select()
                .single();

            if (updateError) {
                console.error('❌ [useInviteCandidate] Erro ao atualizar candidato:', updateError);
                throw updateError;
            }

            console.log('✅ [useInviteCandidate] Candidato atualizado com sucesso');

            // 4. Criar nota sobre o convite
            if (user) {
                try {
                    await createNote.mutateAsync({
                        candidate_id: candidateId,
                        author_id: user.id,
                        note: `Candidato convidado para nova vaga: "${newJob.title}" (${newJob.city}, ${newJob.state}). Status alterado para convite.`,
                        activity_type: 'Convite'
                    });
                } catch (noteError) {
                    console.warn('⚠️ [useInviteCandidate] Erro ao criar nota:', noteError);
                    // Não falhar o processo por erro na nota
                }
            }

            return {
                candidate: updatedCandidate,
                newJob,
                previousJobId: currentCandidate.job_id
            };
        },
        onSuccess: (data) => {
            // Invalidar queries relacionadas
            queryClient.invalidateQueries({ queryKey: ['candidates'] });
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            
            toast({
                title: "Convite enviado com sucesso!",
                description: `${data.candidate.name} foi convidado(a) para a vaga "${data.newJob.title}".`,
                duration: 5000
            });

            console.log('🎉 [useInviteCandidate] Convite concluído com sucesso');
        },
        onError: (error: any) => {
            console.error('❌ [useInviteCandidate] Erro no convite:', error);
            
            let errorMessage = 'Não foi possível enviar o convite. Tente novamente.';
            
            if (error.message?.includes('duplicate key')) {
                errorMessage = 'Este candidato já está concorrendo a esta vaga.';
            } else if (error.message?.includes('foreign key')) {
                errorMessage = 'Vaga não encontrada no sistema.';
            } else if (error.message?.includes('permission denied')) {
                errorMessage = 'Você não tem permissão para enviar convites.';
            }

            toast({
                title: "Erro ao enviar convite",
                description: errorMessage,
                variant: "destructive"
            });
        }
    });
};
