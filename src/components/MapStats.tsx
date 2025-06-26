import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Briefcase, Building, TrendingUp } from 'lucide-react';
import { Job } from '@/hooks/useJobs';

interface MapStatsProps {
    jobs: Job[];
}

const MapStats: React.FC<MapStatsProps> = ({ jobs }) => {
    const stats = useMemo(() => {
        // Filtrar vagas válidas para o mapa (excluir remotas e banco de talentos)
        const validJobs = jobs.filter(job =>
            job.city &&
            job.state &&
            job.city.toLowerCase() !== 'remoto' &&
            job.title !== 'Banco de Talentos'
        );

        // Contar cidades únicas
        const cities = new Set(validJobs.map(job => job.city));

        // Contar estados únicos
        const states = new Set(validJobs.map(job => job.state));

        // Contar departamentos únicos
        const departments = new Set(validJobs.map(job => job.department));

        // Calcular distribuição por região
        const regionMap: Record<string, string[]> = {
            'Norte': ['AC', 'AP', 'AM', 'PA', 'RO', 'RR', 'TO'],
            'Nordeste': ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'],
            'Centro-Oeste': ['DF', 'GO', 'MT', 'MS'],
            'Sudeste': ['ES', 'MG', 'RJ', 'SP'],
            'Sul': ['PR', 'RS', 'SC']
        };

        const regionStats = Object.entries(regionMap).map(([region, statesList]) => {
            const jobsInRegion = validJobs.filter(job =>
                job.state && statesList.includes(job.state)
            );
            return {
                region,
                count: jobsInRegion.length,
                cities: new Set(jobsInRegion.map(job => job.city)).size
            };
        }).filter(stat => stat.count > 0);

        // Encontrar cidade com mais vagas
        const cityJobCount = validJobs.reduce((acc, job) => {
            if (job.city) {
                acc[job.city] = (acc[job.city] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        const topCity = Object.entries(cityJobCount).reduce((max, [city, count]) =>
            count > max.count ? { city, count } : max
            , { city: '', count: 0 });

        return {
            totalJobs: validJobs.length,
            citiesCount: cities.size,
            statesCount: states.size,
            departmentsCount: departments.size,
            regionStats,
            topCity
        };
    }, [jobs]);

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {/* Total de Vagas */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-700">Total de Vagas</p>
                            <p className="text-2xl font-bold text-blue-900">{stats.totalJobs}</p>
                        </div>
                        <Briefcase className="w-8 h-8 text-blue-600" />
                    </div>
                </CardContent>
            </Card>

            {/* Cidades */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-700">Cidades</p>
                            <p className="text-2xl font-bold text-green-900">{stats.citiesCount}</p>
                        </div>
                        <MapPin className="w-8 h-8 text-green-600" />
                    </div>
                </CardContent>
            </Card>

            {/* Estados */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-purple-700">Estados</p>
                            <p className="text-2xl font-bold text-purple-900">{stats.statesCount}</p>
                        </div>
                        <Building className="w-8 h-8 text-purple-600" />
                    </div>
                </CardContent>
            </Card>

            {/* Cidade Destaque */}
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-orange-700">Cidade Destaque</p>
                            <p className="text-lg font-bold text-orange-900 truncate" title={stats.topCity.city}>
                                {stats.topCity.city || 'N/A'}
                            </p>
                            <p className="text-xs text-orange-600">{stats.topCity.count} vagas</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-orange-600" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default MapStats; 