# Guide de Déploiement sur Serveur VPS/Dédié

Ce guide vous explique comment déployer l'application **Sécurité Entretien App** sur votre propre serveur avec un nom de domaine.

## 📋 Prérequis

- **Serveur VPS/Dédié** avec :
  - Linux (Ubuntu/Debian recommandé)
  - Nginx ou Apache installé
  - SSH activé
  - Accès root ou utilisateur avec droits sudo
- **Nom de domaine** pointant vers l'IP de votre serveur
- **Node.js et npm** installés sur votre machine locale (pour le build)

---

## 🚀 Méthode 1 : Déploiement Automatique (Recommandé)

### Étape 1 : Préparer le script de déploiement

Le script `deploy-server.sh` est prêt à l'emploi. Rendez-le exécutable :

```bash
chmod +x deploy-server.sh
```

### Étape 2 : Lancer le déploiement

```bash
./deploy-server.sh [IP_SERVEUR] [DOMAINE] [USER] [CHEMIN] [PORT_SSH]
```

**Exemple :**
```bash
./deploy-server.sh 192.168.1.100 monapp.com root /var/www/html 22
```

Le script va :
1. ✅ Installer les dépendances
2. ✅ Builder le projet
3. ✅ Transférer les fichiers sur le serveur
4. ✅ Générer une configuration Nginx

### Étape 3 : Configurer Nginx sur le serveur

Le script génère un fichier `nginx-[DOMAINE].conf`. Suivez ces étapes :

```bash
# 1. Copier la configuration sur le serveur
scp -P 22 nginx-monapp.com.conf root@192.168.1.100:/etc/nginx/sites-available/monapp.com

# 2. Se connecter au serveur
ssh root@192.168.1.100

# 3. Activer le site
ln -s /etc/nginx/sites-available/monapp.com /etc/nginx/sites-enabled/

# 4. Tester la configuration
nginx -t

# 5. Recharger Nginx
systemctl reload nginx
```

### Étape 4 : Configurer SSL (HTTPS) - Recommandé

```bash
# Installer Certbot
apt-get update
apt-get install certbot python3-certbot-nginx

# Obtenir un certificat SSL gratuit
certbot --nginx -d monapp.com -d www.monapp.com

# Le certificat sera renouvelé automatiquement
```

---

## 🔧 Méthode 2 : Déploiement Manuel

### Étape 1 : Build local

```bash
npm install
npm run build
```

Cela crée un dossier `dist/` avec tous les fichiers statiques.

### Étape 2 : Transférer les fichiers

```bash
# Via SCP
scp -r dist/* root@votre-serveur.com:/var/www/html/

# Ou via SFTP (FileZilla, WinSCP, etc.)
# Connectez-vous et transférez le contenu du dossier dist/
```

### Étape 3 : Configurer Nginx

Créez un fichier `/etc/nginx/sites-available/votre-domaine.com` :

```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;
    root /var/www/html;
    index index.html;

    # Logs
    access_log /var/log/nginx/votre-domaine-access.log;
    error_log /var/log/nginx/votre-domaine-error.log;

    # Configuration pour SPA React
    location / {
        try_files $uri $uri/ /index.html;
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
    gzip_types text/plain text/css text/xml text/javascript 
               application/javascript application/json application/xml 
               application/rss+xml application/atom+xml image/svg+xml;

    # Sécurité
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Activez le site :

```bash
ln -s /etc/nginx/sites-available/votre-domaine.com /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 🔧 Configuration Apache (Alternative)

Si vous utilisez Apache au lieu de Nginx :

### 1. Créer la configuration

Créez `/etc/apache2/sites-available/votre-domaine.com.conf` :

