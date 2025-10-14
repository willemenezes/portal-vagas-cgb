import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import {
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
  LabelList,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import {
  TrendingUp,
  Users,
  Briefcase,
  FileText,
  Clock,
  Award,
  Calendar as CalendarIcon,
  MapPin,
  Loader2,
  PieChart as PieChartIcon,
  BarChart2,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  SlidersHorizontal
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRHProfile } from "@/hooks/useRH";
import ErrorBoundary from "@/components/ErrorBoundary";
import ExpiryDashboard from "./ExpiryDashboard";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useDashboardData } from "@/hooks/useDashboardData";
import { checkMissingCities } from "@/utils/checkMissingCities";

// Paleta moderna solicitada
const COLORS = {
  cobalt: '#2563EB',
  cobaltLight: 'rgba(37,99,235,0.15)',
  green: '#22C55E',
  red: '#EF4444',
  grayBg: '#F9FAFB',
  gray: '#94A3B8',
};

const chartConfig = {
  aplicacoes: {
    label: "Aplicações",
    color: "hsl(220 80% 60%)", // Azul
  },
  aprovados: {
    label: "Aprovados",
    color: "hsl(140 80% 60%)", // Verde
  },
  rejeitados: {
    label: "Rejeitados",
    color: "hsl(0 80% 60%)", // Vermelho
  },
  pendentes: {
    label: "Pendentes",
    color: "hsl(40 90% 60%)", // Laranja/Amarelo
  },
  entrevista: { // Corrigido de 'interview' para 'entrevista'
    label: "Entrevista",
    color: "hsl(260 80% 70%)", // Roxo
  }
};

