import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://bkpaxqznhkcaqrsigbqk.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrcGF4cXpuaGtjYXFyc2lnYnFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyNzE3MzgsImV4cCI6MjA1MTg0NzczOH0.e5oKo3Csh0hjUCpfSkC9JRYdvYAWCbEo4Hf70I97hxA'
);

const { data, error } = await supabase
    .from('jobs')
    .select('city, state')
    .eq('status', 'active');

if (error) {
    console.error('Erro:', error);
    process.exit(1);
}

const cityMap = new Map();

data.forEach(job => {
    if (job.city && job.state && job.city.toLowerCase() !== 'remoto') {
        const key = `${job.city}, ${job.state}`;
        cityMap.set(key, (cityMap.get(key) || 0) + 1);
    }
});

const cities = Array.from(cityMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

console.log('\n=== CIDADES COM VAGAS ATIVAS ===\n');
cities.forEach(([city, count]) => {
    console.log(`${city} (${count} vagas)`);
});

console.log(`\n\nTotal: ${cities.length} cidades com vagas`);

