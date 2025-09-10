@echo off
echo Fazendo deploy das correções dos filtros...
cd /d "C:\CGB VAGAS"
git add .
git commit -m "fix: corrigir layout dos filtros - padronizar com aba Candidatos"
git push origin main
echo Deploy concluído!
pause

