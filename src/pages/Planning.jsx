import React, { useState, useMemo } from 'react'
import Layout from '../components/Layout'
import { useData } from '../context/DataContext'
import { Calendar, Plus, Edit, Trash2, X, Clock, User, MapPin } from 'lucide-react'

const Planning = () => {
  const { employees, clients, contrats } = useData()
  const [planning, setPlanning] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    employeeId: '',
    clientId: '',
    heureDebut: '08:00',
    heureFin: '17:00',
    description: '',
    typeService: 'securite'
  })

  // Charger le planning depuis localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem('planning')
    if (saved) setPlanning(JSON.parse(saved))
  }, [])

  // Sauvegarder le planning
  React.useEffect(() => {
    if (planning.length > 0) {
      localStorage.setItem('planning', JSON.stringify(planning))
    }
  }, [planning])

  const filteredPlanning = useMemo(() => {
    return planning.filter(plan => plan.date === selectedDate)
  }, [planning, selectedDate])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (editingPlan) {
      setPlanning(planning.map(plan =>
        plan.id === editingPlan.id
          ? { ...plan, ...formData }
          : plan
      ))
    } else {
      const newPlan = {
        id: Date.now(),
        ...formData,
        dateCreation: new Date().toISOString()
      }
      setPlanning([...planning, newPlan])
    }
    
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      employeeId: '',
      clientId: '',
      heureDebut: '08:00',
      heureFin: '17:00',
      description: '',
      typeService: 'securite'
    })
    setEditingPlan(null)
    setShowModal(false)
  }

  const handleEdit = (plan) => {
    setEditingPlan(plan)
    setFormData({
      date: plan.date || new Date().toISOString().split('T')[0],
      employeeId: plan.employeeId || '',
      clientId: plan.clientId || '',
      heureDebut: plan.heureDebut || '08:00',
      heureFin: plan.heureFin || '17:00',
      description: plan.description || '',
      typeService: plan.typeService || 'securite'
    })
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette affectation ?')) {
      setPlanning(planning.filter(plan => plan.id !== id))
    }
  }

  const getEmployeeName = (id) => {
    if (!id) return 'Employé inconnu'
    // Gérer les cas où l'ID peut être un nombre ou une chaîne
    const emp = employees.find(e => {
      return String(e.id) === String(id) || e.id === id
    })
    return emp ? `${emp.prenom} ${emp.nom}` : 'Employé inconnu'
  }

  const getClientName = (id) => {
    if (!id) return 'Client inconnu'
    const client = clients.find(c => c.id === id || String(c.id) === String(id))
    return client?.nom || 'Client inconnu'
  }

  return (
    <Layout>
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Planning</h1>
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
            Nouvelle affectation
          </button>
        </div>

        {/* Sélecteur de date */}
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

        {/* Liste du planning */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}>
          {filteredPlanning.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <Calendar size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>Aucune affectation pour cette date</p>
            </div>
          ) : (
            <div style={{ padding: '1.5rem' }}>
              {filteredPlanning.map((plan) => (
                <div
                  key={plan.id}
                  style={{
                    padding: '1.5rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    background: '#f8fafc'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        {getClientName(plan.clientId)}
                      </h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', color: '#64748b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <User size={16} />
                          <span>{getEmployeeName(plan.employeeId)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Clock size={16} />
                          <span>{plan.heureDebut} - {plan.heureFin}</span>
                        </div>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '6px',
                          background: plan.typeService === 'securite' ? '#dbeafe' : plan.typeService === 'entretien' ? '#d1fae5' : '#fef3c7',
                          color: plan.typeService === 'securite' ? '#1e40af' : plan.typeService === 'entretien' ? '#065f46' : '#92400e',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          textTransform: 'capitalize'
                        }}>
                          {plan.typeService}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleEdit(plan)}
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
                        onClick={() => handleDelete(plan.id)}
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
                  </div>
                  {plan.description && (
                    <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{plan.description}</p>
                  )}
                </div>
              ))}
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
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {editingPlan ? 'Modifier l\'affectation' : 'Nouvelle affectation'}
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
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Client *</label>
                  <select
                    required
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="">Sélectionner un client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.nom}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Heure début *</label>
                    <input
                      type="time"
                      required
                      value={formData.heureDebut}
                      onChange={(e) => setFormData({ ...formData, heureDebut: e.target.value })}
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
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Heure fin *</label>
                    <input
                      type="time"
                      required
                      value={formData.heureFin}
                      onChange={(e) => setFormData({ ...formData, heureFin: e.target.value })}
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
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Type de service *</label>
                  <select
                    required
                    value={formData.typeService}
                    onChange={(e) => setFormData({ ...formData, typeService: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="securite">Sécurité</option>
                    <option value="entretien">Entretien</option>
                    <option value="administratif">Administratif</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                    {editingPlan ? 'Modifier' : 'Ajouter'}
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

export default Planning
