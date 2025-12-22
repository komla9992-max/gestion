# Script de déploiement PowerShell pour serveur VPS/Dédié avec Nginx
# Usage: .\deploy-server.ps1 -Server [IP] -Domain [DOMAINE] -User [USER] -Path [CHEMIN] -Port [PORT]
# Exemple: .\deploy-server.ps1 -Server "192.168.1.100" -Domain "monapp.com" -User "root" -Path "/var/www/html" -Port 22

param(
    [Parameter(Mandatory=$true)]
    [string]$Server,
    
    [Parameter(Mandatory=$true)]
    [string]$Domain,
    
    [Parameter(Mandatory=$false)]
    [string]$User = "root",
    
    [Parameter(Mandatory=$false)]
    [string]$Path = "/var/www/html",
    
    [Parameter(Mandatory=$false)]
    [int]$Port = 22
)

Write-Host "🚀 Déploiement sur serveur VPS - Sécurité Entretien App" -ForegroundColor Blue
Write-Host "==============================================================" -ForegroundColor Blue

# Vérifier si Node.js est installé
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js détecté: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js n'est pas installé. Veuillez l'installer depuis nodejs.org" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Installation des dépendances..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de l'installation des dépendances" -ForegroundColor Red
    exit 1
}

Write-Host "🏗️  Build du projet..." -ForegroundColor Yellow
npm run build

if (-not (Test-Path "dist")) {
    Write-Host "❌ Erreur: le dossier dist/ n'a pas été créé" -ForegroundColor Red
    exit 1
}

$distSize = (Get-ChildItem -Path "dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "✅ Build réussi !" -ForegroundColor Green
Write-Host "📁 Taille du dossier dist: $([math]::Round($distSize, 2)) MB" -ForegroundColor Blue

Write-Host "🌐 Déploiement sur le serveur..." -ForegroundColor Yellow
Write-Host "Serveur: ${User}@${Server}:${Port}" -ForegroundColor Blue
Write-Host "Destination: ${Path}" -ForegroundColor Blue

# Vérifier si SCP est disponible (via OpenSSH ou WinSCP)
$scpAvailable = $false
try {
    $scpTest = Get-Command scp -ErrorAction Stop
    $scpAvailable = $true
} catch {
    Write-Host "⚠️  SCP n'est pas disponible dans PowerShell" -ForegroundColor Yellow
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "1. Installer OpenSSH pour Windows (recommandé)" -ForegroundColor Cyan
    Write-Host "2. Utiliser WinSCP ou FileZilla manuellement" -ForegroundColor Cyan
    Write-Host "3. Utiliser WSL (Windows Subsystem for Linux)" -ForegroundColor Cyan
}

if ($scpAvailable) {
    Write-Host "📤 Transfert des fichiers via SCP..." -ForegroundColor Yellow
    
    # Créer le répertoire sur le serveur
    ssh -p $Port "${User}@${Server}" "mkdir -p ${Path}"
    
    # Copier les fichiers
    $scpCommand = "scp -P $Port -r dist/* ${User}@${Server}:${Path}/"
    Invoke-Expression $scpCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Fichiers transférés avec succès !" -ForegroundColor Green
    } else {
        Write-Host "❌ Erreur lors du transfert" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "📋 Instructions pour transfert manuel:" -ForegroundColor Yellow
    Write-Host "1. Ouvrez WinSCP ou FileZilla" -ForegroundColor Cyan
    Write-Host "2. Connectez-vous à: ${User}@${Server}:${Port}" -ForegroundColor Cyan
    Write-Host "3. Naviguez vers: ${Path}" -ForegroundColor Cyan
    Write-Host "4. Transférez TOUT le contenu du dossier dist/" -ForegroundColor Cyan
}

# Créer la configuration Nginx
Write-Host "📝 Génération de la configuration Nginx..." -ForegroundColor Yellow

$nginxConfig = @"
server {
    listen 80;
    server_name ${Domain} www.${Domain};
    root ${Path};
    index index.html;

    # Logs
    access_log /var/log/nginx/${Domain}-access.log;
    error_log /var/log/nginx/${Domain}-error.log;

    # Configuration pour SPA React
    location / {
        try_files `$uri `$uri/ /index.html;
    }

    # Cache pour les assets statiques
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Compression Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml application/rss+xml application/atom+xml image/svg+xml;

    # Sécurité
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
"@

$configFile = "nginx-$Domain.conf"
$nginxConfig | Out-File -FilePath $configFile -Encoding UTF8

Write-Host "✅ Configuration Nginx créée: $configFile" -ForegroundColor Green

Write-Host "`n📋 Instructions pour finaliser le déploiement:" -ForegroundColor Yellow
Write-Host "1. Copier la configuration Nginx sur le serveur:" -ForegroundColor Blue
Write-Host "   scp -P ${Port} ${configFile} ${User}@${Server}:/etc/nginx/sites-available/${Domain}" -ForegroundColor Green
Write-Host ""
Write-Host "2. Activer le site:" -ForegroundColor Blue
Write-Host "   ssh -p ${Port} ${User}@${Server} 'ln -s /etc/nginx/sites-available/${Domain} /etc/nginx/sites-enabled/'" -ForegroundColor Green
Write-Host ""
Write-Host "3. Tester la configuration Nginx:" -ForegroundColor Blue
Write-Host "   ssh -p ${Port} ${User}@${Server} 'nginx -t'" -ForegroundColor Green
Write-Host ""
Write-Host "4. Recharger Nginx:" -ForegroundColor Blue
Write-Host "   ssh -p ${Port} ${User}@${Server} 'systemctl reload nginx'" -ForegroundColor Green
Write-Host ""
Write-Host "5. Configurer SSL avec Let's Encrypt (optionnel mais recommandé):" -ForegroundColor Blue
Write-Host "   ssh -p ${Port} ${User}@${Server} 'apt-get install certbot python3-certbot-nginx'" -ForegroundColor Green
Write-Host "   ssh -p ${Port} ${User}@${Server} 'certbot --nginx -d ${Domain} -d www.${Domain}'" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Déploiement terminé !" -ForegroundColor Green
Write-Host "💡 Votre application devrait être accessible sur: http://${Domain}" -ForegroundColor Yellow



