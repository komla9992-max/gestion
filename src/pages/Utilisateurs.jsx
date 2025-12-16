import React, { useState, useEffect, useMemo } from 'react'
import Layout from '../components/Layout'
import { usersApi } from '../api/usersApi'
import { Plus, Search, Edit, Trash2, UserCog, X, Mail, Shield, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'

const Utilisateurs = () => {
  const { isAdmin } = useAuth()
  const { employees } = useData()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    email: '',
    password: '',
    role: '',
    permissions: []
  })

  // Liste des modules/pages disponibles
  const availableModules = [
    { id: 'dashboard', label: 'Tableau de bord' },
    { id: 'employes', label: 'Employés' },
    { id: 'clients', label: 'Clients' },
    { id: 'contrats', label: 'Contrats' },
    { id: 'planning', label: 'Planning' },
    { id: 'pointages', label: 'Pointages' },
    { id: 'caisse', label: 'Caisse' },
    { id: 'factures', label: 'Factures' },
    { id: 'impayes', label: 'Impayés' },
    { id: 'utilisateurs', label: 'Utilisateurs' },
    { id: 'conges', label: 'Congés' },
    { id: 'paie', label: 'Paie' },
    { id: 'comptabilite', label: 'Comptabilité' }
  ]

  // Charger les utilisateurs au démarrage
  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await usersApi.list()
      setUsers(data)
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error)
    } finally {
      setLoading(false)
    }
  }

  const roles = {
    admin: { label: 'Administrateur', color: '#ef4444', bg: '#fee2e2', icon: Shield },
    comptable: { label: 'Comptable', color: '#3b82f6', bg: '#dbeafe', icon: UserCog },
    superviseur: { label: 'Superviseur', color: '#10b981', bg: '#d1fae5', icon: UserCog },
    agent: { label: 'Agent', color: '#64748b', bg: '#f1f5f9', icon: User }
  }

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesFilter = filterRole === 'all' || user.role === filterRole
      
      return matchesSearch && matchesFilter
    })
  }, [users, searchTerm, filterRole])

  // Récupérer tous les types d'employés uniques
  const employeeTypes = useMemo(() => {
    const types = new Set()
    employees.forEach(emp => {
      if (emp.type && emp.type.trim()) {
        types.add(emp.type)
      }
    })
    return Array.from(types).sort()
  }, [employees])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.employeeId && !editingUser) {
      alert('Veuillez sélectionner un employé')
      return
    }
    
    if (!formData.name || !formData.email) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }
    
    if (isAdmin && (!formData.permissions || formData.permissions.length === 0)) {
      alert('Veuillez sélectionner au moins un module d\'accès')
      return
    }

    try {
      if (editingUser) {
        await usersApi.update(editingUser.id, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          password: formData.password || undefined,
          permissions: formData.permissions
        })
      } else {
        await usersApi.create({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        password: formData.password,
        permissions: formData.permissions
      })
      }
      await loadUsers()
      resetForm()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      alert('Erreur lors de la sauvegarde de l\'utilisateur')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      employeeId: '',
      email: '',
      password: '',
      role: '',
      permissions: []
    })
    setEditingUser(null)
    setShowModal(false)
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    // Chercher l'employé correspondant au nom de l'utilisateur
    const matchingEmployee = employees.find(emp => 
      `${emp.prenom} ${emp.nom}` === user.name || `${emp.nom} ${emp.prenom}` === user.name
    )
    setFormData({
      name: user.name || '',
      employeeId: matchingEmployee?.id || '',
      email: user.email || '',
      password: '',
      role: user.role || matchingEmployee?.type || '',
      permissions: user.permissions || []
    })
    setShowModal(true)
  }

  const handleEmployeeChange = (employeeId) => {
    const selectedEmployee = employees.find(emp => emp.id === Number(employeeId) || emp.id === employeeId)
    if (selectedEmployee) {
      const fullName = `${selectedEmployee.prenom} ${selectedEmployee.nom}`
      setFormData({
        ...formData,
        employeeId: employeeId,
        name: fullName,
        email: selectedEmployee.email || formData.email,
        role: selectedEmployee.type || formData.role
      })
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return
    }

    try {
      await usersApi.remove(id)
      await loadUsers()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert('Erreur lors de la suppression de l\'utilisateur')
    }
  }

  const getRoleBadge = (role) => {
    // Si c'est un rôle système connu, utiliser les styles prédéfinis
    if (roles[role]) {
      const roleInfo = roles[role]
      const Icon = roleInfo.icon
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.25rem 0.75rem',
          borderRadius: '6px',
          background: roleInfo.bg,
          color: roleInfo.color,
          fontSize: '0.875rem',
          fontWeight: '500'
        }}>
          <Icon size={14} />
          {roleInfo.label}
        </span>
      )
    }
    // Sinon, afficher le poste tel quel (poste d'employé)
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.25rem 0.75rem',
        borderRadius: '6px',
        background: '#f1f5f9',
        color: '#475569',
        fontSize: '0.875rem',
        fontWeight: '500'
      }}>
        <User size={14} />
        {role || 'Non défini'}
      </span>
    )
  }

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
          Gestion des Utilisateurs
        </h1>
          {isAdmin && (
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
              Nouvel utilisateur
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
            <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total utilisateurs</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'black', margin: 0 }}>
              {users.length}
            </p>
          </div>
          {Object.entries(roles).map(([roleKey, roleInfo]) => {
            const count = users.filter(u => u.role === roleKey).length
            const Icon = roleInfo.icon
            return (
              <div key={roleKey} style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Icon size={20} color={roleInfo.color} />
                  <p style={{ color: '#666', fontSize: '0.875rem', margin: 0 }}>{roleInfo.label}</p>
                </div>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'black', margin: 0 }}>
                  {count}
                </p>
              </div>
            )
          })}
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
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
            <button
              onClick={() => setFilterRole('all')}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                background: filterRole === 'all' ? 'black' : 'white',
                color: filterRole === 'all' ? 'white' : 'black',
                cursor: 'pointer',
                fontWeight: filterRole === 'all' ? '600' : '400'
              }}
            >
              Tous
            </button>
            {Object.entries(roles).map(([roleKey, roleInfo]) => (
              <button
                key={roleKey}
                onClick={() => setFilterRole(roleKey)}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: `1px solid ${roleInfo.color}`,
                  borderRadius: '8px',
                  background: filterRole === roleKey ? roleInfo.color : 'white',
                  color: filterRole === roleKey ? 'white' : roleInfo.color,
                  cursor: 'pointer',
                  fontWeight: filterRole === roleKey ? '600' : '400'
                }}
              >
                {roleInfo.label}
              </button>
            ))}
          </div>
        </div>

        {/* Liste des utilisateurs */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}>
          {filteredUsers.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <UserCog size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>Aucun utilisateur trouvé</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Nom</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Email</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Poste</th>
                    {isAdmin && (
                      <>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Accès</th>
                        <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#475569' }}>Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem', fontWeight: '500', color: 'black' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'black',
                            fontWeight: 'bold'
                          }}>
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <span>{user.name || '-'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', color: '#666' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Mail size={16} color="#64748b" />
                          {user.email || '-'}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {getRoleBadge(user.role)}
                      </td>
                      {isAdmin && (
                        <>
                          <td style={{ padding: '1rem', color: '#64748b' }}>
                            {user.role === 'admin' ? (
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '6px',
                                background: '#dcfce7',
                                color: '#16a34a',
                                fontSize: '0.875rem',
                                fontWeight: '500'
                              }}>
                                Tous les accès
                              </span>
                            ) : (
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '6px',
                                background: '#f1f5f9',
                                color: '#475569',
                                fontSize: '0.875rem',
                                fontWeight: '500'
                              }} title={(user.permissions || []).map(p => {
                                const module = availableModules.find(m => m.id === p)
                                return module ? module.label : p
                              }).join(', ')}>
                                {(user.permissions || []).length} module{(user.permissions || []).length > 1 ? 's' : ''}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleEdit(user)}
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
                              onClick={() => handleDelete(user.id)}
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
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

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
            padding: '1rem',
            overflowY: 'auto'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'black', margin: 0 }}>
                  {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
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
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'black' }}>
                    Employé *
                  </label>
                  <select
                    required
                    value={formData.employeeId || ''}
                    onChange={(e) => handleEmployeeChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      color: 'black',
                      background: 'white'
                    }}
                  >
                    <option value="">-- Sélectionner un employé --</option>
                    {employees.map((employee) => {
                      const fullName = `${employee.prenom} ${employee.nom}`
                      return (
                        <option key={employee.id} value={employee.id}>
                          {fullName}
                        </option>
                      )
                    })}
                  </select>
                  {editingUser && !formData.employeeId && formData.name && (
                    <input
                      type="hidden"
                      value={formData.name}
                      name="name"
                    />
                  )}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'black' }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      color: 'black'
                    }}
                    placeholder="Ex: jean.dupont@example.com"
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'black' }}>
                    Mot de passe {!editingUser && '*'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      color: 'black'
                    }}
                    placeholder={editingUser ? "Laisser vide pour ne pas modifier" : "Laisser vide pour générer automatiquement"}
                  />
                  {!editingUser && (
                    <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#64748b' }}>
                      Si vide, le mot de passe sera généré automatiquement (email sans @)
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'black' }}>
                    Poste *
                  </label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      color: 'black',
                      background: 'white'
                    }}
                  >
                    <option value="">-- Sélectionner un poste --</option>
                    {employeeTypes.length > 0 ? (
                      employeeTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))
                    ) : (
                      <option disabled>Aucun poste enregistré</option>
                    )}
                  </select>
                  {employeeTypes.length === 0 && (
                    <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#ef4444' }}>
                      Veuillez d'abord créer des employés avec leurs postes
                    </p>
                  )}
                </div>

                {isAdmin && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '500', color: 'black' }}>
                      Accès aux modules *
                    </label>
                    <div style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '1rem',
                      background: '#f8fafc',
                      maxHeight: '250px',
                      overflowY: 'auto'
                    }}>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
                        gap: '0.75rem' 
                      }}>
                        {availableModules.map((module) => {
                          const isChecked = formData.permissions.includes(module.id)
                          return (
                            <label
                              key={module.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                cursor: 'pointer',
                                padding: '0.5rem',
                                borderRadius: '6px',
                                background: isChecked ? '#e0e7ff' : 'white',
                                border: `1px solid ${isChecked ? '#6366f1' : '#e2e8f0'}`,
                                transition: 'all 0.2s'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData({
                                      ...formData,
                                      permissions: [...formData.permissions, module.id]
                                    })
                                  } else {
                                    setFormData({
                                      ...formData,
                                      permissions: formData.permissions.filter(p => p !== module.id)
                                    })
                                  }
                                }}
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  cursor: 'pointer'
                                }}
                              />
                              <span style={{ fontSize: '0.9rem', color: 'black' }}>{module.label}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                    {formData.permissions.length === 0 && (
                      <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#ef4444' }}>
                        Veuillez sélectionner au moins un module
                      </p>
                    )}
                  </div>
                )}

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
                      fontSize: '1rem',
                      color: 'black'
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
                      background: 'black',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '500'
                    }}
                  >
                    {editingUser ? 'Modifier' : 'Créer'}
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

export default Utilisateurs
