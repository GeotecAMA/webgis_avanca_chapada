@echo off
chcp 65001 >nul
REM Publica esta pasta no GitHub Pages. Pode ser executado quantas vezes quiser.
set REPO=https://github.com/GeotecAMA/webgis_avanca_chapada.git
cd /d "%~dp0"

if not exist ".git" (
    git init
    git branch -M main
)
REM O caminho no OneDrive passa de 260 caracteres
git config core.longpaths true
git config user.name >nul 2>&1 || git config user.name "GeotecAMA"
git config user.email >nul 2>&1 || git config user.email "GeotecAMA@users.noreply.github.com"
git remote get-url origin >nul 2>&1 || git remote add origin %REPO%

REM Se o repositorio ja tiver commits (ex.: upload pelo site), parte deles sem apagar nada local
git fetch origin main >nul 2>&1 && (
    git rev-parse --verify HEAD >nul 2>&1 || git reset origin/main
)

git add -A
git diff --cached --quiet && (
    echo Nada mudou desde a ultima publicacao.
) || (
    git commit -m "Atualizacao do WebGIS %date% %time%"
)
git push -u origin main

echo.
echo Site: https://geotecama.github.io/webgis_avanca_chapada/
pause
