import { supabase } from '@/integrations/supabase/client';

const CITY_COORDINATES: Record<string, [number, number]> = {
    // Capitais
    'São Paulo': [-23.5558, -46.6396],
    'Rio de Janeiro': [-22.9068, -43.1729],
    'Belo Horizonte': [-19.9191, -43.9386],
    'Salvador': [-12.9714, -38.5014],
    'Brasília': [-15.8267, -47.9218],
    'Fortaleza': [-3.7319, -38.5267],
    'Recife': [-8.0476, -34.8770],
    'Porto Alegre': [-30.0346, -51.2177],
    'Curitiba': [-25.4284, -49.2733],
    'Manaus': [-3.1190, -60.0217],
    'Belém': [-1.4558, -48.5044],
    'Goiânia': [-16.6869, -49.2648],
    'Vitória': [-20.2976, -40.2958],
    'Florianópolis': [-27.5954, -48.5480],
    'Natal': [-5.7945, -35.2110],
    'João Pessoa': [-7.1195, -34.8450],
    'Maceió': [-9.6658, -35.7353],
    'Teresina': [-5.0892, -42.8019],
    'Cuiabá': [-15.6014, -56.0979],
    'Campo Grande': [-20.4697, -54.6201],
    'Aracaju': [-10.9472, -37.0731],
    'São Luís': [-2.5387, -44.2827],
    'Palmas': [-10.1689, -48.3317],
    'Macapá': [0.0389, -51.0664],
    'Rio Branco': [-9.9754, -67.8249],
    'Porto Velho': [-8.7619, -63.9039],
    'Boa Vista': [2.8235, -60.6758],

    // Cidades importantes do Pará
    'Marabá': [-5.3686, -49.1178],
    'Castanhal': [-1.2939, -47.9261],
    'Santarém': [-2.4448, -54.7081],
    'Ananindeua': [-1.3656, -48.3722],
    'Parauapebas': [-6.0675, -49.9022],
    'Canaã dos Carajás': [-6.4969, -49.8778],
    'Cametá': [-2.2441, -49.4956],
    'Bragança': [-1.0539, -46.7656],
    'Altamira': [-3.2039, -52.2089],
    'Abaetetuba': [-1.7217, -48.8819],
    'Anajás': [-0.9889, -49.9406],
    'Placas': [-3.8681, -54.2125],
    'Medicilândia': [-3.4464, -52.8881],
    'Almeirim': [-1.5231, -52.5819],
    'Redenção': [-8.0256, -50.0319],
    'Tucuruí': [-3.7658, -49.6719],
    'Barcarena': [-1.5058, -48.6256],
    'Breves': [-1.6819, -50.4781],
    'Capanema': [-1.1958, -47.1819],
    'Conceição do Araguaia': [-8.2581, -49.2656],
    'Eldorado dos Carajás': [-6.1039, -49.3556],
    'Itaituba': [-4.2761, -55.9836],
    'Jacundá': [-4.4469, -49.1156],
    'Marituba': [-1.3431, -48.3419],
    'Moju': [-1.8831, -48.7681],
    'Oriximiná': [-1.7658, -55.8669],
    'Paragominas': [-3.0019, -47.3519],
    'Rondon do Pará': [-4.7769, -48.0656],
    'Salinópolis': [-0.6281, -47.3569],
    'Tailândia': [-2.9469, -48.9519],
    'Tucumã': [-6.7469, -51.1619],
    'Uruará': [-3.7158, -53.7381],
    'Vigia': [-0.8581, -48.1419],
    'Xinguara': [-7.0919, -49.9431],
    'Tomé-Açu': [-2.4181, -48.1506],
};

export const checkMissingCities = async () => {
    console.log('🔍 Verificando cidades sem coordenadas...\n');

    const { data: jobs, error } = await supabase
        .from('jobs')
        .select('city, state')
        .eq('status', 'active');

    if (error) {
        console.error('Erro ao buscar vagas:', error);
        return;
    }

    const cityCount = new Map<string, number>();
    const missingCities = new Map<string, { state: string; count: number }>();

    jobs.forEach(job => {
        if (!job.city || !job.state || job.city.toLowerCase() === 'remoto') {
            return;
        }

        const key = `${job.city}, ${job.state}`;
        cityCount.set(key, (cityCount.get(key) || 0) + 1);

        if (!CITY_COORDINATES[job.city]) {
            missingCities.set(job.city, {
                state: job.state,
                count: (missingCities.get(job.city)?.count || 0) + 1
            });
        }
    });

    if (missingCities.size === 0) {
        console.log('✅ Todas as cidades têm coordenadas mapeadas!');
        return;
    }

    console.log(`❌ ${missingCities.size} cidades SEM coordenadas:\n`);

    const sorted = Array.from(missingCities.entries()).sort((a, b) => b[1].count - a[1].count);

    sorted.forEach(([city, info]) => {
        console.log(`  - ${city}, ${info.state} (${info.count} vagas)`);
    });

    console.log('\n\n📋 Código para adicionar ao CITY_COORDINATES:\n');
    console.log("// Cidades faltantes:");
    sorted.forEach(([city, info]) => {
        console.log(`'${city}': [LAT, LON], // ${info.state} - ${info.count} vagas`);
    });

    console.log(`\n\n📊 Total: ${cityCount.size} cidades com vagas, ${missingCities.size} sem coordenadas`);
};

