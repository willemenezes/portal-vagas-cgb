import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const TermsOfUse = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <FileText className="w-16 h-16 text-cgb-primary" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              Termos de Uso
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
                <FileText className="w-5 h-5 text-blue-600" />
                Introdução
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Bem-vindo ao Portal de Carreiras da <strong>GRUPO CGB</strong>. 
                Estes Termos de Uso regulam o acesso e utilização de nosso portal 
                de vagas e serviços relacionados.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Ao utilizar nosso portal, você concorda com estes termos. 
                Se não concordar, por favor, não utilize nossos serviços.
              </p>
            </CardContent>
          </Card>

          {/* Aceitação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Aceitação dos Termos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Ao acessar e utilizar o Portal de Carreiras CGB, você declara que:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Leu e compreendeu estes Termos de Uso</li>
                <li>Concorda em cumprir todas as condições estabelecidas</li>
                <li>Possui capacidade legal para celebrar este acordo</li>
                <li>As informações fornecidas são verdadeiras e precisas</li>
              </ul>
            </CardContent>
          </Card>

          {/* Serviços */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Serviços Oferecidos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                O Portal de Carreiras CGB oferece os seguintes serviços:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Visualização de Vagas:</strong> Consulta de oportunidades de emprego</li>
                <li><strong>Candidatura Online:</strong> Envio de currículos e documentos</li>
                <li><strong>Banco de Talentos:</strong> Cadastro para futuras oportunidades</li>
                <li><strong>Acompanhamento:</strong> Status de candidaturas e processos</li>
                <li><strong>Comunicação:</strong> Notificações sobre vagas e processos</li>
              </ul>
            </CardContent>
          </Card>

          {/* Responsabilidades do Usuário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-600" />
                Responsabilidades do Usuário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Ao utilizar nosso portal, você se compromete a:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Fornecer informações verdadeiras e atualizadas</li>
                <li>Manter a confidencialidade de sua conta</li>
                <li>Não utilizar o portal para atividades ilegais</li>
                <li>Respeitar os direitos de propriedade intelectual</li>
                <li>Não interferir no funcionamento do sistema</li>
                <li>Comunicar alterações em seus dados pessoais</li>
              </ul>
            </CardContent>
          </Card>

          {/* Proibições */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                Condutas Proibidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                É expressamente proibido:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Fornecer informações falsas ou enganosas</li>
                <li>Tentar acessar contas de outros usuários</li>
                <li>Utilizar sistemas automatizados para extrair dados</li>
                <li>Enviar conteúdo ofensivo ou inadequado</li>
                <li>Violar direitos de propriedade intelectual</li>
                <li>Realizar atividades que possam danificar o sistema</li>
              </ul>
            </CardContent>
          </Card>

          {/* Processo Seletivo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Processo Seletivo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <p className="text-gray-700 leading-relaxed">
                  <strong>Importante:</strong> O Portal de Carreiras CGB é gratuito. 
                  Não cobramos nenhuma taxa para:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Visualização de vagas</li>
                  <li>Candidatura a processos seletivos</li>
                  <li>Cadastro no banco de talentos</li>
                  <li>Acompanhamento de candidaturas</li>
                </ul>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <p className="font-semibold text-red-800">Atenção a Golpes</p>
                </div>
                <p className="text-red-700 text-sm">
                  Desconfie de qualquer pessoa que solicite pagamento para participar 
                  de nossos processos seletivos. Sempre utilize apenas nosso portal oficial.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Propriedade Intelectual */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Propriedade Intelectual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Todo o conteúdo do Portal de Carreiras CGB, incluindo:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Textos, imagens e logotipos</li>
                <li>Design e layout do portal</li>
                <li>Software e funcionalidades</li>
                <li>Marcas e nomes comerciais</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                São propriedade exclusiva da GRUPO CGB e protegidos por leis de 
                propriedade intelectual. É proibida a reprodução sem autorização.
              </p>
            </CardContent>
          </Card>

          {/* Limitação de Responsabilidade */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                Limitação de Responsabilidade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                A GRUPO CGB não se responsabiliza por:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Resultados de processos seletivos</li>
                <li>Decisões de contratação</li>
                <li>Interrupções temporárias do serviço</li>
                <li>Danos causados por terceiros</li>
                <li>Uso inadequado do portal pelo usuário</li>
              </ul>
            </CardContent>
          </Card>

          {/* Modificações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                Modificações dos Termos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. 
                As alterações serão comunicadas através do portal.
              </p>
              <p className="text-gray-700 leading-relaxed">
                O uso continuado do portal após as modificações constitui aceitação 
                dos novos termos.
              </p>
            </CardContent>
          </Card>

          {/* Contato */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-cgb-primary" />
                Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Para dúvidas sobre estes Termos de Uso:
              </p>
              <div className="bg-cgb-primary/5 border border-cgb-primary/20 rounded-lg p-4">
                <p className="font-semibold text-cgb-primary mb-2">GRUPO CGB</p>
                <p className="text-gray-700">E-mail: contato@cgbenergia.com.br</p>
                <p className="text-gray-700">Telefone: (XX) XXXX-XXXX</p>
                <p className="text-gray-700">Portal: www.cgbvagas.com.br</p>
              </div>
            </CardContent>
          </Card>

          {/* Lei Aplicável */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                Lei Aplicável
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Estes Termos de Uso são regidos pelas leis brasileiras. 
                Qualquer disputa será resolvida nos tribunais competentes do Brasil.
              </p>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center py-8 border-t border-gray-200">
            <p className="text-gray-600">
              Estes termos estão em conformidade com a legislação brasileira vigente
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

export default TermsOfUse;
