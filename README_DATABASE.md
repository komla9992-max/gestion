# Base de données GESTION SES

Ce projet utilise maintenant une base de données SQLite avec un backend API Express pour gérer toutes les données de l'application.

## Structure

- **database/schema.sql** : Schéma SQL de la base de données
- **server/index.js** : Serveur API Express avec toutes les routes
- **database/gestion_ses.db** : Fichier de base de données SQLite (créé automatiquement)

## Installation

1. Installer les dépendances :
```bash
npm install
```

2. Démarrer le serveur API :
```bash
npm run server
```

Le serveur API démarrera sur `http://localhost:3001`

## Structure de la base de données

### Tables principales

- **users** : Utilisateurs de l'application
- **clients** : Clients de l'entreprise
- **employees** : Employés
- **contrats** : Contrats avec les clients
- **factures** : Factures émises
- **operations** : Opérations de caisse (entrées/sorties)
- **conges** : Demandes de congés
- **fiches_paie** : Fiches de paie des employés
- **avances** : Avances sur salaire
- **planning** : Planning des services

## API Endpoints

### Clients
- `GET /api/clients` - Liste tous les clients
- `GET /api/clients/:id` - Détails d'un client
- `POST /api/clients` - Créer un client
- `PUT /api/clients/:id` - Modifier un client
- `DELETE /api/clients/:id` - Supprimer un client

### Employés
- `GET /api/employees` - Liste tous les employés
- `GET /api/employees/:id` - Détails d'un employé
- `POST /api/employees` - Créer un employé
- `PUT /api/employees/:id` - Modifier un employé
- `DELETE /api/employees/:id` - Supprimer un employé

### Contrats
- `GET /api/contrats` - Liste tous les contrats
- `POST /api/contrats` - Créer un contrat
- `PUT /api/contrats/:id` - Modifier un contrat
- `DELETE /api/contrats/:id` - Supprimer un contrat

### Factures
- `GET /api/factures` - Liste toutes les factures
- `POST /api/factures` - Créer une facture
- `PUT /api/factures/:id` - Modifier une facture
- `DELETE /api/factures/:id` - Supprimer une facture

### Opérations de caisse
- `GET /api/operations` - Liste toutes les opérations
- `POST /api/operations` - Créer une opération
- `PUT /api/operations/:id` - Modifier une opération
- `DELETE /api/operations/:id` - Supprimer une opération

### Congés
- `GET /api/conges` - Liste tous les congés
- `POST /api/conges` - Créer un congé
- `PUT /api/conges/:id` - Modifier un congé
- `DELETE /api/conges/:id` - Supprimer un congé

### Fiches de paie
- `GET /api/fiches-paie` - Liste toutes les fiches de paie
- `POST /api/fiches-paie` - Créer une fiche de paie
- `PUT /api/fiches-paie/:id` - Modifier une fiche de paie
- `DELETE /api/fiches-paie/:id` - Supprimer une fiche de paie

### Avances
- `GET /api/avances` - Liste toutes les avances
- `POST /api/avances` - Créer une avance
- `PUT /api/avances/:id` - Modifier une avance
- `DELETE /api/avances/:id` - Supprimer une avance

### Planning
- `GET /api/planning` - Liste tout le planning
- `POST /api/planning` - Créer une entrée de planning
- `PUT /api/planning/:id` - Modifier une entrée de planning
- `DELETE /api/planning/:id` - Supprimer une entrée de planning

## Migration depuis localStorage

Pour migrer les données existantes depuis localStorage vers la base de données, vous devrez créer un script de migration qui :
1. Lit les données depuis localStorage
2. Les insère dans la base de données via l'API

## Notes

- La base de données SQLite est créée automatiquement au premier démarrage
- Le fichier de base de données est stocké dans `database/gestion_ses.db`
- Les relations entre tables sont gérées avec des clés étrangères
- Les index sont créés pour améliorer les performances des requêtes


