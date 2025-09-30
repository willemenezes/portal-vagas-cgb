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

    let query = supabase
        .from('candidates')
        .select('applied_date, status, city, state');

    const fromDate = dateRange?.from ?? addDays(new Date(), -180);
    const toDate = dateRange?.to ?? new Date();

    query = query.gte('created_at', fromDate.toISOString());
    query = query.lte('created_at', toDate.toISOString());

    const { data: allCandidatesData, error: candidatesError } = await query;
    if (candidatesError) throw candidatesError;

    let allCandidates = allCandidatesData || [];

    // Aplicar filtro por região, a menos que seja admin, jurídico ou gerência
    const unrestrictedRoles = ['admin', 'juridico', 'manager'];
    if (!unrestrictedRoles.includes(rhProfile.role)) {
        allCandidates = allCandidates.filter(candidate => {
            if (!candidate) return false;
            const hasState = candidate.state;
            const hasCity = candidate.city;

            if (rhProfile.assigned_states && rhProfile.assigned_states.length > 0) {
                return hasState && rhProfile.assigned_states.includes(candidate.state as string);
            }
            if (rhProfile.assigned_cities && rhProfile.assigned_cities.length > 0) {
                return hasCity && rhProfile.assigned_cities.includes(candidate.city as string);
            }
            // Se chegou aqui, o usuário não tem atribuições específicas
            // Recrutadores sem atribuições NÃO devem ver dados no dashboard
            return false;
        });
    }

    // Contabiliza apenas vagas realmente visíveis/ativas no sistema
    // status = 'active' | approval_status = 'active' | flow_status = 'ativa'
    let jobsQuery = supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('approval_status', 'active')
        .eq('flow_status', 'ativa');
    if (!unrestrictedRoles.includes(rhProfile.role)) {
        if (rhProfile.assigned_states && rhProfile.assigned_states.length > 0) {
            jobsQuery = jobsQuery.in('state', rhProfile.assigned_states);
        } else if (rhProfile.assigned_cities && rhProfile.assigned_cities.length > 0) {
            jobsQuery = jobsQuery.in('city', rhProfile.assigned_cities);
        }
    }
    const { count: totalJobs, error: jobsError } = await jobsQuery;
    if (jobsError) throw jobsError;

    const totalCandidates = allCandidates.length;
    const statusCounts = allCandidates.reduce((acc, candidate) => {
        if (candidate?.status) {
            const status = candidate.status;
            acc[status] = (acc[status] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const approvedCount = statusCounts['Aprovado'] || 0;
    const conversionRate = totalCandidates > 0 ? Math.round((approvedCount / totalCandidates) * 100) : 0;

    const statusData: StatusData[] = [
        { name: "Pendentes", value: statusCounts['Cadastrado'] || 0 },
        { name: "Entrevista", value: (statusCounts['Entrevista com RH'] || 0) + (statusCounts['Entrevista com Gestor'] || 0) },
        { name: "Aprovados", value: approvedCount },
        { name: "Rejeitados", value: statusCounts['Reprovado'] || 0 },
    ];

    const funnelData: FunnelData[] = [
        { name: 'Cadastrado', value: totalCandidates, fill: 'hsl(220, 80%, 60%)' },
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

    return { totalCandidates, totalJobs: totalJobs || 0, conversionRate, approvedCount, statusData, topCities, funnelData, weeklyData };
};

export const useDashboardData = (rhProfile: RHUser | null, dateRange?: DateRange) => {
    return useQuery({
        queryKey: ['dashboardData', rhProfile?.user_id, dateRange],
        queryFn: () => fetchDashboardData(rhProfile, dateRange),
        enabled: !!rhProfile, // A query só será executada se o perfil do RH estiver carregado
        staleTime: 5 * 60 * 1000, // 5 minutos
        refetchOnWindowFocus: true, // Atualiza quando o usuário volta para a aba
    });
}; 