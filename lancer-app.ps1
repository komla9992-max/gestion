# Script de lancement - Application Sécurité Entretien
$appFolder = $PSScriptRoot
Set-Location $appFolder

Write-Host "=== Application Sécurité Entretien ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Démarrage du serveur de développement..." -ForegroundColor Yellow
Write-Host ""
Write-Host "L'application sera accessible sur: http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "Pour arrêter l'application:" -ForegroundColor Gray
Write-Host "  - Fermez cette fenêtre" -ForegroundColor Gray
Write-Host "  - Ou appuyez sur Ctrl+C" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si Node.js est installé
try {
    node --version | Out-Null
} catch {
    Write-Host "✗ Node.js n'est pas installé!" -ForegroundColor Red
    Write-Host "Veuillez installer Node.js depuis https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

# Vérifier si les dépendances sont installées
if (-not (Test-Path "node_modules")) {
    Write-Host "Installation des dépendances..." -ForegroundColor Yellow
    npm install
}

Write-Host "Le navigateur s'ouvrira automatiquement..." -ForegroundColor Green
Write-Host ""

# Lancer le serveur de développement avec ouverture automatique du navigateur
npm run dev


