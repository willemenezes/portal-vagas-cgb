import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const SMTP_HOST = Deno.env.get("SMTP_HOST") || "mail.cgbengenharia.com.br";
  const SMTP_PORT = Deno.env.get("SMTP_PORT") || "587";
  const SMTP_USER = Deno.env.get("SMTP_USER") || "ti.belem@cgbengenharia.com.br";
  const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD") || "H6578m2024@cgb";

  console.log("🧪 Testando conexão SMTP...");
  console.log("Host:", SMTP_HOST);
  console.log("Port:", SMTP_PORT);
  console.log("User:", SMTP_USER);

  const results = [];

  // Teste 1: Porta 587 com TLS
  try {
    console.log("📧 Teste 1: Porta 587 com TLS...");
    const client = new SmtpClient();
    
    await Promise.race([
      client.connectTLS({
        hostname: SMTP_HOST,
        port: 587,
        username: SMTP_USER,
        password: SMTP_PASSWORD,
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout 30s")), 30000))
    ]);
    
    await client.close();
    results.push({ port: 587, tls: true, status: "✅ Sucesso" });
  } catch (e) {
    results.push({ port: 587, tls: true, status: `❌ Erro: ${e.message}` });
  }

  // Teste 2: Porta 465 com TLS
  try {
    console.log("📧 Teste 2: Porta 465 com TLS...");
    const client = new SmtpClient();
    
    await Promise.race([
      client.connectTLS({
        hostname: SMTP_HOST,
        port: 465,
        username: SMTP_USER,
        password: SMTP_PASSWORD,
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout 30s")), 30000))
    ]);
    
    await client.close();
    results.push({ port: 465, tls: true, status: "✅ Sucesso" });
  } catch (e) {
    results.push({ port: 465, tls: true, status: `❌ Erro: ${e.message}` });
  }

  // Teste 3: Porta 25 sem TLS
  try {
    console.log("📧 Teste 3: Porta 25 sem TLS...");
    const client = new SmtpClient();
    
    await Promise.race([
      client.connect({
        hostname: SMTP_HOST,
        port: 25,
        username: SMTP_USER,
        password: SMTP_PASSWORD,
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout 30s")), 30000))
    ]);
    
    await client.close();
    results.push({ port: 25, tls: false, status: "✅ Sucesso" });
  } catch (e) {
    results.push({ port: 25, tls: false, status: `❌ Erro: ${e.message}` });
  }

  return new Response(JSON.stringify({
    message: "Testes de conexão SMTP concluídos",
    config: {
      host: SMTP_HOST,
      user: SMTP_USER,
      password_configured: !!SMTP_PASSWORD
    },
    results
  }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
