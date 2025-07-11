import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WhatsAppCandidate {
    phone: string;
    name: string;
    email?: string;
    resume_url?: string;
    job_id: string;
    source: 'whatsapp';
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        )

        const { action, data } = await req.json()

        switch (action) {
            case 'search_jobs':
                return await searchJobs(supabaseClient, data)

            case 'get_job_details':
                return await getJobDetails(supabaseClient, data)

            case 'create_application':
                return await createApplication(supabaseClient, data)

            case 'create_candidate':
                return await createCandidate(supabaseClient, data)

            default:
                return new Response(
                    JSON.stringify({ error: 'Ação não reconhecida' }),
                    {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    }
                )
        }
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})

async function searchJobs(supabase: any, { query, limit = 3 }: { query: string, limit?: number }) {
    const { data: jobs, error } = await supabase
        .from('jobs')
        .select(`
      id,
      title,
      department,
      city,
      state,
      type,
      description,
      salary_range,
      requirements,
      benefits,
      created_at
    `)
        .eq('status', 'ativo')
        .neq('title', 'Banco de Talentos')
        .or(`title.ilike.%${query}%,department.ilike.%${query}%,city.ilike.%${query}%,description.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) throw error

    return new Response(
        JSON.stringify({
            success: true,
            jobs: jobs || [],
            count: jobs?.length || 0
        }),
        {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
    )
}

async function getJobDetails(supabase: any, { job_id }: { job_id: string }) {
    const { data: job, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', job_id)
        .eq('status', 'ativo')
        .single()

    if (error) throw error

    return new Response(
        JSON.stringify({
            success: true,
            job: job
        }),
        {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
    )
}

async function createCandidate(supabase: any, candidateData: WhatsAppCandidate) {
    // Verificar se candidato já existe
    const { data: existingCandidate } = await supabase
        .from('candidates')
        .select('id')
        .eq('phone', candidateData.phone)
        .single()

    if (existingCandidate) {
        return new Response(
            JSON.stringify({
                success: true,
                candidate_id: existingCandidate.id,
                message: 'Candidato já cadastrado'
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }

    // Criar novo candidato
    const { data: candidate, error } = await supabase
        .from('candidates')
        .insert({
            name: candidateData.name,
            email: candidateData.email,
            phone: candidateData.phone,
            resume_url: candidateData.resume_url,
            source: 'whatsapp',
            created_at: new Date().toISOString()
        })
        .select()
        .single()

    if (error) throw error

    return new Response(
        JSON.stringify({
            success: true,
            candidate_id: candidate.id,
            message: 'Candidato criado com sucesso'
        }),
        {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
    )
}

async function createApplication(supabase: any, { candidate_id, job_id, phone }: { candidate_id: string, job_id: string, phone: string }) {
    // Verificar se já existe candidatura
    const { data: existingApplication } = await supabase
        .from('job_applications')
        .select('id')
        .eq('candidate_id', candidate_id)
        .eq('job_id', job_id)
        .single()

    if (existingApplication) {
        return new Response(
            JSON.stringify({
                success: false,
                message: 'Você já se candidatou para esta vaga'
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }

    // Criar candidatura
    const { data: application, error } = await supabase
        .from('job_applications')
        .insert({
            candidate_id,
            job_id,
            status: 'Novo',
            source: 'whatsapp',
            applied_at: new Date().toISOString(),
            notes: `Candidatura via WhatsApp - Telefone: ${phone}`
        })
        .select()
        .single()

    if (error) throw error

    // Buscar dados da vaga para notificação
    const { data: job } = await supabase
        .from('jobs')
        .select('title, department')
        .eq('id', job_id)
        .single()

    return new Response(
        JSON.stringify({
            success: true,
            application_id: application.id,
            message: `Candidatura enviada com sucesso para a vaga: ${job?.title}`,
            job_title: job?.title
        }),
        {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
    )
} 