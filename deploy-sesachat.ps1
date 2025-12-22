# Script de deploiement pour sesachat.com
# Serveur: 213.136.93.42
# Domaine: sesachat.com

Write-Host "=== Deploiement sur sesachat.com ===" -ForegroundColor Cyan
Write-Host ""

$Server = "213.136.93.42"
$Domain = "sesachat.com"
$User = "root"
$Path = "/var/www/html"
$Port = 22

# Verifier si Node.js est installe
try {
    $nodeVersion = node --version
    Write-Host "Node.js detecte: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js n'est pas installe!" -ForegroundColor Red
    exit 1
}

# Build du projet
Write-Host "Build du projet..." -ForegroundColor Yellow
npm run build

if (-not (Test-Path "dist")) {
    Write-Host "Erreur: le dossier dist/ n'a pas ete cree" -ForegroundColor Red
    exit 1
}

Write-Host "Build reussi!" -ForegroundColor Green
Write-Host ""

# Instructions pour le transfert
Write-Host "=== Instructions de deploiement ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Transferez le contenu du dossier dist/ vers le serveur:" -ForegroundColor Yellow
Write-Host "   scp -P $Port -r dist/* ${User}@${Server}:${Path}/" -ForegroundColor Green
Write-Host ""
Write-Host "2. Connectez-vous au serveur:" -ForegroundColor Yellow
Write-Host "   ssh -p $Port ${User}@${Server}" -ForegroundColor Green
Write-Host ""
Write-Host "3. Sur le serveur, configurez Nginx:" -ForegroundColor Yellow
Write-Host "   sudo nano /etc/nginx/sites-available/${Domain}" -ForegroundColor Green
Write-Host ""
Write-Host "4. Ajoutez cette configuration:" -ForegroundColor Yellow
Write-Host ""
$nginxConfig = @"
server {
    listen 80;
    server_name ${Domain} www.${Domain};
    root ${Path};
    index index.html;

    location / {
        try_files `$uri `$uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml;
}
"@
Write-Host $nginxConfig -ForegroundColor Gray
Write-Host ""
Write-Host "5. Activez le site:" -ForegroundColor Yellow
Write-Host "   sudo ln -s /etc/nginx/sites-available/${Domain} /etc/nginx/sites-enabled/" -ForegroundColor Green
Write-Host ""
Write-Host "6. Testez et rechargez Nginx:" -ForegroundColor Yellow
Write-Host "   sudo nginx -t" -ForegroundColor Green
Write-Host "   sudo systemctl reload nginx" -ForegroundColor Green
Write-Host ""
Write-Host "7. (Optionnel) Configurez SSL avec Let's Encrypt:" -ForegroundColor Yellow
Write-Host "   sudo certbot --nginx -d ${Domain} -d www.${Domain}" -ForegroundColor Green
Write-Host ""
Write-Host "=== Fin des instructions ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Votre application sera accessible sur: http://${Domain}" -ForegroundColor Green

