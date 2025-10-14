import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, Database, Lock, Eye, Trash2, Download, AlertCircle } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Shield className="w-16 h-16 text-cgb-primary" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              Política de Privacidade
            </h1>
            <p className="text-xl text-gray-600">
              GRUPO CGB - Portal de Carreiras
            </p>
            <p className="text-sm text-gray-500">
              Última atualização: Janeiro de 2025
            </p>
          </div>

          {/* Introdução */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                Introdução
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                A <strong>GRUPO CGB</strong> está comprometida com a proteção da privacidade 
                e dos dados pessoais de todos os usuários de nosso Portal de Carreiras. 
                Esta Política de Privacidade descreve como coletamos, usamos, armazenamos 
                e protegemos suas informações pessoais, em conformidade com a Lei Geral de 
                Proteção de Dados (LGPD - Lei nº 13.709/2018).
              </p>
              <p className="text-gray-700 leading-relaxed">
                Ao utilizar nosso portal, você concorda com as práticas descritas nesta política.
              </p>
            </CardContent>
          </Card>

          {/* Dados Coletados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-green-600" />
                Quais Dados Coletamos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Dados Pessoais:</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Nome completo</li>
                  <li>E-mail</li>
                  <li>Telefone</li>
                  <li>Endereço (cidade, estado)</li>
                  <li>Data de nascimento</li>
                  <li>CPF</li>
                  <li>Currículo profissional</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Dados de Navegação:</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Endereço IP</li>
                  <li>Tipo de navegador</li>
                  <li>Páginas visitadas</li>
                  <li>Tempo de permanência</li>
                  <li>Cookies necessários para funcionamento</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Finalidade */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Finalidade do Tratamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Utilizamos seus dados pessoais exclusivamente para:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Processo Seletivo:</strong> Avaliação de candidaturas e comunicação sobre vagas</li>
                <li><strong>Comunicação:</strong> Envio de informações sobre oportunidades de emprego</li>
                <li><strong>Validação Jurídica:</strong> Verificação de documentos e requisitos legais</li>
                <li><strong>Melhoria do Serviço:</strong> Análise de uso do portal para otimizações</li>
                <li><strong>Segurança:</strong> Prevenção de fraudes e proteção dos dados</li>
              </ul>
            </CardContent>
          </Card>

          {/* Base Legal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-600" />
                Base Legal (LGPD)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <p className="text-gray-700 leading-relaxed">
                  O tratamento de seus dados pessoais é baseado nas seguintes hipóteses legais:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li><strong>Consentimento (Art. 7º, I):</strong> Para candidaturas e comunicações</li>
                  <li><strong>Execução de Contrato (Art. 7º, V):</strong> Para processos seletivos</li>
                  <li><strong>Interesse Legítimo (Art. 7º, IX):</strong> Para melhorias no serviço</li>
                  <li><strong>Cumprimento de Obrigação Legal (Art. 7º, II):</strong> Para validações jurídicas</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Compartilhamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-600" />
                Compartilhamento de Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Seus dados podem ser compartilhados apenas com:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Empresas do Grupo CGB:</strong> Para processos seletivos internos</li>
                <li><strong>Parceiros de Recrutamento:</strong> Empresas que auxiliam na seleção</li>
                <li><strong>Autoridades Competentes:</strong> Quando exigido por lei</li>
                <li><strong>Prestadores de Serviço:</strong> Para funcionamento técnico do portal</li>
              </ul>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  <strong>Importante:</strong> Nunca vendemos seus dados pessoais para terceiros.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Seus Direitos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-600" />
                Seus Direitos (LGPD)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Você tem os seguintes direitos sobre seus dados pessoais:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-indigo-600" />
                    <span className="font-medium">Acesso aos dados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <span className="font-medium">Exclusão dos dados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-green-600" />
                    <span className="font-medium">Correção de dados</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">Portabilidade</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-purple-600" />
                    <span className="font-medium">Revogação de consentimento</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    <span className="font-medium">Informações sobre tratamento</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Segurança */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                Segurança dos Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Implementamos medidas técnicas e organizacionais para proteger seus dados:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Criptografia SSL/TLS para transmissão de dados</li>
                <li>Controle de acesso baseado em funções</li>
                <li>Backup regular e seguro dos dados</li>
                <li>Monitoramento de segurança 24/7</li>
                <li>Treinamento de funcionários em proteção de dados</li>
              </ul>
            </CardContent>
          </Card>

          {/* Retenção */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-gray-600" />
                Retenção de Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Mantemos seus dados pessoais pelo período necessário para:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Candidaturas:</strong> 12 meses após a última atividade</li>
                <li><strong>Processos Seletivos:</strong> Até 2 anos após conclusão</li>
                <li><strong>Dados Jurídicos:</strong> Conforme exigências legais</li>
                <li><strong>Logs de Segurança:</strong> Até 6 meses</li>
              </ul>
            </CardContent>
          </Card>

          {/* Contato */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-cgb-primary" />
                Contato e DPO
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Para exercer seus direitos ou esclarecer dúvidas sobre esta política:
              </p>
              <div className="bg-cgb-primary/5 border border-cgb-primary/20 rounded-lg p-4">
                <p className="font-semibold text-cgb-primary mb-2">Encarregado de Proteção de Dados (DPO)</p>
                <p className="text-gray-700">E-mail: dpo@cgbenergia.com.br</p>
                <p className="text-gray-700">Telefone: (XX) XXXX-XXXX</p>
                <p className="text-gray-700">Endereço: [Endereço da empresa]</p>
              </div>
              <p className="text-sm text-gray-600">
                Responderemos sua solicitação em até 15 dias úteis, conforme previsto na LGPD.
              </p>
            </CardContent>
          </Card>

          {/* Alterações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                Alterações nesta Política
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Esta Política de Privacidade pode ser atualizada periodicamente. 
                Notificaremos sobre mudanças significativas através do portal ou por e-mail.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Recomendamos que você revise esta política regularmente para se manter 
                informado sobre como protegemos seus dados.
              </p>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center py-8 border-t border-gray-200">
            <p className="text-gray-600">
              Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD)
            </p>
            <p className="text-sm text-gray-500 mt-2">
              GRUPO CGB - Portal de Carreiras | Janeiro 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
