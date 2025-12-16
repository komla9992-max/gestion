import React, { useState, useEffect, useMemo } from 'react'
import Layout from '../components/Layout'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { 
  BookOpen, Plus, Edit, Trash2, X, Search, DollarSign, 
  TrendingUp, TrendingDown, FileText, BarChart3,
  CheckCircle, Clock, Download
} from 'lucide-react'
import { exportGrandLivrePDF, exportBalancePDF, exportJournalPDF } from '../utils/exportUtils'

const Comptabilite = () => {
  const { clients = [] } = useData()
  const { isAdmin = false, isComptable = false } = useAuth()
  const [ecritures, setEcritures] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('ecritures')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatut, setFilterStatut] = useState('all')
  const [dateDebut, setDateDebut] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0])
  const [dateFin, setDateFin] = useState(new Date().toISOString().split('T')[0])
  const [showModal, setShowModal] = useState(false)
  const [editingEcriture, setEditingEcriture] = useState(null)
  const [formData, setFormData] = useState({
    numero: '',
    date: new Date().toISOString().split('T')[0],
    jour: new Date().getDate().toString().padStart(2, '0'),
    journal: 'CAISSE',
    numeroFacture: '',
    reference: '',
    compteDebit: '', // Peut contenir plusieurs comptes séparés par des virgules
    compteCredit: '', // Peut contenir plusieurs comptes séparés par des virgules
    compteTiers: '',
    libelle: '',
    dateEcheance: '',
    montantDebit: '',
    montantCredit: '',
    pieceJustificative: '',
    valide: false
  })
  const [lignesDebit, setLignesDebit] = useState([
    { compte: '', compteTiers: '', libelle: '', montant: '' },
    { compte: '', compteTiers: '', libelle: '', montant: '' },
    { compte: '', compteTiers: '', libelle: '', montant: '' },
    { compte: '', compteTiers: '', libelle: '', montant: '' }
  ])
  const [lignesCredit, setLignesCredit] = useState([
    { compte: '', compteTiers: '', libelle: '', montant: '' },
    { compte: '', compteTiers: '', libelle: '', montant: '' },
    { compte: '', compteTiers: '', libelle: '', montant: '' },
    { compte: '', compteTiers: '', libelle: '', montant: '' }
  ])

  // Liste des journaux comptables
  const journaux = {
    'VENTE': 'Journal des Ventes',
    'ACHAT': 'Journal des Achats',
    'CAISSE': 'Journal de Caisse',
    'BANQUE': 'Journal de Banque',
    'OD': 'Journal des Opérations Diverses',
    'GENERAL': 'Journal Général'
  }

  // Charger les écritures depuis localStorage
  useEffect(() => {
    try {
      setLoading(true)
      const saved = localStorage.getItem('comptabilite_ecritures')
      if (saved) {
        const parsed = JSON.parse(saved)
        setEcritures(Array.isArray(parsed) ? parsed : [])
      } else {
        setEcritures([])
      }
      setLoading(false)
    } catch (error) {
      console.error('Erreur lors du chargement des écritures:', error)
      setEcritures([])
      setLoading(false)
    }
  }, [])

  // Plan comptable simplifié
  const planComptable = {
    '701000': { label: 'Ventes de services', type: 'produit' },
    '607000': { label: 'Achat de services', type: 'charge' },
    '411000': { label: 'Clients', type: 'client' },
    '401000': { label: 'Fournisseurs', type: 'fournisseur' },
    '512000': { label: 'Banque', type: 'banque' },
    '531000': { label: 'Caisse', type: 'caisse' },
    '625000': { label: 'Charges de personnel', type: 'charge' },
    '681000': { label: 'Dotations aux amortissements', type: 'charge' }
  }

  const filteredEcritures = useMemo(() => {
    if (!Array.isArray(ecritures)) return []
    
    return ecritures.filter(ecriture => {
      if (!ecriture) return false
      
      try {
        const matchesSearch = 
          (ecriture.numero || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (ecriture.libelle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (ecriture.compte || '').includes(searchTerm)

        const matchesType = filterType === 'all' || ecriture.type === filterType
        const matchesStatut = filterStatut === 'all' || 
          (filterStatut === 'validé' && ecriture.valide) ||
          (filterStatut === 'en_attente' && !ecriture.valide)

        if (!ecriture.date) return matchesSearch && matchesType && matchesStatut

        const ecritureDate = new Date(ecriture.date)
        const debut = new Date(dateDebut)
        const fin = new Date(dateFin)
        const matchesDate = !isNaN(ecritureDate.getTime()) && ecritureDate >= debut && ecritureDate <= fin

        return matchesSearch && matchesType && matchesStatut && matchesDate
      } catch (error) {
        console.error('Erreur lors du filtrage:', error)
        return false
      }
    })
  }, [ecritures, searchTerm, filterType, filterStatut, dateDebut, dateFin])

  const handleSubmit = (e) => {
    e.preventDefault()

    // Récupérer les lignes remplies (qui ont un compte et un montant)
    const lignesDebitRemplies = lignesDebit.filter(l => l.compte && l.montant && parseFloat(l.montant) > 0)
    const lignesCreditRemplies = lignesCredit.filter(l => l.compte && l.montant && parseFloat(l.montant) > 0)

    if (lignesDebitRemplies.length === 0 || lignesCreditRemplies.length === 0) {
      alert('Veuillez remplir au moins une ligne de débit et une ligne de crédit')
      return
    }

    // Calculer les totaux
    const montantDebit = lignesDebitRemplies.reduce((sum, l) => sum + (parseFloat(l.montant) || 0), 0)
    const montantCredit = lignesCreditRemplies.reduce((sum, l) => sum + (parseFloat(l.montant) || 0), 0)

    if (montantDebit !== montantCredit) {
      alert('Le montant débit total doit être égal au montant crédit total (principe de la partie double)')
      return
    }

    // Récupérer les comptes (utiliser le libellé de la première ligne pour formData.libelle si vide)
    const comptesDebitFinal = lignesDebitRemplies.map(l => l.compte).join(',')
    const comptesCreditFinal = lignesCreditRemplies.map(l => l.compte).join(',')
    const libelleFinal = formData.libelle || lignesDebitRemplies[0]?.libelle || ''

    // Vérifier qu'il n'y a pas de compte commun entre débit et crédit
    const debits = comptesDebitFinal.split(',').map(c => c.trim()).filter(c => c)
    const credits = comptesCreditFinal.split(',').map(c => c.trim()).filter(c => c)
    const communs = debits.filter(c => credits.includes(c))
    if (communs.length > 0) {
      alert('Un compte ne peut pas être à la fois au débit et au crédit')
      return
    }

    try {
      let updatedEcritures
      const montant = montantDebit // Les deux sont égaux
      const ecritureDate = formData.date ? new Date(formData.date) : new Date()
      const jour = formData.jour || ecritureDate.getDate().toString().padStart(2, '0')
      
      // Créer l'écriture avec les détails de chaque ligne
      const ecritureData = {
        ...formData,
        libelle: libelleFinal,
        compteDebit: comptesDebitFinal,
        compteCredit: comptesCreditFinal,
        jour,
        montant,
        montantDebit,
        montantCredit,
        lignesDebit: lignesDebitRemplies,
        lignesCredit: lignesCreditRemplies
      }

      if (editingEcriture) {
        updatedEcritures = ecritures.map(ec =>
          ec.id === editingEcriture.id
            ? { ...ec, ...ecritureData }
            : ec
        )
      } else {
        const newEcriture = {
          id: Date.now(),
          numero: formData.numero || `${Date.now()}`,
          ...ecritureData,
          dateCreation: new Date().toISOString()
        }
        updatedEcritures = [...ecritures, newEcriture]
      }

      setEcritures(updatedEcritures)
      localStorage.setItem('comptabilite_ecritures', JSON.stringify(updatedEcritures))
      
      // Générer automatiquement les documents comptables après chaque saisie
      try {
        const grandLivreGenere = generateGrandLivre(updatedEcritures)
        const balanceGeneree = generateBalance(updatedEcritures)
        const rapportsGenere = generateRapports(updatedEcritures)
        const etatFinancierGenere = generateEtatFinancier(updatedEcritures)
        
        // Sauvegarder les documents générés
        localStorage.setItem('comptabilite_grand_livre', JSON.stringify(grandLivreGenere))
        localStorage.setItem('comptabilite_balance', JSON.stringify(balanceGeneree))
        localStorage.setItem('comptabilite_rapports', JSON.stringify(rapportsGenere))
        localStorage.setItem('comptabilite_etat_financier', JSON.stringify(etatFinancierGenere))
      } catch (error) {
        console.error('Erreur lors de la génération automatique des documents:', error)
      }
      
      // Vider uniquement le libellé après l'enregistrement réussi, garder les autres champs
      const today = new Date()
      setFormData({
        ...formData,
        libelle: '', // Vider uniquement le libellé après enregistrement
        numero: '', // Réinitialiser le numéro de pièce
        numeroFacture: '',
        reference: ''
        // Garder les autres champs (journal, date) pour faciliter la saisie
      })
      
      // Réinitialiser les lignes
      setLignesDebit([
        { compte: '', compteTiers: '', libelle: '', montant: '' },
        { compte: '', compteTiers: '', libelle: '', montant: '' },
        { compte: '', compteTiers: '', libelle: '', montant: '' },
        { compte: '', compteTiers: '', libelle: '', montant: '' }
      ])
      setLignesCredit([
        { compte: '', compteTiers: '', libelle: '', montant: '' },
        { compte: '', compteTiers: '', libelle: '', montant: '' },
        { compte: '', compteTiers: '', libelle: '', montant: '' },
        { compte: '', compteTiers: '', libelle: '', montant: '' }
      ])
      
      // Fermer le modal après enregistrement
      setEditingEcriture(null)
      setShowModal(false)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      alert('Erreur lors de la sauvegarde')
    }
  }

  const resetForm = () => {
    const today = new Date()
    setFormData({
      numero: '',
      date: today.toISOString().split('T')[0],
      jour: today.getDate().toString().padStart(2, '0'),
      journal: 'CAISSE',
      numeroFacture: '',
      reference: '',
      compteDebit: '',
      compteCredit: '',
      compteTiers: '',
      libelle: '',
      dateEcheance: '',
      montantDebit: '',
      montantCredit: '',
      pieceJustificative: '',
      valide: false
    })
    setLignesDebit([
      { compte: '', compteTiers: '', libelle: '', montant: '' },
      { compte: '', compteTiers: '', libelle: '', montant: '' },
      { compte: '', compteTiers: '', libelle: '', montant: '' },
      { compte: '', compteTiers: '', libelle: '', montant: '' }
    ])
    setLignesCredit([
      { compte: '', compteTiers: '', libelle: '', montant: '' },
      { compte: '', compteTiers: '', libelle: '', montant: '' },
      { compte: '', compteTiers: '', libelle: '', montant: '' },
      { compte: '', compteTiers: '', libelle: '', montant: '' }
    ])
    setEditingEcriture(null)
    setShowModal(false)
  }

  const handleEdit = (ecriture) => {
    if (ecriture.valide && !isAdmin) {
      alert('Impossible de modifier une écriture validée')
      return
    }
    const montantDebit = parseFloat(ecriture.montantDebit) || parseFloat(ecriture.montant) || 0
    const montantCredit = parseFloat(ecriture.montantCredit) || parseFloat(ecriture.montant) || 0
    const ecritureDate = ecriture.date ? new Date(ecriture.date) : new Date()
    
    // Utiliser les lignes détaillées si disponibles, sinon créer à partir des données existantes
    let nouvellesLignesDebit = []
    let nouvellesLignesCredit = []
    
    if (ecriture.lignesDebit && ecriture.lignesDebit.length > 0) {
      nouvellesLignesDebit = [...ecriture.lignesDebit]
      // Compléter jusqu'à 4 lignes
      while (nouvellesLignesDebit.length < 4) {
        nouvellesLignesDebit.push({ compte: '', compteTiers: '', libelle: '', montant: '' })
      }
    } else {
      // Mode rétrocompatibilité : créer les lignes à partir des données existantes
      const debits = (ecriture.compteDebit || ecriture.compte || '').split(',').map(c => c.trim()).filter(c => c)
      nouvellesLignesDebit = [
        { compte: debits[0] || '', compteTiers: ecriture.compteTiers || '', libelle: ecriture.libelle || '', montant: debits.length > 0 ? montantDebit.toString() : '' },
        { compte: debits[1] || '', compteTiers: '', libelle: '', montant: '' },
        { compte: debits[2] || '', compteTiers: '', libelle: '', montant: '' },
        { compte: debits[3] || '', compteTiers: '', libelle: '', montant: '' }
      ]
    }
    
    if (ecriture.lignesCredit && ecriture.lignesCredit.length > 0) {
      nouvellesLignesCredit = [...ecriture.lignesCredit]
      // Compléter jusqu'à 4 lignes
      while (nouvellesLignesCredit.length < 4) {
        nouvellesLignesCredit.push({ compte: '', compteTiers: '', libelle: '', montant: '' })
      }
    } else {
      // Mode rétrocompatibilité
      const credits = (ecriture.compteCredit || '').split(',').map(c => c.trim()).filter(c => c)
      nouvellesLignesCredit = [
        { compte: credits[0] || '', compteTiers: ecriture.compteTiers || '', libelle: ecriture.libelle || '', montant: credits.length > 0 ? montantCredit.toString() : '' },
        { compte: credits[1] || '', compteTiers: '', libelle: '', montant: '' },
        { compte: credits[2] || '', compteTiers: '', libelle: '', montant: '' },
        { compte: credits[3] || '', compteTiers: '', libelle: '', montant: '' }
      ]
    }
    
    // Pour formData, récupérer les comptes depuis les lignes
    const debits = nouvellesLignesDebit.filter(l => l.compte).map(l => l.compte)
    const credits = nouvellesLignesCredit.filter(l => l.compte).map(l => l.compte)
    
    setEditingEcriture(ecriture)
    setLignesDebit(nouvellesLignesDebit)
    setLignesCredit(nouvellesLignesCredit)
    setFormData({
      numero: ecriture.numero || '',
      date: ecriture.date || new Date().toISOString().split('T')[0],
      jour: ecriture.jour || ecritureDate.getDate().toString().padStart(2, '0'),
      journal: ecriture.journal || 'CAISSE',
      numeroFacture: ecriture.numeroFacture || '',
      reference: ecriture.reference || '',
      compteDebit: debits.join(','),
      compteCredit: credits.join(','),
      compteTiers: ecriture.compteTiers || '',
      libelle: ecriture.libelle || '',
      dateEcheance: ecriture.dateEcheance || '',
      montantDebit: montantDebit > 0 ? montantDebit.toString() : '',
      montantCredit: montantCredit > 0 ? montantCredit.toString() : '',
      pieceJustificative: ecriture.pieceJustificative || '',
      valide: ecriture.valide || false
    })
    setShowModal(true)
  }

  const handleDelete = (id) => {
    const ecriture = ecritures.find(e => e && e.id === id)
    if (ecriture && ecriture.valide && !isAdmin) {
      alert('Impossible de supprimer une écriture validée')
      return
    }
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette écriture ?')) {
      try {
        const newEcritures = ecritures.filter(ec => ec && ec.id !== id)
        setEcritures(newEcritures)
        localStorage.setItem('comptabilite_ecritures', JSON.stringify(newEcritures))
        
        // Régénérer automatiquement les documents après suppression
        try {
          const grandLivreGenere = generateGrandLivre(newEcritures)
          const balanceGeneree = generateBalance(newEcritures)
          const rapportsGenere = generateRapports(newEcritures)
          const etatFinancierGenere = generateEtatFinancier(newEcritures)
          
          localStorage.setItem('comptabilite_grand_livre', JSON.stringify(grandLivreGenere))
          localStorage.setItem('comptabilite_balance', JSON.stringify(balanceGeneree))
          localStorage.setItem('comptabilite_rapports', JSON.stringify(rapportsGenere))
          localStorage.setItem('comptabilite_etat_financier', JSON.stringify(etatFinancierGenere))
        } catch (error) {
          console.error('Erreur lors de la régénération automatique des documents:', error)
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
      }
    }
  }

  const handleValidate = (id) => {
    try {
      const newEcritures = ecritures.map(ec =>
        ec && ec.id === id ? { ...ec, valide: true } : ec
      )
      setEcritures(newEcritures)
      localStorage.setItem('comptabilite_ecritures', JSON.stringify(newEcritures))
      
      // Régénérer automatiquement les documents après validation
      try {
        const grandLivreGenere = generateGrandLivre(newEcritures)
        const balanceGeneree = generateBalance(newEcritures)
        const rapportsGenere = generateRapports(newEcritures)
        const etatFinancierGenere = generateEtatFinancier(newEcritures)
        
        localStorage.setItem('comptabilite_grand_livre', JSON.stringify(grandLivreGenere))
        localStorage.setItem('comptabilite_balance', JSON.stringify(balanceGeneree))
        localStorage.setItem('comptabilite_rapports', JSON.stringify(rapportsGenere))
        localStorage.setItem('comptabilite_etat_financier', JSON.stringify(etatFinancierGenere))
      } catch (error) {
        console.error('Erreur lors de la régénération automatique des documents:', error)
      }
    } catch (error) {
      console.error('Erreur lors de la validation:', error)
    }
  }

  // Fonction pour générer le grand livre automatiquement
  const generateGrandLivre = (ecritures) => {
    if (!Array.isArray(ecritures)) return []
    
    const comptes = {}
    
    ecritures.forEach(ecriture => {
      if (!ecriture) return
      
      const montantDebit = parseFloat(ecriture.montantDebit) || 0
      const montantCredit = parseFloat(ecriture.montantCredit) || 0
      
      // Traiter les comptes débit (peuvent être multiples séparés par des virgules)
      const comptesDebit = (ecriture.compteDebit || '').split(',').map(c => c.trim()).filter(c => c)
      comptesDebit.forEach(compte => {
        if (!comptes[compte]) {
          comptes[compte] = {
            compte,
            libelle: planComptable[compte]?.label || compte,
            debit: 0,
            credit: 0,
            ecritures: []
          }
        }
        comptes[compte].debit += montantDebit
        comptes[compte].ecritures.push({ ...ecriture, type: 'debit' })
      })
      
      // Traiter les comptes crédit (peuvent être multiples séparés par des virgules)
      const comptesCredit = (ecriture.compteCredit || '').split(',').map(c => c.trim()).filter(c => c)
      comptesCredit.forEach(compte => {
        if (!comptes[compte]) {
          comptes[compte] = {
            compte,
            libelle: planComptable[compte]?.label || compte,
            debit: 0,
            credit: 0,
            ecritures: []
          }
        }
        comptes[compte].credit += montantCredit
        comptes[compte].ecritures.push({ ...ecriture, type: 'credit' })
      })
    })
    
    return Object.values(comptes).sort((a, b) => a.compte.localeCompare(b.compte))
  }

  // Calculs pour le grand livre (mis à jour automatiquement)
  const grandLivre = useMemo(() => {
    return generateGrandLivre(filteredEcritures)
  }, [filteredEcritures])

  // Fonction pour générer la balance automatiquement
  const generateBalance = (ecritures) => {
    if (!Array.isArray(ecritures)) {
      return { totalDebit: 0, totalCredit: 0, solde: 0, details: [] }
    }
    
    const totalDebit = ecritures.reduce((sum, e) => {
      return sum + (parseFloat(e?.montantDebit) || 0)
    }, 0)
    
    const totalCredit = ecritures.reduce((sum, e) => {
      return sum + (parseFloat(e?.montantCredit) || 0)
    }, 0)
    
    const solde = totalDebit - totalCredit
    
    // Générer les détails par compte
    const grandLivreData = generateGrandLivre(ecritures)
    const details = grandLivreData.map(compte => ({
      compte: compte.compte,
      libelle: compte.libelle,
      debit: compte.debit,
      credit: compte.credit,
      solde: compte.credit - compte.debit
    }))
    
    return {
      totalDebit,
      totalCredit,
      solde,
      details
    }
  }

  // Balance comptable (mise à jour automatiquement)
  const balance = useMemo(() => {
    return generateBalance(filteredEcritures)
  }, [filteredEcritures])

  // Fonction pour générer les rapports comptables automatiquement
  const generateRapports = (ecritures) => {
    const balanceData = generateBalance(ecritures)
    const grandLivreData = generateGrandLivre(ecritures)
    
    return {
      dateGeneration: new Date().toISOString(),
      periode: {
        debut: dateDebut,
        fin: dateFin
      },
      balance: balanceData,
      grandLivre: grandLivreData,
      nombreEcritures: ecritures.length,
      ecrituresValidees: ecritures.filter(e => e?.valide).length
    }
  }

  // Fonction pour générer l'état financier automatiquement
  const generateEtatFinancier = (ecritures) => {
    const grandLivreData = generateGrandLivre(ecritures)
    
    // Calculer les produits (comptes commençant par 7)
    const produits = grandLivreData
      .filter(c => c.compte.startsWith('7'))
      .reduce((sum, c) => sum + c.credit, 0)
    
    // Calculer les charges (comptes commençant par 6)
    const charges = grandLivreData
      .filter(c => c.compte.startsWith('6'))
      .reduce((sum, c) => sum + c.debit, 0)
    
    // Résultat d'exploitation
    const resultatExploitation = produits - charges
    
    // Actif (comptes commençant par 2, 3, 4)
    const actif = grandLivreData
      .filter(c => c.compte.startsWith('2') || c.compte.startsWith('3') || c.compte.startsWith('4'))
      .reduce((sum, c) => sum + (c.debit > c.credit ? c.debit - c.credit : 0), 0)
    
    // Passif (comptes commençant par 1)
    const passif = grandLivreData
      .filter(c => c.compte.startsWith('1'))
      .reduce((sum, c) => sum + (c.credit > c.debit ? c.credit - c.debit : 0), 0)
    
    return {
      dateGeneration: new Date().toISOString(),
      periode: {
        debut: dateDebut,
        fin: dateFin
      },
      compteResultat: {
        produits,
        charges,
        resultatExploitation
      },
      bilan: {
        actif,
        passif,
        resultat: resultatExploitation
      }
    }
  }

  // Statistiques
  const stats = useMemo(() => {
    if (!Array.isArray(filteredEcritures)) {
      return {
        totalRecettes: 0,
        totalDepenses: 0,
        resultat: 0,
        ecrituresValidees: 0,
        ecrituresEnAttente: 0,
        totalEcritures: 0
      }
    }
    
    // Calculer les recettes (comptes produits - crédit)
    const grandLivreData = generateGrandLivre(filteredEcritures)
    const totalRecettes = grandLivreData
      .filter(c => c.compte.startsWith('7'))
      .reduce((sum, c) => sum + c.credit, 0)
    
    // Calculer les dépenses (comptes charges - débit)
    const totalDepenses = grandLivreData
      .filter(c => c.compte.startsWith('6'))
      .reduce((sum, c) => sum + c.debit, 0)
    
    const ecrituresValidees = filteredEcritures.filter(e => e?.valide).length
    const ecrituresEnAttente = filteredEcritures.filter(e => e && !e.valide).length

    return {
      totalRecettes,
      totalDepenses,
      resultat: totalRecettes - totalDepenses,
      ecrituresValidees,
      ecrituresEnAttente,
      totalEcritures: filteredEcritures.length
    }
  }, [filteredEcritures])

  if (loading) {
    return (
      <Layout>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Chargement...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'black', margin: 0 }}>
          Comptabilité
        </h1>
          {(isAdmin || isComptable) && (
            <button
              onClick={() => setShowModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: 'black',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500'
              }}
            >
              <Plus size={20} />
              Nouvelle écriture
            </button>
          )}
        </div>

        {/* Statistiques */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
        <div style={{
          background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <TrendingUp size={20} color="#10b981" />
              <p style={{ color: '#666', fontSize: '0.875rem', margin: 0 }}>Total recettes</p>
            </div>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'black', margin: 0 }}>
              {stats.totalRecettes.toLocaleString()} F
            </p>
          </div>
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <TrendingDown size={20} color="#ef4444" />
              <p style={{ color: '#666', fontSize: '0.875rem', margin: 0 }}>Total dépenses</p>
            </div>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'black', margin: 0 }}>
              {stats.totalDepenses.toLocaleString()} F
            </p>
          </div>
          <div style={{
            background: stats.resultat >= 0 ? '#d1fae5' : '#fee2e2',
            padding: '1.5rem',
            borderRadius: '12px',
            border: `1px solid ${stats.resultat >= 0 ? '#10b981' : '#ef4444'}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <BarChart3 size={20} color={stats.resultat >= 0 ? '#10b981' : '#ef4444'} />
              <p style={{ color: '#666', fontSize: '0.875rem', margin: 0 }}>Résultat net</p>
            </div>
            <p style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: stats.resultat >= 0 ? '#10b981' : '#ef4444', 
              margin: 0 
            }}>
              {stats.resultat >= 0 ? '+' : ''}{stats.resultat.toLocaleString()} F
            </p>
          </div>
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <FileText size={20} color="#6366f1" />
              <p style={{ color: '#666', fontSize: '0.875rem', margin: 0 }}>Total écritures</p>
            </div>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'black', margin: 0 }}>
              {stats.totalEcritures}
            </p>
          </div>
        </div>

        {/* Onglets */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          borderBottom: '2px solid #e2e8f0'
        }}>
          {[
            { id: 'ecritures', label: 'Écritures', icon: FileText },
            { id: 'grand-livre', label: 'Grand Livre', icon: BookOpen },
            { id: 'balance', label: 'Balance', icon: BarChart3 },
            { id: 'rapports', label: 'Rapports', icon: Download },
            { id: 'etat-financier', label: 'État Financier', icon: BarChart3 }
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: activeTab === tab.id ? '3px solid black' : '3px solid transparent',
                  color: activeTab === tab.id ? 'black' : '#666',
                  cursor: 'pointer',
                  fontWeight: activeTab === tab.id ? '600' : '400',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Filtres */}
        {(activeTab === 'ecritures' || activeTab === 'grand-livre' || activeTab === 'balance') && (
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
              <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 3rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  color: 'black'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{
                  padding: '0.75rem 1rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  color: 'black',
                  background: 'white'
                }}
              >
                <option value="all">Tous les types</option>
                <option value="recette">Recettes</option>
                <option value="depense">Dépenses</option>
              </select>
              <select
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value)}
                style={{
                  padding: '0.75rem 1rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  color: 'black',
                  background: 'white'
                }}
              >
                <option value="all">Tous les statuts</option>
                <option value="validé">Validées</option>
                <option value="en_attente">En attente</option>
              </select>
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  color: 'black'
                }}
              />
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  color: 'black'
                }}
              />
            </div>
          </div>
        )}

        {/* Résumé des soldes - en bas des filtres */}
        {(activeTab === 'ecritures' || activeTab === 'grand-livre' || activeTab === 'balance') && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
            background: 'white',
            padding: '1rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '0.25rem' }}>Ancien solde</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#000', fontFamily: 'monospace' }}>
                {(() => {
                  // Calculer l'ancien solde (somme des écritures avant la période filtrée)
                  const avantPeriode = ecritures.filter(e => {
                    if (!e || !e.date) return false
                    const ecritureDate = new Date(e.date)
                    return ecritureDate < new Date(dateDebut)
                  })
                  const ancienSolde = avantPeriode.reduce((sum, e) => {
                    const debit = parseFloat(e?.montantDebit) || parseFloat(e?.montant) || 0
                    const credit = parseFloat(e?.montantCredit) || parseFloat(e?.montant) || 0
                    return sum + (debit - credit)
                  }, 0)
                  return ancienSolde.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' F'
                })()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '0.25rem' }}>Mouvements</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#000', fontFamily: 'monospace' }}>
                {(() => {
                  const totalMouvements = filteredEcritures.reduce((sum, e) => {
                    const debit = parseFloat(e?.montantDebit) || parseFloat(e?.montant) || 0
                    const credit = parseFloat(e?.montantCredit) || parseFloat(e?.montant) || 0
                    return sum + Math.max(debit, credit)
                  }, 0)
                  return totalMouvements.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' F'
                })()}
              </div>
            </div>
            <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '1rem' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '0.25rem' }}>Nouveau solde</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#000', fontFamily: 'monospace' }}>
                {(() => {
                  const avantPeriode = ecritures.filter(e => {
                    if (!e || !e.date) return false
                    const ecritureDate = new Date(e.date)
                    return ecritureDate < new Date(dateDebut)
                  })
                  const ancienSolde = avantPeriode.reduce((sum, e) => {
                    const debit = parseFloat(e?.montantDebit) || parseFloat(e?.montant) || 0
                    const credit = parseFloat(e?.montantCredit) || parseFloat(e?.montant) || 0
                    return sum + (debit - credit)
                  }, 0)
                  const totalMouvements = filteredEcritures.reduce((sum, e) => {
                    const debit = parseFloat(e?.montantDebit) || parseFloat(e?.montant) || 0
                    const credit = parseFloat(e?.montantCredit) || parseFloat(e?.montant) || 0
                    return sum + (debit - credit)
                  }, 0)
                  const nouveauSolde = ancienSolde + totalMouvements
                  return nouveauSolde.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' F'
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Contenu des onglets */}
        {activeTab === 'ecritures' && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            {/* Tableau principal des écritures */}
            <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {filteredEcritures.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                  <BookOpen size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p>Aucune écriture trouvée</p>
                </div>
              ) : (
                <>
                  <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => exportJournalPDF(filteredEcritures, dateDebut, dateFin)}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: '#6366f1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: '500',
                        fontSize: '14px'
                      }}
                    >
                      <Download size={18} />
                      Exporter en PDF
                    </button>
                  </div>
                  <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
                    <table style={{ 
                      width: '100%', 
                      borderCollapse: 'collapse',
                      fontFamily: "'Times New Roman', Times, serif",
                      fontSize: '14px'
                    }}>
                      <thead>
                        <tr style={{ background: '#f0f0f0', borderBottom: '2px solid #ccc' }}>
                          <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', color: '#000', borderRight: '1px solid #ddd', minWidth: '40px' }}>Jour</th>
                          <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', color: '#000', borderRight: '1px solid #ddd', minWidth: '70px' }}>N° pièce</th>
                          <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', color: '#000', borderRight: '1px solid #ddd', minWidth: '70px' }}>N° facture</th>
                          <th style={{ padding: '8px', textAlign: 'left', fontWeight: '600', color: '#000', borderRight: '1px solid #ddd', minWidth: '100px' }}>Référence</th>
                          <th style={{ padding: '8px', textAlign: 'left', fontWeight: '600', color: '#000', borderRight: '1px solid #ddd', minWidth: '80px' }}>N° compte</th>
                          <th style={{ padding: '8px', textAlign: 'left', fontWeight: '600', color: '#000', borderRight: '1px solid #ddd', minWidth: '100px' }}>N° compte tiers</th>
                          <th style={{ padding: '8px', textAlign: 'left', fontWeight: '600', color: '#000', borderRight: '1px solid #ddd', minWidth: '200px' }}>Libellé écriture</th>
                          <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', color: '#000', borderRight: '1px solid #ddd', minWidth: '90px' }}>Date échéance</th>
                          <th style={{ padding: '8px', textAlign: 'right', fontWeight: '600', color: '#000', borderRight: '1px solid #ddd', minWidth: '100px' }}>Débit</th>
                          <th style={{ padding: '8px', textAlign: 'right', fontWeight: '600', color: '#000', minWidth: '100px' }}>Crédit</th>
                          {(isAdmin || isComptable) && (
                            <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', color: '#000', minWidth: '120px' }}>Actions</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEcritures.flatMap((ecriture) => {
                          if (!ecriture) return []
                          const ecritureDate = ecriture.date ? new Date(ecriture.date) : new Date()
                          const jour = ecriture.jour || ecritureDate.getDate().toString().padStart(2, '0')
                          
                          // Récupérer les lignes détaillées ou créer à partir des données existantes
                          let lignesDebitDetaillees = []
                          let lignesCreditDetaillees = []
                          
                          if (ecriture.lignesDebit && Array.isArray(ecriture.lignesDebit) && ecriture.lignesDebit.length > 0) {
                            // Utiliser les lignes détaillées sauvegardées
                            lignesDebitDetaillees = ecriture.lignesDebit.filter(l => l.compte && l.compte.trim())
                          } else {
                            // Mode rétrocompatibilité : créer les lignes à partir des données existantes
                            const compteDebit = ecriture.compteDebit || ecriture.compte || ''
                            if (compteDebit) {
                              const comptesDebitArray = compteDebit.split(',').map(c => c.trim()).filter(c => c)
                              const montantDebitTotal = parseFloat(ecriture.montantDebit) || parseFloat(ecriture.montant) || 0
                              const montantParCompte = comptesDebitArray.length > 0 ? montantDebitTotal / comptesDebitArray.length : 0
                              
                              comptesDebitArray.forEach((compte, idx) => {
                                lignesDebitDetaillees.push({
                                  compte: compte.trim(),
                                  compteTiers: ecriture.compteTiers || '',
                                  libelle: ecriture.libelle || '',
                                  montant: idx === 0 ? montantDebitTotal.toString() : '0'
                                })
                              })
                            }
                          }
                          
                          if (ecriture.lignesCredit && Array.isArray(ecriture.lignesCredit) && ecriture.lignesCredit.length > 0) {
                            // Utiliser les lignes détaillées sauvegardées
                            lignesCreditDetaillees = ecriture.lignesCredit.filter(l => l.compte && l.compte.trim())
                          } else {
                            // Mode rétrocompatibilité : créer les lignes à partir des données existantes
                            const compteCredit = ecriture.compteCredit || ''
                            if (compteCredit) {
                              const comptesCreditArray = compteCredit.split(',').map(c => c.trim()).filter(c => c)
                              const montantCreditTotal = parseFloat(ecriture.montantCredit) || parseFloat(ecriture.montant) || 0
                              const montantParCompte = comptesCreditArray.length > 0 ? montantCreditTotal / comptesCreditArray.length : 0
                              
                              comptesCreditArray.forEach((compte, idx) => {
                                lignesCreditDetaillees.push({
                                  compte: compte.trim(),
                                  compteTiers: ecriture.compteTiers || '',
                                  libelle: ecriture.libelle || '',
                                  montant: idx === 0 ? montantCreditTotal.toString() : '0'
                                })
                              })
                            }
                          }

                          const lignes = []
                          
                          // Ajouter les lignes de débit (afficher toutes les lignes avec compte, même sans montant)
                          lignesDebitDetaillees.forEach((ligne, idx) => {
                            if (ligne.compte && ligne.compte.trim()) {
                              lignes.push({
                                type: 'debit',
                                ecritureId: ecriture.id,
                                ligneIndex: idx,
                                ...ligne
                              })
                            }
                          })
                          
                          // Ajouter les lignes de crédit (afficher toutes les lignes avec compte, même sans montant)
                          lignesCreditDetaillees.forEach((ligne, idx) => {
                            if (ligne.compte && ligne.compte.trim()) {
                              lignes.push({
                                type: 'credit',
                                ecritureId: ecriture.id,
                                ligneIndex: idx,
                                ...ligne
                              })
                            }
                          })
                          
                          return lignes.map((ligne, ligneIdx) => (
                            <tr 
                              key={`${ecriture.id}-${ligne.type}-${ligneIdx}`} 
                              style={{ 
                                borderBottom: '1px solid #e0e0e0',
                                background: ligne.type === 'debit' ? '#f0f9ff' : '#fff1f2'
                              }}
                            >
                              <td style={{ padding: '6px 8px', textAlign: 'center', color: '#000', borderRight: '1px solid #ddd' }}>
                                {ligneIdx === 0 ? jour : ''}
                              </td>
                              <td style={{ padding: '6px 8px', textAlign: 'center', color: '#000', borderRight: '1px solid #ddd' }}>
                                {ligneIdx === 0 ? (ecriture.numero || '-') : ''}
                              </td>
                              <td style={{ padding: '6px 8px', textAlign: 'center', color: '#000', borderRight: '1px solid #ddd' }}>
                                {ligneIdx === 0 ? (ecriture.numeroFacture || '-') : ''}
                              </td>
                              <td style={{ padding: '6px 8px', textAlign: 'left', color: '#000', borderRight: '1px solid #ddd' }}>
                                {ligneIdx === 0 ? (ecriture.reference || '-') : ''}
                              </td>
                              <td style={{ padding: '6px 8px', textAlign: 'left', color: '#000', borderRight: '1px solid #ddd', fontWeight: ligneIdx === 0 ? '500' : '400' }}>
                                {ligne.compte}
                              </td>
                              <td style={{ padding: '6px 8px', textAlign: 'left', color: '#000', borderRight: '1px solid #ddd' }}>
                                {ligne.compteTiers || '-'}
                              </td>
                              <td style={{ padding: '6px 8px', textAlign: 'left', color: '#000', borderRight: '1px solid #ddd' }}>
                                {ligne.libelle || ecriture.libelle || '-'}
                              </td>
                              <td style={{ padding: '6px 8px', textAlign: 'center', color: '#000', borderRight: '1px solid #ddd' }}>
                                {ligneIdx === 0 && ecriture.dateEcheance 
                                  ? new Date(ecriture.dateEcheance).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) 
                                  : '-'}
                              </td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', color: '#000', borderRight: '1px solid #ddd', fontFamily: 'monospace' }}>
                                {ligne.type === 'debit' && parseFloat(ligne.montant || 0) > 0
                                  ? parseFloat(ligne.montant || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                                  : ''}
                              </td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', color: '#000', fontFamily: 'monospace' }}>
                                {ligne.type === 'credit' && parseFloat(ligne.montant || 0) > 0
                                  ? parseFloat(ligne.montant || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                                  : ''}
                              </td>
                              {(isAdmin || isComptable) && (
                                <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                                  {ligneIdx === 0 && (
                                    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                                      {!ecriture.valide && (
                                        <button
                                          onClick={() => handleEdit(ecriture)}
                                          style={{
                                            padding: '0.25rem 0.5rem',
                                            background: '#f1f5f9',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                          }}
                                          title="Modifier"
                                        >
                                          <Edit size={14} />
                                        </button>
                                      )}
                                      {(!ecriture.valide || isAdmin) && (
                                        <button
                                          onClick={() => handleDelete(ecriture.id)}
                                          style={{
                                            padding: '0.25rem 0.5rem',
                                            background: '#fef2f2',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                          }}
                                          title="Supprimer"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </td>
                              )}
                            </tr>
                          ))
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: '#f0f0f0', borderTop: '2px solid #ccc', fontWeight: '600' }}>
                          <td colSpan="8" style={{ padding: '8px', textAlign: 'right', color: '#000', borderRight: '1px solid #ddd' }}>
                            Totaux journal
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right', color: '#000', borderRight: '1px solid #ddd', fontFamily: 'monospace' }}>
                            {filteredEcritures.reduce((sum, e) => sum + (parseFloat(e?.montantDebit) || parseFloat(e?.montant) || 0), 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right', color: '#000', fontFamily: 'monospace' }}>
                            {filteredEcritures.reduce((sum, e) => sum + (parseFloat(e?.montantCredit) || parseFloat(e?.montant) || 0), 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </td>
                          {(isAdmin || isComptable) && <td></td>}
                        </tr>
                        {(() => {
                          const totalDebit = filteredEcritures.reduce((sum, e) => sum + (parseFloat(e?.montantDebit) || parseFloat(e?.montant) || 0), 0)
                          const totalCredit = filteredEcritures.reduce((sum, e) => sum + (parseFloat(e?.montantCredit) || parseFloat(e?.montant) || 0), 0)
                          const solde = Math.abs(totalDebit - totalCredit)
                          return solde > 0 && (
                            <tr style={{ background: '#fff3cd', borderTop: '1px solid #ccc' }}>
                              <td colSpan="8" style={{ padding: '8px', textAlign: 'right', color: '#856404', borderRight: '1px solid #ddd' }}>
                                Solde à équilibrer
                              </td>
                              <td style={{ padding: '8px', textAlign: 'right', color: '#856404', borderRight: '1px solid #ddd', fontFamily: 'monospace' }}>
                                {totalDebit > totalCredit ? solde.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : ''}
                              </td>
                              <td style={{ padding: '8px', textAlign: 'right', color: '#856404', fontFamily: 'monospace' }}>
                                {totalCredit > totalDebit ? solde.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : ''}
                              </td>
                              {(isAdmin || isComptable) && <td></td>}
                            </tr>
                          )
                        })()}
                      </tfoot>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'grand-livre' && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            {grandLivre.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                <BookOpen size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p>Aucune écriture pour le grand livre</p>
              </div>
            ) : (
              <>
                <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => exportGrandLivrePDF(grandLivre, dateDebut, dateFin)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#6366f1',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontWeight: '500',
                      fontSize: '14px'
                    }}
                  >
                    <Download size={18} />
                    Exporter en PDF
                  </button>
                </div>
                <div style={{ overflowX: 'auto', width: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1200px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Compte</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Libellé</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#475569' }}>Débit</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#475569' }}>Crédit</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#475569' }}>Solde</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grandLivre.map((compte) => {
                      const solde = compte.credit - compte.debit
                      return (
                        <tr key={compte.compte} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '1rem', fontWeight: '500', color: 'black' }}>{compte.compte}</td>
                          <td style={{ padding: '1rem', color: 'black' }}>{compte.libelle}</td>
                          <td style={{ padding: '1rem', textAlign: 'right', color: '#666' }}>
                            {compte.debit > 0 ? compte.debit.toLocaleString() + ' F' : '-'}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right', color: '#666' }}>
                            {compte.credit > 0 ? compte.credit.toLocaleString() + ' F' : '-'}
                          </td>
                          <td style={{ 
                            padding: '1rem', 
                            textAlign: 'right', 
                            fontWeight: '500',
                            color: solde >= 0 ? '#10b981' : '#ef4444'
                          }}>
                            {solde !== 0 ? (solde >= 0 ? '+' : '') + solde.toLocaleString() + ' F' : '-'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                      <td colSpan="2" style={{ padding: '1rem', fontWeight: '600', color: 'black' }}>TOTAL</td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: 'black' }}>
                        {grandLivre.reduce((sum, c) => sum + c.debit, 0).toLocaleString()} F
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: 'black' }}>
                        {grandLivre.reduce((sum, c) => sum + c.credit, 0).toLocaleString()} F
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: 'black' }}>
                        {balance.solde >= 0 ? '+' : ''}{balance.solde.toLocaleString()} F
                      </td>
                    </tr>
                  </tfoot>
                </table>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'balance' && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
          padding: '2rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'black', margin: 0 }}>
                Balance Comptable
              </h2>
              <button
                onClick={() => exportBalancePDF(balance, dateDebut, dateFin)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: '500',
                  fontSize: '14px'
                }}
              >
                <Download size={18} />
                Exporter en PDF
              </button>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                padding: '1.5rem',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Débit</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'black', margin: 0 }}>
                  {balance.totalDebit.toLocaleString()} F
                </p>
              </div>
              <div style={{
                padding: '1.5rem',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Crédit</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'black', margin: 0 }}>
                  {balance.totalCredit.toLocaleString()} F
                </p>
              </div>
              <div style={{
                padding: '1.5rem',
                background: Math.abs(balance.solde) < 0.01 ? '#d1fae5' : '#fee2e2',
                borderRadius: '8px',
                border: `1px solid ${Math.abs(balance.solde) < 0.01 ? '#10b981' : '#ef4444'}`
              }}>
                <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Solde</p>
                <p style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold', 
                  color: Math.abs(balance.solde) < 0.01 ? '#10b981' : '#ef4444', 
                  margin: 0 
                }}>
                  {balance.solde >= 0 ? '+' : ''}{balance.solde.toLocaleString()} F
                </p>
              </div>
            </div>
            {Math.abs(balance.solde) >= 0.01 && (
              <div style={{
                padding: '1rem',
                background: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: '8px',
                color: '#92400e',
                marginBottom: '2rem'
              }}>
                ⚠️ Attention : La balance n'est pas équilibrée. Vérifiez les écritures. (Écart: {Math.abs(balance.solde).toLocaleString()} F)
              </div>
            )}
            {balance.details && balance.details.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Compte</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Libellé</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#475569' }}>Débit</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#475569' }}>Crédit</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#475569' }}>Solde</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balance.details.map((detail) => (
                      <tr key={detail.compte} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem', fontWeight: '500', color: 'black' }}>{detail.compte}</td>
                        <td style={{ padding: '1rem', color: 'black' }}>{detail.libelle}</td>
                        <td style={{ padding: '1rem', textAlign: 'right', color: '#666' }}>
                          {detail.debit > 0 ? detail.debit.toLocaleString() + ' F' : '-'}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', color: '#666' }}>
                          {detail.credit > 0 ? detail.credit.toLocaleString() + ' F' : '-'}
                        </td>
                        <td style={{ 
                          padding: '1rem', 
                          textAlign: 'right', 
                          fontWeight: '500',
                          color: detail.solde >= 0 ? '#10b981' : '#ef4444'
                        }}>
                          {detail.solde !== 0 ? (detail.solde >= 0 ? '+' : '') + detail.solde.toLocaleString() + ' F' : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                      <td colSpan="2" style={{ padding: '1rem', fontWeight: '600', color: 'black' }}>TOTAL</td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: 'black' }}>
                        {balance.totalDebit.toLocaleString()} F
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: 'black' }}>
                        {balance.totalCredit.toLocaleString()} F
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: 'black' }}>
                        {balance.solde >= 0 ? '+' : ''}{balance.solde.toLocaleString()} F
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'rapports' && (() => {
          const rapportsGenere = generateRapports(filteredEcritures)
          return (
            <div style={{
              background: 'white',
          borderRadius: '12px',
              padding: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'black' }}>
                  Rapports Comptables
                </h2>
                <p style={{ fontSize: '0.875rem', color: '#666' }}>
                  Généré automatiquement le {new Date(rapportsGenere.dateGeneration).toLocaleDateString('fr-FR')}
                </p>
        </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                <div style={{
                  padding: '1.5rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}>
                  <p style={{ fontWeight: '600', color: 'black', margin: '0 0 0.5rem 0' }}>Période</p>
                  <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
                    Du {new Date(rapportsGenere.periode.debut).toLocaleDateString('fr-FR')} au {new Date(rapportsGenere.periode.fin).toLocaleDateString('fr-FR')}
                  </p>
      </div>
                <div style={{
                  padding: '1.5rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}>
                  <p style={{ fontWeight: '600', color: 'black', margin: '0 0 0.5rem 0' }}>Nombre d'écritures</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'black', margin: 0 }}>
                    {rapportsGenere.nombreEcritures}
                  </p>
                </div>
                <div style={{
                  padding: '1.5rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}>
                  <p style={{ fontWeight: '600', color: 'black', margin: '0 0 0.5rem 0' }}>Écritures validées</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981', margin: 0 }}>
                    {rapportsGenere.ecrituresValidees}
                  </p>
                </div>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1rem'
              }}>
                <button
                  onClick={() => {
                    const dataStr = JSON.stringify(rapportsGenere, null, 2)
                    const dataBlob = new Blob([dataStr], { type: 'application/json' })
                    const url = URL.createObjectURL(dataBlob)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = `rapports_comptables_${rapportsGenere.periode.debut}_${rapportsGenere.periode.fin}.json`
                    link.click()
                  }}
                  style={{
                    padding: '1.5rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  <Download size={24} color="#6366f1" />
                  <div>
                    <p style={{ fontWeight: '600', color: 'black', margin: 0 }}>Export JSON</p>
                    <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>Exporter les rapports</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    const balanceData = generateBalance(filteredEcritures)
                    const balanceStr = `Balance Comptable\n\nTotal Débit: ${balanceData.totalDebit.toLocaleString()} F\nTotal Crédit: ${balanceData.totalCredit.toLocaleString()} F\nSolde: ${balanceData.solde.toLocaleString()} F`
                    const dataBlob = new Blob([balanceStr], { type: 'text/plain' })
                    const url = URL.createObjectURL(dataBlob)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = `balance_${dateDebut}_${dateFin}.txt`
                    link.click()
                  }}
                  style={{
                    padding: '1.5rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  <FileText size={24} color="#6366f1" />
                  <div>
                    <p style={{ fontWeight: '600', color: 'black', margin: 0 }}>Export Balance</p>
                    <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>Exporter la balance</p>
                  </div>
                </button>
              </div>
            </div>
          )
        })()}

        {activeTab === 'etat-financier' && (() => {
          const etatFinancier = generateEtatFinancier(filteredEcritures)
          return (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '2rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'black' }}>
                  État Financier
                </h2>
                <p style={{ fontSize: '0.875rem', color: '#666' }}>
                  Généré automatiquement le {new Date(etatFinancier.dateGeneration).toLocaleDateString('fr-FR')}
                </p>
              </div>
              
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'black' }}>
                  Compte de Résultat
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem'
                }}>
                  <div style={{
                    padding: '1.5rem',
                    background: '#d1fae5',
                    border: '1px solid #10b981',
                    borderRadius: '8px'
                  }}>
                    <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Produits</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981', margin: 0 }}>
                      {etatFinancier.compteResultat.produits.toLocaleString()} F
                    </p>
                  </div>
                  <div style={{
                    padding: '1.5rem',
                    background: '#fee2e2',
                    border: '1px solid #ef4444',
                    borderRadius: '8px'
                  }}>
                    <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Charges</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444', margin: 0 }}>
                      {etatFinancier.compteResultat.charges.toLocaleString()} F
                    </p>
                  </div>
                  <div style={{
                    padding: '1.5rem',
                    background: etatFinancier.compteResultat.resultatExploitation >= 0 ? '#d1fae5' : '#fee2e2',
                    border: `1px solid ${etatFinancier.compteResultat.resultatExploitation >= 0 ? '#10b981' : '#ef4444'}`,
                    borderRadius: '8px'
                  }}>
                    <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Résultat d'exploitation</p>
                    <p style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: 'bold', 
                      color: etatFinancier.compteResultat.resultatExploitation >= 0 ? '#10b981' : '#ef4444', 
                      margin: 0 
                    }}>
                      {etatFinancier.compteResultat.resultatExploitation >= 0 ? '+' : ''}{etatFinancier.compteResultat.resultatExploitation.toLocaleString()} F
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'black' }}>
                  Bilan
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem'
                }}>
                  <div style={{
                    padding: '1.5rem',
                    background: '#dbeafe',
                    border: '1px solid #3b82f6',
                    borderRadius: '8px'
                  }}>
                    <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Actif</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6', margin: 0 }}>
                      {etatFinancier.bilan.actif.toLocaleString()} F
                    </p>
                  </div>
                  <div style={{
                    padding: '1.5rem',
                    background: '#fef3c7',
                    border: '1px solid #f59e0b',
                    borderRadius: '8px'
                  }}>
                    <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Passif</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b', margin: 0 }}>
                      {etatFinancier.bilan.passif.toLocaleString()} F
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Modal de création/édition */}
        {showModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '0',
              padding: '0',
              maxWidth: '95vw',
              width: '1200px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              fontFamily: "Arial, 'MS Sans Serif', sans-serif",
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              border: '3px solid #808080'
            }}>
              {/* Barre de titre style Sage */}
              <div style={{
                background: 'linear-gradient(to bottom, #c0c0c0, #808080)',
                padding: '4px 8px',
                borderBottom: '2px solid #000',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#000'
              }}>
                <span>{journaux[formData.journal] || 'Journal de saisie'} - {editingEcriture ? 'Modification' : 'Nouvelle écriture'}</span>
                <button
                  onClick={resetForm}
                  style={{
                    background: 'transparent',
                    border: '1px solid #808080',
                    cursor: 'pointer',
                    padding: '2px 6px',
                    fontSize: '12px',
                    color: '#000',
                    fontWeight: 'bold',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Fermer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* En-tête style Sage - Zone commune */}
                <div style={{
                  padding: '6px 8px',
                  background: '#d4d0c8',
                  borderBottom: '2px solid #808080',
                  display: 'grid',
                  gridTemplateColumns: 'auto 120px auto 120px auto 120px',
                  gap: '8px',
                  alignItems: 'center',
                  fontSize: '11px'
                }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#000', whiteSpace: 'nowrap' }}>
                    Journal:
                  </label>
                  <select
                    required
                    value={formData.journal}
                    onChange={(e) => setFormData({ ...formData, journal: e.target.value })}
                    style={{
                      padding: '2px 4px',
                      border: '2px inset #d4d0c8',
                      borderRadius: '0',
                      fontSize: '11px',
                      color: '#000',
                      background: '#ffffff',
                      width: '100%',
                      fontFamily: "Arial, 'MS Sans Serif', sans-serif"
                    }}
                  >
                    {Object.entries(journaux).map(([code, label]) => (
                      <option key={code} value={code}>{label}</option>
                    ))}
                  </select>
                  
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#000', whiteSpace: 'nowrap' }}>
                    Date:
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => {
                      const newDate = e.target.value
                      const dateObj = new Date(newDate)
                      const jour = dateObj.getDate().toString().padStart(2, '0')
                      setFormData({ ...formData, date: newDate, jour })
                    }}
                    style={{
                      padding: '2px 4px',
                      border: '2px inset #d4d0c8',
                      borderRadius: '0',
                      fontSize: '11px',
                      color: '#000',
                      background: '#ffffff',
                      width: '100%',
                      fontFamily: "Arial, 'MS Sans Serif', sans-serif"
                    }}
                  />
                  
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#000', whiteSpace: 'nowrap' }}>
                    Pièce N°:
                  </label>
                  <input
                    type="text"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    style={{
                      padding: '2px 4px',
                      border: '2px inset #d4d0c8',
                      borderRadius: '0',
                      fontSize: '11px',
                      color: '#000',
                      background: '#ffffff',
                      width: '100%',
                      fontFamily: "Arial, 'MS Sans Serif', sans-serif"
                    }}
                    placeholder="Auto"
                  />
                </div>

                {/* Tableau de saisie style Sage */}
                <div style={{ flex: 1, overflow: 'auto', border: '2px inset #d4d0c8' }}>
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'separate',
                    borderSpacing: '0',
                    fontSize: '11px',
                    background: 'white',
                    fontFamily: "Arial, 'MS Sans Serif', sans-serif"
                  }}>
                    <thead>
                      <tr style={{ background: '#d4d0c8', borderBottom: '2px solid #808080' }}>
                        <th style={{ padding: '3px 4px', textAlign: 'center', fontWeight: 'bold', color: '#000', border: '1px solid #808080', borderTop: 'none', borderLeft: 'none', width: '35px', fontSize: '10px' }}>Jour</th>
                        <th style={{ padding: '3px 4px', textAlign: 'center', fontWeight: 'bold', color: '#000', border: '1px solid #808080', borderTop: 'none', width: '80px', fontSize: '10px' }}>N° facture</th>
                        <th style={{ padding: '3px 4px', textAlign: 'left', fontWeight: 'bold', color: '#000', border: '1px solid #808080', borderTop: 'none', width: '100px', fontSize: '10px' }}>Référence</th>
                        <th style={{ padding: '3px 4px', textAlign: 'left', fontWeight: 'bold', color: '#000', border: '1px solid #808080', borderTop: 'none', width: '120px', fontSize: '10px' }}>N° compte</th>
                        <th style={{ padding: '3px 4px', textAlign: 'left', fontWeight: 'bold', color: '#000', border: '1px solid #808080', borderTop: 'none', width: '120px', fontSize: '10px' }}>N° compte tiers</th>
                        <th style={{ padding: '3px 4px', textAlign: 'left', fontWeight: 'bold', color: '#000', border: '1px solid #808080', borderTop: 'none', minWidth: '250px', fontSize: '10px' }}>Libellé écriture</th>
                        <th style={{ padding: '3px 4px', textAlign: 'center', fontWeight: 'bold', color: '#000', border: '1px solid #808080', borderTop: 'none', width: '110px', fontSize: '10px' }}>Date échéance</th>
                        <th style={{ padding: '3px 4px', textAlign: 'right', fontWeight: 'bold', color: '#000', border: '1px solid #808080', borderTop: 'none', width: '110px', fontSize: '10px' }}>Débit</th>
                        <th style={{ padding: '3px 4px', textAlign: 'right', fontWeight: 'bold', color: '#000', border: '1px solid #808080', borderTop: 'none', width: '110px', fontSize: '10px' }}>Crédit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* 4 Lignes de saisie Débit */}
                      {lignesDebit.map((ligne, index) => (
                        <tr key={`debit-${index}`} style={{ borderBottom: index < 3 ? '1px solid #d4d0c8' : 'none', background: '#ffffff' }}>
                          <td style={{ padding: '2px 4px', textAlign: 'center', border: '2px inset #d4d0c8', borderTop: 'none', borderLeft: 'none', background: index === 0 ? '#ffffff' : '#f5f5f5' }}>
                            {index === 0 ? (
                              <input
                                type="text"
                                value={formData.jour}
                                onChange={(e) => setFormData({ ...formData, jour: e.target.value })}
                                style={{
                                  width: '100%',
                                  padding: '2px 4px',
                                  border: 'none',
                                  fontSize: '11px',
                                  textAlign: 'center',
                                  background: 'transparent',
                                  fontFamily: "Arial, 'MS Sans Serif', sans-serif"
                                }}
                                placeholder="JJ"
                                maxLength={2}
                              />
                            ) : (
                              <span style={{ color: '#666', fontSize: '11px' }}>{formData.jour}</span>
                            )}
                          </td>
                          <td style={{ padding: '2px 4px', textAlign: 'center', border: '2px inset #d4d0c8', borderTop: 'none', background: index === 0 ? '#ffffff' : '#f5f5f5' }}>
                            {index === 0 ? (
                              <input
                                type="text"
                                value={formData.numeroFacture}
                                onChange={(e) => setFormData({ ...formData, numeroFacture: e.target.value })}
                                style={{
                                  width: '100%',
                                  padding: '2px 4px',
                                  border: 'none',
                                  fontSize: '11px',
                                  textAlign: 'center',
                                  background: 'transparent',
                                  fontFamily: "Arial, 'MS Sans Serif', sans-serif"
                                }}
                                placeholder=""
                              />
                            ) : (
                              <span style={{ color: '#666', fontSize: '11px' }}>{formData.numeroFacture || '-'}</span>
                            )}
                          </td>
                          <td style={{ padding: '2px 4px', textAlign: 'left', border: '2px inset #d4d0c8', borderTop: 'none', background: index === 0 ? '#ffffff' : '#f5f5f5' }}>
                            {index === 0 ? (
                              <input
                                type="text"
                                value={formData.reference}
                                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                                style={{
                                  width: '100%',
                                  padding: '2px 4px',
                                  border: 'none',
                                  fontSize: '11px',
                                  background: 'transparent',
                                  fontFamily: "Arial, 'MS Sans Serif', sans-serif"
                                }}
                                placeholder=""
                              />
                            ) : (
                              <span style={{ color: '#666', fontSize: '11px' }}>{formData.reference || '-'}</span>
                            )}
                          </td>
                          <td style={{ padding: '2px 4px', border: '2px inset #d4d0c8', borderTop: 'none', background: '#c6efce' }}>
                            <select
                              value={ligne.compte}
                              onChange={(e) => {
                                const nouvellesLignes = [...lignesDebit]
                                nouvellesLignes[index].compte = e.target.value
                                setLignesDebit(nouvellesLignes)
                              }}
                              style={{
                                width: '100%',
                                padding: '2px 4px',
                                border: 'none',
                                fontSize: '11px',
                                background: 'transparent',
                                fontFamily: "Arial, 'MS Sans Serif', sans-serif"
                              }}
                            >
                              <option value="">Sélectionner</option>
                              {Object.entries(planComptable).map(([code, info]) => (
                                <option key={code} value={code}>{code} - {info.label}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '2px 4px', border: '2px inset #d4d0c8', borderTop: 'none', background: '#ffffff' }}>
                            <select
                              value={ligne.compteTiers}
                              onChange={(e) => {
                                const nouvellesLignes = [...lignesDebit]
                                nouvellesLignes[index].compteTiers = e.target.value
                                setLignesDebit(nouvellesLignes)
                              }}
                              style={{
                                width: '100%',
                                padding: '2px 4px',
                                border: 'none',
                                fontSize: '11px',
                                background: 'transparent',
                                fontFamily: "Arial, 'MS Sans Serif', sans-serif"
                              }}
                            >
                              <option value="">-</option>
                              {Object.entries(planComptable)
                                .filter(([code, info]) => info.type === 'client' || info.type === 'fournisseur')
                                .map(([code, info]) => (
                                  <option key={code} value={code}>{code}</option>
                                ))}
                            </select>
                          </td>
                          <td style={{ padding: '2px 4px', border: '2px inset #d4d0c8', borderTop: 'none', background: index === 0 ? '#ffffff' : '#f5f5f5' }}>
                            {index === 0 ? (
                              <input
                                type="text"
                                value={formData.libelle}
                                onChange={(e) => {
                                  setFormData({ ...formData, libelle: e.target.value })
                                  const nouvellesLignes = [...lignesDebit]
                                  nouvellesLignes[index].libelle = e.target.value
                                  setLignesDebit(nouvellesLignes)
                                }}
                                style={{
                                  width: '100%',
                                  padding: '2px 4px',
                                  border: 'none',
                                  fontSize: '11px',
                                  background: 'transparent',
                                  fontFamily: "Arial, 'MS Sans Serif', sans-serif"
                                }}
                                placeholder="Libellé"
                              />
                            ) : (
                              <input
                                type="text"
                                value={ligne.libelle}
                                onChange={(e) => {
                                  const nouvellesLignes = [...lignesDebit]
                                  nouvellesLignes[index].libelle = e.target.value
                                  setLignesDebit(nouvellesLignes)
                                }}
                                style={{
                                  width: '100%',
                                  padding: '2px 4px',
                                  border: 'none',
                                  fontSize: '11px',
                                  background: 'transparent',
                                  fontFamily: "Arial, 'MS Sans Serif', sans-serif"
                                }}
                                placeholder=""
                              />
                            )}
                          </td>
                          <td style={{ padding: '2px 4px', textAlign: 'center', border: '2px inset #d4d0c8', borderTop: 'none', background: index === 0 ? '#ffffff' : '#f5f5f5' }}>
                            {index === 0 ? (
                              <input
                                type="date"
                                value={formData.dateEcheance}
                                onChange={(e) => setFormData({ ...formData, dateEcheance: e.target.value })}
                                style={{
                                  width: '100%',
                                  padding: '2px 4px',
                                  border: 'none',
                                  fontSize: '11px',
                                  background: 'transparent',
                                  fontFamily: "Arial, 'MS Sans Serif', sans-serif"
                                }}
                              />
                            ) : (
                              <span style={{ color: '#666', fontSize: '11px' }}>{formData.dateEcheance ? new Date(formData.dateEcheance).toLocaleDateString('fr-FR') : '-'}</span>
                            )}
                          </td>
                          <td style={{ padding: '2px 4px', textAlign: 'right', border: '2px inset #d4d0c8', borderTop: 'none', background: '#c6efce' }}>
                            <input
                              type="number"
                              step="0.01"
                              value={ligne.montant}
                              onChange={(e) => {
                                const nouvellesLignes = [...lignesDebit]
                                nouvellesLignes[index].montant = e.target.value
                                setLignesDebit(nouvellesLignes)
                              }}
                              style={{
                                width: '100%',
                                padding: '2px 4px',
                                border: 'none',
                                fontSize: '11px',
                                textAlign: 'right',
                                fontFamily: 'Courier New, monospace',
                                background: 'transparent'
                              }}
                              placeholder="0.00"
                            />
                          </td>
                          <td style={{ padding: '2px 4px', textAlign: 'right', border: '2px inset #d4d0c8', borderTop: 'none', background: '#c6efce', borderRight: '2px inset #d4d0c8' }}>
                            <span style={{
                              display: 'inline-block',
                              width: '100%',
                              padding: '2px 4px',
                              fontSize: '11px',
                              textAlign: 'right',
                              fontFamily: 'Courier New, monospace',
                              background: 'transparent',
                              color: '#666'
                            }}>-</span>
                          </td>
                        </tr>
                      ))}
                      {/* 4 Lignes de saisie Crédit */}
                      {lignesCredit.map((ligne, index) => (
                        <tr key={`credit-${index}`} style={{ borderBottom: index < 3 ? '1px solid #d4d0c8' : 'none', background: '#ffffff' }}>
                          <td style={{ padding: '2px 4px', textAlign: 'center', border: '2px inset #d4d0c8', borderTop: 'none', borderLeft: 'none', background: '#f5f5f5' }}>
                            <span style={{ color: '#666', fontSize: '11px' }}>{formData.jour}</span>
                          </td>
                          <td style={{ padding: '2px 4px', textAlign: 'center', border: '2px inset #d4d0c8', borderTop: 'none', background: '#f5f5f5' }}>
                            <span style={{ color: '#666', fontSize: '11px' }}>{formData.numeroFacture || '-'}</span>
                          </td>
                          <td style={{ padding: '2px 4px', textAlign: 'left', border: '2px inset #d4d0c8', borderTop: 'none', background: '#f5f5f5' }}>
                            <span style={{ color: '#666', fontSize: '11px' }}>{formData.reference || '-'}</span>
                          </td>
                          <td style={{ padding: '2px 4px', border: '2px inset #d4d0c8', borderTop: 'none', background: '#ffc7ce' }}>
                            <select
                              value={ligne.compte}
                              onChange={(e) => {
                                const nouvellesLignes = [...lignesCredit]
                                nouvellesLignes[index].compte = e.target.value
                                setLignesCredit(nouvellesLignes)
                              }}
                              style={{
                                width: '100%',
                                padding: '2px 4px',
                                border: 'none',
                                fontSize: '11px',
                                background: 'transparent',
                                fontFamily: "Arial, 'MS Sans Serif', sans-serif"
                              }}
                            >
                              <option value="">Sélectionner</option>
                              {Object.entries(planComptable).map(([code, info]) => (
                                <option key={code} value={code}>{code} - {info.label}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '2px 4px', border: '2px inset #d4d0c8', borderTop: 'none', background: '#ffffff' }}>
                            <select
                              value={ligne.compteTiers}
                              onChange={(e) => {
                                const nouvellesLignes = [...lignesCredit]
                                nouvellesLignes[index].compteTiers = e.target.value
                                setLignesCredit(nouvellesLignes)
                              }}
                              style={{
                                width: '100%',
                                padding: '2px 4px',
                                border: 'none',
                                fontSize: '11px',
                                background: 'transparent',
                                fontFamily: "Arial, 'MS Sans Serif', sans-serif"
                              }}
                            >
                              <option value="">-</option>
                              {Object.entries(planComptable)
                                .filter(([code, info]) => info.type === 'client' || info.type === 'fournisseur')
                                .map(([code, info]) => (
                                  <option key={code} value={code}>{code}</option>
                                ))}
                            </select>
                          </td>
                          <td style={{ padding: '2px 4px', border: '2px inset #d4d0c8', borderTop: 'none', background: '#f5f5f5' }}>
                            <input
                              type="text"
                              value={ligne.libelle || formData.libelle}
                              onChange={(e) => {
                                const nouvellesLignes = [...lignesCredit]
                                nouvellesLignes[index].libelle = e.target.value
                                setLignesCredit(nouvellesLignes)
                              }}
                              style={{
                                width: '100%',
                                padding: '2px 4px',
                                border: 'none',
                                fontSize: '11px',
                                background: 'transparent',
                                fontFamily: "Arial, 'MS Sans Serif', sans-serif"
                              }}
                              placeholder=""
                            />
                          </td>
                          <td style={{ padding: '2px 4px', textAlign: 'center', border: '2px inset #d4d0c8', borderTop: 'none', background: '#f5f5f5' }}>
                            <span style={{ color: '#666', fontSize: '11px' }}>{formData.dateEcheance ? new Date(formData.dateEcheance).toLocaleDateString('fr-FR') : '-'}</span>
                          </td>
                          <td style={{ padding: '2px 4px', textAlign: 'right', border: '2px inset #d4d0c8', borderTop: 'none', background: '#ffc7ce' }}>
                            <span style={{
                              display: 'inline-block',
                              width: '100%',
                              padding: '2px 4px',
                              fontSize: '11px',
                              textAlign: 'right',
                              fontFamily: 'Courier New, monospace',
                              background: 'transparent',
                              color: '#666'
                            }}>-</span>
                          </td>
                          <td style={{ padding: '2px 4px', textAlign: 'right', border: '2px inset #d4d0c8', borderTop: 'none', background: '#ffc7ce', borderRight: '2px inset #d4d0c8' }}>
                            <input
                              type="number"
                              step="0.01"
                              value={ligne.montant}
                              onChange={(e) => {
                                const nouvellesLignes = [...lignesCredit]
                                nouvellesLignes[index].montant = e.target.value
                                setLignesCredit(nouvellesLignes)
                              }}
                              style={{
                                width: '100%',
                                padding: '2px 4px',
                                border: 'none',
                                fontSize: '11px',
                                textAlign: 'right',
                                fontFamily: 'Courier New, monospace',
                                background: 'transparent'
                              }}
                              placeholder="0.00"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Section Totaux style Sage */}
                <div style={{
                  padding: '6px 8px',
                  background: '#d4d0c8',
                  borderTop: '2px solid #808080',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '2rem',
                  alignItems: 'center',
                  fontSize: '11px'
                }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#000' }}>Total Débit:</label>
                    <div style={{
                      padding: '2px 6px',
                      background: '#ffffff',
                      border: '2px inset #d4d0c8',
                      fontSize: '11px',
                      fontFamily: 'Courier New, monospace',
                      minWidth: '120px',
                      textAlign: 'right',
                      color: '#000'
                    }}>
                      {lignesDebit.reduce((sum, l) => sum + (parseFloat(l.montant) || 0), 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} F
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#000' }}>Total Crédit:</label>
                    <div style={{
                      padding: '2px 6px',
                      background: '#ffffff',
                      border: '2px inset #d4d0c8',
                      fontSize: '11px',
                      fontFamily: 'Courier New, monospace',
                      minWidth: '120px',
                      textAlign: 'right',
                      color: '#000'
                    }}>
                      {lignesCredit.reduce((sum, l) => sum + (parseFloat(l.montant) || 0), 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} F
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#000' }}>Solde:</label>
                    <div style={{
                      padding: '2px 6px',
                      background: (() => {
                        const totalDebit = lignesDebit.reduce((sum, l) => sum + (parseFloat(l.montant) || 0), 0)
                        const totalCredit = lignesCredit.reduce((sum, l) => sum + (parseFloat(l.montant) || 0), 0)
                        return Math.abs(totalDebit - totalCredit) < 0.01 ? '#c6efce' : '#ffc7ce'
                      })(),
                      border: '2px inset #d4d0c8',
                      fontSize: '11px',
                      fontFamily: 'Courier New, monospace',
                      fontWeight: 'bold',
                      minWidth: '120px',
                      textAlign: 'right',
                      color: '#000'
                    }}>
                      {(() => {
                        const totalDebit = lignesDebit.reduce((sum, l) => sum + (parseFloat(l.montant) || 0), 0)
                        const totalCredit = lignesCredit.reduce((sum, l) => sum + (parseFloat(l.montant) || 0), 0)
                        return (totalDebit - totalCredit).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      })()} F
                    </div>
                  </div>
                </div>

                {/* Pied de page avec boutons style Windows classique */}
                <div style={{
                  padding: '4px 8px',
                  background: '#d4d0c8',
                  borderTop: '2px solid #808080',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '4px'
                }}>
                  <button
                    type="button"
                    onClick={resetForm}
                    style={{
                      padding: '2px 11px 2px 11px',
                      border: '2px outset #d4d0c8',
                      borderRadius: '0',
                      background: '#d4d0c8',
                      cursor: 'pointer',
                      fontSize: '11px',
                      color: '#000',
                      fontWeight: 'bold',
                      fontFamily: "Arial, 'MS Sans Serif', sans-serif",
                      minWidth: '75px',
                      height: '23px'
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.border = '2px inset #d4d0c8'
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.border = '2px outset #d4d0c8'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.border = '2px outset #d4d0c8'
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '2px 11px 2px 11px',
                      border: '2px outset #d4d0c8',
                      borderRadius: '0',
                      background: '#d4d0c8',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      color: '#000',
                      fontFamily: "Arial, 'MS Sans Serif', sans-serif",
                      minWidth: '75px',
                      height: '23px'
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.border = '2px inset #d4d0c8'
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.border = '2px outset #d4d0c8'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.border = '2px outset #d4d0c8'
                    }}
                  >
                    {editingEcriture ? 'Modifier' : 'Enregistrer'}
                  </button>
                </div>
              </form>
        </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Comptabilite
