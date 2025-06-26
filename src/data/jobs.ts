
export interface Job {
  id: string;
  title: string;
  department: string;
  city: string;
  state: string;
  type: string;
  posted: string;
  applicants: number;
  description: string;
  requirements: string[];
  benefits: string[];
  workload: string;
  status: "active" | "closed" | "draft";
}

export const mockJobs: Job[] = [
  {
    id: "1",
    title: "Técnico em Eletrotécnica",
    department: "Técnico",
    city: "Belém",
    state: "PA",
    type: "CLT",
    posted: "2 dias",
    applicants: 23,
    description: "Responsável pela manutenção preventiva e corretiva de equipamentos elétricos, análise de sistemas de energia e suporte técnico em projetos de distribuição elétrica.",
    requirements: [
      "Curso técnico em Eletrotécnica completo",
      "Experiência mínima de 2 anos na área",
      "Conhecimento em NR-10",
      "CNH categoria B",
      "Disponibilidade para viagens"
    ],
    benefits: [
      "Vale alimentação",
      "Vale transporte", 
      "Plano de saúde",
      "Plano odontológico",
      "Participação nos lucros"
    ],
    workload: "44h semanais",
    status: "active"
  },
  {
    id: "2",
    title: "Agente Comercial de Cobrança",
    department: "Comercial",
    city: "Ananindeua",
    state: "PA",
    type: "CLT",
    posted: "1 dia",
    applicants: 18,
    description: "Responsável por controlar os processos da área de cobrança de faturas de energia, realizando levantamentos diários das produções executadas em campo pelos agentes de cobrança para repasse de informações às áreas responsáveis.",
    requirements: [
      "Ensino médio completo",
      "Experiência em cobrança ou atendimento ao cliente",
      "Conhecimento em pacote Office",
      "Boa comunicação e organização",
      "Disponibilidade para trabalhar em campo"
    ],
    benefits: [
      "Vale alimentação",
      "Vale transporte",
      "Plano de saúde",
      "Comissão por produtividade",
      "Participação nos lucros"
    ],
    workload: "44h semanais",
    status: "active"
  },
  {
    id: "3",
    title: "Agente Comercial de Leitura",
    department: "Comercial",
    city: "Macapá",
    state: "AP",
    type: "CLT",
    posted: "3 dias",
    applicants: 15,
    description: "Encarregado de enviar relatórios diários para análise dos processos, como clientes não lidos, faturamento imediato, pontualidade e releitura. Também realiza atribuições de livros de leitura e massiva, utilizando programas e ferramentas da empresa.",
    requirements: [
      "Ensino médio completo",
      "Experiência com sistemas informatizados",
      "Conhecimento em Excel",
      "Pontualidade e responsabilidade",
      "Capacidade de análise de dados"
    ],
    benefits: [
      "Vale alimentação",
      "Vale transporte",
      "Plano de saúde",
      "Auxílio educação",
      "Participação nos lucros"
    ],
    workload: "40h semanais",
    status: "active"
  },
  {
    id: "4",
    title: "Leiturista",
    department: "Operacional",
    city: "Santarém",
    state: "PA",
    type: "CLT",
    posted: "2 dias",
    applicants: 31,
    description: "Responsável por realizar a leitura de medidores de consumo de energia, registrando os dados para faturamento com precisão e pontualidade.",
    requirements: [
      "Ensino fundamental completo",
      "Experiência em leitura de medidores (desejável)",
      "CNH categoria A ou B",
      "Disponibilidade para trabalhar em campo",
      "Conhecimento básico em matemática"
    ],
    benefits: [
      "Vale alimentação",
      "Vale transporte",
      "Seguro de vida",
      "Auxílio combustível",
      "Participação nos lucros"
    ],
    workload: "44h semanais",
    status: "active"
  },
  {
    id: "5",
    title: "Jovem Aprendiz",
    department: "Administrativo",
    city: "Belém",
    state: "PA",
    type: "Aprendiz",
    posted: "1 semana",
    applicants: 47,
    description: "Programa de aprendizagem voltado para jovens que buscam ingressar no mercado de trabalho, oferecendo capacitação teórica e prática em diversas áreas da empresa.",
    requirements: [
      "Idade entre 14 e 24 anos",
      "Cursando ensino médio ou técnico",
      "Interesse em desenvolvimento profissional",
      "Proatividade e vontade de aprender",
      "Disponibilidade de meio período"
    ],
    benefits: [
      "Bolsa auxílio",
      "Vale transporte",
      "Seguro de vida",
      "Curso profissionalizante",
      "Certificado de conclusão"
    ],
    workload: "20h semanais",
    status: "active"
  },
  {
    id: "6",
    title: "Assistente Administrativo",
    department: "Administrativo",
    city: "Santana",
    state: "AP",
    type: "CLT",
    posted: "5 dias",
    applicants: 29,
    description: "Auxilia nas rotinas administrativas, como elaboração de relatórios, controle de documentos e atendimento a clientes internos e externos.",
    requirements: [
      "Ensino médio completo",
      "Experiência em rotinas administrativas",
      "Conhecimento em pacote Office",
      "Boa comunicação",
      "Organização e proatividade"
    ],
    benefits: [
      "Vale alimentação",
      "Vale transporte",
      "Plano de saúde",
      "Auxílio educação",
      "Participação nos lucros"
    ],
    workload: "40h semanais",
    status: "active"
  },
  {
    id: "7",
    title: "Auxiliar Administrativo",
    department: "Administrativo",
    city: "Marabá",
    state: "PA",
    type: "CLT",
    posted: "4 dias",
    applicants: 22,
    description: "Atua em atividades administrativas gerais, como organização de documentos, atendimento telefônico e suporte às demais áreas da empresa.",
    requirements: [
      "Ensino médio completo",
      "Experiência básica em escritório",
      "Conhecimento básico em informática",
      "Boa comunicação verbal",
      "Organização e responsabilidade"
    ],
    benefits: [
      "Vale alimentação",
      "Vale transporte",
      "Plano de saúde",
      "Participação nos lucros"
    ],
    workload: "44h semanais",
    status: "active"
  },
  {
    id: "8",
    title: "Assistente de Departamento Pessoal",
    department: "Recursos Humanos",
    city: "Belém",
    state: "PA",
    type: "CLT",
    posted: "1 semana",
    applicants: 26,
    description: "Atua no setor de recursos humanos, auxiliando em processos de admissão, demissão, folha de pagamento e controle de benefícios.",
    requirements: [
      "Ensino médio completo ou superior em RH",
      "Experiência em departamento pessoal",
      "Conhecimento em legislação trabalhista",
      "Domínio do Excel avançado",
      "Discrição e confidencialidade"
    ],
    benefits: [
      "Vale alimentação",
      "Vale transporte",
      "Plano de saúde",
      "Plano odontológico",
      "Auxílio educação",
      "Participação nos lucros"
    ],
    workload: "40h semanais",
    status: "active"
  },
  {
    id: "9",
    title: "Eletricista",
    department: "Técnico",
    city: "Castanhal",
    state: "PA",
    type: "CLT",
    posted: "3 dias",
    applicants: 18,
    description: "Execução de instalações elétricas, manutenção de equipamentos e sistemas elétricos de baixa e média tensão.",
    requirements: [
      "Curso técnico em Eletrotécnica ou experiência comprovada",
      "NR-10 atualizada",
      "Conhecimento em sistemas elétricos",
      "CNH categoria B",
      "Disponibilidade para viagens"
    ],
    benefits: [
      "Vale alimentação",
      "Vale transporte",
      "Plano de saúde",
      "Auxílio ferramentas",
      "Participação nos lucros"
    ],
    workload: "44h semanais",
    status: "active"
  },
  {
    id: "10",
    title: "Auxiliar de Eletricista",
    department: "Técnico",
    city: "Laranjal do Jari",
    state: "AP",
    type: "CLT",
    posted: "2 dias",
    applicants: 25,
    description: "Auxiliar nas atividades de instalação e manutenção elétrica, preparação de materiais e ferramentas.",
    requirements: [
      "Ensino médio completo",
      "Curso básico de eletricidade",
      "Disponibilidade para aprender",
      "Força física para trabalho em altura",
      "Responsabilidade e pontualidade"
    ],
    benefits: [
      "Vale alimentação",
      "Vale transporte",
      "Plano de saúde",
      "Treinamentos",
      "Participação nos lucros"
    ],
    workload: "44h semanais",
    status: "active"
  },
  {
    id: "11",
    title: "Agente Comercial",
    department: "Comercial",
    city: "Abaetetuba",
    state: "PA",
    type: "CLT",
    posted: "5 dias",
    applicants: 20,
    description: "Atendimento ao cliente, vendas e negociação de contratos de energia elétrica.",
    requirements: [
      "Ensino médio completo",
      "Experiência em vendas",
      "Boa comunicação",
      "Conhecimento básico em informática",
      "CNH categoria B"
    ],
    benefits: [
      "Vale alimentação",
      "Vale transporte",
      "Plano de saúde",
      "Comissão por vendas",
      "Participação nos lucros"
    ],
    workload: "44h semanais",
    status: "active"
  },
  {
    id: "12",
    title: "Condutor Maquinista",
    department: "Operacional",
    city: "Oiapoque",
    state: "AP",
    type: "CLT",
    posted: "1 semana",
    applicants: 12,
    description: "Operação de máquinas e equipamentos especializados para manutenção da rede elétrica.",
    requirements: [
      "CNH categoria C ou D",
      "Experiência com máquinas pesadas",
      "Curso de operação de equipamentos",
      "Responsabilidade e atenção",
      "Disponibilidade para viagens"
    ],
    benefits: [
      "Vale alimentação",
      "Vale transporte",
      "Plano de saúde",
      "Adicional de periculosidade",
      "Participação nos lucros"
    ],
    workload: "44h semanais",
    status: "active"
  },
  {
    id: "13",
    title: "Motorista Fluvial",
    department: "Operacional",
    city: "Belém",
    state: "PA",
    type: "CLT",
    posted: "4 dias",
    applicants: 16,
    description: "Condução de embarcações para transporte de equipes e materiais em rios e igarapés.",
    requirements: [
      "Habilitação para embarcações",
      "Experiência em navegação fluvial",
      "Conhecimento da região amazônica",
      "Responsabilidade e prudência",
      "Disponibilidade para pernoite"
    ],
    benefits: [
      "Vale alimentação",
      "Vale transporte",
      "Plano de saúde",
      "Adicional de periculosidade",
      "Participação nos lucros"
    ],
    workload: "44h semanais",
    status: "active"
  },
  {
    id: "14",
    title: "Analista Operacional",
    department: "Operacional",
    city: "Macapá",
    state: "AP",
    type: "CLT",
    posted: "6 dias",
    applicants: 21,
    description: "Análise de dados operacionais, elaboração de relatórios e otimização de processos.",
    requirements: [
      "Superior completo em Engenharia ou áreas afins",
      "Experiência em análise de dados",
      "Conhecimento em Excel avançado",
      "Raciocínio analítico",
      "Inglês intermediário"
    ],
    benefits: [
      "Vale alimentação",
      "Vale transporte",
      "Plano de saúde premium",
      "Auxílio educação",
      "Participação nos lucros"
    ],
    workload: "40h semanais",
    status: "active"
  },
  {
    id: "15",
    title: "Técnico de Informática",
    department: "Tecnologia",
    city: "Santarém",
    state: "PA",
    type: "CLT",
    posted: "3 dias",
    applicants: 28,
    description: "Suporte técnico em informática, manutenção de equipamentos e redes de computadores.",
    requirements: [
      "Curso técnico em Informática",
      "Experiência em suporte técnico",
      "Conhecimento em redes e hardware",
      "Proatividade para resolução de problemas",
      "Disponibilidade para viagens"
    ],
    benefits: [
      "Vale alimentação",
      "Vale transporte",
      "Plano de saúde",
      "Certificações técnicas",
      "Participação nos lucros"
    ],
    workload: "40h semanais",
    status: "active"
  },
  {
    id: "16",
    title: "Gerente Operacional",
    department: "Gerência",
    city: "Belém",
    state: "PA",
    type: "CLT",
    posted: "1 semana",
    applicants: 8,
    description: "Gestão das operações regionais, coordenação de equipes e planejamento estratégico.",
    requirements: [
      "Superior completo em Engenharia ou Administração",
      "Experiência em gestão operacional",
      "Liderança e visão estratégica",
      "Conhecimento do setor elétrico",
      "Inglês fluente"
    ],
    benefits: [
      "Vale alimentação",
      "Vale transporte",
      "Plano de saúde premium",
      "Carro da empresa",
      "Participação nos lucros"
    ],
    workload: "40h semanais",
    status: "active"
  },
  {
    id: "17",
    title: "Serviços Gerais",
    department: "Operacional",
    city: "Marabá",
    state: "PA",
    type: "CLT",
    posted: "2 dias",
    applicants: 35,
    description: "Atividades de limpeza, conservação e manutenção predial das instalações da empresa.",
    requirements: [
      "Ensino fundamental completo",
      "Experiência em serviços gerais",
      "Responsabilidade e organização",
      "Disponibilidade de horário",
      "Boa conduta"
    ],
    benefits: [
      "Vale alimentação",
      "Vale transporte",
      "Plano de saúde",
      "Participação nos lucros"
    ],
    workload: "44h semanais",
    status: "active"
  }
];

export const getJobById = (id: string): Job | undefined => {
  return mockJobs.find(job => job.id === id);
};

export const filterJobs = (jobs: Job[], filters: {
  search: string;
  city: string;
  state: string;
  department: string;
  type: string;
}) => {
  return jobs.filter(job => {
    const matchesSearch = !filters.search || 
      job.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      job.description.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesCity = !filters.city || job.city === filters.city;
    const matchesState = !filters.state || job.state === filters.state;
    const matchesDepartment = !filters.department || job.department === filters.department;
    const matchesType = !filters.type || job.type === filters.type;

    return matchesSearch && matchesCity && matchesState && matchesDepartment && matchesType;
  });
};
