# Script d'installation - Application Securite Entretien
# Ce script installe l'application sur votre ordinateur

Write-Host "=== Installation de l'Application Securite Entretien ===" -ForegroundColor Cyan
Write-Host ""

$appName = "Securite Entretien"
$desktopPath = [Environment]::GetFolderPath("Desktop")
$startMenuPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs"
$appFolder = $PSScriptRoot
$launcherPath = Join-Path $appFolder "lancer-app.ps1"

# Verifier si Node.js est installe
Write-Host "Verification de Node.js..." -ForegroundColor Yellow
$nodeCheck = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCheck) {
    $nodeVersion = node --version
    Write-Host "Node.js installe: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "Node.js n'est pas installe!" -ForegroundColor Red
    Write-Host "Veuillez installer Node.js depuis https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Appuyez sur Entree pour quitter"
    exit 1
}

# Verifier si les dependances sont installees
Write-Host ""
Write-Host "Verification des dependances..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "Installation des dependances..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erreur lors de l'installation des dependances" -ForegroundColor Red
        exit 1
    }
    Write-Host "Dependances installees" -ForegroundColor Green
} else {
    Write-Host "Dependances deja installees" -ForegroundColor Green
}

# Creer le build de production
Write-Host ""
Write-Host "Creation du build de production..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors du build" -ForegroundColor Red
    exit 1
}
Write-Host "Build cree avec succes" -ForegroundColor Green

# Le script de lancement existe deja, pas besoin de le recreer
Write-Host ""
Write-Host "Script de lancement pret" -ForegroundColor Green

# Creer un raccourci sur le bureau
Write-Host ""
Write-Host "Creation du raccourci sur le bureau..." -ForegroundColor Yellow
$shortcutPath = Join-Path $desktopPath "$appName.lnk"
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "powershell.exe"
$shortcut.Arguments = "-NoExit -ExecutionPolicy Bypass -File `"$launcherPath`""
$shortcut.WorkingDirectory = $appFolder
$shortcut.Description = "Lancer l'application $appName"
$shortcut.IconLocation = "powershell.exe"
$shortcut.Save()
Write-Host "Raccourci cree sur le bureau: $appName.lnk" -ForegroundColor Green

# Creer un raccourci dans le menu Demarrer
Write-Host ""
Write-Host "Creation du raccourci dans le menu Demarrer..." -ForegroundColor Yellow
if (-not (Test-Path $startMenuPath)) {
    New-Item -ItemType Directory -Path $startMenuPath -Force | Out-Null
}
$startMenuShortcutPath = Join-Path $startMenuPath "$appName.lnk"
$startMenuShortcut = $shell.CreateShortcut($startMenuShortcutPath)
$startMenuShortcut.TargetPath = "powershell.exe"
$startMenuShortcut.Arguments = "-NoExit -ExecutionPolicy Bypass -File `"$launcherPath`""
$startMenuShortcut.WorkingDirectory = $appFolder
$startMenuShortcut.Description = "Lancer l'application $appName"
$startMenuShortcut.IconLocation = "powershell.exe"
$startMenuShortcut.Save()
Write-Host "Raccourci cree dans le menu Demarrer" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installation terminee avec succes!" -ForegroundColor Green
Write-Host ""
Write-Host "L'application est maintenant installee sur votre ordinateur." -ForegroundColor White
Write-Host ""
Write-Host "Pour lancer l'application:" -ForegroundColor Yellow
Write-Host "  1. Double-cliquez sur le raccourci sur votre bureau" -ForegroundColor Gray
Write-Host "  2. Ou utilisez le menu Demarrer" -ForegroundColor Gray
Write-Host "  3. Ou executez: .\lancer-app.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "L'application sera accessible sur: http://localhost:5173" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Read-Host "Appuyez sur Entree pour quitter"
