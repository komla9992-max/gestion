# Script pour configurer le remote Git et pousser vers GitHub
# Usage: .\git-push.ps1

Write-Host "=== Configuration Git et Push vers GitHub ===" -ForegroundColor Cyan
Write-Host ""

# Vérifier si un remote existe déjà
$remoteExists = git remote -v 2>$null
if ($remoteExists) {
    Write-Host "Remote existant détecté:" -ForegroundColor Yellow
    git remote -v
    Write-Host ""
    $response = Read-Host "Voulez-vous remplacer le remote existant? (o/n)"
    if ($response -eq "o" -or $response -eq "O") {
        git remote remove origin
        Write-Host "Remote 'origin' supprimé." -ForegroundColor Green
    } else {
        Write-Host "Opération annulée." -ForegroundColor Yellow
        exit
    }
}

# Demander l'URL du dépôt GitHub
Write-Host "Entrez l'URL de votre dépôt GitHub:" -ForegroundColor Cyan
Write-Host "Exemple: https://github.com/VOTRE_USERNAME/securite-entretien-app.git" -ForegroundColor Gray
$repoUrl = Read-Host "URL du dépôt"

if ([string]::IsNullOrWhiteSpace($repoUrl)) {
    Write-Host "URL vide. Opération annulée." -ForegroundColor Red
    exit
}

# Ajouter le remote
Write-Host ""
Write-Host "Ajout du remote 'origin'..." -ForegroundColor Cyan
git remote add origin $repoUrl

# Vérifier que le remote est bien ajouté
Write-Host ""
Write-Host "Remote configuré:" -ForegroundColor Green
git remote -v

# Vérifier la branche actuelle
$currentBranch = git branch --show-current
Write-Host ""
Write-Host "Branche actuelle: $currentBranch" -ForegroundColor Cyan

# Demander confirmation avant le push
Write-Host ""
$response = Read-Host "Voulez-vous pousser vers GitHub maintenant? (o/n)"
if ($response -eq "o" -or $response -eq "O") {
    Write-Host ""
    Write-Host "Push vers GitHub..." -ForegroundColor Cyan
    Write-Host "Note: Vous devrez peut-être vous authentifier avec votre nom d'utilisateur GitHub et un Personal Access Token" -ForegroundColor Yellow
    Write-Host ""
    
    git push -u origin $currentBranch
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Push réussi!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "✗ Erreur lors du push. Vérifiez vos identifiants GitHub." -ForegroundColor Red
        Write-Host "Pour créer un Personal Access Token:" -ForegroundColor Yellow
        Write-Host "1. Allez sur GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)" -ForegroundColor Gray
        Write-Host "2. Cliquez sur 'Generate new token (classic)'" -ForegroundColor Gray
        Write-Host "3. Cochez la permission 'repo'" -ForegroundColor Gray
        Write-Host "4. Utilisez ce token comme mot de passe lors de l'authentification" -ForegroundColor Gray
    }
} else {
    Write-Host ""
    Write-Host "Pour pousser plus tard, exécutez:" -ForegroundColor Cyan
    Write-Host "git push -u origin $currentBranch" -ForegroundColor Gray
}








