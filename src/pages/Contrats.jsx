import React, { useState, useMemo } from 'react'
import Layout from '../components/Layout'
import { useData } from '../context/DataContext'
import { Plus, Search, Edit, Trash2, FileText, X, Calendar, DollarSign } from 'lucide-react'

const Contrats = () => {
  const { contrats, setContrats, clients, employees } = useData()
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingContrat, setEditingContrat] = useState(null)
  const [formData, setFormData] = useState({
    numero: '',
    clientId: '',
    dateDebut: '',
    dateFin: '',
    montant: '',
    typeService: 'securite',
    statut: 'actif'
  })

  const filteredContrats = useMemo(() => {
    return contrats.filter(contrat => {
      if (!contrat.clientId) return contrat.numero?.toLowerCase().includes(searchTerm.toLowerCase())
      const client = clients.find(c => c.id === contrat.clientId || String(c.id) === String(contrat.clientId))
      return client?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contrat.numero?.toLowerCase().includes(searchTerm.toLowerCase())
    })
  }, [contrats, clients, searchTerm])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (editingContrat) {
      setContrats(contrats.map(contrat =>
        contrat.id === editingContrat.id
          ? { ...contrat, ...formData, montant: parseFloat(formData.montant) }
          : contrat
      ))
    } else {
      const newContrat = {
        id: Date.now(),
        ...formData,
        montant: parseFloat(formData.montant),
        dateCreation: new Date().toISOString()
      }
      setContrats([...contrats, newContrat])
    }
    
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      numero: '',
      clientId: '',
      dateDebut: '',
      dateFin: '',
      montant: '',
      typeService: 'securite',
      statut: 'actif'
    })
    setEditingContrat(null)
    setShowModal(false)
  }

  const handleEdit = (contrat) => {
    setEditingContrat(contrat)
    setFormData({
      numero: contrat.numero || '',
      clientId: contrat.clientId || '',
      dateDebut: contrat.dateDebut || '',
      dateFin: contrat.dateFin || '',
      montant: contrat.montant || '',
      typeService: contrat.typeService || 'securite',
      statut: contrat.statut || 'actif'
    })
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce contrat ?')) {
      setContrats(contrats.filter(contrat => contrat.id !== id))
    }
  }

  const getClientName = (clientId) => {
    if (!clientId) return 'Client inconnu'
    const client = clients.find(c => c.id === clientId || String(c.id) === String(clientId))
    return client?.nom || 'Client inconnu'
  }

  return (
    <Layout>
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Gestion des Contrats</h1>
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
            Ajouter un contrat
          </button>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', maxWidth: '500px' }}>
            <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Rechercher un contrat..."
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
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}>
          {filteredContrats.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <p>Aucun contrat trouvé</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Numéro</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Client</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Type de service</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Date début</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Date fin</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Montant</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Statut</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#475569' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContrats.map((contrat) => (
                    <tr key={contrat.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem', fontWeight: '500' }}>{contrat.numero || '-'}</td>
                      <td style={{ padding: '1rem' }}>{getClientName(contrat.clientId)}</td>
                      <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{contrat.typeService}</td>
                      <td style={{ padding: '1rem', color: '#64748b' }}>
                        {contrat.dateDebut ? new Date(contrat.dateDebut).toLocaleDateString('fr-FR') : '-'}
                      </td>
                      <td style={{ padding: '1rem', color: '#64748b' }}>
                        {contrat.dateFin ? new Date(contrat.dateFin).toLocaleDateString('fr-FR') : '-'}
                      </td>
                      <td style={{ padding: '1rem', color: '#64748b' }}>
                        {contrat.montant ? `${contrat.montant.toLocaleString()} F` : '-'}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '6px',
                          background: contrat.statut === 'actif' ? '#d1fae5' : '#fee2e2',
                          color: contrat.statut === 'actif' ? '#065f46' : '#991b1b',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          textTransform: 'capitalize'
                        }}>
                          {contrat.statut}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleEdit(contrat)}
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
                            onClick={() => handleDelete(contrat.id)}
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
                  ))}
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
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {editingContrat ? 'Modifier le contrat' : 'Ajouter un contrat'}
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
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Numéro de contrat *</label>
                  <input
                    type="text"
                    required
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
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
                    <option value="mixte">Mixte</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Date début *</label>
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
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Date fin *</label>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
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
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Statut *</label>
                    <select
                      required
                      value={formData.statut}
                      onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="actif">Actif</option>
                      <option value="inactif">Inactif</option>
                      <option value="expire">Expiré</option>
                    </select>
                  </div>
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
                    {editingContrat ? 'Modifier' : 'Ajouter'}
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

export default Contrats
