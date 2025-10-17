import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Resume {
  id: string;
  name?: string | null;
  email: string;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  position?: string | null;
  experience?: string | null;
  education?: string | null;
  skills?: string[] | null;
  resume_file_url?: string | null;
  resume_file_name?: string | null;
  cnh?: string | null;
  vehicle?: string | null;
  // Novos campos adicionados
  age?: string | null;
  whatsapp?: string | null;
  workedAtCGB?: string | null;
  pcd?: string | null;
  travel?: string | null;
  vehicleModel?: string | null;
  vehicleYear?: string | null;
  status: 'new' | 'reviewed' | 'shortlisted' | 'contacted';
  submitted_date: string;
  created_at: string;
  updated_at: string;
}

// Hook para buscar currículos com paginação inteligente
export const useResumes = (page = 0, pageSize = 100) => {
  return useQuery({
    queryKey: ['resumes', 'paginated', page, pageSize],
    queryFn: async () => {
      console.log(`🔄 useResumes: Carregando página ${page + 1} (${pageSize} currículos)...`);

      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from('resumes')
        .select('*', { count: 'exact' })
        .order('submitted_date', { ascending: false })
        .range(from, to);

      if (error) throw error;

      console.log(`✅ useResumes: ${data?.length || 0} currículos carregados (Página ${page + 1})`);

      return {
        resumes: data || [],
        totalCount: count || 0,
        hasMore: (data?.length || 0) === pageSize,
        currentPage: page,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutos de cache
    refetchOnWindowFocus: false,
  });
};

// Hook para buscar TODOS os currículos (para relatórios e exportações)
export const useAllResumes = () => {
  return useQuery({
    queryKey: ['resumes', 'all', 'v2'],
    queryFn: async () => {
      console.log('🔄 useAllResumes: Buscando TODOS os currículos (sem limites)...');

      let allResumes: any[] = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('resumes')
          .select('*')
          .order('submitted_date', { ascending: false })
          .range(from, from + batchSize - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allResumes = [...allResumes, ...data];
          console.log(`📥 Lote ${Math.floor(from / batchSize) + 1}: ${data.length} currículos (Total: ${allResumes.length})`);
          from += batchSize;

          if (data.length < batchSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      console.log(`✅ useAllResumes: ${allResumes.length} currículos carregados (TOTAL COMPLETO)`);
      return allResumes;
    },
    staleTime: 10 * 60 * 1000, // 10 minutos de cache
    refetchOnWindowFocus: false,
  });
};

// Hook para obter contagem total de currículos (talentos)
export const useResumesCount = () => {
  return useQuery({
    queryKey: ['resumes', 'count', 'v1'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('resumes')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useCreateResume = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resume: Omit<Resume, 'id' | 'created_at' | 'updated_at' | 'submitted_date'>) => {
      const { data, error } = await supabase
        .from('resumes')
        .insert([resume] as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
    },
  });
};

export const useUpdateResumeStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Resume['status'] }) => {
      const { data, error } = await supabase
        .from('resumes')
        .update({ status } as any)
        .eq('id', id as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
    },
  });
};

export const useUploadResume = () => {
  return useMutation({
    mutationFn: async ({ file, fileName }: { file: File; fileName: string }) => {
      const filePath = `curriculos/${fileName}`;

      const { data, error } = await supabase.storage
        .from('resumes')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);

      return { ...data, publicUrl };
    },
  });
};

export const useDeleteResume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (resume: Resume) => {
      // 1. Deletar o arquivo do Storage
      if (resume.resume_file_url) {
        const fullPath = new URL(resume.resume_file_url).pathname;
        const filePath = fullPath.substring(fullPath.indexOf('/resumes/') + '/resumes/'.length);
        if (filePath) {
          const { error: storageError } = await supabase.storage
            .from('resumes')
            .remove([filePath]);
          if (storageError) {
            console.error("Erro ao deletar arquivo do Storage:", storageError);
            // Continuar mesmo se o arquivo não for encontrado, pois o registro do DB é mais importante
          }
        }
      }

      // 2. Deletar o registro da tabela 'resumes'
      const { error } = await supabase
        .from('resumes')
        .delete()
        .eq('id', resume.id);

      if (error) {
        throw error;
      }

      return resume.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
    },
  });
};
