import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Briefcase, Users, ExternalLink } from 'lucide-react';
import { Job } from '@/hooks/useJobs';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import './JobsMap.css';

// Coordenadas das cidades brasileiras (expandida)
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
    'Abaetetuba': [-1.7217, -48.8819],
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

    // Cidades do Amapá
    'Laranjal do Jari': [-0.4578, -52.4825],
    'Santana': [0.0583, -51.1811],
    'Oiapoque': [3.8333, -51.8333],
    'Mazagão': [-0.1167, -51.2833],

    // Cidades importantes de São Paulo
    'Campinas': [-22.9099, -47.0626],
    'Santos': [-23.9618, -46.3322],
    'Ribeirão Preto': [-21.1775, -47.8208],
    'Sorocaba': [-23.5015, -47.4526],
    'Guarulhos': [-23.4543, -46.5339],
    'Osasco': [-23.5329, -46.7918],
    'São Bernardo do Campo': [-23.6914, -46.5646],
    'Santo André': [-23.6528, -46.5311],

    // Cidades importantes do Rio de Janeiro
    'Niterói': [-22.8833, -43.1036],
    'Nova Iguaçu': [-22.7592, -43.4511],
    'Duque de Caxias': [-22.7856, -43.3117],

    // Cidades importantes de Minas Gerais
    'Uberlândia': [-18.9113, -48.2622],
    'Contagem': [-19.9317, -44.0536],
    'Juiz de Fora': [-21.7642, -43.3503],

    // Cidades importantes do Sul
    'Caxias do Sul': [-29.1678, -51.1794],
    'Pelotas': [-31.7654, -52.3376],
    'Londrina': [-23.3045, -51.1696],
    'Maringá': [-23.4205, -51.9331],
    'Foz do Iguaçu': [-25.5478, -54.5882],
    'Joinville': [-26.3044, -48.8487],
    'Blumenau': [-26.9194, -49.0661],

    // Cidades importantes do Nordeste
    'Feira de Santana': [-12.2664, -38.9663],
    'Caruaru': [-8.2836, -35.9761],
    'Petrolina': [-9.3891, -40.5028],
    'Campina Grande': [-7.2306, -35.8811],
    'Mossoró': [-5.1875, -37.3439],
    'Sobral': [-3.6861, -40.3500],

    // Cidades importantes do Centro-Oeste
    'Anápolis': [-16.3281, -48.9531],
    'Várzea Grande': [-15.6467, -56.1325],
    'Dourados': [-22.2211, -54.8056],
};

// Criar ícone customizado
const createCustomIcon = (count: number) => {
    const color = count >= 5 ? '#dc2626' : count >= 3 ? '#ea580c' : count >= 2 ? '#d97706' : '#16a34a';

    return new Icon({
        iconUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.163 0 0 7.163 0 16c0 16 16 24 16 24s16-8 16-24C32 7.163 24.837 0 16 0z" fill="${color}"/>
        <circle cx="16" cy="16" r="8" fill="white"/>
        <text x="16" y="20" text-anchor="middle" fill="${color}" font-size="10" font-weight="bold">${count}</text>
      </svg>
    `)}`,
        iconSize: [32, 40],
        iconAnchor: [16, 40],
        popupAnchor: [0, -40],
    });
};

interface JobLocation {
    city: string;
    state: string;
    jobs: Job[];
    coordinates: [number, number];
}

interface JobsMapProps {
    jobs: Job[];
    onRefresh?: () => void;
}

