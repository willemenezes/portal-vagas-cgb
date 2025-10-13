import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DateRange } from "react-day-picker";
import { RHUser } from "./useRH";
import { addDays } from "date-fns";

// Interfaces para tipagem dos dados
export interface DashboardStats {
    totalCandidates: number;
    totalJobs: number;
    conversionRate: number;
    approvedCount: number;
    statusData: StatusData[];
    topCities: CityData[];
    funnelData: FunnelData[];
    weeklyData: WeeklyData[];
}

interface WeeklyData {
    date: string;
    day: string;
    aplicacoes: number;
}

interface StatusData {
    name: string;
    value: number;
}

interface CityData {
    name: string;
    value: number;
    fill: string;
}

interface FunnelData {
    name: string;
    value: number;
    fill: string;
}

const fetchDashboardData = async (rhProfile: RHUser | null, dateRange?: DateRange) => {
    if (!rhProfile) {
        throw new Error("Perfil do usuário não carregado.");
    }

    // CORREÇÃO CRÍTICA: Usar filtro de data APENAS se o usuário selecionou um período
    // Se não selecionou, mostrar TODOS os candidatos (sem filtro de data)
    const fromDate = dateRange?.from;
    const toDate = dateRange?.to;
    const hasDateFilter = fromDate && toDate;

    console.log('📅 [useDashboardData] Filtro de data:', hasDateFilter ? `${fromDate} até ${toDate}` : 'TODOS OS PERÍODOS');

    // BUG FIX: Para recrutador, precisamos buscar os dados para filtrar por região
    // Para admin, usamos count('exact') direto
    let totalCandidates = 0;

    if (rhProfile && rhProfile.role === 'recruiter' &&
        (rhProfile.assigned_states?.length || rhProfile.assigned_cities?.length)) {
        // Recrutador: buscar dados para filtrar
        let candidatesForCountQuery = supabase
            .from('candidates')
            .select('state, city');

        // Aplicar filtro de data APENAS se selecionado
        if (hasDateFilter) {
            candidatesForCountQuery = candidatesForCountQuery
                .gte('created_at', fromDate.toISOString())
                .lte('created_at', toDate.toISOString());
        }

        const { data: candidatesForCount, error: countError } = await candidatesForCountQuery;
        if (countError) throw countError;

        // Filtrar por região
        const filtered = (candidatesForCount || []).filter(candidate => {
            const assignedStates = rhProfile.assigned_states || [];
            const assignedCities = rhProfile.assigned_cities || [];

            const matchState = assignedStates.length === 0 || assignedStates.includes(candidate.state || '');
            const matchCity = assignedCities.length === 0 || assignedCities.includes(candidate.city || '');

            return matchState && matchCity;
        });

        totalCandidates = filtered.length;
    } else {
        // Admin: usar count('exact') direto
        let countQuery = supabase
            .from('candidates')
            .select('id', { count: 'exact', head: true });

        // Aplicar filtro de data APENAS se selecionado
        if (hasDateFilter) {
            countQuery = countQuery
                .gte('created_at', fromDate.toISOString())
                .lte('created_at', toDate.toISOString());
        }

        const { count, error: countError } = await countQuery;
        if (countError) throw countError;
        totalCandidates = count || 0;
    }

    console.log('✅ [useDashboardData] Total de candidatos:', totalCandidates);

    // CORREÇÃO CRÍTICA: Buscar TODOS os candidatos em lotes para não ocultar dados
    console.log('🔄 [useDashboardData] Buscando TODOS os candidatos para gráficos (SEM LIMITES - até 200.000)...');

    let allCandidates: any[] = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
        let candidatesQuery = supabase
            .from('candidates')
            .select('applied_date, status, city, state')
            .range(from, from + batchSize - 1);

        // Aplicar filtro de data APENAS se selecionado
        if (hasDateFilter) {
            candidatesQuery = candidatesQuery
                .gte('created_at', fromDate!.toISOString())
                .lte('created_at', toDate!.toISOString());
        }

        const { data, error } = await candidatesQuery;

        if (error) {
            console.error("❌ Erro ao buscar candidatos para dashboard:", error);
            throw error;
        }

        if (data && data.length > 0) {
            allCandidates = [...allCandidates, ...data];
            console.log(`📥 Dashboard - Lote ${Math.floor(from / batchSize) + 1}: ${data.length} candidatos (Total: ${allCandidates.length})`);
            from += batchSize;

            if (data.length < batchSize) {
                hasMore = false;
            }
        } else {
            hasMore = false;
        }

        // Limite de segurança para evitar loops infinitos - AUMENTADO para suportar grande volume
        if (from >= 200000) {
            console.warn('⚠️ Limite de segurança atingido (200.000 candidatos)');
            hasMore = false;
        }
    }

    console.log(`✅ [useDashboardData] ${allCandidates.length} candidatos carregados para gráficos`);

    // BUG FIX: Filtro por região para RECRUTADOR (reativado e corrigido)
    if (rhProfile && rhProfile.role === 'recruiter') {
        const assignedStates = rhProfile.assigned_states || [];
        const assignedCities = rhProfile.assigned_cities || [];

        if (assignedStates.length > 0 || assignedCities.length > 0) {
            allCandidates = allCandidates.filter(candidate => {
                const candidateState = candidate.state;
                const candidateCity = candidate.city;

                const matchState = assignedStates.length === 0 || assignedStates.includes(candidateState || '');
                const matchCity = assignedCities.length === 0 || assignedCities.includes(candidateCity || '');

                return matchState && matchCity;
            });
        }
    }

    // Contabiliza apenas vagas realmente visíveis/ativas no sistema
    // status = 'active' | approval_status = 'active' | flow_status = 'ativa'
    let totalJobs = 0;

    if (rhProfile && rhProfile.role === 'recruiter' &&
        (rhProfile.assigned_states?.length || rhProfile.assigned_cities?.length)) {
        // Recrutador: buscar vagas para filtrar por região
        let jobsForFilterQuery = supabase
            .from('jobs')
            .select('state, city')
            .eq('status', 'active')
            .eq('approval_status', 'active')
            .eq('flow_status', 'ativa');

        const { data: jobsForFilter, error: jobsError } = await jobsForFilterQuery;
        if (jobsError) throw jobsError;

        // Filtrar por região
        const filteredJobs = (jobsForFilter || []).filter(job => {
            const assignedStates = rhProfile.assigned_states || [];
            const assignedCities = rhProfile.assigned_cities || [];

            const matchState = assignedStates.length === 0 || assignedStates.includes(job.state || '');
            const matchCity = assignedCities.length === 0 || assignedCities.includes(job.city || '');

            return matchState && matchCity;
        });

        totalJobs = filteredJobs.length;
    } else {
        // Admin: usar count('exact') direto
        let jobsQuery = supabase
            .from('jobs')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'active')
            .eq('approval_status', 'active')
            .eq('flow_status', 'ativa');

        const { count, error: jobsError } = await jobsQuery;
        if (jobsError) throw jobsError;
        totalJobs = count || 0;
    }

    const statusCounts = allCandidates.reduce((acc, candidate) => {
        if (candidate?.status) {
            const status = candidate.status;
            acc[status] = (acc[status] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const approvedCount = statusCounts['Aprovado'] || 0;
    // BUG FIX: totalCandidates agora vem do count('exact'), não do array.length
    const conversionRate = (totalCandidates || 0) > 0 ? Math.round((approvedCount / (totalCandidates || 1)) * 100) : 0;

    const statusData: StatusData[] = [
        { name: "Pendentes", value: statusCounts['Cadastrado'] || 0 },
        { name: "Entrevista", value: (statusCounts['Entrevista com RH'] || 0) + (statusCounts['Entrevista com Gestor'] || 0) },
        { name: "Aprovados", value: approvedCount },
        { name: "Rejeitados", value: statusCounts['Reprovado'] || 0 },
    ];

    const funnelData: FunnelData[] = [
        { name: 'Cadastrado', value: totalCandidates || 0, fill: 'hsl(220, 80%, 60%)' },
        { name: 'Análise de Currículo', value: statusCounts['Análise de Currículo'] || 0, fill: 'hsl(225, 75%, 65%)' },
        { name: 'Entrevista com RH', value: statusCounts['Entrevista com RH'] || 0, fill: 'hsl(230, 70%, 70%)' },
        { name: 'Entrevista com Gestor', value: statusCounts['Entrevista com Gestor'] || 0, fill: 'hsl(240, 65%, 75%)' },
        { name: 'Aprovado', value: approvedCount, fill: 'hsl(140, 80%, 60%)' },
    ].filter(item => item.value > 0);

    const cityCounts = allCandidates.reduce((acc, candidate) => {
        if (candidate.city) {
            acc[candidate.city] = (acc[candidate.city] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const topCities: CityData[] = Object.entries(cityCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, value], index) => ({
            name,
            value,
            fill: `hsl(220, 70%, ${75 - index * 10}%)`,
        }));

    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        return d;
    }).reverse();

    const dailyCounts = allCandidates.reduce((acc, candidate) => {
        if (candidate?.applied_date) {
            const appliedDate = new Date(candidate.applied_date).toISOString().split('T')[0];
            acc[appliedDate] = (acc[appliedDate] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const weeklyData = last7Days.map(date => {
        const dateString = date.toISOString().split('T')[0];
        return {
            date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            day: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
            aplicacoes: dailyCounts[dateString] || 0,
        };
    });

    return {
        totalCandidates: totalCandidates,
        totalJobs: totalJobs,
        conversionRate,
        approvedCount,
        statusData,
        topCities,
        funnelData,
        weeklyData
    };
};

export const useDashboardData = (rhProfile: RHUser | null, dateRange?: DateRange) => {
    return useQuery({
        queryKey: ['dashboardData', 'unlimited', 'v5', 'all-periods', rhProfile?.user_id, dateRange], // CORREÇÃO CRÍTICA: Nova queryKey v5 - sem limite de data padrão
        queryFn: () => fetchDashboardData(rhProfile, dateRange),
        enabled: !!rhProfile, // A query só será executada se o perfil do RH estiver carregado
        staleTime: 2 * 60 * 1000, // 2 minutos (reduzido para atualizações mais frequentes)
        refetchOnWindowFocus: true, // Atualiza quando o usuário volta para a aba
    });
}; 