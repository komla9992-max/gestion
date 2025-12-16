# Guide de Déploiement - Sécurité Entretien App

## Informations sur le Projet

- **Type** : Application React avec Vite
- **Stockage de données** : localStorage (navigateur côté client)
- **Authentification** : localStorage

## ⚠️ Important à savoir

Cette application utilise **uniquement localStorage** pour stocker les données. Cela signifie :
- Les données sont stockées localement dans le navigateur de chaque utilisateur
- Les données ne sont **pas synchronisées** entre utilisateurs
- Si l'utilisateur vide le cache ou change de navigateur, les données seront perdues
- Pour un usage professionnel, il est recommandé d'ajouter un backend avec base de données

---

## Ce dont vous avez besoin pour déployer

### Option 1 : Déploiement statique (Recommandé pour commencer)

#### Prerequisites
1. **Node.js et npm** installés sur votre machine locale (pour le build)
2. **Un serveur web statique** ou un service d'hébergement gratuit :
   - Netlify (recommandé)
   - Vercel (recommandé)
   - GitHub Pages
   - Surge.sh
   - Un serveur Apache/Nginx classique

#### Étapes de déploiement

1. **Build du projet** (sur votre machine locale)
   ```bash
   npm install
   npm run build
   ```
   Cela génère un dossier `dist/` avec tous les fichiers statiques

2. **Déployer le dossier `dist/`** sur votre hébergeur

---

### Option 2 : Déploiement avec serveur web (Apache/Nginx)

#### Prérequis
- Un serveur VPS ou dédié avec :
  - Linux (Ubuntu/Debian recommandé)
  - Nginx ou Apache installé
  - SSH accessible

#### Fichiers nécessaires
- Le dossier `dist/` (après build)
- Configuration Nginx/Apache pour servir les fichiers statiques

---

### Option 3 : Déploiement avec Docker

#### Prérequis
- Docker installé
- Dockerfile (à créer)

---

## Détails pour chaque option

### 🔵 Netlify (Le plus simple - Gratuit)

1. **Build local** :
   ```bash
   npm run build
   ```

2. **Via l'interface Netlify** :
   - Créer un compte sur netlify.com
   - Glisser-déposer le dossier `dist/`
   - Votre site est en ligne !

3. **Via Netlify CLI** :
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify deploy --prod --dir=dist
   ```

**Avantages** :
- Gratuit
- HTTPS automatique
- Déploiement en quelques minutes
- Pas besoin de serveur

---

### 🟢 Vercel (Très simple - Gratuit)

1. **Via l'interface Vercel** :
   - Créer un compte sur vercel.com
   - Connecter votre dépôt Git (GitHub/GitLab)
   - Vercel détecte automatiquement Vite
   - Build et déploiement automatiques

2. **Via Vercel CLI** :
   ```bash
   npm install -g vercel
   vercel
   ```

**Configuration recommandée** :
- Framework Preset : Vite
- Build Command : `npm run build`
- Output Directory : `dist`

---

### 🟡 GitHub Pages

1. **Installer gh-pages** :
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Ajouter dans package.json** :
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   },
   "homepage": "https://votreusername.github.io/securite-entretien-app"
   ```

3. **Mettre à jour vite.config.js** :
   ```js
   export default defineConfig({
     plugins: [react()],
     base: '/securite-entretien-app/'  // Nom de votre repo
   })
   ```

4. **Déployer** :
   ```bash
   npm run deploy
   ```

---

### 🟠 Serveur VPS avec Nginx

#### Fichiers nécessaires
1. Le dossier `dist/` (après build)
2. Configuration Nginx

#### Étapes

1. **Build local** :
   ```bash
   npm run build
   ```

2. **Transférer les fichiers** (via SFTP/SCP) :
   ```bash
   scp -r dist/* user@votre-serveur.com:/var/www/html/
   ```

3. **Configuration Nginx** (`/etc/nginx/sites-available/securite-app`) :
   ```nginx
   server {
       listen 80;
       server_name votre-domaine.com;
       root /var/www/html;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       # Gzip compression
       gzip on;
       gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
   }
   ```

4. **Activer le site** :
   ```bash
   sudo ln -s /etc/nginx/sites-available/securite-app /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

---

## Commandes de build

```bash
# Installer les dépendances
npm install

# Build pour production
npm run build

# Prévisualiser le build localement
npm run preview
```

Le dossier `dist/` contiendra :
- `index.html`
- `assets/` (JS, CSS, images)
- Tous les fichiers statiques nécessaires

---

## Variables d'environnement (si nécessaire)

Si vous avez besoin de variables d'environnement, créez un fichier `.env` :

```env
VITE_APP_TITLE=Sécurité Entretien App
VITE_API_URL=https://api.example.com
```

Accès dans le code avec `import.meta.env.VITE_APP_TITLE`

---

## Recommandations pour la production

### ⚠️ Limitations actuelles

1. **localStorage** : 
   - Les données ne sont pas partagées entre utilisateurs
   - Perdues si le cache est vidé
   - Solution : Migrer vers une API backend + base de données

2. **Authentification** :
   - Stockée dans localStorage
   - Pas sécurisée pour un usage professionnel
   - Solution : Backend avec sessions JWT

3. **Sécurité** :
   - Pas de validation côté serveur
   - Solution : Ajouter un backend sécurisé

### ✅ Améliorations recommandées

Pour un déploiement professionnel :
1. Créer un backend API (Node.js/Express, Python/Flask, etc.)
2. Base de données (PostgreSQL, MySQL, MongoDB)
3. Authentification sécurisée (JWT, OAuth)
4. Validation et sécurité côté serveur
5. Backup automatique des données

---

## Support

Pour toute question sur le déploiement, consultez :
- [Documentation Vite](https://vitejs.dev/guide/static-deploy.html)
- [Documentation Netlify](https://docs.netlify.com/)
- [Documentation Vercel](https://vercel.com/docs)






