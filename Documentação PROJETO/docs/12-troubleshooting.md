# 🛠️ Troubleshooting - Guia de Resolução de Problemas

## 🚨 Problemas Críticos

### 1. Sistema Fora do Ar

#### Sintomas:
- Página não carrega
- Erro 500/503
- Timeout de conexão

#### Diagnóstico:
```bash
# Verificar status do Supabase
curl -I https://[seu-projeto].supabase.co/rest/v1/

# Verificar logs do Vercel/Netlify
vercel logs --follow

# Verificar status da aplicação
curl -I https://[seu-dominio].com/health
```

#### Soluções:
1. **Supabase Down**: Aguardar restauração ou usar backup
2. **Deploy com Bug**: Rollback para versão anterior
3. **Limite de Conexões**: Reiniciar conexões do banco

### 2. Banco de Dados Inacessível

#### Sintomas:
- Erro "connection refused"
- Queries falhando
- Timeout de database

#### Diagnóstico:
```sql
-- Verificar conexões ativas
SELECT count(*) FROM pg_stat_activity;

-- Verificar queries lentas
SELECT query, query_start, state 
FROM pg_stat_activity 
WHERE state = 'active' 
AND query_start < NOW() - INTERVAL '5 minutes';

-- Verificar locks
SELECT * FROM pg_locks WHERE NOT granted;
```

#### Soluções:
1. **Muitas Conexões**: Implementar connection pooling
2. **Queries Lentas**: Otimizar queries ou adicionar índices
3. **Deadlocks**: Revisar ordem de operações

---

## ⚠️ Problemas Comuns

### 1. Login Não Funciona

#### Problema: Usuário não consegue fazer login

**Diagnóstico**:
```typescript
// Verificar se usuário existe
const { data: user } = await supabase.auth.getUser();
console.log('User:', user);

// Verificar perfil RH
const { data: rhProfile } = await supabase
  .from('rh_users')
  .select('*')
  .eq('user_id', user?.id)
  .single();
console.log('RH Profile:', rhProfile);
```

**Soluções**:
- ✅ Verificar se email está confirmado
- ✅ Resetar senha se necessário
- ✅ Verificar se perfil RH existe
- ✅ Conferir permissões de acesso

### 2. Candidato em Validação TJ Não Bloqueia

#### Problema: Candidato sai de "Validação TJ" sem aprovação

**Diagnóstico**:
```sql
-- Verificar status legal do candidato
SELECT id, name, status, legal_status 
FROM candidates 
WHERE status = 'Validação TJ';

-- Verificar validações existentes
SELECT * FROM candidate_legal_validations 
WHERE candidate_id = '[candidate-id]' 
ORDER BY created_at DESC;
```

**Soluções**:
- ✅ Verificar se `legal_status` está como "pendente"
- ✅ Conferir lógica de bloqueio no Kanban
- ✅ Resetar status legal se necessário:

```sql
UPDATE candidates 
SET legal_status = 'pendente' 
WHERE id = '[candidate-id]' AND status = 'Validação TJ';
```

### 3. Upload de Currículo Falha

#### Problema: Erro ao fazer upload de PDF

**Diagnóstico**:
```typescript
// Verificar configurações do Storage
const { data: buckets } = await supabase.storage.listBuckets();
console.log('Buckets:', buckets);

// Verificar políticas RLS
const { data: policies } = await supabase
  .from('storage.policies')
  .select('*');
```

**Soluções**:
- ✅ Verificar tamanho do arquivo (max 5MB)
- ✅ Confirmar formato PDF
- ✅ Verificar políticas do Supabase Storage
- ✅ Conferir permissões de upload

### 4. Emails Não Enviados

#### Problema: Sistema não envia emails

**Diagnóstico**:
```typescript
// Testar Edge Function
const { data, error } = await supabase.functions.invoke('send-email', {
  body: {
    to: 'test@example.com',
    subject: 'Teste',
    html: '<p>Teste</p>'
  }
});

console.log('Email result:', { data, error });
```

**Soluções**:
- ✅ Verificar configuração da Edge Function
- ✅ Conferir variáveis de ambiente
- ✅ Validar formato do email
- ✅ Verificar logs do Supabase

### 5. Performance Lenta

#### Problema: Sistema lento para carregar

**Diagnóstico**:
```sql
-- Queries mais lentas
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Índices não utilizados
SELECT schemaname, tablename, indexname, idx_scan 
FROM pg_stat_user_indexes 
WHERE idx_scan = 0;
```

**Soluções**:
- ✅ Adicionar índices necessários
- ✅ Otimizar queries N+1
- ✅ Implementar paginação
- ✅ Usar cache quando apropriado

---

## 🔍 Ferramentas de Diagnóstico

### 1. Health Check Endpoint

```typescript
// /api/health
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    storage: await checkStorage(),
    email: await checkEmailService(),
    external_apis: await checkExternalAPIs(),
  };
  
  const allHealthy = Object.values(checks).every(check => check.status === 'ok');
  
  return Response.json({
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks
  }, {
    status: allHealthy ? 200 : 503
  });
}

async function checkDatabase() {
  try {
    const { data } = await supabase.from('jobs').select('count').single();
    return { status: 'ok', latency: Date.now() };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}
```

