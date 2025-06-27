import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  Funnel,
  FunnelChart,
  Tooltip,
  LabelList
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  FileText,
  Clock,
  Target,
  Award,
  Calendar as CalendarIcon,
  MapPin,
  Loader2,
  PieChart as PieChartIcon,
  BarChart2,
  Timer,
  Trophy,
  CheckCircle,
  SlidersHorizontal,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRHProfile } from "@/hooks/useRH";
import ErrorBoundary from "@/components/ErrorBoundary";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, addDays, subMonths } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

const chartConfig = {
  aplicacoes: {
    label: "Aplicações",
    color: "hsl(var(--cgb-primary-hue) 70% 50%)",
  },
  aprovados: {
    label: "Aprovados",
    color: "hsl(220 80% 60%)",
  },
  rejeitados: {
    label: "Rejeitados",
    color: "hsl(0 80% 60%)",
  },
  pendentes: {
    label: "Pendentes",
    color: "hsl(30 90% 50%)",
  },
  interview: {
    label: "Entrevista",
    color: "hsl(260 80% 60%)",
  }
};

// Interfaces para tipagem dos dados
interface DashboardStats {
  totalCandidates: number;
  totalJobs: number;
  totalResumes: number;
  conversionRate: number;
  approvedCount: number;
}

interface WeeklyData {
  date: string;
  day: string;
  aplicacoes: number;
}

interface StatusData {
  name: string;
  value: number;
  color: string;
  icon: React.ElementType;
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

interface AnalyticsStats {
  avgTimeToHire: number;
  hiresThisMonth: number;
}

interface MonthlyHireData {
  month: string;
  contratacoes: number;
}

interface JobApprovalStats {
  approved: number;
  rejected: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { data: rhProfile, isLoading: isProfileLoading } = useRHProfile(user?.id);

