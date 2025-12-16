import React, { useState, useMemo } from 'react'
import Layout from '../components/Layout'
import { useData } from '../context/DataContext'
import { Plus, Search, Edit, Trash2, Shield, Wrench, Briefcase, X, FileText, Upload, XCircle } from 'lucide-react'

const Employes = () => {
  const { employees, setEmployees } = useData()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    type: 'securite',
    dateEmbauche: '',
    dateDebauche: '',
    salaire: '',
    adresse: '',
    contactUrgenceNom: '',
    contactUrgenceTelephone: '',
    contactUrgenceRelation: '',
    documents: [] // Tableau pour stocker les fichiers PDF
  })
  const [dragActive, setDragActive] = useState(false)

  const types = {
    securite: { label: 'Sécurité', icon: Shield, color: '#3b82f6' },
    entretien: { label: 'Entretien', icon: Wrench, color: '#10b981' },
    administratif: { label: 'Administratif', icon: Briefcase, color: '#f59e0b' }
  }

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = 
        `${emp.nom} ${emp.prenom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.telephone?.includes(searchTerm) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesFilter = filterType === 'all' || emp.type === filterType
      
      return matchesSearch && matchesFilter
    })
  }, [employees, searchTerm, filterType])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (editingEmployee) {
      setEmployees(employees.map(emp => 
        emp.id === editingEmployee.id 
          ? { ...emp, ...formData, salaire: parseFloat(formData.salaire) }
          : emp
      ))
    } else {
      const newEmployee = {
        id: Date.now(),
        ...formData,
        salaire: parseFloat(formData.salaire),
        dateCreation: new Date().toISOString()
      }
      setEmployees([...employees, newEmployee])
    }
    
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      nom: '',
      prenom: '',
      telephone: '',
      email: '',
      type: 'securite',
      dateEmbauche: '',
      dateDebauche: '',
      salaire: '',
      adresse: '',
      contactUrgenceNom: '',
      contactUrgenceTelephone: '',
      contactUrgenceRelation: '',
      documents: []
    })
    setEditingEmployee(null)
    setShowModal(false)
    setDragActive(false)
  }

  const handleEdit = (employee) => {
    setEditingEmployee(employee)
    setFormData({
      nom: employee.nom || '',
      prenom: employee.prenom || '',
      telephone: employee.telephone || '',
      email: employee.email || '',
      type: employee.type || 'securite',
      dateEmbauche: employee.dateEmbauche || '',
      dateDebauche: employee.dateDebauche || '',
      salaire: employee.salaire || '',
      adresse: employee.adresse || '',
      contactUrgenceNom: employee.contactUrgenceNom || '',
      contactUrgenceTelephone: employee.contactUrgenceTelephone || '',
      contactUrgenceRelation: employee.contactUrgenceRelation || '',
      documents: employee.documents || []
    })
    setShowModal(true)
  }

  // Convertir un fichier PDF en base64
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = error => reject(error)
    })
  }

  // Gérer l'ajout de fichiers PDF
  const handleFileUpload = async (files) => {
    const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf')
    
    if (pdfFiles.length === 0) {
      alert('Veuillez sélectionner uniquement des fichiers PDF')
      return
    }

    const newDocuments = []
    
    for (const file of pdfFiles) {
      try {
        // Limiter la taille à 5MB
        if (file.size > 5 * 1024 * 1024) {
          alert(`Le fichier "${file.name}" est trop volumineux (max 5MB)`)
          continue
        }

        const base64 = await convertFileToBase64(file)
        newDocuments.push({
          id: Date.now() + Math.random(),
          nom: file.name,
          taille: file.size,
          type: file.type,
          dateUpload: new Date().toISOString(),
          contenu: base64 // Stocker le contenu en base64
        })
      } catch (error) {
        console.error('Erreur lors de la conversion du fichier:', error)
        alert(`Erreur lors de l'upload de "${file.name}"`)
      }
    }

    setFormData({
      ...formData,
      documents: [...(formData.documents || []), ...newDocuments]
    })
  }

  // Gérer le drop de fichiers
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  // Gérer le drag over
  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  // Gérer le drag leave
  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  // Supprimer un document
  const handleRemoveDocument = (documentId) => {
    setFormData({
      ...formData,
      documents: formData.documents.filter(doc => doc.id !== documentId)
    })
  }

  // Télécharger/voir un document
  const handleViewDocument = (doc) => {
    const link = document.createElement('a')
    link.href = doc.contenu
    link.download = doc.nom
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Formater la taille du fichier
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
      setEmployees(employees.filter(emp => emp.id !== id))
    }
  }

  const getTypeInfo = (type) => {
    if (types[type]) {
      return { ...types[type], label: types[type].label }
    }
    // Pour les types personnalisés, retourner le type saisi avec des valeurs par défaut
    return {
      label: type || 'Non défini',
      icon: Briefcase,
      color: '#64748b'
    }
  }

  return (
    <Layout>
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Gestion des Employés</h1>
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
            Ajouter un employé
          </button>
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
              placeholder="Rechercher un employé..."
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
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setFilterType('all')}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                background: filterType === 'all' ? '#6366f1' : 'white',
                color: filterType === 'all' ? 'white' : '#1e293b',
                cursor: 'pointer',
                fontWeight: filterType === 'all' ? '600' : '400'
              }}
            >
              Tous
            </button>
            {Object.entries(types).map(([key, type]) => {
              const Icon = type.icon
              return (
                <button
                  key={key}
                  onClick={() => setFilterType(key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    background: filterType === key ? type.color : 'white',
                    color: filterType === key ? 'white' : '#1e293b',
                    cursor: 'pointer',
                    fontWeight: filterType === key ? '600' : '400'
                  }}
                >
                  <Icon size={18} />
                  {type.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Liste des employés */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}>
          {filteredEmployees.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <p>Aucun employé trouvé</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Nom complet</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Type</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Téléphone</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Email</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Salaire</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Date embauche</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Date débauche</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Contact urgence</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#475569' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => {
                    const typeInfo = getTypeInfo(employee.type)
                    const Icon = typeInfo.icon
                    return (
                      <tr key={employee.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: '500' }}>
                            {employee.prenom} {employee.nom}
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            background: `${typeInfo.color}15`,
                            color: typeInfo.color,
                            fontSize: '0.875rem',
                            fontWeight: '500'
                          }}>
                            <Icon size={16} />
                            {typeInfo.label}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', color: '#64748b' }}>{employee.telephone || '-'}</td>
                        <td style={{ padding: '1rem', color: '#64748b' }}>{employee.email || '-'}</td>
                        <td style={{ padding: '1rem', color: '#64748b' }}>
                          {employee.salaire ? `${employee.salaire.toLocaleString()} F` : '-'}
                        </td>
                        <td style={{ padding: '1rem', color: '#64748b' }}>
                          {employee.dateEmbauche ? new Date(employee.dateEmbauche).toLocaleDateString('fr-FR') : '-'}
                        </td>
                        <td style={{ padding: '1rem', color: employee.dateDebauche ? '#ef4444' : '#64748b', fontWeight: employee.dateDebauche ? '500' : 'normal' }}>
                          {employee.dateDebauche ? new Date(employee.dateDebauche).toLocaleDateString('fr-FR') : '-'}
                        </td>
                        <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.875rem' }}>
                          {employee.contactUrgenceNom || employee.contactUrgenceTelephone ? (
                            <div>
                              {employee.contactUrgenceNom && (
                                <div style={{ fontWeight: '500', marginBottom: '0.25rem', color: '#1e293b' }}>{employee.contactUrgenceNom}</div>
                              )}
                              {employee.contactUrgenceTelephone && (
                                <div style={{ marginBottom: '0.25rem' }}>
                                  <a 
                                    href={`tel:${employee.contactUrgenceTelephone.replace(/\s/g, '')}`}
                                    style={{ 
                                      fontSize: '0.875rem', 
                                      color: '#3b82f6', 
                                      fontWeight: '600', 
                                      textDecoration: 'none',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.25rem'
                                    }}
                                    onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                                    onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                                  >
                                    📞 {employee.contactUrgenceTelephone}
                                  </a>
                                </div>
                              )}
                              {employee.contactUrgenceRelation && (
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                  {employee.contactUrgenceRelation === 'parent' ? 'Parent' :
                                   employee.contactUrgenceRelation === 'conjoint' ? 'Conjoint(e)' :
                                   employee.contactUrgenceRelation === 'enfant' ? 'Enfant' :
                                   employee.contactUrgenceRelation === 'frere_soeur' ? 'Frère/Sœur' :
                                   employee.contactUrgenceRelation === 'ami' ? 'Ami(e)' :
                                   employee.contactUrgenceRelation === 'autre' ? 'Autre' :
                                   employee.contactUrgenceRelation}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>-</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                            {employee.documents && employee.documents.length > 0 && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  padding: '0.25rem 0.5rem',
                                  background: '#fef2f2',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  color: '#ef4444',
                                  fontWeight: '500'
                                }}
                                title={`${employee.documents.length} document(s) PDF`}
                              >
                                <FileText size={14} />
                                {employee.documents.length}
                              </span>
                            )}
                            <button
                              onClick={() => handleEdit(employee)}
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
                              onClick={() => handleDelete(employee.id)}
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
                  {editingEmployee ? 'Modifier l\'employé' : 'Ajouter un employé'}
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
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Nom *</label>
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
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Prénom *</label>
                    <input
                      type="text"
                      required
                      value={formData.prenom}
                      onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
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
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Type d'employé *</label>
                  <input
                    type="text"
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    placeholder="Ex: Sécurité, Entretien, Administratif..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Date d'embauche</label>
                    <input
                      type="date"
                      value={formData.dateEmbauche}
                      onChange={(e) => setFormData({ ...formData, dateEmbauche: e.target.value })}
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
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Date de débauche</label>
                    <input
                      type="date"
                      value={formData.dateDebauche}
                      onChange={(e) => setFormData({ ...formData, dateDebauche: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                    />
                    <small style={{ color: '#64748b', fontSize: '0.875rem' }}>
                      Optionnel - Date de fin de contrat
                    </small>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Salaire (FCFA)</label>
                  <input
                    type="number"
                    value={formData.salaire}
                    onChange={(e) => setFormData({ ...formData, salaire: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
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

                {/* Contact d'urgence */}
                <div style={{ 
                  marginBottom: '1.5rem', 
                  padding: '1rem', 
                  background: '#f8fafc', 
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <h3 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    marginBottom: '1rem',
                    color: '#1e293b'
                  }}>
                    Contact d'urgence
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Nom complet</label>
                      <input
                        type="text"
                        value={formData.contactUrgenceNom}
                        onChange={(e) => setFormData({ ...formData, contactUrgenceNom: e.target.value })}
                        placeholder="Nom de la personne"
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
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                        Numéro de téléphone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.contactUrgenceTelephone}
                        onChange={(e) => setFormData({ ...formData, contactUrgenceTelephone: e.target.value })}
                        placeholder="Ex: +228 90 12 34 56 ou 90 12 34 56"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '1rem'
                        }}
                      />
                      <small style={{ color: '#64748b', fontSize: '0.875rem', display: 'block', marginTop: '0.25rem' }}>
                        ⚠️ Numéro de la personne à contacter en cas d'urgence (obligatoire)
                      </small>
                    </div>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Relation</label>
                    <select
                      value={formData.contactUrgenceRelation}
                      onChange={(e) => setFormData({ ...formData, contactUrgenceRelation: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        background: 'white'
                      }}
                    >
                      <option value="">Sélectionner la relation</option>
                      <option value="parent">Parent</option>
                      <option value="conjoint">Conjoint(e)</option>
                      <option value="enfant">Enfant</option>
                      <option value="frere_soeur">Frère/Sœur</option>
                      <option value="ami">Ami(e)</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                </div>

                {/* Documents PDF */}
                <div style={{ 
                  marginBottom: '1.5rem', 
                  padding: '1rem', 
                  background: '#f0f9ff', 
                  borderRadius: '8px',
                  border: '1px solid #bae6fd'
                }}>
                  <h3 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    marginBottom: '1rem',
                    color: '#1e293b'
                  }}>
                    📄 Dossiers PDF de l'employé
                  </h3>
                  
                  {/* Zone de drop/upload */}
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    style={{
                      border: `2px dashed ${dragActive ? '#3b82f6' : '#cbd5e1'}`,
                      borderRadius: '8px',
                      padding: '2rem',
                      textAlign: 'center',
                      background: dragActive ? '#eff6ff' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      marginBottom: '1rem'
                    }}
                    onClick={() => document.getElementById('pdf-upload').click()}
                  >
                    <Upload size={32} color={dragActive ? '#3b82f6' : '#64748b'} style={{ marginBottom: '0.5rem' }} />
                    <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                      Glissez-déposez vos fichiers PDF ici ou cliquez pour sélectionner
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                      Format accepté: PDF uniquement (max 5MB par fichier)
                    </p>
                    <input
                      id="pdf-upload"
                      type="file"
                      accept="application/pdf"
                      multiple
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleFileUpload(e.target.files)
                        }
                        e.target.value = '' // Reset pour permettre de sélectionner le même fichier
                      }}
                    />
                  </div>

                  {/* Liste des documents uploadés */}
                  {formData.documents && formData.documents.length > 0 && (
                    <div style={{ marginTop: '1rem' }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#475569' }}>
                        Documents ({formData.documents.length})
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {formData.documents.map((doc) => (
                          <div
                            key={doc.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.75rem',
                              background: 'white',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                              <FileText size={20} color="#ef4444" />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '500', fontSize: '0.875rem', color: '#1e293b' }}>
                                  {doc.nom}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                  {formatFileSize(doc.taille)} • {new Date(doc.dateUpload).toLocaleDateString('fr-FR')}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                type="button"
                                onClick={() => handleViewDocument(doc)}
                                style={{
                                  padding: '0.5rem',
                                  background: '#f0f9ff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  color: '#3b82f6'
                                }}
                                title="Voir/Télécharger"
                              >
                                <FileText size={18} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveDocument(doc.id)}
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
                                <XCircle size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                    {editingEmployee ? 'Modifier' : 'Ajouter'}
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

export default Employes
