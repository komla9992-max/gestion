// Backend API Server pour GESTION SES
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Chemin vers la base de données
const DB_PATH = path.join(__dirname, '..', 'database', 'gestion_ses.db');

// Créer le dossier database s'il n'existe pas
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialiser la base de données
function initDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Erreur lors de l\'ouverture de la base de données:', err);
        reject(err);
        return;
      }
      console.log('Base de données connectée');
    });

    // Lire et exécuter le schéma SQL
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    db.exec(schema, (err) => {
      if (err) {
        console.error('Erreur lors de l\'initialisation du schéma:', err);
        reject(err);
        return;
      }
      console.log('Schéma de base de données initialisé');
      resolve(db);
    });
  });
}

// Fonction helper pour exécuter des requêtes
function dbQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);
    db.all(sql, params, (err, rows) => {
      db.close();
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);
    db.run(sql, params, function(err) {
      db.close();
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

// Routes pour les clients
app.get('/api/clients', async (req, res) => {
  try {
    const clients = await dbQuery('SELECT * FROM clients ORDER BY created_at DESC');
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/clients/:id', async (req, res) => {
  try {
    const clients = await dbQuery('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    if (clients.length === 0) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }
    res.json(clients[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/clients', async (req, res) => {
  try {
    const { nom, telephone, email, adresse, type, contact_personne } = req.body;
    const result = await dbRun(
      'INSERT INTO clients (nom, telephone, email, adresse, type, contact_personne) VALUES (?, ?, ?, ?, ?, ?)',
      [nom, telephone || null, email || null, adresse || null, type || 'entreprise', contact_personne || null]
    );
    const client = await dbQuery('SELECT * FROM clients WHERE id = ?', [result.id]);
    res.status(201).json(client[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/clients/:id', async (req, res) => {
  try {
    const { nom, telephone, email, adresse, type, contact_personne } = req.body;
    await dbRun(
      'UPDATE clients SET nom = ?, telephone = ?, email = ?, adresse = ?, type = ?, contact_personne = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [nom, telephone || null, email || null, adresse || null, type || 'entreprise', contact_personne || null, req.params.id]
    );
    const client = await dbQuery('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    res.json(client[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/clients/:id', async (req, res) => {
  try {
    await dbRun('DELETE FROM clients WHERE id = ?', [req.params.id]);
    res.json({ message: 'Client supprimé' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes pour les employés
app.get('/api/employees', async (req, res) => {
  try {
    const employees = await dbQuery('SELECT * FROM employees ORDER BY created_at DESC');
    // Parser les documents JSON
    const parsed = employees.map(emp => ({
      ...emp,
      documents: emp.documents ? JSON.parse(emp.documents) : []
    }));
    res.json(parsed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/employees/:id', async (req, res) => {
  try {
    const employees = await dbQuery('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    if (employees.length === 0) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }
    const emp = employees[0];
    emp.documents = emp.documents ? JSON.parse(emp.documents) : [];
    res.json(emp);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const {
      nom, prenom, telephone, email, type, date_embauche, date_debauche,
      salaire, adresse, contact_urgence_nom, contact_urgence_telephone,
      contact_urgence_relation, documents
    } = req.body;
    
    const documentsJson = documents ? JSON.stringify(documents) : null;
    
    const result = await dbRun(
      `INSERT INTO employees (
        nom, prenom, telephone, email, type, date_embauche, date_debauche,
        salaire, adresse, contact_urgence_nom, contact_urgence_telephone,
        contact_urgence_relation, documents
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nom, prenom, telephone || null, email || null, type || 'securite',
        date_embauche || null, date_debauche || null, salaire || null,
        adresse || null, contact_urgence_nom || null, contact_urgence_telephone || null,
        contact_urgence_relation || null, documentsJson
      ]
    );
    
    const employee = await dbQuery('SELECT * FROM employees WHERE id = ?', [result.id]);
    const emp = employee[0];
    emp.documents = emp.documents ? JSON.parse(emp.documents) : [];
    res.status(201).json(emp);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  try {
    const {
      nom, prenom, telephone, email, type, date_embauche, date_debauche,
      salaire, adresse, contact_urgence_nom, contact_urgence_telephone,
      contact_urgence_relation, documents
    } = req.body;
    
    const documentsJson = documents ? JSON.stringify(documents) : null;
    
    await dbRun(
      `UPDATE employees SET
        nom = ?, prenom = ?, telephone = ?, email = ?, type = ?,
        date_embauche = ?, date_debauche = ?, salaire = ?, adresse = ?,
        contact_urgence_nom = ?, contact_urgence_telephone = ?,
        contact_urgence_relation = ?, documents = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        nom, prenom, telephone || null, email || null, type || 'securite',
        date_embauche || null, date_debauche || null, salaire || null,
        adresse || null, contact_urgence_nom || null, contact_urgence_telephone || null,
        contact_urgence_relation || null, documentsJson, req.params.id
      ]
    );
    
    const employee = await dbQuery('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    const emp = employee[0];
    emp.documents = emp.documents ? JSON.parse(emp.documents) : [];
    res.json(emp);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    await dbRun('DELETE FROM employees WHERE id = ?', [req.params.id]);
    res.json({ message: 'Employé supprimé' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes pour les contrats
app.get('/api/contrats', async (req, res) => {
  try {
    const contrats = await dbQuery('SELECT * FROM contrats ORDER BY created_at DESC');
    res.json(contrats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/contrats', async (req, res) => {
  try {
    const { numero, client_id, date_debut, date_fin, montant, type_service, statut } = req.body;
    const result = await dbRun(
      'INSERT INTO contrats (numero, client_id, date_debut, date_fin, montant, type_service, statut) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [numero || null, client_id, date_debut || null, date_fin || null, montant || null, type_service || 'securite', statut || 'actif']
    );
    const contrat = await dbQuery('SELECT * FROM contrats WHERE id = ?', [result.id]);
    res.status(201).json(contrat[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/contrats/:id', async (req, res) => {
  try {
    const { numero, client_id, date_debut, date_fin, montant, type_service, statut } = req.body;
    await dbRun(
      'UPDATE contrats SET numero = ?, client_id = ?, date_debut = ?, date_fin = ?, montant = ?, type_service = ?, statut = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [numero || null, client_id, date_debut || null, date_fin || null, montant || null, type_service || 'securite', statut || 'actif', req.params.id]
    );
    const contrat = await dbQuery('SELECT * FROM contrats WHERE id = ?', [req.params.id]);
    res.json(contrat[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/contrats/:id', async (req, res) => {
  try {
    await dbRun('DELETE FROM contrats WHERE id = ?', [req.params.id]);
    res.json({ message: 'Contrat supprimé' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes pour les factures
app.get('/api/factures', async (req, res) => {
  try {
    const factures = await dbQuery('SELECT * FROM factures ORDER BY created_at DESC');
    res.json(factures);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/factures', async (req, res) => {
  try {
    const { numero, client_id, contrat_id, date_emission, date_echeance, montant_ht, taux_tva, montant_tva, montant_ttc, montant_paye, statut } = req.body;
    const result = await dbRun(
      'INSERT INTO factures (numero, client_id, contrat_id, date_emission, date_echeance, montant_ht, taux_tva, montant_tva, montant_ttc, montant_paye, statut) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [numero, client_id, contrat_id || null, date_emission, date_echeance || null, montant_ht, taux_tva || 3, montant_tva || null, montant_ttc, montant_paye || 0, statut || 'non_payee']
    );
    const facture = await dbQuery('SELECT * FROM factures WHERE id = ?', [result.id]);
    res.status(201).json(facture[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/factures/:id', async (req, res) => {
  try {
    const { numero, client_id, contrat_id, date_emission, date_echeance, montant_ht, taux_tva, montant_tva, montant_ttc, montant_paye, statut } = req.body;
    await dbRun(
      'UPDATE factures SET numero = ?, client_id = ?, contrat_id = ?, date_emission = ?, date_echeance = ?, montant_ht = ?, taux_tva = ?, montant_tva = ?, montant_ttc = ?, montant_paye = ?, statut = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [numero, client_id, contrat_id || null, date_emission, date_echeance || null, montant_ht, taux_tva || 3, montant_tva || null, montant_ttc, montant_paye || 0, statut || 'non_payee', req.params.id]
    );
    const facture = await dbQuery('SELECT * FROM factures WHERE id = ?', [req.params.id]);
    res.json(facture[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/factures/:id', async (req, res) => {
  try {
    await dbRun('DELETE FROM factures WHERE id = ?', [req.params.id]);
    res.json({ message: 'Facture supprimée' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes pour les opérations de caisse
app.get('/api/operations', async (req, res) => {
  try {
    const operations = await dbQuery('SELECT * FROM operations ORDER BY date DESC, created_at DESC');
    res.json(operations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/operations', async (req, res) => {
  try {
    const { mode, type, montant, description, facture_id, date } = req.body;
    const result = await dbRun(
      'INSERT INTO operations (mode, type, montant, description, facture_id, date) VALUES (?, ?, ?, ?, ?, ?)',
      [mode || 'caisse', type, montant, description || null, facture_id || null, date]
    );
    const operation = await dbQuery('SELECT * FROM operations WHERE id = ?', [result.id]);
    res.status(201).json(operation[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/operations/:id', async (req, res) => {
  try {
    const { mode, type, montant, description, facture_id, date } = req.body;
    await dbRun(
      'UPDATE operations SET mode = ?, type = ?, montant = ?, description = ?, facture_id = ?, date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [mode || 'caisse', type, montant, description || null, facture_id || null, date, req.params.id]
    );
    const operation = await dbQuery('SELECT * FROM operations WHERE id = ?', [req.params.id]);
    res.json(operation[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/operations/:id', async (req, res) => {
  try {
    await dbRun('DELETE FROM operations WHERE id = ?', [req.params.id]);
    res.json({ message: 'Opération supprimée' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes pour les congés
app.get('/api/conges', async (req, res) => {
  try {
    const conges = await dbQuery('SELECT * FROM conges ORDER BY date_debut DESC');
    res.json(conges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/conges', async (req, res) => {
  try {
    const { employee_id, date_debut, date_fin, type, statut, commentaire } = req.body;
    const result = await dbRun(
      'INSERT INTO conges (employee_id, date_debut, date_fin, type, statut, commentaire) VALUES (?, ?, ?, ?, ?, ?)',
      [employee_id, date_debut, date_fin, type || 'annuel', statut || 'en_attente', commentaire || null]
    );
    const conge = await dbQuery('SELECT * FROM conges WHERE id = ?', [result.id]);
    res.status(201).json(conge[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/conges/:id', async (req, res) => {
  try {
    const { employee_id, date_debut, date_fin, type, statut, commentaire } = req.body;
    await dbRun(
      'UPDATE conges SET employee_id = ?, date_debut = ?, date_fin = ?, type = ?, statut = ?, commentaire = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [employee_id, date_debut, date_fin, type || 'annuel', statut || 'en_attente', commentaire || null, req.params.id]
    );
    const conge = await dbQuery('SELECT * FROM conges WHERE id = ?', [req.params.id]);
    res.json(conge[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/conges/:id', async (req, res) => {
  try {
    await dbRun('DELETE FROM conges WHERE id = ?', [req.params.id]);
    res.json({ message: 'Congé supprimé' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes pour les fiches de paie
app.get('/api/fiches-paie', async (req, res) => {
  try {
    const fiches = await dbQuery('SELECT * FROM fiches_paie ORDER BY annee DESC, mois DESC');
    res.json(fiches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/fiches-paie', async (req, res) => {
  try {
    const { employee_id, mois, annee, salaire_brut, cotisations, net_a_payer, date_paiement } = req.body;
    const result = await dbRun(
      'INSERT INTO fiches_paie (employee_id, mois, annee, salaire_brut, cotisations, net_a_payer, date_paiement) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [employee_id, mois, annee, salaire_brut, cotisations || 0, net_a_payer, date_paiement || null]
    );
    const fiche = await dbQuery('SELECT * FROM fiches_paie WHERE id = ?', [result.id]);
    res.status(201).json(fiche[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/fiches-paie/:id', async (req, res) => {
  try {
    const { employee_id, mois, annee, salaire_brut, cotisations, net_a_payer, date_paiement } = req.body;
    await dbRun(
      'UPDATE fiches_paie SET employee_id = ?, mois = ?, annee = ?, salaire_brut = ?, cotisations = ?, net_a_payer = ?, date_paiement = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [employee_id, mois, annee, salaire_brut, cotisations || 0, net_a_payer, date_paiement || null, req.params.id]
    );
    const fiche = await dbQuery('SELECT * FROM fiches_paie WHERE id = ?', [req.params.id]);
    res.json(fiche[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/fiches-paie/:id', async (req, res) => {
  try {
    await dbRun('DELETE FROM fiches_paie WHERE id = ?', [req.params.id]);
    res.json({ message: 'Fiche de paie supprimée' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes pour les avances
app.get('/api/avances', async (req, res) => {
  try {
    const avances = await dbQuery('SELECT * FROM avances ORDER BY date_demande DESC');
    res.json(avances);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/avances', async (req, res) => {
  try {
    const { employee_id, montant, date_demande, date_remboursement, statut, commentaire } = req.body;
    const result = await dbRun(
      'INSERT INTO avances (employee_id, montant, date_demande, date_remboursement, statut, commentaire) VALUES (?, ?, ?, ?, ?, ?)',
      [employee_id, montant, date_demande, date_remboursement || null, statut || 'en_attente', commentaire || null]
    );
    const avance = await dbQuery('SELECT * FROM avances WHERE id = ?', [result.id]);
    res.status(201).json(avance[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/avances/:id', async (req, res) => {
  try {
    const { employee_id, montant, date_demande, date_remboursement, statut, commentaire } = req.body;
    await dbRun(
      'UPDATE avances SET employee_id = ?, montant = ?, date_demande = ?, date_remboursement = ?, statut = ?, commentaire = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [employee_id, montant, date_demande, date_remboursement || null, statut || 'en_attente', commentaire || null, req.params.id]
    );
    const avance = await dbQuery('SELECT * FROM avances WHERE id = ?', [req.params.id]);
    res.json(avance[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/avances/:id', async (req, res) => {
  try {
    await dbRun('DELETE FROM avances WHERE id = ?', [req.params.id]);
    res.json({ message: 'Avance supprimée' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes pour le planning
app.get('/api/planning', async (req, res) => {
  try {
    const planning = await dbQuery('SELECT * FROM planning ORDER BY date, heure_debut');
    res.json(planning);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/planning', async (req, res) => {
  try {
    const { date, employee_id, client_id, heure_debut, heure_fin, description, type_service } = req.body;
    const result = await dbRun(
      'INSERT INTO planning (date, employee_id, client_id, heure_debut, heure_fin, description, type_service) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [date, employee_id, client_id, heure_debut, heure_fin, description || null, type_service || 'securite']
    );
    const plan = await dbQuery('SELECT * FROM planning WHERE id = ?', [result.id]);
    res.status(201).json(plan[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/planning/:id', async (req, res) => {
  try {
    const { date, employee_id, client_id, heure_debut, heure_fin, description, type_service } = req.body;
    await dbRun(
      'UPDATE planning SET date = ?, employee_id = ?, client_id = ?, heure_debut = ?, heure_fin = ?, description = ?, type_service = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [date, employee_id, client_id, heure_debut, heure_fin, description || null, type_service || 'securite', req.params.id]
    );
    const plan = await dbQuery('SELECT * FROM planning WHERE id = ?', [req.params.id]);
    res.json(plan[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/planning/:id', async (req, res) => {
  try {
    await dbRun('DELETE FROM planning WHERE id = ?', [req.params.id]);
    res.json({ message: 'Plan supprimé' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API GESTION SES fonctionnelle' });
});

// Démarrer le serveur
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Serveur API démarré sur http://localhost:${PORT}`);
      console.log(`📊 Base de données: ${DB_PATH}`);
    });
  })
  .catch((err) => {
    console.error('Erreur lors du démarrage du serveur:', err);
    process.exit(1);
  });

