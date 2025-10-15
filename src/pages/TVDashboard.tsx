import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Metrics {
  totalActiveJobs: number
  candidatesToday: number
  approvedThisMonth: number
  conversionRate: number
  jobsExpiringSoon: { id: string; title: string; expires_at: string }[]
  topCities: { city: string; count: number }[]
  collectedAt: string
}

const TVDashboard = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/metrics', { cache: 'no-store' })
      if (!res.ok) throw new Error('Falha ao buscar métricas')
      const data = await res.json()
      setMetrics(data)
    } catch (e: any) {
      setError(e?.message || 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
    const id = setInterval(fetchMetrics, 60_000)
    return () => clearInterval(id)
  }, [])

  const goFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen()
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Painel de TV</h1>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={fetchMetrics}>Atualizar</Button>
          <Button onClick={goFullscreen}>Tela Cheia</Button>
        </div>
      </div>

      {loading && (
        <div className="text-center text-gray-300">Carregando...</div>
      )}
      {error && (
        <div className="text-center text-red-400">{error}</div>
      )}

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Vagas Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-extrabold text-emerald-400">{metrics.totalActiveJobs}</div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Candidatos Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-extrabold text-cyan-400">{metrics.candidatesToday}</div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Aprovados no Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-extrabold text-indigo-400">{metrics.approvedThisMonth}</div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Conversão (Mês)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-extrabold text-amber-400">{metrics.conversionRate}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Vagas que expiram em 7 dias</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-zinc-300 max-h-64 overflow-y-auto">
                {metrics.jobsExpiringSoon.length === 0 && <li>Nenhuma vaga expira nos próximos 7 dias.</li>}
                {metrics.jobsExpiringSoon.map(j => (
                  <li key={j.id} className="flex justify-between gap-4">
                    <span className="truncate">{j.title}</span>
                    <span className="text-zinc-400">{new Date(j.expires_at).toLocaleDateString('pt-BR')}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Cidades com mais vagas (ativas)</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-zinc-300">
                {metrics.topCities.map(c => (
                  <li key={c.city} className="flex justify-between">
                    <span>{c.city}</span>
                    <span className="font-bold text-emerald-400">{c.count}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {metrics && (
        <div className="text-sm text-zinc-500 mt-6">
          Atualizado em {new Date(metrics.collectedAt).toLocaleTimeString('pt-BR')}
        </div>
      )}
    </div>
  )
}

export default TVDashboard


