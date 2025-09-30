import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Candidate } from '@/hooks/useCandidates';

export interface CandidateReportData {
    candidate: any;
    job: any | null;
    legalData: any | null;
    history: any[];
    approvals: {
        request: any | null;
    };
}

export const useCandidateReport = (candidateId: string | null) => {
    return useQuery<CandidateReportData>({
        queryKey: ['candidate-report', candidateId],
        queryFn: async () => {
            if (!candidateId) throw new Error('candidateId é obrigatório');

            // 1) Candidato + vaga
            const { data: candidate, error: candError } = await supabase
                .from('candidates')
                .select('*, job:jobs(*)')
                .eq('id', candidateId)
                .single();

            if (candError) throw candError;

            // 2) Dados jurídicos (último registro)
            const { data: legal, error: legalError } = await supabase
                .from('candidate_legal_data')
                .select('*')
                .eq('candidate_id', candidateId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (legalError && legalError.code !== 'PGRST116') { // no rows
                throw legalError;
            }

            // 3) Histórico (notas + validações) - evitar joins diretos para compatibilidade com RLS
            const [notesRes, validationsRes] = await Promise.all([
                supabase
                    .from('candidate_notes')
                    .select('*')
                    .eq('candidate_id', candidateId)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('candidate_legal_validations')
                    .select('*')
                    .eq('candidate_id', candidateId)
                    .order('created_at', { ascending: false })
            ]);

            if (notesRes.error) throw notesRes.error;
            if (validationsRes.error) throw validationsRes.error;

            const authorIds = Array.from(new Set((notesRes.data || []).map((n: any) => n.author_id).filter(Boolean)));
            const validatorIds = Array.from(new Set((validationsRes.data || []).map((v: any) => v.validator_id).filter(Boolean)));
            const idsToFetch = Array.from(new Set([...authorIds, ...validatorIds]));

            let userMap = new Map<string, any>();
            if (idsToFetch.length > 0) {
                const { data: users } = await supabase
                    .from('rh_users')
                    .select('user_id, full_name, email')
                    .in('user_id', idsToFetch);
                if (users) {
                    userMap = new Map(users.map((u: any) => [u.user_id, u]));
                }
            }

            const history = [
                ...(notesRes.data || []).map((n: any) => ({
                    id: n.id,
                    type: 'note',
                    content: n.note,
                    activity_type: n.activity_type,
                    created_at: n.created_at,
                    author: userMap.get(n.author_id) || null
                })),
                ...(validationsRes.data || []).map((v: any) => {
                    const validator = userMap.get(v.validator_id);
                    return {
                        id: v.id,
                        type: 'legal_validation',
                        content: v.comments || v.status,
                        activity_type: 'Validação Legal',
                        created_at: v.created_at,
                        author: validator || null,
                        legal_status: v.status,
                        legal_status_translated: translateLegalStatus(v.status),
                        validator_name: validator?.full_name || 'Sistema',
                        comments: v.comments
                    };
                })
            ].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            // Helper para traduzir status jurídico
            function translateLegalStatus(status: string | null | undefined): string {
                if (!status) return 'Pendente';
                const statusMap: Record<string, string> = {
                    'pending': 'Pendente',
                    'approved': 'Aprovado',
                    'rejected': 'Reprovado',
                    'request_changes': 'Solicitar Alterações',
                    'approved_with_restrictions': 'Aprovado com Restrições'
                };
                return statusMap[status] || status;
            }

            // 4) Aprovações da vaga (se vinculada a job request via notas/approved_by em job_requests)
            let request = null;
            if (candidate?.job_id) {
                const { data: req, error: reqError } = await supabase
                    .from('job_requests')
                    .select('*')
                    .eq('title', candidate?.job?.title || '')
                    .eq('city', candidate?.job?.city || '')
                    .eq('state', candidate?.job?.state || '')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (!reqError) request = req;
            }

            return {
                candidate,
                job: candidate?.job || null,
                legalData: legal || null,
                history,
                approvals: { request }
            } as CandidateReportData;
        },
        enabled: !!candidateId,
    });
};


