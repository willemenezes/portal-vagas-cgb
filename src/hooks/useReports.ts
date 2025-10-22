import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CandidateReport {
    id: string;
    candidate_id: string;
    job_id: string | null;
    report_url: string;
    report_file_name: string;
    generated_by: string | null;
    generated_at: string;
    metadata?: any;
}

export const useCandidateReports = (candidateId: string | null) => {
    return useQuery<CandidateReport[]>({
        queryKey: ['candidate-reports', candidateId],
        queryFn: async () => {
            if (!candidateId) return [];
            const { data, error } = await supabase
                .from('candidate_reports')
                .select('*')
                .eq('candidate_id', candidateId)
                .order('generated_at', { ascending: false });
            if (error) throw error;
            return data || [];
        },
        enabled: !!candidateId
    });
};

export const useSaveCandidateReport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ candidateId, jobId, file, fileName, metadata }: { candidateId: string; jobId?: string | null; file: Blob; fileName: string; metadata?: any; }) => {
            const path = `candidate-${candidateId}/${fileName}`;

            // Upload para Storage
            const { data: upload, error: storageError } = await supabase.storage
                .from('reports')
                .upload(path, file, { upsert: true, cacheControl: '3600' });
            if (storageError) throw storageError;

            const { data: { publicUrl } } = supabase.storage
                .from('reports')
                .getPublicUrl(path);

            // Registrar em candidate_reports
            const user = await supabase.auth.getUser();
            const { data: inserted, error: insertError } = await supabase
                .from('candidate_reports')
                .insert({
                    candidate_id: candidateId,
                    job_id: jobId || null,
                    report_url: publicUrl,
                    report_file_name: fileName,
                    generated_by: user.data.user?.id || null,
                    metadata: metadata || {}
                })
                .select()
                .single();
            if (insertError) throw insertError;

            return inserted;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['candidate-reports', data.candidate_id] });
        }
    });
};


