```apache
<VirtualHost *:80>
    ServerName votre-domaine.com
    ServerAlias www.votre-domaine.com
    DocumentRoot /var/www/html

    <Directory /var/www/html>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        # Configuration pour SPA React
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    # Compression
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/html text/plain text/xml 
        text/css text/javascript application/javascript application/json
    </IfModule>

    # Cache
    <IfModule mod_expires.c>
        ExpiresActive On
        ExpiresByType image/jpg "access plus 1 year"
        ExpiresByType image/jpeg "access plus 1 year"
        ExpiresByType image/gif "access plus 1 year"
        ExpiresByType image/png "access plus 1 year"
        ExpiresByType text/css "access plus 1 year"
        ExpiresByType application/javascript "access plus 1 year"
    </IfModule>

    ErrorLog ${APACHE_LOG_DIR}/votre-domaine-error.log
    CustomLog ${APACHE_LOG_DIR}/votre-domaine-access.log combined
</VirtualHost>
```

### 2. Activer les modules nécessaires

```bash
a2enmod rewrite
a2enmod expires
a2enmod deflate
a2ensite votre-domaine.com
systemctl reload apache2
```

---

## 🔒 Configuration du Pare-feu

Assurez-vous que les ports 80 (HTTP) et 443 (HTTPS) sont ouverts :

```bash
# UFW (Ubuntu)
ufw allow 80/tcp
ufw allow 443/tcp
ufw reload

# Ou iptables
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

---

## 🌐 Configuration DNS

Assurez-vous que votre nom de domaine pointe vers votre serveur :

1. **Enregistrement A** : `votre-domaine.com` → `IP_DU_SERVEUR`
2. **Enregistrement A** : `www.votre-domaine.com` → `IP_DU_SERVEUR`

Vous pouvez vérifier avec :
```bash
dig votre-domaine.com
# ou
nslookup votre-domaine.com
```

---

## 🔄 Mises à jour

Pour mettre à jour l'application après des modifications :

```bash
# 1. Build local
npm run build

# 2. Transférer les nouveaux fichiers
scp -r dist/* root@votre-serveur.com:/var/www/html/

# C'est tout ! L'application est mise à jour.
```

Ou utilisez le script :

```bash
./deploy-server.sh [IP] [DOMAINE] [USER] [CHEMIN] [PORT]
```

---

## ⚠️ Limitations Actuelles

Cette application utilise **localStorage** pour stocker les données, ce qui signifie :

- ✅ Les données sont stockées dans le navigateur de chaque utilisateur
- ❌ Les données ne sont **pas synchronisées** entre utilisateurs
- ❌ Les données sont perdues si l'utilisateur vide le cache
- ❌ Pas de backup automatique

**Pour un usage professionnel**, il est **fortement recommandé** de :
1. Créer un backend API (Node.js/Express, Python/Flask, etc.)
2. Utiliser une base de données (PostgreSQL, MySQL, MongoDB)
3. Implémenter une authentification sécurisée (JWT)
4. Ajouter des sauvegardes automatiques

---

## 🐛 Dépannage

### L'application ne s'affiche pas

1. Vérifiez que Nginx/Apache fonctionne :
   ```bash
   systemctl status nginx
   ```

2. Vérifiez les logs :
   ```bash
   tail -f /var/log/nginx/votre-domaine-error.log
   ```

3. Vérifiez les permissions :
   ```bash
   chown -R www-data:www-data /var/www/html
   chmod -R 755 /var/www/html
   ```

### Erreur 404 sur les routes React

Assurez-vous que la configuration `try_files` (Nginx) ou `RewriteRule` (Apache) est correcte pour les Single Page Applications.

### SSL ne fonctionne pas

Vérifiez que le certificat est valide :
```bash
certbot certificates
```

Renouvelez si nécessaire :
```bash
certbot renew
```

---

## 📞 Support

Pour toute question, consultez :
- [Documentation Nginx](https://nginx.org/en/docs/)
- [Documentation Apache](https://httpd.apache.org/docs/)
- [Documentation Let's Encrypt](https://letsencrypt.org/docs/)



