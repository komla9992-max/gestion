import React, { useState, useMemo, useEffect } from 'react'
import Layout from '../components/Layout'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import {
  Plus, Search, Edit, Trash2, X, Calendar,
  CheckCircle, XCircle, Clock, AlertCircle,
  User, FileText, Download, Filter
} from 'lucide-react'

const Conges = () => {
  const { conges, setConges, employees } = useData()
  const { currentUser } = useAuth()

  // Mettre à jour automatiquement les statuts des congés selon les dates (une fois par minute)
  useEffect(() => {
    const mettreAJourStatuts = () => {
      const aujourdhui = new Date()
      aujourdhui.setHours(0, 0, 0, 0)

      setConges(prevConges => {
        const congesMisAJour = prevConges.map(conge => {
          if (!conge.dateDebut || !conge.dateFin) return conge

          const debut = new Date(conge.dateDebut)
          debut.setHours(0, 0, 0, 0)
          const fin = new Date(conge.dateFin)
          fin.setHours(23, 59, 59, 999)

          // Si le congé est approuvé et que la date de début est passée
          if (conge.statut === 'approuve' && aujourdhui >= debut && aujourdhui <= fin) {
            return { ...conge, statut: 'en_cours' }
          }
          // Si le congé est en cours et que la date de fin est passée
          if ((conge.statut === 'en_cours' || conge.statut === 'approuve') && aujourdhui > fin) {
            return { ...conge, statut: 'termine' }
          }
          return conge
        })

        // Vérifier s'il y a des changements avant de retourner
        const aChange = congesMisAJour.some((conge, index) => 
          conge.statut !== prevConges[index]?.statut
        )
        return aChange ? congesMisAJour : prevConges
      })
    }

    // Mettre à jour immédiatement
    mettreAJourStatuts()

    // Mettre à jour toutes les minutes
    const interval = setInterval(mettreAJourStatuts, 60000)

    return () => clearInterval(interval)
  }, [setConges])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatut, setFilterStatut] = useState('all')
  const [filterEmployee, setFilterEmployee] = useState('all')
  const [filterDate, setFilterDate] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingConge, setEditingConge] = useState(null)
  const [formData, setFormData] = useState({
    employeeId: '',
    dateDebut: '',
    dateFin: '',
    type: 'annuel',
    motif: '',
    statut: 'demande',
    commentaire: ''
  })

  const statuts = {
    demande: { label: 'En attente', icon: Clock, color: '#f59e0b', bg: '#fef3c7' },
    approuve: { label: 'Validé', icon: CheckCircle, color: '#10b981', bg: '#d1fae5' },
    refuse: { label: 'Refusé', icon: XCircle, color: '#ef4444', bg: '#fee2e2' },
    en_cours: { label: 'En cours', icon: Calendar, color: '#3b82f6', bg: '#dbeafe' },
    termine: { label: 'Terminé', icon: CheckCircle, color: '#64748b', bg: '#f1f5f9' }
  }

  const typesConge = {
    annuel: 'Congé annuel',
    maladie: 'Congé maladie',
    maternite: 'Congé maternité',
    paternite: 'Congé paternité',
    exceptionnel: 'Congé exceptionnel',
    sans_solde: 'Congé sans solde',
    formation: 'Congé formation'
  }

  // Calculer le nombre de jours entre deux dates
  const calculerJours = (dateDebut, dateFin) => {
    if (!dateDebut || !dateFin) return 0
    const debut = new Date(dateDebut)
    const fin = new Date(dateFin)
    const diffTime = Math.abs(fin - debut)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  // Filtrer les congés
  const filteredConges = useMemo(() => {
    return conges.filter(conge => {
      const employee = employees.find(e => {
        return String(e.id) === String(conge.employeeId) || e.id === conge.employeeId
      })
      const nomComplet = employee ? `${employee.prenom} ${employee.nom}` : ''
      
      const matchesSearch = 
        nomComplet.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conge.motif?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conge.type?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatut = filterStatut === 'all' || conge.statut === filterStatut
      const matchesEmployee = filterEmployee === 'all' || conge.employeeId === filterEmployee
      
      let matchesDate = true
      if (filterDate) {
        const dateFilter = new Date(filterDate)
        const dateDebut = conge.dateDebut ? new Date(conge.dateDebut) : null
        const dateFin = conge.dateFin ? new Date(conge.dateFin) : null
        
        if (dateDebut && dateFin) {
          matchesDate = dateFilter >= dateDebut && dateFilter <= dateFin
        }
      }
      
      return matchesSearch && matchesStatut && matchesEmployee && matchesDate
    })
  }, [conges, employees, searchTerm, filterStatut, filterEmployee, filterDate])

  // Statistiques
  const stats = useMemo(() => {
    const total = conges.length
    const enAttente = conges.filter(c => c.statut === 'demande').length
    const approuves = conges.filter(c => c.statut === 'approuve').length
    const enCours = conges.filter(c => {
      if (c.statut !== 'approuve' && c.statut !== 'en_cours') return false
      const aujourdhui = new Date()
      const debut = c.dateDebut ? new Date(c.dateDebut) : null
      const fin = c.dateFin ? new Date(c.dateFin) : null
      if (!debut || !fin) return false
      return aujourdhui >= debut && aujourdhui <= fin
    }).length
    
    const totalJours = conges
      .filter(c => c.statut === 'approuve' || c.statut === 'en_cours' || c.statut === 'termine')
      .reduce((sum, c) => sum + calculerJours(c.dateDebut, c.dateFin), 0)

    return { total, enAttente, approuves, enCours, totalJours }
  }, [conges])

  // Calculer les jours de congé restants pour chaque employé
  const joursCongesRestants = useMemo(() => {
    const aujourdhui = new Date()
    const anneeCourante = aujourdhui.getFullYear()
    const joursParAn = 30 // 30 jours de congé par an
    
    return employees.map(employee => {
      // Calculer les jours utilisés pour l'année en cours
      const joursUtilises = conges
        .filter(c => {
          // Vérifier que le congé appartient à cet employé
          const employeeIdMatch = String(c.employeeId) === String(employee.id) || c.employeeId === employee.id
          if (!employeeIdMatch) return false
          
          // Vérifier que le congé est approuvé, en cours ou terminé
          if (c.statut !== 'approuve' && c.statut !== 'en_cours' && c.statut !== 'termine') return false
          
          // Vérifier que le congé est dans l'année en cours
          if (!c.dateDebut || !c.dateFin) return false
          const dateDebut = new Date(c.dateDebut)
          const dateFin = new Date(c.dateFin)
          return dateDebut.getFullYear() === anneeCourante || dateFin.getFullYear() === anneeCourante
        })
        .reduce((sum, c) => sum + calculerJours(c.dateDebut, c.dateFin), 0)
      
      const joursRestants = Math.max(0, joursParAn - joursUtilises)
      
      return {
        employee,
        joursUtilises,
        joursRestants,
        joursParAn
      }
    }).sort((a, b) => {
      // Trier par nom d'employé
      const nomA = `${a.employee.prenom} ${a.employee.nom}`
      const nomB = `${b.employee.prenom} ${b.employee.nom}`
      return nomA.localeCompare(nomB)
    })
  }, [employees, conges])

  // Congés à venir (30 prochains jours)
  const congesProchains = useMemo(() => {
    const aujourdhui = new Date()
    const dans30Jours = new Date()
    dans30Jours.setDate(aujourdhui.getDate() + 30)
    
    return conges
      .filter(c => {
        if (c.statut !== 'approuve' && c.statut !== 'demande') return false
        const debut = c.dateDebut ? new Date(c.dateDebut) : null
        if (!debut) return false
        return debut >= aujourdhui && debut <= dans30Jours
      })
      .sort((a, b) => {
        const dateA = a.dateDebut ? new Date(a.dateDebut) : new Date()
        const dateB = b.dateDebut ? new Date(b.dateDebut) : new Date()
        return dateA - dateB
      })
      .slice(0, 5)
      .map(c => ({
        ...c,
        employee: employees.find(e => {
          return String(e.id) === String(c.employeeId) || e.id === c.employeeId
        })
      }))
  }, [conges, employees])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Valider les dates
    if (formData.dateDebut && formData.dateFin) {
      const debut = new Date(formData.dateDebut)
      const fin = new Date(formData.dateFin)
      if (fin < debut) {
        alert('La date de fin doit être postérieure à la date de début')
        return
      }
    }

    // Déterminer le statut automatiquement si c'est un nouveau congé
    let statutFinal = formData.statut
    if (!editingConge && !statutFinal) {
      statutFinal = 'demande'
    }

    // Mettre à jour le statut si le congé est en cours
    if (formData.dateDebut && formData.dateFin) {
      const aujourdhui = new Date()
      const debut = new Date(formData.dateDebut)
      const fin = new Date(formData.dateFin)
      if (statutFinal === 'approuve' && aujourdhui >= debut && aujourdhui <= fin) {
        statutFinal = 'en_cours'
      } else if (statutFinal === 'en_cours' && aujourdhui > fin) {
        statutFinal = 'termine'
      }
    }
    
    // Convertir employeeId en nombre pour assurer la cohérence
    const employeeIdNum = formData.employeeId ? Number(formData.employeeId) : null
    
    if (editingConge) {
      setConges(conges.map(conge =>
        conge.id === editingConge.id
          ? { ...conge, ...formData, employeeId: employeeIdNum, statut: statutFinal }
          : conge
      ))
    } else {
      const newConge = {
        id: Date.now(),
        ...formData,
        employeeId: employeeIdNum,
        statut: statutFinal,
        dateCreation: new Date().toISOString(),
        nombreJours: calculerJours(formData.dateDebut, formData.dateFin)
      }
      setConges([...conges, newConge])
    }
    
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      employeeId: '',
      dateDebut: '',
      dateFin: '',
      type: 'annuel',
      motif: '',
      statut: 'demande',
      commentaire: ''
    })
    setEditingConge(null)
    setShowModal(false)
  }

  const handleEdit = (conge) => {
    setEditingConge(conge)
    setFormData({
      employeeId: conge.employeeId || '',
      dateDebut: conge.dateDebut || '',
      dateFin: conge.dateFin || '',
      type: conge.type || 'annuel',
      motif: conge.motif || '',
      statut: conge.statut || 'demande',
      commentaire: conge.commentaire || ''
    })
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce congé ?')) {
      setConges(conges.filter(conge => conge.id !== id))
    }
  }

  const isAdmin = currentUser?.role === 'admin'

  const handleStatutChange = (id, nouveauStatut) => {
    // Vérifier que seul l'administrateur peut changer le statut
    if (!isAdmin) {
      alert('Seul l\'administrateur peut approuver ou refuser les congés')
      return
    }
    
    setConges(conges.map(conge => {
      if (conge.id === id) {
        // Si on approuve ou que le congé devient en cours, vérifier les dates
        let statutFinal = nouveauStatut
        if ((nouveauStatut === 'approuve' || nouveauStatut === 'en_cours') && conge.dateDebut && conge.dateFin) {
          const aujourdhui = new Date()
          const debut = new Date(conge.dateDebut)
          const fin = new Date(conge.dateFin)
          if (aujourdhui >= debut && aujourdhui <= fin) {
            statutFinal = 'en_cours'
          }
        }
        return { ...conge, statut: statutFinal }
      }
      return conge
    }))
  }

  const getEmployeeName = (employeeId) => {
    if (!employeeId) return 'Employé inconnu'
    // Gérer les cas où l'ID peut être un nombre ou une chaîne
    const employee = employees.find(e => {
      return String(e.id) === String(employeeId) || e.id === employeeId
    })
    return employee ? `${employee.prenom} ${employee.nom}` : 'Employé inconnu'
  }

  const getStatutInfo = (statut) => {
    return statuts[statut] || statuts.demande
  }

  return (
    <Layout>
      <div style={{ padding: '2rem', background: '#f8fafc', minHeight: '100vh' }}>
        {/* En-tête */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>
              Gestion des Congés
            </h1>
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
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#4f46e5'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#6366f1'}
            >
              <Plus size={20} />
              Nouveau congé
            </button>
          </div>
          <p style={{ color: '#64748b', margin: 0 }}>
            Gérez les demandes de congés de vos employés
          </p>
        </div>

        {/* Statistiques */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total congés</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
              {stats.total}
            </p>
          </div>
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>En attente</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b', margin: 0 }}>
              {stats.enAttente}
            </p>
          </div>
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Validés</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981', margin: 0 }}>
              {stats.approuves}
            </p>
          </div>
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>En cours</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6', margin: 0 }}>
              {stats.enCours}
            </p>
          </div>
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total jours</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6', margin: 0 }}>
              {stats.totalJours}
            </p>
          </div>
        </div>

        {/* Jours de congé restants par employé */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
          marginBottom: '2rem',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
              Jours de congé restants par employé ({new Date().getFullYear()})
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>
              Chaque employé dispose de 30 jours de congé par an
            </p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#1e293b' }}>Employé</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#1e293b' }}>Jours utilisés</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#1e293b' }}>Jours restants</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#1e293b' }}>Total annuel</th>
                </tr>
              </thead>
              <tbody>
                {joursCongesRestants.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                      Aucun employé trouvé
                    </td>
                  </tr>
                ) : (
                  joursCongesRestants.map(({ employee, joursUtilises, joursRestants, joursParAn }) => {
                    const pourcentageUtilise = (joursUtilises / joursParAn) * 100
                    const couleurRestants = joursRestants > 10 ? '#10b981' : joursRestants > 5 ? '#f59e0b' : '#ef4444'
                    
                    return (
                      <tr key={employee.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem', fontWeight: '500' }}>
                          {employee.prenom} {employee.nom}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>
                          {joursUtilises} jour{joursUtilises > 1 ? 's' : ''}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            background: `${couleurRestants}15`,
                            color: couleurRestants,
                            fontSize: '0.875rem',
                            fontWeight: '600'
                          }}>
                            {joursRestants} jour{joursRestants > 1 ? 's' : ''}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span>{joursParAn} jours</span>
                            <div style={{
                              width: '100%',
                              height: '6px',
                              background: '#e2e8f0',
                              borderRadius: '3px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${Math.min(100, pourcentageUtilise)}%`,
                                height: '100%',
                                background: couleurRestants,
                                transition: 'width 0.3s'
                              }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Congés prochains */}
        {congesProchains.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #3b82f6',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Calendar size={20} color="#3b82f6" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e40af', margin: 0 }}>
                Congés à venir (30 prochains jours)
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {congesProchains.map((conge) => {
                const statutInfo = getStatutInfo(conge.statut)
                const StatutIcon = statutInfo.icon
                return (
                  <div
                    key={conge.id}
                    style={{
                      background: 'white',
                      padding: '1rem',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: '600', color: '#1e293b', margin: '0 0 0.25rem 0' }}>
                        {conge.employee?.prenom} {conge.employee?.nom}
                      </p>
                      <p style={{ color: '#64748b', margin: 0, fontSize: '0.875rem' }}>
                        {conge.dateDebut ? new Date(conge.dateDebut).toLocaleDateString('fr-FR') : '-'} 
                        {' - '}
                        {conge.dateFin ? new Date(conge.dateFin).toLocaleDateString('fr-FR') : '-'}
                        {' • '}
                        {calculerJours(conge.dateDebut, conge.dateFin)} jour{calculerJours(conge.dateDebut, conge.dateFin) > 1 ? 's' : ''}
                      </p>
                    </div>
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      background: statutInfo.bg,
                      color: statutInfo.color,
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}>
                      <StatutIcon size={16} />
                      {statutInfo.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Filtres et recherche */}
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={20} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.75rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '1rem',
                background: 'white'
              }}
            >
              <option value="all">Tous les statuts</option>
              {Object.entries(statuts).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </select>
            <select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '1rem',
                background: 'white'
              }}
            >
              <option value="all">Tous les employés</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.prenom} {emp.nom}</option>
              ))}
            </select>
            <input
              type="date"
              placeholder="Filtrer par date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>
          {(filterStatut !== 'all' || filterEmployee !== 'all' || filterDate || searchTerm) && (
            <button
              onClick={() => {
                setFilterStatut('all')
                setFilterEmployee('all')
                setFilterDate('')
                setSearchTerm('')
              }}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: '#64748b'
              }}
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>

        {/* Liste des congés */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}>
          {filteredConges.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <Calendar size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p style={{ fontSize: '1.125rem', margin: 0 }}>Aucun congé trouvé</p>
              <p style={{ fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>
                {searchTerm || filterStatut !== 'all' || filterEmployee !== 'all' || filterDate
                  ? 'Essayez de modifier vos filtres'
                  : 'Commencez par créer un nouveau congé'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#1e293b' }}>Employé</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#1e293b' }}>Type</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#1e293b' }}>Date début</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#1e293b' }}>Date fin</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#1e293b' }}>Nombre de jours</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#1e293b' }}>Motif</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#1e293b' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredConges.map((conge) => {
                    const statutInfo = getStatutInfo(conge.statut)
                    const StatutIcon = statutInfo.icon
                    const nombreJours = calculerJours(conge.dateDebut, conge.dateFin)
                    
                    return (
                      <tr key={conge.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem', fontWeight: '500' }}>
                          {getEmployeeName(conge.employeeId)}
                        </td>
                        <td style={{ padding: '1rem', color: '#64748b' }}>
                          {typesConge[conge.type] || conge.type}
                        </td>
                        <td style={{ padding: '1rem', color: '#64748b' }}>
                          {conge.dateDebut ? new Date(conge.dateDebut).toLocaleDateString('fr-FR') : '-'}
                        </td>
                        <td style={{ padding: '1rem', color: '#64748b' }}>
                          {conge.dateFin ? new Date(conge.dateFin).toLocaleDateString('fr-FR') : '-'}
                        </td>
                        <td style={{ padding: '1rem', color: '#64748b', fontWeight: '500' }}>
                          {nombreJours} jour{nombreJours > 1 ? 's' : ''}
                        </td>
                        <td style={{ padding: '1rem', color: '#64748b', maxWidth: '200px' }}>
                          <div style={{ 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap',
                            title: conge.motif || '-'
                          }}>
                            {conge.motif || '-'}
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            background: statutInfo.bg,
                            color: statutInfo.color,
                            fontSize: '0.875rem',
                            fontWeight: '500'
                          }}>
                            <StatutIcon size={16} />
                            {statutInfo.label}
                          </span>
                            {isAdmin && conge.statut === 'demande' && (
                              <>
                                <button
                                  onClick={() => handleStatutChange(conge.id, 'approuve')}
                                  style={{
                                    padding: '0.5rem',
                                    background: '#d1fae5',
                                    color: '#10b981',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#10b981'
                                    e.currentTarget.style.color = 'white'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#d1fae5'
                                    e.currentTarget.style.color = '#10b981'
                                  }}
                                  title="Approuver"
                                >
                                  <CheckCircle size={18} />
                                </button>
                                <button
                                  onClick={() => handleStatutChange(conge.id, 'refuse')}
                                  style={{
                                    padding: '0.5rem',
                                    background: '#fee2e2',
                                    color: '#ef4444',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#ef4444'
                                    e.currentTarget.style.color = 'white'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#fee2e2'
                                    e.currentTarget.style.color = '#ef4444'
                                  }}
                                  title="Refuser"
                                >
                                  <XCircle size={18} />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleEdit(conge)}
                              style={{
                                padding: '0.5rem',
                                background: '#dbeafe',
                                color: '#3b82f6',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#3b82f6'
                                e.currentTarget.style.color = 'white'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#dbeafe'
                                e.currentTarget.style.color = '#3b82f6'
                              }}
                              title="Modifier"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(conge.id)}
                              style={{
                                padding: '0.5rem',
                                background: '#fee2e2',
                                color: '#ef4444',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#ef4444'
                                e.currentTarget.style.color = 'white'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#fee2e2'
                                e.currentTarget.style.color = '#ef4444'
                              }}
                              title="Supprimer"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal de formulaire */}
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
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) resetForm()
          }}
          >
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                  {editingConge ? 'Modifier le congé' : 'Nouveau congé'}
                </h2>
                <button
                  onClick={resetForm}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#64748b',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f1f5f9'
                    e.currentTarget.style.color = '#1e293b'
                  }}
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1e293b' }}>
                    Employé *
                  </label>
                  <select
                    required
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      background: 'white'
                    }}
                  >
                    <option value="">Sélectionner un employé</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.prenom} {emp.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1e293b' }}>
                      Date de début *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.dateDebut}
                      onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1e293b' }}>
                      Date de fin *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.dateFin}
                      onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
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

                {formData.dateDebut && formData.dateFin && (
                  <div style={{
                    marginBottom: '1rem',
                    padding: '0.75rem',
                    background: '#dbeafe',
                    borderRadius: '8px',
                    color: '#1e40af',
                    fontSize: '0.875rem'
                  }}>
                    Durée: {calculerJours(formData.dateDebut, formData.dateFin)} jour{calculerJours(formData.dateDebut, formData.dateFin) > 1 ? 's' : ''}
                  </div>
                )}

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1e293b' }}>
                    Type de congé *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      background: 'white'
                    }}
                  >
                    {Object.entries(typesConge).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1e293b' }}>
                    Motif
                  </label>
                  <textarea
                    value={formData.motif}
                    onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                    placeholder="Raison du congé..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>


                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1e293b' }}>
                    Commentaire
                  </label>
                  <textarea
                    value={formData.commentaire}
                    onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
                    placeholder="Commentaire interne..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
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
                      background: '#f1f5f9',
                      color: '#64748b',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#e2e8f0'
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#6366f1',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#4f46e5'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#6366f1'}
                  >
                    {editingConge ? 'Modifier' : 'Créer'}
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

export default Conges