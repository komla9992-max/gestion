# Guide de Configuration Git et GitHub

## Étape 1 : Configurer Git avec votre identité

Avant de connecter votre dépôt à GitHub, vous devez configurer Git avec votre nom et votre email.

### Remplacez ces valeurs par vos informations :
- VOTRE_NOM : Votre nom complet ou nom d'utilisateur GitHub
- VOTRE_EMAIL : Votre adresse email (celle associée à votre compte GitHub)

Exécutez ces commandes dans le terminal :

```powershell
git config --global user.name "VOTRE_NOM"
git config --global user.email "VOTRE_EMAIL"
```

## Étape 2 : Créer un dépôt sur GitHub

1. Allez sur https://github.com
2. Connectez-vous à votre compte
3. Cliquez sur le bouton "+" en haut à droite
4. Sélectionnez "New repository"
5. Donnez un nom à votre dépôt (ex: `securite-entretien-app`)
6. Choisissez Public ou Private selon vos préférences
7. **NE PAS** cocher "Initialize this repository with a README" (le dépôt existe déjà localement)
8. Cliquez sur "Create repository"

## Étape 3 : Connecter votre dépôt local à GitHub

GitHub vous donnera une URL. Il y a deux méthodes :

### Méthode 1 : HTTPS (Recommandée pour débutants)

1. Sur la page du nouveau dépôt GitHub, copiez l'URL HTTPS (ex: `https://github.com/VOTRE_USERNAME/securite-entretien-app.git`)

2. Dans votre terminal, exécutez :

```powershell
git remote add origin https://github.com/VOTRE_USERNAME/securite-entretien-app.git
```

3. Vérifiez que le remote est bien ajouté :

```powershell
git remote -v
```

### Méthode 2 : SSH (Plus sécurisée, nécessite une clé SSH)

Si vous préférez SSH, vous devez d'abord configurer une clé SSH.

## Étape 4 : Ajouter et committer vos fichiers

Avant de pousser vers GitHub, vous devez ajouter vos fichiers au dépôt :

```powershell
git add .
git commit -m "Initial commit: Application de gestion de sécurité et entretien"
```

## Étape 5 : Pousser vers GitHub

### Pour HTTPS :
Vous devrez vous authentifier avec un token d'accès personnel GitHub :

```powershell
git branch -M main
git push -u origin main
```

Quand GitHub vous demande vos identifiants :
- Username : Votre nom d'utilisateur GitHub
- Password : Un **Personal Access Token** (PAS votre mot de passe GitHub)

### Créer un Personal Access Token (PAT) :

1. Allez sur GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Cliquez sur "Generate new token (classic)"
3. Donnez un nom au token (ex: "PC Local")
4. Sélectionnez les permissions : cochez au minimum `repo`
5. Cliquez sur "Generate token"
6. **COPIEZ LE TOKEN** (vous ne pourrez plus le voir après)
7. Utilisez ce token comme mot de passe lors du `git push`

## Commandes utiles après la configuration initiale

```powershell
# Voir l'état des fichiers
git status

# Ajouter des fichiers modifiés
git add .

# Créer un commit
git commit -m "Description des modifications"

# Envoyer les modifications vers GitHub
git push

# Récupérer les modifications depuis GitHub
git pull
```

## Résumé rapide

```powershell
# 1. Configurer Git
git config --global user.name "Votre Nom"
git config --global user.email "votre.email@example.com"

# 2. Ajouter le remote GitHub
git remote add origin https://github.com/VOTRE_USERNAME/securite-entretien-app.git

# 3. Vérifier
git remote -v

# 4. Ajouter et committer
git add .
git commit -m "Initial commit"

# 5. Pousser vers GitHub
git branch -M main
git push -u origin main
```

## Dépannage

### Si vous avez déjà un remote "origin" :
```powershell
git remote remove origin
git remote add origin https://github.com/VOTRE_USERNAME/securite-entretien-app.git
```

### Pour changer l'URL du remote :
```powershell
git remote set-url origin https://github.com/VOTRE_USERNAME/securite-entretien-app.git
```

