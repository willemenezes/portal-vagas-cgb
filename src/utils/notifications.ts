// Funções auxiliares para sistema de notificações
import { supabase } from '@/integrations/supabase/client';
import { NotificationRecipient } from '@/types/notifications';

/**
 * Busca gerentes por região (estado/cidade)
 */
export const getManagersByRegion = async (state: string, city: string): Promise<NotificationRecipient[]> => {
  try {
    const { data, error } = await supabase
      .from('rh_users')
      .select('email, full_name, role, assigned_states, assigned_cities')
      .eq('role', 'manager');

    if (error) throw error;

    return data
      ?.filter(user => {
        // Se tem estados atribuídos, verificar se inclui o estado da vaga
        if (user.assigned_states && user.assigned_states.length > 0) {
          return user.assigned_states.includes(state);
        }
        // Se tem cidades atribuídas, verificar se inclui a cidade da vaga
        if (user.assigned_cities && user.assigned_cities.length > 0) {
          return user.assigned_cities.includes(city);
        }
        // Se não tem restrições, pode ver todas
        return true;
      })
      .map(user => ({
        email: user.email,
        name: user.full_name,
        role: user.role
      })) || [];
  } catch (error) {
    console.error('Erro ao buscar gerentes:', error);
    return [];
  }
};

/**
 * Busca usuários RH por região (estado/cidade)
 */
export const getRHByRegion = async (state: string, city: string): Promise<NotificationRecipient[]> => {
  try {
    const { data, error } = await supabase
      .from('rh_users')
      .select('email, full_name, role, assigned_states, assigned_cities')
      .in('role', ['admin', 'recruiter']);

    if (error) throw error;

    return data
      ?.filter(user => {
        // Admins veem todas as regiões
        if (user.role === 'admin') return true;
        
        // Para recruiters, aplicar filtro regional
        if (user.assigned_states && user.assigned_states.length > 0) {
          return user.assigned_states.includes(state);
        }
        if (user.assigned_cities && user.assigned_cities.length > 0) {
          return user.assigned_cities.includes(city);
        }
        return true;
      })
      .map(user => ({
        email: user.email,
        name: user.full_name,
        role: user.role
      })) || [];
  } catch (error) {
    console.error('Erro ao buscar usuários RH:', error);
    return [];
  }
};

/**
 * Busca usuários por role específico
 */
export const getUsersByRole = async (role: string): Promise<NotificationRecipient[]> => {
  try {
    const { data, error } = await supabase
      .from('rh_users')
      .select('email, full_name, role')
      .eq('role', role);

    if (error) throw error;

    return data?.map(user => ({
      email: user.email,
      name: user.full_name,
      role: user.role
    })) || [];
  } catch (error) {
    console.error(`Erro ao buscar usuários ${role}:`, error);
    return [];
  }
};

/**
 * Busca usuário específico por ID
 */
export const getUserById = async (userId: string): Promise<NotificationRecipient | null> => {
  try {
    const { data, error } = await supabase
      .from('rh_users')
      .select('email, full_name, role')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    return data ? {
      email: data.email,
      name: data.full_name,
      role: data.role
    } : null;
  } catch (error) {
    console.error('Erro ao buscar usuário por ID:', error);
    return null;
  }
};

/**
 * Busca stakeholders de uma vaga (coordenador + gerente que aprovou)
 */
export const getJobStakeholders = async (requestId: string): Promise<NotificationRecipient[]> => {
  try {
    const { data: request, error } = await supabase
      .from('job_requests')
      .select('requested_by, approved_by')
      .eq('id', requestId)
      .single();

    if (error) throw error;

    const stakeholders: NotificationRecipient[] = [];

    // Buscar coordenador que criou a solicitação
    if (request.requested_by) {
      const coordinator = await getUserById(request.requested_by);
      if (coordinator) stakeholders.push(coordinator);
    }

    // Buscar gerente que aprovou (se approved_by for um nome, buscar por nome)
    if (request.approved_by) {
      const { data: approver, error: approverError } = await supabase
        .from('rh_users')
        .select('email, full_name, role')
        .eq('full_name', request.approved_by)
        .single();

      if (!approverError && approver) {
        stakeholders.push({
          email: approver.email,
          name: approver.full_name,
          role: approver.role
        });
      }
    }

    return stakeholders;
  } catch (error) {
    console.error('Erro ao buscar stakeholders:', error);
    return [];
  }
};

/**
 * Busca RH responsável por um candidato (baseado na vaga/região)
 */
export const getRHByCandidate = async (candidateId: string): Promise<NotificationRecipient[]> => {
  try {
    // Buscar dados do candidato e vaga
    const { data: candidate, error } = await supabase
      .from('candidates')
      .select(`
        *,
        job:jobs(city, state)
      `)
      .eq('id', candidateId)
      .single();

    if (error) throw error;

    const state = candidate.state || candidate.job?.state;
    const city = candidate.city || candidate.job?.city;

    if (!state || !city) {
      console.warn('Estado/cidade não encontrados para candidato:', candidateId);
      return [];
    }

    return await getRHByRegion(state, city);
  } catch (error) {
    console.error('Erro ao buscar RH por candidato:', error);
    return [];
  }
};