  // Estados para os dados do dashboard
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalCandidates: 0,
    totalJobs: 0,
    totalResumes: 0,
    conversionRate: 0,
    approvedCount: 0
  });
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [topCities, setTopCities] = useState<CityData[]>([]);
  const [analyticsStats, setAnalyticsStats] = useState<AnalyticsStats>({ avgTimeToHire: 0, hiresThisMonth: 0 });
  const [funnelData, setFunnelData] = useState<FunnelData[]>([]);
  const [monthlyHires, setMonthlyHires] = useState<MonthlyHireData[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -180),
    to: new Date(),
  });
  const [jobStats, setJobStats] = useState<JobApprovalStats>({ approved: 0, rejected: 0 });

  useEffect(() => {
    let isMounted = true;

    if (isProfileLoading || !rhProfile) {
      return;
    }

    const fetchDashboardData = async (dateRange?: DateRange) => {
      try {
        if (isMounted) setLoading(true);

        let query = supabase
          .from('candidates')
          .select('applied_date, status, city, state');

        if (dateRange?.from) {
          query = query.gte('created_at', dateRange.from.toISOString());
        }
        if (dateRange?.to) {
          query = query.lte('created_at', dateRange.to.toISOString());
        }

        const { data: allCandidatesData, error: candidatesError } = await query;

        if (!isMounted) return;
        if (candidatesError) throw candidatesError;

        let allCandidates = allCandidatesData || [];

        // Aplicar filtro por região se não for admin
        if (rhProfile && !rhProfile.is_admin) {
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
            return true;
          });
        }

        let jobsQuery = supabase.from('jobs').select('*', { count: 'exact', head: true });

        if (rhProfile && !rhProfile.is_admin) {
          if (rhProfile.assigned_states && rhProfile.assigned_states.length > 0) {
            jobsQuery = jobsQuery.in('state', rhProfile.assigned_states);
          } else if (rhProfile.assigned_cities && rhProfile.assigned_cities.length > 0) {
            jobsQuery = jobsQuery.in('city', rhProfile.assigned_cities);
          }
        }

        const { count: totalJobs, error: jobsError } = await jobsQuery;

        if (!isMounted) return;
        if (jobsError) throw jobsError;

        const totalCandidates = allCandidates.length;
        const statusCounts = allCandidates.reduce((acc, candidate) => {
          if (candidate?.status) {
            const status = candidate.status;
            acc[status] = (acc[status] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

        const approvedCount = statusCounts.approved || 0;
        const conversionRate = totalCandidates > 0 ? Math.round((approvedCount / totalCandidates) * 100) : 0;

        const statusDataArray: StatusData[] = [
          { name: "Pendentes", value: statusCounts.pending || 0, color: chartConfig.pendentes.color, icon: Clock },
          { name: "Entrevista", value: statusCounts.interview || 0, color: chartConfig.interview.color, icon: Users },
          { name: "Aprovados", value: approvedCount, color: chartConfig.aprovados.color, icon: Award },
          { name: "Rejeitados", value: statusCounts.rejected || 0, color: chartConfig.rejeitados.color, icon: TrendingDown },
        ];

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

        const weeklyDataArray = last7Days.map(date => {
          const dateString = date.toISOString().split('T')[0];
          return {
            date: dateString,
            day: date.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3),
            aplicacoes: dailyCounts[dateString] || 0
          };
        });

        const cityCounts = allCandidates.reduce((acc, candidate) => {
          const city = candidate.city?.trim();
          if (city) {
            acc[city] = (acc[city] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

        const cityColors = ["#6A0B27", "#9E2A47", "#D25C6C", "#F58D90", "#FABFC2"];
        const sortedCities = Object.entries(cityCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([name, value], index) => ({
            name,
            value,
            fill: cityColors[index]
          }));

        // Busca de todas as vagas para estatísticas
        const { data: allJobsData, error: allJobsError } = await supabase.from('jobs').select('approval_status');
        if (!isMounted) return;
        if (allJobsError) throw allJobsError;

        const approvedJobs = allJobsData?.filter(j => j.approval_status === 'active').length || 0;
        const rejectedJobs = allJobsData?.filter(j => j.approval_status === 'rejected').length || 0;
        if (isMounted) {
          setJobStats({ approved: approvedJobs, rejected: rejectedJobs });
        }

        if (isMounted) {
          setStats({
            totalCandidates,
            totalJobs: totalJobs || 0,
            totalResumes: 0,
            conversionRate,
            approvedCount
          });
          setStatusData(statusDataArray.filter(s => s.value > 0));
          setWeeklyData(weeklyDataArray);
          setTopCities(sortedCities);
        }

      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const fetchAnalyticsData = async (dateRange?: DateRange) => {
      try {
        let notesQuery = supabase
          .from('candidate_notes')
          .select('candidate_id, created_at, note')
          .eq('activity_type', 'Mudança de Status' as any);
        let jobsQuery = supabase.from('jobs').select('id, created_at');
        let candidatesQuery = supabase.from('candidates').select('id, created_at, job_id, status');

        if (dateRange?.from) {
          notesQuery = notesQuery.gte('created_at', dateRange.from.toISOString());
          jobsQuery = jobsQuery.gte('created_at', dateRange.from.toISOString());
          candidatesQuery = candidatesQuery.gte('created_at', dateRange.from.toISOString());
        }
        if (dateRange?.to) {
          notesQuery = notesQuery.lte('created_at', dateRange.to.toISOString());
          jobsQuery = jobsQuery.lte('created_at', dateRange.to.toISOString());
          candidatesQuery = candidatesQuery.lte('created_at', dateRange.to.toISOString());
        }

        const [{ data: notes }, { data: jobs }, { data: candidates }] = await Promise.all([
          notesQuery,
          jobsQuery,
          candidatesQuery
        ]);

        if (!isMounted) return;

        const safeNotes = (notes || []) as any[];
        const safeJobs = (jobs || []) as any[];
        const safeCandidates = (candidates || []) as any[];

        const approvedCandidates = safeCandidates.filter(c => c.status === 'Aprovado');
        let totalDays = 0;
        let hiresCount = 0;
        const jobCreationMap = new Map(safeJobs.map(job => [job.id, new Date(job.created_at)]));

        approvedCandidates.forEach(candidate => {
          const jobCreationDate = jobCreationMap.get(candidate.job_id);
          const approvalNote = safeNotes.find(n => n.candidate_id === candidate.id && n.note && n.note.includes('Aprovado'));
          const approvalDate = approvalNote ? new Date(approvalNote.created_at) : new Date();

          if (jobCreationDate) {
            const timeDiff = approvalDate.getTime() - jobCreationDate.getTime();
            totalDays += timeDiff / (1000 * 3600 * 24);
            hiresCount++;
          }
        });
        const avgTimeToHire = hiresCount > 0 ? Math.round(totalDays / hiresCount) : 0;

        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const hiresThisMonth = approvedCandidates.filter(c => {
          const approvalNote = safeNotes.find(n => n.candidate_id === c.id && n.note && n.note.includes('Aprovado'));
          return approvalNote && new Date(approvalNote.created_at) > oneMonthAgo;
        }).length;

        const funnelSteps = ["Cadastrado", "Análise de Currículo", "Pré-selecionado", "Em Entrevista", "Teste Técnico", "Aguardando Retorno", "Aprovado"];
        const funnelColors = ["#8884d8", "#83a6ed", "#8dd1e1", "#82ca9d", "#a4de6c", "#d0ed57", "#ffc658"];
        const candidateStages = new Map<string, Set<string>>();

        safeNotes.forEach(note => {
          if (note?.note) {
            const stage = funnelSteps.find(step => note.note.includes(step));
            if (stage) {
              if (!candidateStages.has(stage)) {
                candidateStages.set(stage, new Set());
              }
              candidateStages.get(stage)!.add(note.candidate_id);
            }
          }
        });
        candidateStages.set("Cadastrado", new Set(safeCandidates.map(c => c.id)));

        const funnelDataResult = funnelSteps.map((step, index) => ({
          name: step,
          value: candidateStages.get(step)?.size || 0,
          fill: funnelColors[index],
        })).filter(d => d.value > 0);

        const hiresByMonth: Record<string, number> = {};
        const sixMonthsAgo = subMonths(new Date(), 5);
        sixMonthsAgo.setDate(1);

        approvedCandidates.forEach(c => {
          const approvalNote = safeNotes.find(n => n.candidate_id === c.id && n.note && n.note.includes('Aprovado'));
          if (approvalNote) {
            const approvalDate = new Date(approvalNote.created_at);
            if (approvalDate >= sixMonthsAgo) {
              const month = format(approvalDate, 'MMM/yy', { locale: ptBR });
              hiresByMonth[month] = (hiresByMonth[month] || 0) + 1;
            }
          }
        });

        const last6Months: string[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          last6Months.push(format(d, 'MMM/yy', { locale: ptBR }));
        }

        const monthlyHiresData = last6Months.map(month => ({
          month,
          contratacoes: hiresByMonth[month] || 0,
        }));

        if (isMounted) {
          setAnalyticsStats({ avgTimeToHire, hiresThisMonth });
          setFunnelData(funnelDataResult);
          setMonthlyHires(monthlyHiresData);
        }

      } catch (error) {
        console.error("Erro ao buscar dados analíticos:", error);
      }
    };

    fetchDashboardData(dateRange);
    fetchAnalyticsData(dateRange);

    return () => {
      isMounted = false;
    };
  }, [rhProfile, dateRange, isProfileLoading]);

  // Função para obter a data atual formatada
  const getCurrentDate = () => {
    const now = new Date();
    return now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  if (loading || isProfileLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-cgb-primary" />
        <span className="ml-2 text-gray-600">Carregando dashboard...</span>
      </div>
    );
  }

  // Renderização padrão para Admin e Recrutador
  return (
    <div className="space-y-8">
      {/* Header do Dashboard */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Dashboard de Acompanhamento
          </h2>
          <div className="space-y-1 mt-2">
            <p className="text-lg text-gray-600">
              Insights e métricas em tempo real
            </p>
            {rhProfile && typeof rhProfile === 'object' && 'is_admin' in rhProfile && !rhProfile.is_admin && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span className="text-blue-600 font-medium">
                  Dados filtrados por região: {
                    'assigned_states' in rhProfile && rhProfile.assigned_states && Array.isArray(rhProfile.assigned_states) && rhProfile.assigned_states.length > 0
                      ? `Estados: ${rhProfile.assigned_states.join(', ')}`
                      : 'assigned_cities' in rhProfile && rhProfile.assigned_cities && Array.isArray(rhProfile.assigned_cities) && rhProfile.assigned_cities.length > 0
                        ? `Cidades: ${rhProfile.assigned_cities.join(', ')}`
                        : 'Todas as regiões'
                  }
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[300px] justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Selecione uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* KPIs Cards com dados reais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total de Vagas */}
        <Card className="bg-blue-100 border-blue-200 text-blue-900 transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vagas Abertas</CardTitle>
            <Briefcase className="w-4 h-4 text-blue-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalJobs}</div>
            <p className="text-xs text-blue-800/80">Total de vagas ativas</p>
          </CardContent>
        </Card>

        {/* Total de Candidatos */}
        <Card className="bg-purple-100 border-purple-200 text-purple-900 transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Candidatos</CardTitle>
            <Users className="w-4 h-4 text-purple-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCandidates}</div>
            <p className="text-xs text-purple-800/80">Candidatos no banco de talentos</p>
          </CardContent>
        </Card>
        {/* Aprovados */}
        <Card className="bg-green-100 border-green-200 text-green-900 transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Candidatos Aprovados</CardTitle>
            <Award className="w-4 h-4 text-green-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedCount}</div>
            <p className="text-xs text-green-800/80">Contratados através do portal</p>
          </CardContent>
        </Card>
        {/* Taxa de Conversão */}
        <Card className="bg-cgb-primary/10 border-cgb-primary/20 text-cgb-primary-dark transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Target className="w-4 h-4 text-cgb-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <p className="text-xs text-cgb-primary/80">De candidatos para aprovados</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-100 border-orange-200 text-orange-900 transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio de Contratação</CardTitle>
            <Timer className="w-4 h-4 text-orange-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsStats.avgTimeToHire} dias</div>
            <p className="text-xs text-orange-800/80">Desde a criação da vaga</p>
          </CardContent>
        </Card>
        <Card className="bg-teal-100 border-teal-200 text-teal-900 transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Contratações no Mês</CardTitle>
            <Trophy className="w-4 h-4 text-teal-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsStats.hiresThisMonth}</div>
            <p className="text-xs text-teal-800/80">Novos talentos aprovados</p>
          </CardContent>
        </Card>
        {/* Card de Vagas Aprovadas */}
        <Card className="bg-cyan-100 border-cyan-200 text-cyan-900 transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vagas Aprovadas</CardTitle>
            <ThumbsUp className="w-4 h-4 text-cyan-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobStats.approved}</div>
            <p className="text-xs text-cyan-800/80">Requisições de vagas aceitas</p>
          </CardContent>
        </Card>
        {/* Card de Vagas Rejeitadas */}
        <Card className="bg-rose-100 border-rose-200 text-rose-900 transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vagas Rejeitadas</CardTitle>
            <ThumbsDown className="w-4 h-4 text-rose-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobStats.rejected}</div>
            <p className="text-xs text-rose-800/80">Requisições de vagas devolvidas</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos com dados reais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Contratações Mensais (Substituindo o de Cidades) */}
        <ErrorBoundary fallbackMessage="Não foi possível carregar o gráfico de contratações.">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-cgb-primary" />
                Contratações nos Últimos 6 Meses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyHires.some(d => d.contratacoes > 0) ? (
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyHires} margin={{ top: 20, right: 20, bottom: 5, left: -15 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} />
                      <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={30} />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
                      />
                      <Bar dataKey="contratacoes" name="Contratações" fill="#6A0B27" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center text-center text-gray-500">
                  <BarChart2 className="w-12 h-12 mb-4 text-gray-300" />
                  <h3 className="font-semibold text-lg">Sem dados de contratação</h3>
                  <p className="text-sm">As contratações mensais aparecerão aqui.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </ErrorBoundary>

        {/* Gráfico de Funil de Conversão */}
        <ErrorBoundary fallbackMessage="Não foi possível carregar o funil de conversão.">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-cgb-primary" />
                Funil de Conversão de Candidatos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {funnelData.length > 0 ? (
                <ChartContainer config={{}} className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <FunnelChart margin={{ top: 20, right: 160, left: 20, bottom: 5 }}>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.9)",
                          backdropFilter: "blur(4px)",
                          border: "1px solid #e2e8f0",
                          borderRadius: "0.5rem",
                        }}
                      />
                      <Funnel dataKey="value" data={funnelData} isAnimationActive neckWidth={60} neckHeight={50}>
                        <LabelList
                          position="right"
                          dataKey="name"
                          stroke="none"
                          style={{ fill: '#374151', fontWeight: 500 }}
                          formatter={(name: string) => {
                            const entry = funnelData.find(d => d.name === name);
                            return `${name} (${entry?.value || 0})`;
                          }}
                        />
                      </Funnel>
                    </FunnelChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center text-center text-gray-500">
                  <SlidersHorizontal className="w-12 h-12 mb-4 text-gray-300" />
                  <h3 className="font-semibold text-lg">Dados insuficientes para o funil</h3>
                  <p className="text-sm">O funil aparecerá quando houver movimentação de candidatos.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </ErrorBoundary>

        {/* Gráfico de Aplicações da Semana */}
        <ErrorBoundary fallbackMessage="Não foi possível carregar o gráfico de aplicações.">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-cgb-primary" />
                Aplicações da Última Semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weeklyData.reduce((sum, day) => sum + day.aplicacoes, 0) > 0 ? (
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
                      />
                      <Bar dataKey="aplicacoes" fill="#6A0B27" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center text-center text-gray-500">
                  <CalendarIcon className="w-12 h-12 mb-4 text-gray-300" />
                  <h3 className="font-semibold text-lg">Sem aplicações recentes</h3>
                  <p className="text-sm">Os dados aparecerão aqui quando novos candidatos se aplicarem.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </ErrorBoundary>
      </div>

      {/* Ações do Dashboard */}
      <div className="flex justify-center">
        <Card className="bg-white border border-gray-200 shadow-lg">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Dashboard Atualizado em Tempo Real
              </h3>
              <p className="text-gray-600 mb-4">
                Os dados são atualizados automaticamente conforme novas informações são inseridas na plataforma.
              </p>
              <button
                onClick={() => {
                  fetchDashboardData(dateRange);
                }}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-cgb-primary hover:bg-cgb-primary-dark text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    Atualizar Dados
                  </>
                )}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
