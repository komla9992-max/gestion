import React, { useState, useMemo } from 'react'
import Layout from '../components/Layout'
import { useData } from '../context/DataContext'
import { Plus, Search, Edit, Trash2, Building2, X, Phone, Mail, MapPin } from 'lucide-react'

const Clients = () => {
  const { clients, setClients } = useData()
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [formData, setFormData] = useState({
    nom: '',
    telephone: '',
    email: '',
    adresse: '',
    type: 'entreprise',
    contactPersonne: ''
  })

  const filteredClients = useMemo(() => {
    return clients.filter(client =>
      client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.telephone?.includes(searchTerm) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [clients, searchTerm])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (editingClient) {
      setClients(clients.map(client =>
        client.id === editingClient.id
          ? { ...client, ...formData }
          : client
      ))
    } else {
      const newClient = {
        id: Date.now(),
        ...formData,
        dateCreation: new Date().toISOString()
      }
      setClients([...clients, newClient])
    }
    
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      nom: '',
      telephone: '',
      email: '',
      adresse: '',
      type: 'entreprise',
      contactPersonne: ''
    })
    setEditingClient(null)
    setShowModal(false)
  }

  const handleEdit = (client) => {
    setEditingClient(client)
    setFormData({
      nom: client.nom || '',
      telephone: client.telephone || '',
      email: client.email || '',
      adresse: client.adresse || '',
      type: client.type || 'entreprise',
      contactPersonne: client.contactPersonne || ''
    })
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      setClients(clients.filter(client => client.id !== id))
    }
  }

  return (
    <Layout>
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Gestion des Clients</h1>
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
            Ajouter un client
          </button>
        </div>

        {/* Recherche */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', maxWidth: '500px' }}>
            <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Rechercher un client..."
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

        {/* Liste des clients */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredClients.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              padding: '3rem',
              textAlign: 'center',
              background: 'white',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              color: '#64748b'
            }}>
              <Building2 size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>Aucun client trouvé</p>
            </div>
          ) : (
            filteredClients.map((client) => (
              <div
                key={client.id}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: '1px solid #e2e8f0',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                      {client.nom}
                    </h3>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '6px',
                      background: client.type === 'entreprise' ? '#dbeafe' : '#fef3c7',
                      color: client.type === 'entreprise' ? '#1e40af' : '#92400e',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}>
                      {client.type === 'entreprise' ? 'Entreprise' : 'Particulier'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleEdit(client)}
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
                      onClick={() => handleDelete(client.id)}
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {client.telephone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
                      <Phone size={16} />
                      <span>{client.telephone}</span>
                    </div>
                  )}
                  {client.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
                      <Mail size={16} />
                      <span>{client.email}</span>
                    </div>
                  )}
                  {client.adresse && (
                    <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem', color: '#64748b' }}>
                      <MapPin size={16} style={{ marginTop: '2px' }} />
                      <span>{client.adresse}</span>
                    </div>
                  )}
                  {client.contactPersonne && (
                    <div style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        Contact: <strong>{client.contactPersonne}</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
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
                  {editingClient ? 'Modifier le client' : 'Ajouter un client'}
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
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Nom / Raison sociale *</label>
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
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
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Type *</label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="entreprise">Entreprise</option>
                    <option value="particulier">Particulier</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Téléphone</label>
                    <input
                      type="tel"
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
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
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Adresse</label>
                  <textarea
                    value={formData.adresse}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
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

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Personne de contact</label>
                  <input
                    type="text"
                    value={formData.contactPersonne}
                    onChange={(e) => setFormData({ ...formData, contactPersonne: e.target.value })}
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
                    {editingClient ? 'Modifier' : 'Ajouter'}
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

export default Clients