const Dashboard = () => {
  const { user } = useAuth();
  const { data: rhProfile } = useRHProfile(user?.id);

  // CORREÇÃO CRÍTICA: Iniciar SEM filtro de data para mostrar TODOS os candidatos
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const { data: dashboardData, isLoading, isError, error } = useDashboardData(rhProfile, dateRange);

  // Executar verificação de cidades faltantes (apenas em desenvolvimento)
  useEffect(() => {
    if (import.meta.env.DEV) {
      checkMissingCities();
    }
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-10 h-10 animate-spin text-cgb-primary" /></div>;
  }

  if (isError) {
    return <div className="text-red-500">Erro ao carregar dados do dashboard: {error.message}</div>;
  }

  if (!dashboardData) {
    return <div className="text-center p-8">Nenhum dado disponível para o período ou perfil selecionado.</div>;
  }

  const {
    totalCandidates,
    totalJobs,
    conversionRate,
    approvedCount,
    statusData,
    topCities,
    funnelData,
    weeklyData,
    averageHiringTime
  } = dashboardData;

  // Adicionado filtro para remover status com 0 candidatos e aplicar paleta
  const statusColorMap: Record<string, string> = {
    'Pendentes': COLORS.gray,
    'Entrevista': COLORS.cobalt,
    'Aprovados': COLORS.green,
    'Rejeitados': COLORS.red,
    'Cadastrado': COLORS.gray,
    'Análise de Currículo': COLORS.cobalt,
    'Entrevista com RH': COLORS.cobalt,
    'Entrevista com Gestor': COLORS.cobalt,
    'Contratado': COLORS.green,
  };
  const statusDataFormatted = statusData.filter(item => item.value > 0).map(item => ({
    ...item,
    color: statusColorMap[item.name] || COLORS.gray,
    icon: item.name === 'Pendentes' ? Clock : item.name === 'Entrevista' ? Users : item.name === 'Aprovados' ? Award : ThumbsDown
  }));

  // Percentuais do funil (horizontal)
  const totalFunnel = funnelData?.[0]?.value || 0;
  const funnelPercentData = (funnelData || []).map(step => ({
    ...step,
    percent: totalFunnel ? Math.round((step.value / totalFunnel) * 100) : 0,
  }));

  // Função para obter a data atual formatada
  const getCurrentDate = () => {
    const now = new Date();
    return now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Date Range Picker */}
        <div className="flex justify-end">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
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
                      {format(dateRange.from, "LLL dd, y", { locale: ptBR })} -{" "}
                      {format(dateRange.to, "LLL dd, y", { locale: ptBR })}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y", { locale: ptBR })
                  )
                ) : (
                  <span>Escolha um período</span>
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
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
        {/* Resumo Geral */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white border border-gray-200 rounded-2xl shadow-soft transition-all hover:shadow-medium hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Candidatos</CardTitle>
              <Users className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCandidates}</div>
              <p className="text-xs text-indigo-800/80">{dateRange?.from && dateRange?.to ? 'no período selecionado' : 'de todos os tempos'}</p>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-200 rounded-2xl shadow-soft transition-all hover:shadow-medium hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Vagas</CardTitle>
              <Briefcase className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalJobs}</div>
              <p className="text-xs text-blue-800/80">ativas na sua região</p>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-200 rounded-2xl shadow-soft transition-all hover:shadow-medium hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Candidatos Aprovados</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedCount}</div>
              <p className="text-xs text-green-800/80">{dateRange?.from && dateRange?.to ? 'contratados no período' : 'contratados (total)'}</p>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-200 rounded-2xl shadow-soft transition-all hover:shadow-medium hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <TrendingUp className="h-4 w-4 text-teal-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversionRate}%</div>
              <p className="text-xs text-teal-800/80">{approvedCount} aprovados de {totalCandidates} candidatos</p>
            </CardContent>
          </Card>
        </div>

        {/* Card adicional de Tempo Médio de Contratação */}
        {averageHiringTime > 0 && (
          <div className="grid gap-6 md:grid-cols-1">
            <Card className="bg-white border border-gray-200 rounded-2xl shadow-soft transition-all hover:shadow-medium hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tempo Médio de Contratação</CardTitle>
                <Clock className="h-4 w-4 text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageHiringTime} dias</div>
                <p className="text-xs text-gray-600">da criação da vaga à contratação</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Dashboard de Validade das Vagas */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="h-5 w-5 text-cgb-primary" />
            Controle de Validade das Vagas
          </h2>
          <ExpiryDashboard
            stats={dashboardData?.expiryStats}
            isLoading={isLoading}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Status dos Candidatos */}
          <Card className="bg-white border border-gray-200 rounded-2xl shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChartIcon className="h-5 w-5 mr-2" />
                Status dos Candidatos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Tooltip
                    cursor={false}
                    formatter={(value, name) => [value, name]}
                  />
                  <Pie data={statusDataFormatted} dataKey="value" nameKey="name" innerRadius={65} outerRadius={90} strokeWidth={4}>
                    {statusDataFormatted.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Funil de Conversão */}
          <Card className="bg-white border border-gray-200 rounded-2xl shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center">
                <SlidersHorizontal className="h-5 w-5 mr-2" />
                Funil de Conversão
              </CardTitle>
            </CardHeader>
            <CardContent className="w-full h-[250px]">
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={funnelPercentData} margin={{ left: 20 }}>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="name" width={100} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(200, 200, 200, 0.2)' }} formatter={(v: number) => [`${v}%`, 'Percentual do funil']} />
                    <Bar dataKey="percent" radius={[0, 6, 6, 0]} fill={COLORS.cobalt}>
                      <LabelList dataKey="percent" position="right" formatter={(v: number) => `${v}%`} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Top Cidades */}
          <Card className="bg-white border border-gray-200 rounded-2xl shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Top Cidades
              </CardTitle>
            </CardHeader>
            <CardContent className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={topCities} margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={80} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(200, 200, 200, 0.2)' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {topCities.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Aplicações Semanais */}
          <Card className="bg-white border border-gray-200 rounded-2xl shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart2 className="h-5 w-5 mr-2" />
                Aplicações Semanais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData} margin={{ left: 10, right: 10, bottom: 10 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="day" tickLine={false} tickMargin={10} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                    <Area type="monotone" dataKey="aplicacoes" fill={COLORS.cobaltLight} stroke="none" />
                    <Line type="monotone" dataKey="aplicacoes" stroke={COLORS.cobalt} strokeWidth={3} dot={{ r: 3, stroke: '#fff', strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;
