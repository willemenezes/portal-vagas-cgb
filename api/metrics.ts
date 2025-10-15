import { createClient } from '@supabase/supabase-js'

export default async function handler(req: Request): Promise<Response> {
  try {
    const url = process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Missing Supabase env vars' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(url, serviceKey)

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const in7Days = new Date()
    in7Days.setDate(in7Days.getDate() + 7)

    const [activeJobsRes, candidatesRes, approvedRes, expiringRes, jobsByCityRes] = await Promise.all([
      supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .in('status', ['active', 'ativo'])
        .in('approval_status', ['active', 'ativo'])
        .eq('flow_status', 'ativa'),

      supabase
        .from('candidates')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString()),

      supabase
        .from('candidates')
        .select('id', { count: 'exact', head: true })
        .in('status', ['Aprovado', 'Contratado'])
        .gte('updated_at', monthStart.toISOString()),

      supabase
        .from('jobs')
        .select('id, title, expires_at')
        .not('expires_at', 'is', null)
        .lte('expires_at', in7Days.toISOString())
        .order('expires_at', { ascending: true })
        .limit(20),

      supabase
        .from('jobs')
        .select('city')
        .in('status', ['active', 'ativo'])
        .in('approval_status', ['active', 'ativo'])
        .eq('flow_status', 'ativa')
    ])

    const totalActiveJobs = activeJobsRes.count || 0
    const candidatesToday = candidatesRes.count || 0
    const approvedThisMonth = approvedRes.count || 0

    // Taxa de conversão simples (aprovados no mês / candidatos no mês)
    const monthCandidatesRes = await supabase
      .from('candidates')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', monthStart.toISOString())
    const monthCandidates = monthCandidatesRes.count || 0
    const conversionRate = monthCandidates > 0 ? Math.round((approvedThisMonth / monthCandidates) * 100) : 0

    const jobsExpiringSoon = (expiringRes.data || []).map(j => ({ id: j.id, title: j.title, expires_at: j.expires_at }))

    const cityCounts: Record<string, number> = {}
    ;(jobsByCityRes.data || []).forEach((j: any) => {
      if (!j.city) return
      cityCounts[j.city] = (cityCounts[j.city] || 0) + 1
    })
    const topCities = Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([city, count]) => ({ city, count }))

    return new Response(
      JSON.stringify({
        totalActiveJobs,
        candidatesToday,
        approvedThisMonth,
        conversionRate,
        jobsExpiringSoon,
        topCities,
        collectedAt: new Date().toISOString(),
      }),
      { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    )
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}


