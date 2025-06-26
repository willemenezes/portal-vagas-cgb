import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, Search, FileText, MapPin, Briefcase } from 'lucide-react';
import { type SelectionStatus } from '@/lib/constants';

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  age: string;
  workedAtCGB: string;
  whatsapp: string;
  emailInfo: string;
  desiredJob: string;
  pcd: string;
  travel: string;
  cnh: string;
  vehicle: string;
  vehicleModel: string;
  vehicleYear: string;
  lgpdConsent: boolean;
  job_id: string;
  status: SelectionStatus | 'pending' | 'approved' | 'rejected' | 'interview';
  resume_file_url?: string;
  resume_file_name?: string;
  applied_date: string;
  created_at: string;
  updated_at: string;
  job?: {
    title: string;
    city: string;
    state: string;
  };
}

// Criando um tipo específico para a criação de um novo candidato
export type NewCandidate = Omit<Candidate, 'id' | 'created_at' | 'updated_at' | 'applied_date' | 'job'>;

export const useCandidates = () => {
  return useQuery({
    queryKey: ['candidates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidates')
        .select(`
          *,
          job:jobs(title, city, state)
        `)
        .order('applied_date', { ascending: false });

      if (error) {
        console.error("Erro ao buscar candidatos:", error);
        throw error;
      }
      return data;
    },
    select: (data): Candidate[] => {
      if (!Array.isArray(data)) return [];
      return data.map(c => ({
        ...c,
        city: c.city || c.job?.city,
        state: c.state || c.job?.state,
      })) as Candidate[];
    }
  });
};

export const useCreateCandidate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (candidate: NewCandidate) => {
      const { data, error } = await supabase
        .from('candidates')
        .insert([candidate])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
    },
  });
};

export const useUpdateCandidateStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Candidate['status'] }) => {
      const { data, error } = await supabase
        .from('candidates')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      // Opcional: atualizar o candidato específico no cache para uma resposta mais rápida da UI
      queryClient.setQueryData(['candidate', variables.id], data);
    },
  });
};

export const useDeleteCandidate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (candidate: Candidate) => {
      // 1. Deletar o arquivo do currículo do Storage
      if (candidate.resume_file_url) {
        const fullPath = new URL(candidate.resume_file_url).pathname;
        const filePath = fullPath.substring(fullPath.indexOf('/resumes/') + '/resumes/'.length);

        if (filePath) {
          const { error: storageError } = await supabase.storage
            .from('resumes')
            .remove([filePath]);
          if (storageError) {
            console.error("Erro ao deletar currículo do Storage:", storageError);
          }
        }
      }

      // 2. Deletar o registro do candidato do banco de dados
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', candidate.id);

      if (error) {
        throw error;
      }

      return candidate.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
    },
  });
};
