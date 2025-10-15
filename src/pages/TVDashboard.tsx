import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
    const [password, setPassword] = useState('')
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [authError, setAuthError] = useState('')

    const handleLogin = () => {
        if (password === 'Ferr@r186@cgb') {
            setIsAuthenticated(true)
            setAuthError('')
        } else {
            setAuthError('Senha incorreta')
        }
    }

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔍 Tentando buscar métricas...')
      
      const res = await fetch('/api/metrics', { cache: 'no-store' })
      console.log('📡 Resposta da API:', res.status, res.statusText)
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error('❌ Erro da API:', errorText)
        throw new Error(`Falha ao buscar métricas: ${res.status} ${res.statusText}`)
      }
      
      const data = await res.json()
      console.log('✅ Dados recebidos:', data)
      setMetrics(data)
    } catch (e: any) {
      console.error('💥 Erro completo:', e)
      setError(e?.message || 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

    useEffect(() => {
        if (isAuthenticated) {
            fetchMetrics()
            const id = setInterval(fetchMetrics, 60_000)
            return () => clearInterval(id)
        }
    }, [isAuthenticated])

    const goFullscreen = () => {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen()
        }
    }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <CardTitle className="text-2xl font-bold text-white">Dashboard CGB</CardTitle>
              <p className="text-gray-300 mt-2">Digite a senha para acessar o painel</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Digite a senha de acesso"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  className="bg-white/10 border-white/30 text-white placeholder:text-gray-400 h-12 text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {authError && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {authError}
                  </div>
                )}
              </div>
              <Button 
                onClick={handleLogin} 
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Entrar no Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

    return (
        <div className="min-h-screen bg-black text-white p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Dashboard CGB</h1>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={fetchMetrics}>Atualizar</Button>
                    <Button onClick={goFullscreen}>Tela Cheia</Button>
                    <Button variant="outline" onClick={() => setIsAuthenticated(false)}>Sair</Button>
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


