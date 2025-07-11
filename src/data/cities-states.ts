// Mapeamento de cidades principais por estado
export const CITIES_BY_STATE = {
    AC: ['Rio Branco', 'Cruzeiro do Sul', 'Sena Madureira', 'Tarauacá'],
    AL: ['Maceió', 'Arapiraca', 'Palmeira dos Índios', 'Rio Largo'],
    AP: ['Macapá', 'Santana', 'Laranjal do Jari', 'Oiapoque'],
    AM: ['Manaus', 'Parintins', 'Itacoatiara', 'Manacapuru'],
    BA: ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Juazeiro', 'Ilhéus'],
    CE: ['Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Maracanaú', 'Sobral'],
    DF: ['Brasília', 'Taguatinga', 'Ceilândia', 'Planaltina'],
    ES: ['Vitória', 'Vila Velha', 'Cariacica', 'Serra', 'Cachoeiro de Itapemirim'],
    GO: ['Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde', 'Luziânia'],
    MA: ['São Luís', 'Imperatriz', 'São José de Ribamar', 'Timon', 'Caxias'],
    MT: ['Cuiabá', 'Várzea Grande', 'Rondonópolis', 'Sinop', 'Tangará da Serra'],
    MS: ['Campo Grande', 'Dourados', 'Três Lagoas', 'Corumbá', 'Ponta Porã'],
    MG: ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim', 'Montes Claros'],
    PA: ['Belém', 'Ananindeua', 'Santarém', 'Marabá', 'Parauapebas', 'Castanhal'],
    PB: ['João Pessoa', 'Campina Grande', 'Santa Rita', 'Patos', 'Bayeux'],
    PR: ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel', 'São José dos Pinhais'],
    PE: ['Recife', 'Jaboatão dos Guararapes', 'Olinda', 'Caruaru', 'Petrolina'],
    PI: ['Teresina', 'Parnaíba', 'Picos', 'Piripiri', 'Floriano'],
    RJ: ['Rio de Janeiro', 'São Gonçalo', 'Duque de Caxias', 'Nova Iguaçu', 'Niterói', 'Campos dos Goytacazes'],
    RN: ['Natal', 'Mossoró', 'Parnamirim', 'São Gonçalo do Amarante', 'Macaíba'],
    RS: ['Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Canoas', 'Santa Maria', 'Gravataí'],
    RO: ['Porto Velho', 'Ji-Paraná', 'Ariquemes', 'Vilhena', 'Cacoal'],
    RR: ['Boa Vista', 'Rorainópolis', 'Caracaraí', 'Alto Alegre'],
    SC: ['Florianópolis', 'Joinville', 'Blumenau', 'São José', 'Criciúma', 'Chapecó'],
    SP: ['São Paulo', 'Guarulhos', 'Campinas', 'São Bernardo do Campo', 'Santo André', 'Osasco', 'Sorocaba', 'Ribeirão Preto'],
    SE: ['Aracaju', 'Nossa Senhora do Socorro', 'Lagarto', 'Itabaiana'],
    TO: ['Palmas', 'Araguaína', 'Gurupi', 'Porto Nacional', 'Paraíso do Tocantins']
} as const;

// Função para obter o estado de uma cidade
export const getStateByCity = (cityName: string): string | null => {
    const normalizedCity = cityName.toLowerCase().trim();

    for (const [state, cities] of Object.entries(CITIES_BY_STATE)) {
        const found = cities.find(city =>
            city.toLowerCase() === normalizedCity
        );
        if (found) {
            return state;
        }
    }

    return null;
};

// Função para validar se cidade pertence ao estado
export const validateCityState = (city: string, state: string): boolean => {
    const normalizedCity = city.toLowerCase().trim();
    const cities = CITIES_BY_STATE[state as keyof typeof CITIES_BY_STATE];

    if (!cities) return false;

    return cities.some(cityInState =>
        cityInState.toLowerCase() === normalizedCity
    );
};

// Lista de estados
export const STATES = [
    { code: 'AC', name: 'Acre' },
    { code: 'AL', name: 'Alagoas' },
    { code: 'AP', name: 'Amapá' },
    { code: 'AM', name: 'Amazonas' },
    { code: 'BA', name: 'Bahia' },
    { code: 'CE', name: 'Ceará' },
    { code: 'DF', name: 'Distrito Federal' },
    { code: 'ES', name: 'Espírito Santo' },
    { code: 'GO', name: 'Goiás' },
    { code: 'MA', name: 'Maranhão' },
    { code: 'MT', name: 'Mato Grosso' },
    { code: 'MS', name: 'Mato Grosso do Sul' },
    { code: 'MG', name: 'Minas Gerais' },
    { code: 'PA', name: 'Pará' },
    { code: 'PB', name: 'Paraíba' },
    { code: 'PR', name: 'Paraná' },
    { code: 'PE', name: 'Pernambuco' },
    { code: 'PI', name: 'Piauí' },
    { code: 'RJ', name: 'Rio de Janeiro' },
    { code: 'RN', name: 'Rio Grande do Norte' },
    { code: 'RS', name: 'Rio Grande do Sul' },
    { code: 'RO', name: 'Rondônia' },
    { code: 'RR', name: 'Roraima' },
    { code: 'SC', name: 'Santa Catarina' },
    { code: 'SP', name: 'São Paulo' },
    { code: 'SE', name: 'Sergipe' },
    { code: 'TO', name: 'Tocantins' }
] as const;

// Exportação no formato esperado pelo LegalDataForm
export const states = STATES.reduce((acc, state) => {
    acc[state.code] = state.name;
    return acc;
}, {} as Record<string, string>);

// Exportação das cidades no formato esperado
export const cities = CITIES_BY_STATE; 