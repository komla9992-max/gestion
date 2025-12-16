#!/bin/bash

# Script de déploiement pour serveur VPS/Dédié avec Nginx
# Usage: ./deploy-server.sh [serveur] [domaine] [utilisateur] [chemin]
# Exemple: ./deploy-server.sh 192.168.1.100 example.com root /var/www/html

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Déploiement sur serveur VPS - Sécurité Entretien App${NC}"
echo "=============================================================="

# Variables (à remplir par l'utilisateur)
SERVER=${1:-""}
DOMAIN=${2:-""}
USER=${3:-"root"}
DEST_PATH=${4:-"/var/www/html"}
SSH_PORT=${5:-"22"}

if [ -z "$SERVER" ] || [ -z "$DOMAIN" ]; then
    echo -e "${YELLOW}Usage: ./deploy-server.sh [IP_SERVEUR] [DOMAINE] [USER] [CHEMIN] [PORT_SSH]${NC}"
    echo -e "${YELLOW}Exemple: ./deploy-server.sh 192.168.1.100 monapp.com root /var/www/html 22${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Installation des dépendances...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors de l'installation des dépendances${NC}"
    exit 1
fi

echo -e "${YELLOW}🏗️  Build du projet...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Erreur: le dossier dist/ n'a pas été créé${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build réussi !${NC}"
echo -e "${BLUE}📁 Taille du dossier dist: $(du -sh dist | cut -f1)${NC}"

echo -e "${YELLOW}🌐 Déploiement sur le serveur...${NC}"
echo -e "${BLUE}Serveur: ${USER}@${SERVER}:${SSH_PORT}${NC}"
echo -e "${BLUE}Destination: ${DEST_PATH}${NC}"

# Créer le répertoire de destination sur le serveur
ssh -p $SSH_PORT ${USER}@${SERVER} "mkdir -p ${DEST_PATH}"

# Copier les fichiers
echo -e "${YELLOW}📤 Transfert des fichiers...${NC}"
scp -P $SSH_PORT -r dist/* ${USER}@${SERVER}:${DEST_PATH}/

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Fichiers transférés avec succès !${NC}"
else
    echo -e "${RED}❌ Erreur lors du transfert${NC}"
    exit 1
fi

# Créer la configuration Nginx
echo -e "${YELLOW}📝 Génération de la configuration Nginx...${NC}"

NGINX_CONFIG="server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    root ${DEST_PATH};
    index index.html;

    # Logs
    access_log /var/log/nginx/${DOMAIN}-access.log;
    error_log /var/log/nginx/${DOMAIN}-error.log;

    # Configuration pour SPA React
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Cache pour les assets statiques
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control \"public, immutable\";
    }

    # Compression Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml application/rss+xml application/atom+xml image/svg+xml;

    # Sécurité
    add_header X-Frame-Options \"SAMEORIGIN\" always;
    add_header X-Content-Type-Options \"nosniff\" always;
    add_header X-XSS-Protection \"1; mode=block\" always;
}"

echo "$NGINX_CONFIG" > nginx-${DOMAIN}.conf
echo -e "${GREEN}✅ Configuration Nginx créée: nginx-${DOMAIN}.conf${NC}"

echo -e "${YELLOW}📋 Instructions pour finaliser le déploiement:${NC}"
echo -e "${BLUE}1. Copier la configuration Nginx sur le serveur:${NC}"
echo -e "   ${GREEN}scp -P ${SSH_PORT} nginx-${DOMAIN}.conf ${USER}@${SERVER}:/etc/nginx/sites-available/${DOMAIN}${NC}"
echo ""
echo -e "${BLUE}2. Activer le site:${NC}"
echo -e "   ${GREEN}ssh -p ${SSH_PORT} ${USER}@${SERVER} 'ln -s /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/'${NC}"
echo ""
echo -e "${BLUE}3. Tester la configuration Nginx:${NC}"
echo -e "   ${GREEN}ssh -p ${SSH_PORT} ${USER}@${SERVER} 'nginx -t'${NC}"
echo ""
echo -e "${BLUE}4. Recharger Nginx:${NC}"
echo -e "   ${GREEN}ssh -p ${SSH_PORT} ${USER}@${SERVER} 'systemctl reload nginx'${NC}"
echo ""
echo -e "${BLUE}5. Configurer SSL avec Let's Encrypt (optionnel mais recommandé):${NC}"
echo -e "   ${GREEN}ssh -p ${SSH_PORT} ${USER}@${SERVER} 'apt-get install certbot python3-certbot-nginx'${NC}"
echo -e "   ${GREEN}ssh -p ${SSH_PORT} ${USER}@${SERVER} 'certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}'${NC}"
echo ""
echo -e "${GREEN}✅ Déploiement terminé !${NC}"
echo -e "${YELLOW}💡 Votre application devrait être accessible sur: http://${DOMAIN}${NC}"