### 2. Logs Estruturados

```typescript
interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

class Logger {
  static info(message: string, metadata?: any) {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      metadata
    }));
  }
  
  static error(message: string, error?: Error, metadata?: any) {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error?.stack,
      timestamp: new Date().toISOString(),
      metadata
    }));
  }
}
```

### 3. Performance Monitoring

```typescript
// Hook para monitorar performance
const usePerformanceMonitor = () => {
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          console.log('Page Load Time:', entry.loadEventEnd - entry.loadEventStart);
        }
        
        if (entry.entryType === 'measure') {
          console.log('Custom Measure:', entry.name, entry.duration);
        }
      });
    });
    
    observer.observe({ entryTypes: ['navigation', 'measure'] });
    
    return () => observer.disconnect();
  }, []);
};
```

---

## 📊 Monitoramento Proativo

### 1. Alertas Configurados

```typescript
interface AlertRules {
  critical: {
    database_down: {
      condition: 'connection_failed > 0';
      notification: 'immediate_call';
    };
    
    high_error_rate: {
      condition: 'error_rate > 5%';
      notification: 'slack_urgent';
    };
  };
  
  warning: {
    slow_queries: {
      condition: 'avg_query_time > 2s';
      notification: 'slack_warning';
    };
    
    high_memory_usage: {
      condition: 'memory_usage > 80%';
      notification: 'email';
    };
  };
}
```

### 2. Métricas Importantes

```typescript
const metrics = {
  // Performance
  response_time: 'avg(response_time) by endpoint',
  error_rate: 'count(errors) / count(requests) * 100',
  throughput: 'count(requests) per minute',
  
  // Business
  daily_applications: 'count(new_applications) per day',
  conversion_rate: 'count(hired) / count(applied) * 100',
  time_to_hire: 'avg(days_from_application_to_hire)',
  
  // System
  database_connections: 'count(active_connections)',
  memory_usage: 'memory_used / memory_total * 100',
  disk_usage: 'disk_used / disk_total * 100',
};
```

---

## 🚀 Otimizações de Performance

### 1. Database Query Optimization

```sql
-- Índices recomendados para performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_candidates_job_status 
ON candidates(job_id, status) 
WHERE status != 'Reprovado';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_candidates_legal_pending 
ON candidates(legal_status, updated_at) 
WHERE legal_status = 'pendente';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_candidate_recent 
ON candidate_notes(candidate_id, created_at DESC);

-- Query otimizada para dashboard
CREATE MATERIALIZED VIEW dashboard_metrics AS
SELECT 
  COUNT(*) FILTER (WHERE status = 'ativa') as active_jobs,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_candidates_month,
  AVG(EXTRACT(EPOCH FROM (hired_date - applied_date))/86400) as avg_time_to_hire
FROM jobs j
LEFT JOIN candidates c ON j.id = c.job_id;

-- Refresh automático da view
CREATE OR REPLACE FUNCTION refresh_dashboard_metrics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW dashboard_metrics;
END;
$$ LANGUAGE plpgsql;
```

### 2. Frontend Optimization

```typescript
// Lazy loading de componentes
const CandidateDetailModal = lazy(() => import('./CandidateDetailModal'));
const ReportsPage = lazy(() => import('../pages/Reports'));

// Memoização de componentes pesados
const CandidateList = memo(({ candidates, filters }) => {
  const filteredCandidates = useMemo(() => 
    candidates.filter(candidate => 
      applyFilters(candidate, filters)
    ), [candidates, filters]
  );
  
  return (
    <VirtualizedList
      items={filteredCandidates}
      renderItem={CandidateCard}
      height={600}
    />
  );
});

// Debounce para busca
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
};
```

---

## 📞 Contatos de Emergência

### Equipe Técnica
- **Desenvolvedor Principal**: +55 11 99999-9999
- **DBA**: +55 11 88888-8888
- **DevOps**: +55 11 77777-7777

### Fornecedores
- **Supabase Support**: support@supabase.io
- **Vercel Support**: support@vercel.com

### Procedimentos de Emergência

#### Severidade 1 (Sistema Fora do Ar)
1. ☎️ Ligar imediatamente para desenvolvedor principal
2. 📧 Enviar email para equipe técnica
3. 📱 Postar no Slack #emergencia
4. 📋 Documentar incidente

#### Severidade 2 (Funcionalidade Crítica Afetada)
1. 📱 Postar no Slack #suporte
2. 📧 Enviar email com detalhes
3. 📋 Criar ticket de suporte

#### Severidade 3 (Problema Menor)
1. 📧 Enviar email para suporte
2. 📋 Documentar no sistema de tickets

---

## 📚 Recursos Úteis

### Documentação Externa
- [Supabase Docs](https://supabase.com/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Ferramentas de Debug
- **React DevTools**: Para debug de componentes
- **TanStack Query DevTools**: Para debug de queries
- **Supabase Dashboard**: Para debug de banco de dados

### Logs e Monitoramento
- **Supabase Logs**: Dashboard do Supabase
- **Vercel Analytics**: Métricas de performance
- **Browser DevTools**: Network, Console, Performance

---

*Guia de Troubleshooting atualizado em: 27/12/2024* 