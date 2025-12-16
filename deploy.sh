#!/bin/bash

# Script de déploiement pour Sécurité Entretien App
# Usage: ./deploy.sh [netlify|vercel|github|build]

echo "🚀 Script de déploiement - Sécurité Entretien App"
echo "=================================================="

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction pour build
build_project() {
    echo -e "${YELLOW}📦 Installation des dépendances...${NC}"
    npm install
    
    echo -e "${YELLOW}🏗️  Build du projet...${NC}"
    npm run build
    
    if [ -d "dist" ]; then
        echo -e "${GREEN}✅ Build réussi ! Le dossier dist/ est prêt.${NC}"
        echo -e "${GREEN}📁 Taille du dossier dist: $(du -sh dist | cut -f1)${NC}"
        return 0
    else
        echo -e "${RED}❌ Erreur lors du build${NC}"
        return 1
    fi
}

# Déterminer le mode de déploiement
MODE=${1:-build}

case $MODE in
    build)
        build_project
        echo -e "${YELLOW}💡 Pour déployer, utilisez:${NC}"
        echo -e "  - Netlify: glisser-déposer le dossier dist/ sur netlify.com"
        echo -e "  - Vercel: vercel --prod"
        echo -e "  - GitHub Pages: npm run deploy (si configuré)"
        ;;
    
    netlify)
        build_project
        if [ $? -eq 0 ]; then
            echo -e "${YELLOW}🌐 Déploiement sur Netlify...${NC}"
            if command -v netlify &> /dev/null; then
                netlify deploy --prod --dir=dist
            else
                echo -e "${RED}❌ Netlify CLI non installé${NC}"
                echo -e "${YELLOW}Installez-le avec: npm install -g netlify-cli${NC}"
                echo -e "${YELLOW}Ou glisser-déposer le dossier dist/ sur netlify.com${NC}"
            fi
        fi
        ;;
    
    vercel)
        build_project
        if [ $? -eq 0 ]; then
            echo -e "${YELLOW}🌐 Déploiement sur Vercel...${NC}"
            if command -v vercel &> /dev/null; then
                vercel --prod
            else
                echo -e "${RED}❌ Vercel CLI non installé${NC}"
                echo -e "${YELLOW}Installez-le avec: npm install -g vercel${NC}"
            fi
        fi
        ;;
    
    github)
        build_project
        if [ $? -eq 0 ]; then
            echo -e "${YELLOW}🌐 Déploiement sur GitHub Pages...${NC}"
            npm run deploy 2>/dev/null || echo -e "${RED}❌ Commande deploy non configurée. Voir DEPLOY.md${NC}"
        fi
        ;;
    
    *)
        echo -e "${RED}❌ Mode inconnu: $MODE${NC}"
        echo -e "${YELLOW}Usage: ./deploy.sh [build|netlify|vercel|github]${NC}"
        exit 1
        ;;
esac
 