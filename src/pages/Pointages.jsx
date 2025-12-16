import React, { useState, useMemo } from 'react'
import Layout from '../components/Layout'
import { useData } from '../context/DataContext'
import { Clock, Plus, Edit, Trash2, X, User, Calendar } from 'lucide-react'

const Pointages = () => {
  const { employees, clients, contrats } = useData()
  
  // Fonction pour obtenir l'heure actuelle
  const getCurrentTime = () => {
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }

  const [pointages, setPointages] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingPointage, setEditingPointage] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    employeeId: '',
    heureArrivee: getCurrentTime(), // Remplir automatiquement l'heure d'arrivée
    heureDepart: '', // Heure de départ vide et non obligatoire
    observation: ''
  })

  React.useEffect(() => {
    const saved = localStorage.getItem('pointages')
    if (saved) setPointages(JSON.parse(saved))
  }, [])

  React.useEffect(() => {
    if (pointages.length > 0) {
      localStorage.setItem('pointages', JSON.stringify(pointages))
    }
  }, [pointages])

  const filteredPointages = useMemo(() => {
    const filtered = pointages.filter(p => {
      // Normaliser les dates pour la comparaison
      const pointageDate = p.date ? new Date(p.date).toISOString().split('T')[0] : ''
      const selected = selectedDate ? new Date(selectedDate).toISOString().split('T')[0] : ''
      return pointageDate === selected
    })
    // Trier par ID décroissant (plus récent en premier)
    return filtered.sort((a, b) => (b.id || 0) - (a.id || 0))
  }, [pointages, selectedDate])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (editingPointage) {
      setPointages(pointages.map(p =>
        p.id === editingPointage.id ? { ...p, ...formData } : p
      ))
    } else {
      // Vérifier si un pointage existe déjà pour cet employé à cette date
      const existingPointage = pointages.find(p => 
        p.employeeId === formData.employeeId && 
        p.date === formData.date
      )

      if (existingPointage) {
        // Mettre à jour le pointage existant avec les nouvelles données
        setPointages(pointages.map(p =>
          p.id === existingPointage.id 
            ? { ...p, ...formData, dateCreation: p.dateCreation || new Date().toISOString() }
            : p
        ))
      } else {
        // Créer un nouveau pointage
        const newPointage = {
          id: Date.now(),
          ...formData,
          dateCreation: new Date().toISOString()
        }
        setPointages([...pointages, newPointage])
      }
    }
    
    resetForm()
  }

  const handlePointerArrivee = () => {
    setFormData({ ...formData, heureArrivee: getCurrentTime() })
  }

  const handlePointerDepart = () => {
    setFormData({ ...formData, heureDepart: getCurrentTime() })
  }

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      employeeId: '',
      heureArrivee: getCurrentTime(), // Remplir automatiquement l'heure d'arrivée
      heureDepart: '', // Heure de départ vide et non obligatoire
      observation: ''
    })
    setEditingPointage(null)
    setShowModal(false)
  }

  const handleEdit = (pointage) => {
    setEditingPointage(pointage)
    setFormData({
      date: pointage.date,
      employeeId: pointage.employeeId,
      heureArrivee: pointage.heureArrivee,
      heureDepart: pointage.heureDepart,
      observation: pointage.observation || ''
    })
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Supprimer ce pointage ?')) {
      setPointages(pointages.filter(p => p.id !== id))
    }
  }

  const handlePointerDepartRapide = (pointage) => {
    const heureDepartActuelle = getCurrentTime()
    setPointages(pointages.map(p =>
      p.id === pointage.id 
        ? { ...p, heureDepart: heureDepartActuelle }
        : p
    ))
  }

  const handlePointerArriveeRapide = (pointage) => {
    const heureArriveeActuelle = getCurrentTime()
    setPointages(pointages.map(p =>
      p.id === pointage.id 
        ? { ...p, heureArrivee: heureArriveeActuelle }
        : p
    ))
  }

  const getEmployeeName = (id) => {
    if (!id) return 'Inconnu'
    // Gérer les cas où l'ID peut être un nombre ou une chaîne
    const emp = employees.find(e => {
      return String(e.id) === String(id) || e.id === id
    })
    return emp ? `${emp.prenom} ${emp.nom}` : 'Inconnu'
  }

  const getEmployeeType = (id) => {
    if (!id) return null
    const emp = employees.find(e => {
      return String(e.id) === String(id) || e.id === id
    })
    return emp?.type || null
  }

  const getTypeLabel = (type) => {
    if (!type) return 'Non défini'
    const types = {
      securite: 'Sécurité',
      entretien: 'Entretien',
      administratif: 'Administratif'
    }
    // Si le type est dans la liste prédéfinie, retourner le label
    // Sinon, retourner le type tel quel (type personnalisé)
    return types[type] || type
  }

  const getTypeColor = (type) => {
    const typeColors = {
      securite: { bg: '#dbeafe', color: '#1e40af' },
      entretien: { bg: '#d1fae5', color: '#065f46' },
      administratif: { bg: '#fef3c7', color: '#92400e' }
    }
    // Si le type est dans la liste prédéfinie, retourner les couleurs correspondantes
    // Sinon, retourner des couleurs par défaut pour les types personnalisés
    return typeColors[type] || { bg: '#f3f4f6', color: '#6b7280' }
  }

  const getClientForEmployee = (employeeId, date) => {
    if (!employeeId || !date) return null
    
    // Charger le planning depuis localStorage
    const saved = localStorage.getItem('planning')
    if (!saved) return null
    
    const planning = JSON.parse(saved)
    // Trouver le planning pour cet employé à cette date
    const plan = planning.find(p => 
      p.employeeId && 
      p.date === date && 
      (String(p.employeeId) === String(employeeId) || p.employeeId === employeeId)
    )
    
    if (plan && plan.clientId) {
      const client = clients.find(c => 
        c.id === plan.clientId || String(c.id) === String(plan.clientId)
      )
      return client?.nom || null
    }
    
    return null
  }

  const calculateHours = (arrivee, depart) => {
    if (!arrivee || !depart) return '-'
    try {
      const [h1, m1] = arrivee.split(':').map(Number)
      const [h2, m2] = depart.split(':').map(Number)
      
      // Vérifier que les valeurs sont valides
      if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return '-'
      
      const total = (h2 * 60 + m2) - (h1 * 60 + m1)
      
      // Si le total est négatif, cela signifie que le départ est le lendemain
      const hours = Math.floor(Math.abs(total) / 60)
      const minutes = Math.abs(total) % 60
      
      // Si négatif, ajouter 24h
      if (total < 0) {
        return `${hours + 24}h${minutes.toString().padStart(2, '0')}`
      }
      
      return `${hours}h${minutes.toString().padStart(2, '0')}`
    } catch (error) {
      console.error('Erreur dans calculateHours:', error)
      return '-'
    }
  }

  return (
    <Layout>
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Pointages</h1>
          <button
            onClick={() => {
              // Mettre à jour l'heure d'arrivée avec l'heure actuelle lors de l'ouverture du modal
              setFormData({
                date: new Date().toISOString().split('T')[0],
                employeeId: '',
                heureArrivee: getCurrentTime(),
                heureDepart: '',
                observation: ''
              })
              setEditingPointage(null)
              setShowModal(true)
            }}
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
            Nouveau pointage
          </button>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: '0.75rem',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '1rem',
              maxWidth: '300px'
            }}
          />
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}>
          {filteredPointages.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <p>Aucun pointage pour cette date</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Employé</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Poste</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Client</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Heure arrivée</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Heure départ</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Heures travaillées</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Observation</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPointages.map((pointage) => {
                    const hasArrivee = pointage.heureArrivee && pointage.heureArrivee.trim() !== ''
                    const hasDepart = pointage.heureDepart && pointage.heureDepart.trim() !== ''
                    
                    const employeeType = getEmployeeType(pointage.employeeId)
                    const typeColor = getTypeColor(employeeType)
                    
                    const clientName = getClientForEmployee(pointage.employeeId, pointage.date)
                    
                    return (
                      <tr key={pointage.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem', fontWeight: '500' }}>{getEmployeeName(pointage.employeeId)}</td>
                        <td style={{ padding: '1rem' }}>
                          {employeeType ? (
                            <span style={{
                              display: 'inline-block',
                              padding: '0.375rem 0.75rem',
                              borderRadius: '6px',
                              background: typeColor.bg,
                              color: typeColor.color,
                              fontSize: '0.875rem',
                              fontWeight: '500'
                            }}>
                              {getTypeLabel(employeeType)}
                            </span>
                          ) : (
                            <span style={{ color: '#9ca3af' }}>-</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.875rem' }}>
                          {clientName || <span style={{ color: '#9ca3af' }}>-</span>}
                        </td>
                        <td style={{ padding: '1rem', color: '#64748b' }}>
                          {hasArrivee ? pointage.heureArrivee : (
                            <span style={{ color: '#f59e0b', fontStyle: 'italic' }}>Non pointé</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem', color: '#64748b' }}>
                          {hasDepart ? pointage.heureDepart : (
                            <span style={{ color: '#f59e0b', fontStyle: 'italic' }}>Non pointé</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem', color: '#64748b', fontWeight: '500' }}>
                          {hasArrivee && hasDepart 
                            ? calculateHours(pointage.heureArrivee, pointage.heureDepart)
                            : '-'
                          }
                        </td>
                        <td style={{ padding: '1rem', color: '#64748b' }}>{pointage.observation || '-'}</td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            {!hasArrivee && (
                              <button
                                onClick={() => handlePointerArriveeRapide(pointage)}
                                style={{
                                  padding: '0.5rem 0.75rem',
                                  background: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.875rem',
                                  fontWeight: '500'
                                }}
                                title="Pointer l'arrivée maintenant"
                              >
                                Arrivée
                              </button>
                            )}
                            {hasArrivee && !hasDepart && (
                              <button
                                onClick={() => handlePointerDepartRapide(pointage)}
                                style={{
                                  padding: '0.5rem 0.75rem',
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.875rem',
                                  fontWeight: '500'
                                }}
                                title="Pointer le départ maintenant"
                              >
                                Départ
                              </button>
                            )}
                            <button
                              onClick={() => handleEdit(pointage)}
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
                              onClick={() => handleDelete(pointage.id)}
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
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
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
              maxWidth: '500px',
              width: '100%'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {editingPointage ? 'Modifier le pointage' : 'Nouveau pointage'}
                </h2>
                <button onClick={resetForm} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
                  <X size={24} />
                </button>
              </div>
              {editingPointage && (
                <div style={{ 
                  marginBottom: '1rem', 
                  padding: '0.75rem', 
                  background: '#dbeafe', 
                  border: '1px solid #3b82f6',
                  borderRadius: '8px',
                  color: '#1e40af',
                  fontSize: '0.875rem'
                }}>
                  <strong>Pointage existant détecté.</strong> Les données existantes ont été chargées. Vous pouvez les modifier ou pointer le départ.
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => {
                      const selectedDate = e.target.value
                      // Vérifier si un pointage existe déjà pour cet employé à cette date
                      if (formData.employeeId && !editingPointage) {
                        const existingPointage = pointages.find(p => 
                          p.employeeId === formData.employeeId && 
                          p.date === selectedDate
                        )
                        
                        if (existingPointage) {
                          // Préremplir avec les données existantes
                          setFormData({
                            ...formData,
                            date: selectedDate,
                            heureArrivee: existingPointage.heureArrivee || '',
                            heureDepart: existingPointage.heureDepart || '',
                            observation: existingPointage.observation || ''
                          })
                          setEditingPointage(existingPointage)
                        } else {
                          setFormData({ ...formData, date: selectedDate })
                        }
                      } else {
                        setFormData({ ...formData, date: selectedDate })
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Employé *</label>
                  <select
                    required
                    value={formData.employeeId}
                    onChange={(e) => {
                      const selectedEmployeeId = e.target.value
                      // Vérifier si un pointage existe déjà pour cet employé à cette date
                      const existingPointage = pointages.find(p => 
                        p.employeeId === selectedEmployeeId && 
                        p.date === formData.date
                      )
                      
                      if (existingPointage && !editingPointage) {
                        // Préremplir avec les données existantes
                        setFormData({
                          ...formData,
                          employeeId: selectedEmployeeId,
                          heureArrivee: existingPointage.heureArrivee || getCurrentTime(),
                          heureDepart: existingPointage.heureDepart || '',
                          observation: existingPointage.observation || ''
                        })
                        setEditingPointage(existingPointage)
                      } else {
                        // Pour un nouveau pointage, mettre à jour l'heure d'arrivée automatiquement
                        setFormData({ 
                          ...formData, 
                          employeeId: selectedEmployeeId,
                          heureArrivee: formData.heureArrivee || getCurrentTime()
                        })
                      }
                    }}
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <label style={{ fontWeight: '500' }}>Heure arrivée *</label>
                        {!editingPointage && (
                          <button
                            type="button"
                            onClick={handlePointerArrivee}
                            style={{
                              padding: '0.375rem 0.75rem',
                              background: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.875rem',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            Actualiser
                          </button>
                        )}
                      </div>
                      <input
                        type="time"
                        required
                        value={formData.heureArrivee}
                        onChange={(e) => setFormData({ ...formData, heureArrivee: e.target.value })}
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <label style={{ fontWeight: '500' }}>Heure départ</label>
                        {!editingPointage && (
                          <button
                            type="button"
                            onClick={handlePointerDepart}
                            style={{
                              padding: '0.375rem 0.75rem',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.875rem',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            Pointer maintenant
                          </button>
                        )}
                      </div>
                      <input
                        type="time"
                        value={formData.heureDepart}
                        onChange={(e) => setFormData({ ...formData, heureDepart: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '1rem'
                        }}
                      />
                      <small style={{ color: '#64748b', fontSize: '0.875rem' }}>Optionnel - peut être rempli plus tard</small>
                    </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Observation</label>
                  <textarea
                    value={formData.observation}
                    onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                    rows="3"
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
                    onClick={resetForm}
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      background: 'white',
                      cursor: 'pointer'
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
                      fontWeight: '500'
                    }}
                  >
                    {editingPointage ? 'Modifier' : 'Ajouter'}
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

export default Pointages
