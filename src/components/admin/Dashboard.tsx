import { useState } from "react";
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

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -180),
    to: new Date(),
  });

  const { data: dashboardData, isLoading, isError, error } = useDashboardData(rhProfile, dateRange);

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
    completedJobs,
    avgTimeToComplete
  } = dashboardData;

  // Adicionado filtro para remover status com 0 candidatos
  const statusDataFormatted = statusData.filter(item => item.value > 0).map(item => ({
    ...item,
    color: chartConfig[item.name.toLowerCase()]?.color || '#ccc',
    icon: item.name === 'Pendentes' ? Clock : item.name === 'Entrevista' ? Users : item.name === 'Aprovados' ? Award : ThumbsDown
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
          <Card className="bg-indigo-50 border-indigo-100 text-indigo-900 transition-all hover:shadow-md hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Candidatos</CardTitle>
              <Users className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCandidates}</div>
              <p className="text-xs text-indigo-800/80">no período selecionado</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-100 text-blue-900 transition-all hover:shadow-md hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Vagas</CardTitle>
              <Briefcase className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalJobs}</div>
              <p className="text-xs text-blue-800/80">ativas na sua região</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-100 text-green-900 transition-all hover:shadow-md hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Candidatos Aprovados</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedCount}</div>
              <p className="text-xs text-green-800/80">contratados no período</p>
            </CardContent>
          </Card>
          <Card className="bg-teal-50 border-teal-100 text-teal-900 transition-all hover:shadow-md hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <TrendingUp className="h-4 w-4 text-teal-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversionRate}%</div>
              <p className="text-xs text-teal-800/80">de candidatos aprovados</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-100 text-purple-900 transition-all hover:shadow-md hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vagas Finalizadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedJobs}</div>
              <p className="text-xs text-purple-800/80">processos concluídos</p>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-100 text-orange-900 transition-all hover:shadow-md hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgTimeToComplete}</div>
              <p className="text-xs text-orange-800/80">dias para conclusão</p>
            </CardContent>
          </Card>
        </div>

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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          {/* Gráfico de Aplicações Semanais */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart2 className="h-5 w-5 mr-2" />
                Aplicações na Última Semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart data={weeklyData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="day" tickLine={false} tickMargin={10} axisLine={false} />
                  <YAxis />
                  <Tooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar dataKey="aplicacoes" fill="var(--color-aplicacoes)" radius={8} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
          {/* Status dos Candidatos */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChartIcon className="h-5 w-5 mr-2" />
                Status dos Candidatos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <PieChart>
                  <Tooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie data={statusDataFormatted} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
                    {statusDataFormatted.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Funil de Conversão */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <SlidersHorizontal className="h-5 w-5 mr-2" />
                Funil de Conversão de Candidatos
              </CardTitle>
            </CardHeader>
            <CardContent className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <Tooltip />
                  <Funnel dataKey="value" data={funnelData} isAnimationActive>
                    <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Cidades */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Top 5 Cidades com Mais Candidatos
              </CardTitle>
            </CardHeader>
            <CardContent className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={topCities} margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} tickLine={false} axisLine={false} />
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
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;
