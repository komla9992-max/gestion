import React, { useState, useMemo, useEffect } from 'react'
import Layout from '../components/Layout'
import { useData } from '../context/DataContext'
import { exportFichePaiePDF } from '../utils/exportUtils'
import { DollarSign, Plus, Edit, Trash2, X, Search, Download, FileText, Calendar, User, TrendingUp, Wallet } from 'lucide-react'

const Paie = () => {
  const { employees, fichesPaie, setFichesPaie, conges } = useData()
  const [pointages, setPointages] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPeriode, setFilterPeriode] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [editingFiche, setEditingFiche] = useState(null)
  const [selectedPeriode, setSelectedPeriode] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [formData, setFormData] = useState({
    employeeId: '',
    periode: '',
    salaireBase: '',
    heuresTravaillees: '',
    heuresSupplementaires: '',
    posteHeuresSup: '',
    montantHeuresSup: '',
    primes: '',
    joursConges: '',
    montantConges: '',
    joursAbsences: '',
    montantAbsences: '',
    nbRetards: '',
    montantRetards: '',
    cnss: '',
    autresRetenues: '',
    observations: ''
  })

  // Charger les pointages depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pointages')
    if (saved) setPointages(JSON.parse(saved))
  }, [])

  // Remplir automatiquement le salaire de base lorsqu'un employé est sélectionné
  useEffect(() => {
    if (formData.employeeId) {
      const employee = employees.find(e => e.id === parseInt(formData.employeeId))
      if (employee && employee.salaire) {
        // En mode création, remplir automatiquement le salaire
        // En mode édition, remplir seulement si le champ est vide
        const salaireActuel = parseFloat(formData.salaireBase) || 0
        const salaireEmploye = employee.salaire
        
        if (!editingFiche) {
          // Mode création : toujours remplir avec le salaire de l'employé
          setFormData(prev => ({
            ...prev,
            salaireBase: salaireEmploye.toString()
          }))
        } else {
          // Mode édition : remplir seulement si le champ est vide ou 0
          if (salaireActuel === 0 || formData.salaireBase === '') {
            setFormData(prev => ({
              ...prev,
              salaireBase: salaireEmploye.toString()
            }))
          }
        }
      }
    }
  }, [formData.employeeId, employees, editingFiche]) // eslint-disable-line react-hooks/exhaustive-deps

  // Calculer automatiquement le montant des jours supplémentaires : (salaire de base / 30) × jours supplémentaires
  useEffect(() => {
    const salaireBase = parseFloat(formData.salaireBase) || 0
    const joursSupplementaires = parseFloat(formData.heuresSupplementaires) || 0
    
    // Calculer le nouveau montant selon la formule : (salaire de base / 30) × jours supplémentaires
    const montantCalc = (salaireBase / 30) * joursSupplementaires
    const nouveauMontant = montantCalc.toFixed(2)
    
    // Ne mettre à jour que si la valeur a changé pour éviter les boucles
    if (parseFloat(formData.montantHeuresSup) !== parseFloat(nouveauMontant)) {
      setFormData(prev => ({
        ...prev,
        montantHeuresSup: nouveauMontant
      }))
    }
  }, [formData.salaireBase, formData.heuresSupplementaires]) // eslint-disable-line react-hooks/exhaustive-deps

  // Calculer automatiquement le montant des absences : (salaire de base / 30) × jours d'absences
  useEffect(() => {
    const salaireBase = parseFloat(formData.salaireBase) || 0
    const joursAbsences = parseFloat(formData.joursAbsences) || 0
    
    // Calculer le nouveau montant selon la formule : (salaire de base / 30) × jours d'absences
    const montantCalc = (salaireBase / 30) * joursAbsences
    const nouveauMontant = montantCalc.toFixed(2)
    
    // Ne mettre à jour que si la valeur a changé pour éviter les boucles
    if (parseFloat(formData.montantAbsences) !== parseFloat(nouveauMontant)) {
      setFormData(prev => ({
        ...prev,
        montantAbsences: nouveauMontant
      }))
    }
  }, [formData.salaireBase, formData.joursAbsences]) // eslint-disable-line react-hooks/exhaustive-deps

  // Calculer automatiquement le montant des retards : (salaire de base / 30) × nombre de retards
  useEffect(() => {
    const salaireBase = parseFloat(formData.salaireBase) || 0
    const nbRetards = parseFloat(formData.nbRetards) || 0
    
    // Calculer le nouveau montant selon la formule : (salaire de base / 30) × nombre de retards
    const montantCalc = (salaireBase / 30) * nbRetards
    const nouveauMontant = montantCalc.toFixed(2)
    
    // Ne mettre à jour que si la valeur a changé pour éviter les boucles
    if (parseFloat(formData.montantRetards) !== parseFloat(nouveauMontant)) {
      setFormData(prev => ({
        ...prev,
        montantRetards: nouveauMontant
      }))
    }
  }, [formData.salaireBase, formData.nbRetards]) // eslint-disable-line react-hooks/exhaustive-deps

  // Calculer automatiquement le montant CNSS : salaire de base × 9%
  useEffect(() => {
    const salaireBase = parseFloat(formData.salaireBase) || 0
    
    // Calculer le nouveau montant selon la formule : salaire de base × 9%
    const montantCalc = salaireBase * 0.09
    const nouveauMontant = montantCalc.toFixed(2)
    
    // Ne mettre à jour que si la valeur a changé pour éviter les boucles
    if (parseFloat(formData.cnss) !== parseFloat(nouveauMontant)) {
      setFormData(prev => ({
        ...prev,
        cnss: nouveauMontant
      }))
    }
  }, [formData.salaireBase]) // eslint-disable-line react-hooks/exhaustive-deps

  // Générer la période au format MM/YYYY
  const formatPeriode = (dateString) => {
    const [year, month] = dateString.split('-')
    return `${month}/${year}`
  }

  // Calculer les heures travaillées pour un employé sur une période
  const calculateHeuresTravaillees = (employeeId, periode) => {
    const [year, month] = periode.split('-')
    const startDate = new Date(year, parseInt(month) - 1, 1)
    const endDate = new Date(year, parseInt(month), 0)
    
    const pointagesPeriode = pointages.filter(p => {
      const pointageDate = new Date(p.date)
      return p.employeeId === employeeId && 
             pointageDate >= startDate && 
             pointageDate <= endDate
    })

    let totalHeures = 0
    pointagesPeriode.forEach(p => {
      const [h1, m1] = p.heureArrivee.split(':').map(Number)
      const [h2, m2] = p.heureDepart.split(':').map(Number)
      const heures = (h2 * 60 + m2 - h1 * 60 - m1) / 60
      totalHeures += heures
    })

    return Math.round(totalHeures * 10) / 10
  }

  // Calculer les heures supplémentaires (au-delà de 173h/mois)
  const calculateHeuresSupplementaires = (heuresTravaillees) => {
    const heuresNormales = 173
    return Math.max(0, heuresTravaillees - heuresNormales)
  }

  // Calculer les jours de congés pour une période
  const calculateJoursConges = (employeeId, periode) => {
    const [year, month] = periode.split('-')
    const startDate = new Date(year, parseInt(month) - 1, 1)
    const endDate = new Date(year, parseInt(month), 0)
    
    const congesPeriode = conges.filter(c => {
      const congeDate = new Date(c.dateDebut)
      return c.employeeId === employeeId && 
             congeDate >= startDate && 
             congeDate <= endDate &&
             c.statut === 'approuve'
    })

    let totalJours = 0
    congesPeriode.forEach(c => {
      const debut = new Date(c.dateDebut)
      const fin = new Date(c.dateFin)
      const jours = Math.ceil((fin - debut) / (1000 * 60 * 60 * 24)) + 1
      totalJours += jours
    })

    return totalJours
  }

  // Générer automatiquement une fiche de paie
  const generateFichePaie = (employeeId, periode) => {
    const employee = employees.find(e => e.id === parseInt(employeeId))
    if (!employee) return null

    const salaireBase = employee.salaire || 0
    const heuresTravaillees = calculateHeuresTravaillees(employeeId, periode)
    const heuresSupplementaires = calculateHeuresSupplementaires(heuresTravaillees)
    // Calculer le montant des jours supplémentaires : (salaire de base / 30) × jours supplémentaires
    const montantHeuresSup = salaireBase > 0 && heuresSupplementaires > 0 
      ? (salaireBase / 30) * heuresSupplementaires 
      : 0
    const joursConges = calculateJoursConges(employeeId, periode)
    const montantConges = (joursConges * salaireBase) / 30

    // Calculs des retenues (exemples)
    const cnss = salaireBase * 0.09 // 9% CNSS
    const totalGains = salaireBase + montantHeuresSup + montantConges
    const totalRetenues = cnss
    const netAPayer = totalGains - totalRetenues

    return {
      employeeId: parseInt(employeeId),
      periode: formatPeriode(periode),
      salaireBase,
      heuresTravaillees,
      heuresSupplementaires,
      montantHeuresSup,
      primes: 0,
      joursConges,
      montantConges,
      joursAbsences: 0,
      montantAbsences: 0,
      nbRetards: 0,
      montantRetards: 0,
      cnss,
      autresRetenues: 0,
      totalGains,
      totalRetenues,
      netAPayer,
      observations: ''
    }
  }

  const handleGenerate = () => {
    if (!formData.employeeId || !selectedPeriode) {
      alert('Veuillez sélectionner un employé et une période')
      return
    }

    const existingFiche = fichesPaie.find(f => 
      f.employeeId === parseInt(formData.employeeId) && 
      f.periode === formatPeriode(selectedPeriode)
    )

    if (existingFiche) {
      if (!window.confirm('Une fiche de paie existe déjà pour cette période. Voulez-vous la remplacer ?')) {
        return
      }
      // Supprimer l'ancienne fiche
      setFichesPaie(fichesPaie.filter(f => f.id !== existingFiche.id))
    }

    const nouvelleFiche = generateFichePaie(formData.employeeId, selectedPeriode)
    if (nouvelleFiche) {
      const ficheComplete = {
        id: Date.now(),
        ...nouvelleFiche,
        dateCreation: new Date().toISOString()
      }
      setFichesPaie([...fichesPaie, ficheComplete])
      setShowGenerateModal(false)
      setFormData({
        employeeId: '',
        periode: '',
        salaireBase: '',
        heuresTravaillees: '',
        heuresSupplementaires: '',
        montantHeuresSup: '',
        primes: '',
        joursConges: '',
        montantConges: '',
        joursAbsences: '',
        montantAbsences: '',
        nbRetards: '',
        montantRetards: '',
        cnss: '',
        autresRetenues: '',
        observations: ''
      })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const salaireBase = parseFloat(formData.salaireBase) || 0
    const joursSupplementaires = parseFloat(formData.heuresSupplementaires) || 0
    const joursAbsences = parseFloat(formData.joursAbsences) || 0
    const nbRetards = parseFloat(formData.nbRetards) || 0
    
    // Calculer automatiquement les montants selon les formules :
    // - Jours supplémentaires : (salaire de base / 30) × jours supplémentaires
    const montantHeuresSup = (salaireBase / 30) * joursSupplementaires
    // - Absences : (salaire de base / 30) × jours d'absences
    const montantAbsences = (salaireBase / 30) * joursAbsences
    // - Retards : (salaire de base / 30) × nombre de retards
    const montantRetards = (salaireBase / 30) * nbRetards
    // - CNSS : salaire de base × 9%
    const cnss = salaireBase * 0.09
    
    const primes = parseFloat(formData.primes) || 0
    const montantConges = parseFloat(formData.montantConges) || 0
    const autresRetenues = parseFloat(formData.autresRetenues) || 0

    const totalGains = salaireBase + montantHeuresSup + primes + montantConges
    const totalRetenues = montantAbsences + montantRetards + cnss + autresRetenues
    const netAPayer = totalGains - totalRetenues

    if (editingFiche) {
      setFichesPaie(fichesPaie.map(f =>
        f.id === editingFiche.id
          ? {
              ...f,
              ...formData,
              salaireBase,
              posteHeuresSup: formData.posteHeuresSup || '',
              montantHeuresSup,
              primes,
              montantConges,
              montantAbsences,
              montantRetards,
              cnss,
              autresRetenues,
              totalGains,
              totalRetenues,
              netAPayer
            }
          : f
      ))
    } else {
      const newFiche = {
        id: Date.now(),
        employeeId: parseInt(formData.employeeId),
        periode: formData.periode,
        salaireBase,
        heuresTravaillees: parseFloat(formData.heuresTravaillees) || 0,
        heuresSupplementaires: parseFloat(formData.heuresSupplementaires) || 0,
        posteHeuresSup: formData.posteHeuresSup || '',
        montantHeuresSup,
        primes,
        joursConges: parseInt(formData.joursConges) || 0,
        montantConges,
        joursAbsences: parseInt(formData.joursAbsences) || 0,
        montantAbsences,
        nbRetards: parseInt(formData.nbRetards) || 0,
        montantRetards,
        cnss,
        autresRetenues,
        totalGains,
        totalRetenues,
        netAPayer,
        observations: formData.observations || '',
        dateCreation: new Date().toISOString()
      }
      setFichesPaie([...fichesPaie, newFiche])
    }
    
    resetForm()
  }

    const resetForm = () => {
    setFormData({
      employeeId: '',
      periode: '',
      salaireBase: '',
      heuresTravaillees: '',
      heuresSupplementaires: '',
      posteHeuresSup: '',
      montantHeuresSup: '',
      primes: '',
      joursConges: '',
      montantConges: '',
      joursAbsences: '',
      montantAbsences: '',
      nbRetards: '',
      montantRetards: '',
      cnss: '',
      autresRetenues: '',
      observations: ''
    })
    setEditingFiche(null)
    setShowModal(false)
  }

  const handleEdit = (fiche) => {
    setEditingFiche(fiche)
    const employee = employees.find(e => e.id === fiche.employeeId)
    setFormData({
      employeeId: fiche.employeeId.toString(),
      periode: fiche.periode,
      salaireBase: fiche.salaireBase?.toString() || '',
      heuresTravaillees: fiche.heuresTravaillees?.toString() || '',
      heuresSupplementaires: fiche.heuresSupplementaires?.toString() || '',
      posteHeuresSup: fiche.posteHeuresSup || '',
      montantHeuresSup: fiche.montantHeuresSup?.toString() || '',
      primes: fiche.primes?.toString() || '',
      joursConges: fiche.joursConges?.toString() || '',
      montantConges: fiche.montantConges?.toString() || '',
      joursAbsences: fiche.joursAbsences?.toString() || '',
      montantAbsences: fiche.montantAbsences?.toString() || '',
      nbRetards: fiche.nbRetards?.toString() || '',
      montantRetards: fiche.montantRetards?.toString() || '',
      cnss: fiche.cnss?.toString() || '',
      autresRetenues: fiche.autresRetenues?.toString() || '',
      observations: fiche.observations || ''
    })
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Supprimer cette fiche de paie ?')) {
      setFichesPaie(fichesPaie.filter(f => f.id !== id))
    }
  }

  const handleExportPDF = async (fiche) => {
    const employee = employees.find(e => e.id === fiche.employeeId)
    if (!employee) {
      alert('Employé introuvable')
      return
    }
    await exportFichePaiePDF(fiche, employee)
  }

  const getEmployeeName = (id) => {
    if (!id) return 'Inconnu'
    // Gérer les cas où l'ID peut être un nombre ou une chaîne
    const emp = employees.find(e => {
      return String(e.id) === String(id) || e.id === id
    })
    return emp ? `${emp.prenom} ${emp.nom}` : 'Inconnu'
  }

  const filteredFiches = useMemo(() => {
    return fichesPaie.filter(fiche => {
      const matchesSearch = getEmployeeName(fiche.employeeId).toLowerCase().includes(searchTerm.toLowerCase()) ||
                          fiche.periode?.includes(searchTerm)
      const matchesPeriode = !filterPeriode || fiche.periode === filterPeriode
      return matchesSearch && matchesPeriode
    })
  }, [fichesPaie, searchTerm, filterPeriode, employees])

  const statistiques = useMemo(() => {
    const total = filteredFiches.reduce((acc, f) => acc + (f.netAPayer || 0), 0)
    const nbFiches = filteredFiches.length
    const moyenne = nbFiches > 0 ? total / nbFiches : 0
    return { total, nbFiches, moyenne }
  }, [filteredFiches])

  const periodesUniques = useMemo(() => {
    const periodes = [...new Set(fichesPaie.map(f => f.periode))].sort().reverse()
    return periodes
  }, [fichesPaie])

  return (
    <Layout>
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Gestion de la Paie</h1>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setShowGenerateModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500'
              }}
            >
              <FileText size={20} />
              Générer automatiquement
            </button>
            <button
              onClick={() => setShowModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500'
              }}
            >
              <Plus size={20} />
              Nouvelle fiche
            </button>
          </div>
        </div>

        {/* Statistiques */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '1.5rem',
            borderRadius: '12px',
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ opacity: 0.9, fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total des salaires</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                  {statistiques.total.toLocaleString()} F
                </p>
              </div>
              <Wallet size={40} style={{ opacity: 0.8 }} />
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Nombre de fiches</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#6366f1' }}>
                  {statistiques.nbFiches}
                </p>
              </div>
              <FileText size={32} color="#6366f1" />
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Salaire moyen</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                  {statistiques.moyenne.toLocaleString()} F
                </p>
              </div>
              <TrendingUp size={32} color="#10b981" />
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Rechercher par employé ou période..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 3rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>
          
          <div style={{ minWidth: '200px' }}>
            <select
              value={filterPeriode}
              onChange={(e) => setFilterPeriode(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            >
              <option value="">Toutes les périodes</option>
              {periodesUniques.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Liste des fiches de paie */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}>
          {filteredFiches.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <p>Aucune fiche de paie trouvée</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Employé</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Période</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#475569' }}>Salaire de base</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#475569' }}>Total gains</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#475569' }}>Total retenues</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#475569' }}>Net à payer</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#475569' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiches.map((fiche) => (
                    <tr key={fiche.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem', fontWeight: '500' }}>
                        {getEmployeeName(fiche.employeeId)}
                      </td>
                      <td style={{ padding: '1rem', color: '#64748b' }}>{fiche.periode}</td>
                      <td style={{ padding: '1rem', textAlign: 'right', color: '#64748b' }}>
                        {(fiche.salaireBase || 0).toLocaleString()} F
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', color: '#10b981', fontWeight: '500' }}>
                        {(fiche.totalGains || 0).toLocaleString()} F
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', color: '#ef4444', fontWeight: '500' }}>
                        {(fiche.totalRetenues || 0).toLocaleString()} F
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', color: '#6366f1', fontWeight: 'bold', fontSize: '1.1rem' }}>
                        {(fiche.netAPayer || 0).toLocaleString()} F
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleExportPDF(fiche)}
                            style={{
                              padding: '0.5rem',
                              background: '#f1f5f9',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              color: '#6366f1'
                            }}
                            title="Exporter en PDF"
                          >
                            <Download size={18} />
                          </button>
                          <button
                            onClick={() => handleEdit(fiche)}
                            style={{
                              padding: '0.5rem',
                              background: '#f1f5f9',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              color: '#6366f1'
                            }}
                            title="Modifier"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(fiche.id)}
                            style={{
                              padding: '0.5rem',
                              background: '#fef2f2',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              color: '#ef4444'
                            }}
                            title="Supprimer"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal de génération automatique */}
        {showGenerateModal && (
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
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '500px',
              width: '100%'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Générer une fiche de paie</h2>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem'
                  }}
                >
                  <X size={24} />
                </button>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Employé *</label>
                <select
                  required
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">Sélectionner un employé</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.prenom} {emp.nom}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Période (Mois/Année) *</label>
                <input
                  type="month"
                  required
                  value={selectedPeriode}
                  onChange={(e) => setSelectedPeriode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ 
                padding: '1rem', 
                background: '#f0f9ff', 
                borderRadius: '8px', 
                marginBottom: '1.5rem',
                fontSize: '0.875rem',
                color: '#0369a1'
              }}>
                <p style={{ margin: 0 }}>
                  La fiche de paie sera générée automatiquement en calculant :
                </p>
                <ul style={{ margin: '0.5rem 0 0 1.5rem', padding: 0 }}>
                  <li>Les jours travaillés depuis les pointages</li>
                  <li>Les jours supplémentaires (au-delà de la norme)</li>
                  <li>Les congés payés</li>
                  <li>Les cotisations CNSS (9%)</li>
                </ul>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '8px',
                    background: '#10b981',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}
                >
                  Générer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal d'édition/création */}
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
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {editingFiche ? 'Modifier la fiche de paie' : 'Nouvelle fiche de paie'}
                </h2>
                <button
                  onClick={resetForm}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem'
                  }}
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Employé *</label>
                    <select
                      required
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="">Sélectionner un employé</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.prenom} {emp.nom}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Période (MM/YYYY) *</label>
                    <input
                      type="text"
                      required
                      placeholder="01/2024"
                      value={formData.periode}
                      onChange={(e) => setFormData({ ...formData, periode: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', textAlign: 'left' }}>Gains</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Salaire de base (FCFA)</label>
                      <input
                        type="number"
                        value={formData.salaireBase}
                        onChange={(e) => setFormData({ ...formData, salaireBase: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          textAlign: 'right'
                        }}
                      />
                      <label style={{ display: 'block', marginTop: '1rem', marginBottom: '0.5rem', fontWeight: '500' }}>Jours travaillés</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.heuresTravaillees}
                        onChange={(e) => setFormData({ ...formData, heuresTravaillees: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          textAlign: 'right'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Jours supplémentaires</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.heuresSupplementaires}
                        onChange={(e) => setFormData({ ...formData, heuresSupplementaires: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          textAlign: 'right'
                        }}
                      />
                      <label style={{ display: 'block', marginTop: '1rem', marginBottom: '0.5rem', fontWeight: '500' }}>Poste (heures supplémentaires)</label>
                      <input
                        type="text"
                        value={formData.posteHeuresSup}
                        onChange={(e) => setFormData({ ...formData, posteHeuresSup: e.target.value })}
                        placeholder="Ex: Poste de garde - Site A"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '1rem'
                        }}
                      />
                      <label style={{ display: 'block', marginTop: '1rem', marginBottom: '0.5rem', fontWeight: '500' }}>Montant jours sup. (FCFA)</label>
                      <input
                        type="number"
                        readOnly
                        value={formData.montantHeuresSup}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          background: '#f8fafc',
                          color: '#64748b',
                          cursor: 'not-allowed',
                          textAlign: 'right'
                        }}
                        title="Calculé automatiquement : (Salaire de base / 30) × Jours supplémentaires"
                      />
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'right' }}>
                        Calculé automatiquement
                      </p>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Primes (FCFA)</label>
                      <input
                        type="number"
                        value={formData.primes}
                        onChange={(e) => setFormData({ ...formData, primes: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          textAlign: 'right'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Jours de congés</label>
                      <input
                        type="number"
                        value={formData.joursConges}
                        onChange={(e) => setFormData({ ...formData, joursConges: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          textAlign: 'right'
                        }}
                      />
                      <label style={{ display: 'block', marginTop: '1rem', marginBottom: '0.5rem', fontWeight: '500' }}>Montant congés (FCFA)</label>
                      <input
                        type="number"
                        value={formData.montantConges}
                        onChange={(e) => setFormData({ ...formData, montantConges: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          textAlign: 'right'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem', padding: '1rem', background: '#fef2f2', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', textAlign: 'left' }}>Retenues</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Jours d'absences</label>
                      <input
                        type="number"
                        value={formData.joursAbsences}
                        onChange={(e) => setFormData({ ...formData, joursAbsences: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          textAlign: 'right'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Montant absences (FCFA)</label>
                      <input
                        type="number"
                        readOnly
                        value={formData.montantAbsences}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          background: '#f8fafc',
                          color: '#64748b',
                          cursor: 'not-allowed',
                          textAlign: 'right'
                        }}
                        title="Calculé automatiquement : (Salaire de base / 30) × Jours d'absences"
                      />
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'right' }}>
                        Calculé automatiquement
                      </p>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Nombre de retards</label>
                      <input
                        type="number"
                        value={formData.nbRetards}
                        onChange={(e) => setFormData({ ...formData, nbRetards: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          textAlign: 'right'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Montant retards (FCFA)</label>
                      <input
                        type="number"
                        readOnly
                        value={formData.montantRetards}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          background: '#f8fafc',
                          color: '#64748b',
                          cursor: 'not-allowed',
                          textAlign: 'right'
                        }}
                        title="Calculé automatiquement : (Salaire de base / 30) × Nombre de retards"
                      />
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'right' }}>
                        Calculé automatiquement
                      </p>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>CNSS (9%) (FCFA)</label>
                      <input
                        type="number"
                        readOnly
                        value={formData.cnss}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          background: '#f8fafc',
                          color: '#64748b',
                          cursor: 'not-allowed',
                          textAlign: 'right'
                        }}
                        title="Calculé automatiquement : Salaire de base × 9%"
                      />
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'right' }}>
                        Calculé automatiquement
                      </p>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Autres retenues (FCFA)</label>
                      <input
                        type="number"
                        value={formData.autresRetenues}
                        onChange={(e) => setFormData({ ...formData, autresRetenues: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          textAlign: 'right'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Observations</label>
                  <textarea
                    value={formData.observations}
                    onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={resetForm}
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      background: 'white',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: 'none',
                      borderRadius: '8px',
                      background: '#6366f1',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '500'
                    }}
                  >
                    {editingFiche ? 'Modifier' : 'Ajouter'}
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

export default Paie
