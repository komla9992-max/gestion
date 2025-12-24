-- Schéma de base de données pour l'application GESTION SES
-- SQLite Database Schema

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'agent',
    permissions TEXT, -- JSON array
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des clients
CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    telephone TEXT,
    email TEXT,
    adresse TEXT,
    type TEXT DEFAULT 'entreprise', -- entreprise ou particulier
    contact_personne TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des employés
CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    telephone TEXT,
    email TEXT,
    type TEXT DEFAULT 'securite', -- securite, entretien, administratif
    date_embauche DATE,
    date_debauche DATE,
    salaire REAL,
    adresse TEXT,
    contact_urgence_nom TEXT,
    contact_urgence_telephone TEXT,
    contact_urgence_relation TEXT,
    documents TEXT, -- JSON array of documents
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des contrats
CREATE TABLE IF NOT EXISTS contrats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero TEXT,
    client_id INTEGER NOT NULL,
    date_debut DATE,
    date_fin DATE,
    montant REAL,
    type_service TEXT DEFAULT 'securite',
    statut TEXT DEFAULT 'actif', -- actif, termine, suspendu
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Table des factures
CREATE TABLE IF NOT EXISTS factures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero TEXT UNIQUE NOT NULL,
    client_id INTEGER NOT NULL,
    contrat_id INTEGER,
    date_emission DATE NOT NULL,
    date_echeance DATE,
    montant_ht REAL NOT NULL,
    taux_tva REAL DEFAULT 3, -- Taux RSPS
    montant_tva REAL, -- Montant RSPS
    montant_ttc REAL NOT NULL, -- Net à payer
    montant_paye REAL DEFAULT 0,
    statut TEXT DEFAULT 'non_payee', -- non_payee, partiellement_payee, payee
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (contrat_id) REFERENCES contrats(id) ON DELETE SET NULL
);

-- Table des opérations de caisse
CREATE TABLE IF NOT EXISTS operations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mode TEXT DEFAULT 'caisse', -- caisse ou banque
    type TEXT NOT NULL, -- entree ou sortie
    montant REAL NOT NULL,
    description TEXT,
    facture_id INTEGER,
    date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (facture_id) REFERENCES factures(id) ON DELETE SET NULL
);

-- Table des congés
CREATE TABLE IF NOT EXISTS conges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    type TEXT DEFAULT 'annuel', -- annuel, maladie, exceptionnel
    statut TEXT DEFAULT 'en_attente', -- en_attente, approuve, refuse
    commentaire TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Table des fiches de paie
CREATE TABLE IF NOT EXISTS fiches_paie (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    mois INTEGER NOT NULL, -- 1-12
    annee INTEGER NOT NULL,
    salaire_brut REAL NOT NULL,
    cotisations REAL DEFAULT 0,
    net_a_payer REAL NOT NULL,
    date_paiement DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE(employee_id, mois, annee)
);

-- Table des avances
CREATE TABLE IF NOT EXISTS avances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    montant REAL NOT NULL,
    date_demande DATE NOT NULL,
    date_remboursement DATE,
    statut TEXT DEFAULT 'en_attente', -- en_attente, approuve, rembourse
    commentaire TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Table du planning
CREATE TABLE IF NOT EXISTS planning (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    employee_id INTEGER NOT NULL,
    client_id INTEGER NOT NULL,
    heure_debut TIME NOT NULL,
    heure_fin TIME NOT NULL,
    description TEXT,
    type_service TEXT DEFAULT 'securite',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_clients_nom ON clients(nom);
CREATE INDEX IF NOT EXISTS idx_employees_nom ON employees(nom, prenom);
CREATE INDEX IF NOT EXISTS idx_factures_client ON factures(client_id);
CREATE INDEX IF NOT EXISTS idx_factures_numero ON factures(numero);
CREATE INDEX IF NOT EXISTS idx_operations_date ON operations(date);
CREATE INDEX IF NOT EXISTS idx_operations_type ON operations(type);
CREATE INDEX IF NOT EXISTS idx_planning_date ON planning(date);
CREATE INDEX IF NOT EXISTS idx_conges_employee ON conges(employee_id);


