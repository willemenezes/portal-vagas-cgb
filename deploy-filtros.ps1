Write-Host "Fazendo deploy das correções dos filtros..." -ForegroundColor Green
Set-Location "C:\CGB VAGAS"
git add .
git commit -m "feat: adicionar filtros CNH e tipo de veículo - padronizar com aba Candidatos"
git push origin main
Write-Host "Deploy concluído!" -ForegroundColor Green
Read-Host "Pressione Enter para continuar"