const JobsMap: React.FC<JobsMapProps> = ({ jobs, onRefresh }) => {
    const [mapReady, setMapReady] = useState(false);
    const [jobLocations, setJobLocations] = useState<JobLocation[]>([]);
    const [isLoadingLocations, setIsLoadingLocations] = useState(true);

    useEffect(() => {
        const processJobs = async () => {
            setIsLoadingLocations(true);
            const locationMap = new Map<string, JobLocation>();
            const citiesToGeocode = new Set<string>();
            // Limpar cache de geocodificação para forçar nova busca com estado correto
            const geocodedCache: Record<string, [number, number]> = {};

            for (const job of jobs) {
                if (!job.city || !job.state || job.city.toLowerCase() === 'remoto' || job.title === 'Banco de Talentos') {
                    continue;
                }

                let coordinates = CITY_COORDINATES[job.city] || geocodedCache[job.city];

                if (!coordinates) {
                    citiesToGeocode.add(job.city);
                } else {
                    const key = `${job.city}-${job.state}`;
                    if (locationMap.has(key)) {
                        locationMap.get(key)!.jobs.push(job);
                    } else {
                        locationMap.set(key, {
                            city: job.city,
                            state: job.state,
                            jobs: [job],
                            coordinates
                        });
                    }
                }
            }

            if (citiesToGeocode.size > 0) {
                const promises = Array.from(citiesToGeocode).map(async (city) => {
                    try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(city)}&state=${encodeURIComponent(job.state)}&country=Brazil&format=json&limit=1`);
                        const data = await response.json();
                        if (data && data.length > 0) {
                            const { lat, lon, display_name } = data[0];
                            const coords: [number, number] = [parseFloat(lat), parseFloat(lon)];
                            console.log(`🗺️ Geocodificação: ${city}, ${job.state} -> ${display_name} (${coords[0]}, ${coords[1]})`);
                            geocodedCache[city] = coords;
                            return { city, coords };
                        }
                    } catch (error) {
                        console.error(`Falha ao geocodificar ${city}:`, error);
                    }
                    return null;
                });

                const results = await Promise.all(promises);

                results.forEach(result => {
                    if (result) {
                        jobs.forEach(job => {
                            if (job.city === result.city) {
                                const key = `${job.city}-${job.state}`;
                                if (locationMap.has(key)) {
                                    locationMap.get(key)!.jobs.push(job);
                                } else {
                                    locationMap.set(key, {
                                        city: job.city,
                                        state: job.state,
                                        jobs: [job],
                                        coordinates: result.coords
                                    });
                                }
                            }
                        });
                    }
                });

                localStorage.setItem('geocodedCities', JSON.stringify(geocodedCache));
            }

            setJobLocations(Array.from(locationMap.values()));
            setIsLoadingLocations(false);
        };

        processJobs();
    }, [jobs]);

    useEffect(() => {
        setMapReady(true);
    }, []);

    if (isLoadingLocations) {
        return (
            <div className="w-full h-96 bg-gray-100 rounded-xl flex items-center justify-center">
                <div className="text-center">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
                    <p className="text-gray-600">Atualizando localizações no mapa...</p>
                </div>
            </div>
        );
    }

    if (!mapReady) {
        return (
            <div className="w-full h-96 bg-gray-100 rounded-xl flex items-center justify-center">
                <div className="text-center">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Carregando mapa...</p>
                </div>
            </div>
        );
    }

    const center: LatLngExpression = [-14.2350, -51.9253]; // Centro do Brasil
    const zoom = 4;

    return (
        <div className="w-full h-96 rounded-xl overflow-hidden border border-gray-200 shadow-lg">
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {jobLocations.map((location, index) => (
                    <Marker
                        key={index}
                        position={location.coordinates}
                        icon={createCustomIcon(location.jobs.length)}
                    >
                        <Popup maxWidth={350} className="custom-popup">
                            <Card className="border-0 shadow-none">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <MapPin className="w-5 h-5 text-cgb-primary" />
                                        {location.city}, {location.state}
                                    </CardTitle>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Briefcase className="w-4 h-4" />
                                        <span>{location.jobs.length} {location.jobs.length === 1 ? 'vaga disponível' : 'vagas disponíveis'}</span>
                                    </div>
                                </CardHeader>

                                <CardContent className="pt-0">
                                    <div className="space-y-3 max-h-48 overflow-y-auto">
                                        {location.jobs.slice(0, 3).map((job) => (
                                            <div key={job.id} className="p-3 bg-gray-50 rounded-lg">
                                                <h4 className="font-semibold text-sm text-gray-900 mb-1">
                                                    {job.title}
                                                </h4>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge variant="secondary" className="text-xs">
                                                        {job.type}
                                                    </Badge>
                                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                                        <Users className="w-3 h-3" />
                                                        {job.applicants || 0} candidatos
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                                                    {job.description}
                                                </p>
                                                <Link
                                                    to={`/vaga/${job.id}`}
                                                    className="inline-flex items-center gap-1 text-xs text-cgb-primary hover:text-cgb-primary-dark font-medium"
                                                >
                                                    Ver detalhes
                                                    <ExternalLink className="w-3 h-3" />
                                                </Link>
                                            </div>
                                        ))}

                                        {location.jobs.length > 3 && (
                                            <div className="text-center pt-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-xs"
                                                    onClick={() => {
                                                        // Scroll para a seção de vagas e filtrar por cidade
                                                        document.getElementById('all-jobs')?.scrollIntoView({ behavior: 'smooth' });
                                                    }}
                                                >
                                                    Ver todas as {location.jobs.length} vagas
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default JobsMap; 