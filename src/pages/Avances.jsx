import React, { useState, useMemo } from 'react'
import Layout from '../components/Layout'
import { useData } from '../context/DataContext'
import {
  Plus, Search, Edit, Trash2, X, Calendar,
  CheckCircle, XCircle, Clock, AlertCircle,
  User, DollarSign, TrendingDown, TrendingUp, Filter, FileText
} from 'lucide-react'

const Avances = () => {
  const { avances, setAvances, employees } = useData()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatut, setFilterStatut] = useState('all')
  const [filterEmployee, setFilterEmployee] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingAvance, setEditingAvance] = useState(null)
  const [formData, setFormData] = useState({
    employeeId: '',
    montant: '',
    dateAvance: new Date().toISOString().split('T')[0],
    dateRemboursementPrevu: '',
    montantRembourse: 0,
    description: '',
    statut: 'non_remboursee'
  })

  const statuts = {
    non_remboursee: { label: 'Non remboursée', icon: AlertCircle, color: '#ef4444', bg: '#fee2e2' },
    partiellement_remboursee: { label: 'Partiellement remboursée', icon: Clock, color: '#f59e0b', bg: '#fef3c7' },
    remboursee: { label: 'Remboursée', icon: CheckCircle, color: '#10b981', bg: '#d1fae5' }
  }

  // Calculer le statut en fonction du montant remboursé
  const getStatutAvance = (montantTotal, montantRembourse) => {
    const total = Number(montantTotal) || 0
    const rembourse = Number(montantRembourse) || 0
    
    if (rembourse === 0) return 'non_remboursee'
    if (Math.abs(rembourse - total) < 0.01 || rembourse >= total) return 'remboursee'
    return 'partiellement_remboursee'
  }

  // Calculer le montant remboursé à partir des remboursements
  const getMontantRembourse = (avance) => {
    if (avance.remboursements && Array.isArray(avance.remboursements) && avance.remboursements.length > 0) {
      return avance.remboursements.reduce((sum, r) => sum + (Number(r.montant) || 0), 0)
    }
    // Compatibilité avec l'ancien système
    return Number(avance.montantRembourse) || 0
  }

  // Filtrer les avances
  const filteredAvances = useMemo(() => {
    return avances.filter(avance => {
      const employee = employees.find(e => {
        return String(e.id) === String(avance.employeeId) || e.id === avance.employeeId
      })
      const nomComplet = employee ? `${employee.prenom} ${employee.nom}` : ''
      
      const matchesSearch = 
        nomComplet.toLowerCase().includes(searchTerm.toLowerCase()) ||
        avance.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        avance.montant?.toString().includes(searchTerm)
      
      // Calculer le montant remboursé
      const montantRembourse = getMontantRembourse(avance)
      // Calculer le statut actuel
      const statutActuel = getStatutAvance(avance.montant, montantRembourse)
      const matchesStatut = filterStatut === 'all' || statutActuel === filterStatut
      const matchesEmployee = filterEmployee === 'all' || avance.employeeId == filterEmployee
      
      return matchesSearch && matchesStatut && matchesEmployee
    })
  }, [avances, employees, searchTerm, filterStatut, filterEmployee])

  // Statistiques
  const stats = useMemo(() => {
    const total = avances.length
    const montantTotal = avances.reduce((sum, a) => sum + (Number(a.montant) || 0), 0)
    const montantRembourse = avances.reduce((sum, a) => sum + getMontantRembourse(a), 0)
    const montantRestant = montantTotal - montantRembourse
    
    const nonRemboursees = avances.filter(a => {
      const montantRembourse = getMontantRembourse(a)
      const statut = getStatutAvance(a.montant, montantRembourse)
      return statut === 'non_remboursee'
    }).length
    
    const remboursees = avances.filter(a => {
      const montantRembourse = getMontantRembourse(a)
      const statut = getStatutAvance(a.montant, montantRembourse)
      return statut === 'remboursee'
    }).length

    return { total, montantTotal, montantRembourse, montantRestant, nonRemboursees, remboursees }
  }, [avances])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const montant = parseFloat(formData.montant) || 0
    const montantRembourse = parseFloat(formData.montantRembourse) || 0
    const statut = getStatutAvance(montant, montantRembourse)
    
    if (editingAvance) {
      // Conserver les remboursements existants si présents
      const remboursementsExistants = editingAvance.remboursements || []
      const montantRembourseCalcule = remboursementsExistants.length > 0 
        ? remboursementsExistants.reduce((sum, r) => sum + (Number(r.montant) || 0), 0)
        : montantRembourse
      
      setAvances(avances.map(avance =>
        avance.id === editingAvance.id
          ? {
              ...avance,
              ...formData,
              employeeId: formData.employeeId ? (typeof formData.employeeId === 'string' ? Number(formData.employeeId) : formData.employeeId) : formData.employeeId,
              montant,
              montantRembourse: montantRembourseCalcule,
              statut: getStatutAvance(montant, montantRembourseCalcule),
              remboursements: remboursementsExistants // Conserver les remboursements
            }
          : avance
      ))
    } else {
      const newAvance = {
        id: Date.now(),
        ...formData,
        employeeId: formData.employeeId ? (typeof formData.employeeId === 'string' ? Number(formData.employeeId) : formData.employeeId) : formData.employeeId,
        montant,
        montantRembourse: 0,
        remboursements: [], // Initialiser avec un tableau vide
        statut: 'non_remboursee',
        dateCreation: new Date().toISOString()
      }
      setAvances([...avances, newAvance])
    }
    
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      employeeId: '',
      montant: '',
      dateAvance: new Date().toISOString().split('T')[0],
      dateRemboursementPrevu: '',
      montantRembourse: 0,
      description: '',
      statut: 'non_remboursee'
    })
    setEditingAvance(null)
    setShowModal(false)
  }

  const handleEdit = (avance) => {
    setEditingAvance(avance)
    const montantRembourse = getMontantRembourse(avance)
    setFormData({
      employeeId: avance.employeeId || '',
      montant: avance.montant || '',
      dateAvance: avance.dateAvance ? avance.dateAvance.split('T')[0] : new Date().toISOString().split('T')[0],
      dateRemboursementPrevu: avance.dateRemboursementPrevu ? avance.dateRemboursementPrevu.split('T')[0] : '',
      montantRembourse: montantRembourse,
      description: avance.description || '',
      statut: avance.statut || 'non_remboursee'
    })
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette avance ?')) {
      setAvances(avances.filter(avance => avance.id !== id))
    }
  }

  const [showRemboursementModal, setShowRemboursementModal] = useState(false)
  const [selectedAvance, setSelectedAvance] = useState(null)
  const [remboursementData, setRemboursementData] = useState({
    montant: '',
    date: new Date().toISOString().split('T')[0]
  })

  const handleRemboursement = (avance) => {
    setSelectedAvance(avance)
    setRemboursementData({
      montant: '',
      date: new Date().toISOString().split('T')[0]
    })
    setShowRemboursementModal(true)
  }

  const handleSubmitRemboursement = (e) => {
    e.preventDefault()
    
    if (!selectedAvance || !remboursementData.montant || parseFloat(remboursementData.montant) <= 0) {
      alert('Veuillez entrer un montant valide')
      return
    }

    const montantRemboursement = parseFloat(remboursementData.montant)
    const montantTotal = Number(selectedAvance.montant) || 0
    const remboursementsExistants = selectedAvance.remboursements || []
    const montantRembourseActuel = remboursementsExistants.reduce((sum, r) => sum + (Number(r.montant) || 0), 0)
    const resteARembourser = montantTotal - montantRembourseActuel

    if (montantRemboursement > resteARembourser) {
      alert(`Le montant saisi (${montantRemboursement.toLocaleString()} F) dépasse le reste à rembourser (${resteARembourser.toLocaleString()} F)`)
      return
    }

    const nouveauRemboursement = {
      id: Date.now(),
      montant: montantRemboursement,
      date: remboursementData.date,
      dateCreation: new Date().toISOString()
    }

    const nouveauxRemboursements = [...remboursementsExistants, nouveauRemboursement]
    const nouveauMontantRembourse = montantRembourseActuel + montantRemboursement
    const nouveauStatut = getStatutAvance(montantTotal, nouveauMontantRembourse)
    
    setAvances(avances.map(a =>
      a.id === selectedAvance.id
        ? {
            ...a,
            remboursements: nouveauxRemboursements,
            montantRembourse: nouveauMontantRembourse,
            statut: nouveauStatut
          }
        : a
    ))

    setShowRemboursementModal(false)
    setSelectedAvance(null)
    setRemboursementData({ montant: '', date: new Date().toISOString().split('T')[0] })
  }

  const getEmployeeName = (employeeId) => {
    if (!employeeId) return 'Employé inconnu'
    const employee = employees.find(e => {
      return String(e.id) === String(employeeId) || e.id === employeeId
    })
    return employee ? `${employee.prenom} ${employee.nom}` : 'Employé inconnu'
  }

  const getStatutBadge = (statut) => {
    return statuts[statut] || statuts.non_remboursee
  }

  return (
    <Layout>
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Gestion des Avances</h1>
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
            Nouvelle avance
          </button>
        </div>

        {/* Statistiques */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ padding: '0.5rem', background: '#dbeafe', borderRadius: '8px' }}>
                <TrendingDown size={20} color="#3b82f6" />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Total avancé</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
                  {stats.montantTotal.toLocaleString()} F
                </div>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ padding: '0.5rem', background: '#d1fae5', borderRadius: '8px' }}>
                <TrendingUp size={20} color="#10b981" />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Total remboursé</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
                  {stats.montantRembourse.toLocaleString()} F
                </div>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ padding: '0.5rem', background: '#fee2e2', borderRadius: '8px' }}>
                <AlertCircle size={20} color="#ef4444" />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Reste à rembourser</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
                  {stats.montantRestant.toLocaleString()} F
                </div>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ padding: '0.5rem', background: '#fef3c7', borderRadius: '8px' }}>
                <FileText size={20} color="#f59e0b" />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Non remboursées</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
                  {stats.nonRemboursees}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Rechercher une avance..."
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
          
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              style={{
                padding: '0.75rem 1.5rem',
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

            <button
              onClick={() => setFilterStatut('all')}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                background: filterStatut === 'all' ? '#6366f1' : 'white',
                color: filterStatut === 'all' ? 'white' : '#1e293b',
                cursor: 'pointer',
                fontWeight: filterStatut === 'all' ? '600' : '400'
              }}
            >
              Toutes
            </button>
            <button
              onClick={() => setFilterStatut('non_remboursee')}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                background: filterStatut === 'non_remboursee' ? '#ef4444' : 'white',
                color: filterStatut === 'non_remboursee' ? 'white' : '#1e293b',
                cursor: 'pointer',
                fontWeight: filterStatut === 'non_remboursee' ? '600' : '400'
              }}
            >
              Non remboursées
            </button>
            <button
              onClick={() => setFilterStatut('partiellement_remboursee')}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                background: filterStatut === 'partiellement_remboursee' ? '#f59e0b' : 'white',
                color: filterStatut === 'partiellement_remboursee' ? 'white' : '#1e293b',
                cursor: 'pointer',
                fontWeight: filterStatut === 'partiellement_remboursee' ? '600' : '400'
              }}
            >
              Partiellement remboursées
            </button>
            <button
              onClick={() => setFilterStatut('remboursee')}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                background: filterStatut === 'remboursee' ? '#10b981' : 'white',
                color: filterStatut === 'remboursee' ? 'white' : '#1e293b',
                cursor: 'pointer',
                fontWeight: filterStatut === 'remboursee' ? '600' : '400'
              }}
            >
              Remboursées
            </button>
          </div>
        </div>

        {/* Liste des avances */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}>
          {filteredAvances.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <p>Aucune avance trouvée</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Employé</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Date avance</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Montant</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Remboursé</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Reste</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Date remboursement prévu</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Remboursements</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Statut</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#475569' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAvances.map((avance) => {
                    const montantRembourse = getMontantRembourse(avance)
                    const statutActuel = getStatutAvance(avance.montant, montantRembourse)
                    const statutBadge = getStatutBadge(statutActuel)
                    const montantTotal = Number(avance.montant) || 0
                    const montantRestant = montantTotal - montantRembourse
                    const Icon = statutBadge.icon
                    const remboursements = avance.remboursements || []
                    
                    return (
                      <tr key={avance.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem', fontWeight: '500' }}>
                          {getEmployeeName(avance.employeeId)}
                        </td>
                        <td style={{ padding: '1rem', color: '#64748b' }}>
                          {avance.dateAvance ? new Date(avance.dateAvance).toLocaleDateString('fr-FR') : '-'}
                        </td>
                        <td style={{ padding: '1rem', fontWeight: '500' }}>
                          {montantTotal.toLocaleString()} F
                        </td>
                        <td style={{ padding: '1rem', color: '#10b981', fontWeight: '500' }}>
                          {montantRembourse.toLocaleString()} F
                        </td>
                        <td style={{ padding: '1rem', color: montantRestant > 0 ? '#ef4444' : '#10b981', fontWeight: '600' }}>
                          {montantRestant.toLocaleString()} F
                        </td>
                        <td style={{ padding: '1rem', color: '#64748b' }}>
                          {avance.dateRemboursementPrevu ? new Date(avance.dateRemboursementPrevu).toLocaleDateString('fr-FR') : '-'}
                        </td>
                        <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.875rem' }}>
                          {remboursements.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              {remboursements.map((remb, index) => (
                                <div key={remb.id || index} style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '0.5rem',
                                  padding: '0.25rem 0.5rem',
                                  background: '#f0fdf4',
                                  borderRadius: '4px'
                                }}>
                                  <span style={{ fontWeight: '500', color: '#10b981' }}>
                                    {Number(remb.montant).toLocaleString()} F
                                  </span>
                                  <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                                    {remb.date ? new Date(remb.date).toLocaleDateString('fr-FR') : '-'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>-</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '6px',
                            background: statutBadge.bg,
                            color: statutBadge.color,
                            fontSize: '0.875rem',
                            fontWeight: '500'
                          }}>
                            <Icon size={14} />
                            {statutBadge.label}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                            {montantRestant > 0 && (
                              <button
                                onClick={() => handleRemboursement(avance)}
                                style={{
                                  padding: '0.5rem',
                                  background: '#f0fdf4',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  color: '#10b981',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title="Enregistrer un remboursement"
                              >
                                <DollarSign size={18} />
                              </button>
                            )}
                            <button
                              onClick={() => handleEdit(avance)}
                              style={{
                                padding: '0.5rem',
                                background: '#f1f5f9',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                color: '#6366f1'
                              }}
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(avance.id)}
                              style={{
                                padding: '0.5rem',
                                background: '#fef2f2',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                color: '#ef4444'
                              }}
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

        {/* Modal de remboursement */}
        {showRemboursementModal && selectedAvance && (
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
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Enregistrer un remboursement</h2>
                <button
                  onClick={() => {
                    setShowRemboursementModal(false)
                    setSelectedAvance(null)
                    setRemboursementData({ montant: '', date: new Date().toISOString().split('T')[0] })
                  }}
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
                <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                  Employé: <strong>{getEmployeeName(selectedAvance.employeeId)}</strong>
                </p>
                <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                  Montant total: <strong>{Number(selectedAvance.montant || 0).toLocaleString()} F</strong>
                </p>
                <p style={{ color: '#64748b', marginBottom: '1rem' }}>
                  Remboursé: <strong style={{ color: '#10b981' }}>{getMontantRembourse(selectedAvance).toLocaleString()} F</strong> | 
                  Reste: <strong style={{ color: '#ef4444' }}>
                    {(Number(selectedAvance.montant || 0) - getMontantRembourse(selectedAvance)).toLocaleString()} F
                  </strong>
                </p>
              </div>

              <form onSubmit={handleSubmitRemboursement}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Montant du remboursement (FCFA) *
                  </label>
                  <input
                    type="number"
                    required
                    value={remboursementData.montant}
                    onChange={(e) => setRemboursementData({ ...remboursementData, montant: e.target.value })}
                    max={Number(selectedAvance.montant || 0) - getMontantRembourse(selectedAvance)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                    placeholder={`Maximum: ${(Number(selectedAvance.montant || 0) - getMontantRembourse(selectedAvance)).toLocaleString()} F`}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Date du remboursement *
                  </label>
                  <input
                    type="date"
                    required
                    value={remboursementData.date}
                    onChange={(e) => setRemboursementData({ ...remboursementData, date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRemboursementModal(false)
                      setSelectedAvance(null)
                      setRemboursementData({ montant: '', date: new Date().toISOString().split('T')[0] })
                    }}
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
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {editingAvance ? 'Modifier l\'avance' : 'Nouvelle avance'}
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Montant (FCFA) *</label>
                    <input
                      type="number"
                      required
                      value={formData.montant}
                      onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
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
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Date avance *</label>
                    <input
                      type="date"
                      required
                      value={formData.dateAvance}
                      onChange={(e) => setFormData({ ...formData, dateAvance: e.target.value })}
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

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Date remboursement prévu</label>
                  <input
                    type="date"
                    value={formData.dateRemboursementPrevu}
                    onChange={(e) => setFormData({ ...formData, dateRemboursementPrevu: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                {editingAvance && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Montant remboursé (FCFA)</label>
                    <input
                      type="number"
                      value={formData.montantRembourse}
                      onChange={(e) => setFormData({ ...formData, montantRembourse: e.target.value })}
                      max={formData.montant}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                    />
                    <small style={{ color: '#64748b', fontSize: '0.875rem' }}>
                      Vous pouvez également utiliser le bouton de remboursement dans la liste
                    </small>
                  </div>
                )}

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      resize: 'vertical'
                    }}
                    placeholder="Décrivez la raison de l'avance..."
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
                    {editingAvance ? 'Modifier' : 'Créer'}
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

export default Avances

