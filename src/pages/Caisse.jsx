import React, { useState, useMemo } from 'react'
import Layout from '../components/Layout'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { DollarSign, Plus, Edit, Trash2, X, TrendingUp, TrendingDown, Wallet, Receipt, AlertCircle, Building2, CreditCard, Filter, Search, Download, Calendar, Clock } from 'lucide-react'
import { exportRecuCaissePDF } from '../utils/exportUtils'

const Caisse = () => {
  const { operations, setOperations, factures, setFactures, clients } = useData()
  const { isAdmin } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [editingOperation, setEditingOperation] = useState(null)
  const [filterMode, setFilterMode] = useState('all') // all, caisse, banque
  const [filterType, setFilterType] = useState('all') // all, entree, sortie
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState({ debut: '', fin: '' })
  const [formData, setFormData] = useState({
    mode: 'caisse', // caisse ou banque
    type: 'entree',
    montant: '',
    description: '',
    factureId: '',
    date: new Date().toISOString().split('T')[0]
  })

  // Fonction pour obtenir le nom du client
  const getClientName = (clientId) => {
    if (!clientId) return 'Client inconnu'
    const client = clients.find(c => {
      return String(c.id) === String(clientId) || c.id === clientId
    })
    return client?.nom || 'Client inconnu'
  }

  // Liste des factures impayées
  const facturesImpayees = useMemo(() => {
    return factures.filter(facture => {
      const montantPaye = facture.montantPaye || 0
      const montantRestant = (facture.montantTTC || 0) - montantPaye
      return facture.statut === 'non_payee' || (facture.statut === 'partiellement_payee' && montantRestant > 0)
    })
  }, [factures])

  // Sélectionner une facture impayée
  const handleSelectFacture = (facture) => {
    const montantPaye = facture.montantPaye || 0
    const montantRestant = (facture.montantTTC || 0) - montantPaye
    
    setFormData({
      type: 'entree',
      montant: montantRestant.toFixed(2),
      description: `Paiement facture ${facture.numero || 'N/A'}`,
      factureId: facture.id,
      date: new Date().toISOString().split('T')[0]
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (editingOperation) {
      if (!isAdmin) {
        alert('Seul l\'administrateur peut modifier les opérations')
        return
      }
      setOperations(operations.map(op =>
        op.id === editingOperation.id
          ? { ...op, ...formData, montant: parseFloat(formData.montant) }
          : op
      ))
    } else {
      const newOperation = {
        id: Date.now(),
        ...formData,
        montant: parseFloat(formData.montant),
        dateCreation: new Date().toISOString()
      }
      setOperations([...operations, newOperation])

      // Si c'est un paiement de facture, mettre à jour la facture
      if (formData.factureId && formData.type === 'entree') {
        const facture = factures.find(f => {
          return String(f.id) === String(formData.factureId) || f.id === formData.factureId
        })
        if (facture) {
          const montant = parseFloat(formData.montant)
          const montantTotal = Number(facture.montantTTC) || 0
          const montantPayeActuel = Number(facture.montantPaye) || 0
          const nouveauMontantPaye = montantPayeActuel + montant
          
          // S'assurer que le montant payé ne dépasse pas le montant total
          const montantPayeFinal = Math.min(nouveauMontantPaye, montantTotal)
          
          // Déterminer le statut avec une tolérance pour les problèmes de précision
          const nouveauStatut = montantPayeFinal === 0
            ? 'non_payee'
            : montantPayeFinal >= montantTotal - 0.01 // Tolérance de 0.01 FCFA
              ? 'payee' // Intégralement payé
              : 'partiellement_payee'

          setFactures(factures.map(f =>
            (String(f.id) === String(formData.factureId) || f.id === formData.factureId)
              ? {
                  ...f,
                  montantPaye: montantPayeFinal,
                  statut: nouveauStatut
                }
              : f
          ))
        }
      }
    }
    
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      mode: 'caisse',
      type: 'entree',
      montant: '',
      description: '',
      factureId: '',
      date: new Date().toISOString().split('T')[0]
    })
    setEditingOperation(null)
    setShowModal(false)
  }

  const handleEdit = (operation) => {
    if (!isAdmin) {
      alert('Seul l\'administrateur peut modifier les opérations')
      return
    }
    setEditingOperation(operation)
    setFormData({
      mode: operation.mode || 'caisse',
      type: operation.type || 'entree',
      montant: operation.montant || '',
      description: operation.description || '',
      factureId: operation.factureId || '',
      date: operation.date || new Date().toISOString().split('T')[0]
    })
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (!isAdmin) {
      alert('Seul l\'administrateur peut supprimer les opérations')
      return
    }
    if (window.confirm('Supprimer cette opération ?')) {
      setOperations(operations.filter(op => op.id !== id))
    }
  }

  const handleGenerateReceipt = async (operation) => {
    try {
      // Récupérer le client si l'opération est liée à une facture
      let client = null
      if (operation.factureId) {
        const facture = factures.find(f => {
          return String(f.id) === String(operation.factureId) || f.id === operation.factureId
        })
        if (facture && facture.clientId) {
          client = clients.find(c => {
            return String(c.id) === String(facture.clientId) || c.id === facture.clientId
          })
        }
      }
      
      await exportRecuCaissePDF(operation, client)
    } catch (error) {
      console.error('Erreur lors de la génération du reçu:', error)
      alert('Erreur lors de la génération du reçu')
    }
  }

  // Statistiques globales
  const soldeGlobal = useMemo(() => {
    return operations.reduce((acc, op) => {
      return op.type === 'entree' ? acc + op.montant : acc - op.montant
    }, 0)
  }, [operations])

  const totalEntreesGlobal = useMemo(() => {
    return operations.filter(op => op.type === 'entree').reduce((acc, op) => acc + op.montant, 0)
  }, [operations])

  const totalSortiesGlobal = useMemo(() => {
    return operations.filter(op => op.type === 'sortie').reduce((acc, op) => acc + op.montant, 0)
  }, [operations])

  // Statistiques Caisse
  const operationsCaisse = useMemo(() => {
    return operations.filter(op => op.mode === 'caisse')
  }, [operations])

  const soldeCaisse = useMemo(() => {
    return operationsCaisse.reduce((acc, op) => {
      return op.type === 'entree' ? acc + op.montant : acc - op.montant
    }, 0)
  }, [operationsCaisse])

  const totalEntreesCaisse = useMemo(() => {
    return operationsCaisse.filter(op => op.type === 'entree').reduce((acc, op) => acc + op.montant, 0)
  }, [operationsCaisse])

  const totalSortiesCaisse = useMemo(() => {
    return operationsCaisse.filter(op => op.type === 'sortie').reduce((acc, op) => acc + op.montant, 0)
  }, [operationsCaisse])

  // Statistiques Banque
  const operationsBanque = useMemo(() => {
    return operations.filter(op => op.mode === 'banque')
  }, [operations])

  const soldeBanque = useMemo(() => {
    return operationsBanque.reduce((acc, op) => {
      return op.type === 'entree' ? acc + op.montant : acc - op.montant
    }, 0)
  }, [operationsBanque])

  const totalEntreesBanque = useMemo(() => {
    return operationsBanque.filter(op => op.type === 'entree').reduce((acc, op) => acc + op.montant, 0)
  }, [operationsBanque])

  const totalSortiesBanque = useMemo(() => {
    return operationsBanque.filter(op => op.type === 'sortie').reduce((acc, op) => acc + op.montant, 0)
  }, [operationsBanque])

  // Calcul du reste à payer (factures impayées et partiellement payées)
  const resteAPayer = useMemo(() => {
    return factures.reduce((acc, facture) => {
      // Ne compter que les factures non payées ou partiellement payées
      if (facture.statut === 'non_payee' || facture.statut === 'partiellement_payee') {
        const montantPaye = facture.montantPaye || 0
        const montantRestant = (facture.montantTTC || 0) - montantPaye
        return acc + montantRestant
      }
      return acc
    }, 0)
  }, [factures])

  // Filtrage des opérations
  const filteredOperations = useMemo(() => {
    return operations.filter(op => {
      // Filtre par mode (caisse/banque)
      if (filterMode !== 'all' && op.mode !== filterMode) return false
      
      // Filtre par type (entree/sortie)
      if (filterType !== 'all' && op.type !== filterType) return false
      
      // Filtre par recherche
      if (searchTerm && !op.description?.toLowerCase().includes(searchTerm.toLowerCase())) return false
      
      // Filtre par date
      if (dateFilter.debut && op.date) {
        const opDate = new Date(op.date)
        const debutDate = new Date(dateFilter.debut)
        if (opDate < debutDate) return false
      }
      if (dateFilter.fin && op.date) {
        const opDate = new Date(op.date)
        const finDate = new Date(dateFilter.fin)
        finDate.setHours(23, 59, 59, 999)
        if (opDate > finDate) return false
      }
      
      return true
    })
  }, [operations, filterMode, filterType, searchTerm, dateFilter])

  return (
    <Layout>
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Gestion de la Caisse</h1>
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
            Nouvelle opération
          </button>
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
                <p style={{ opacity: 0.9, fontSize: '0.875rem', marginBottom: '0.5rem' }}>Solde actuel</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                  {soldeGlobal.toLocaleString()} F
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
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total entrées</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                  {totalEntreesGlobal.toLocaleString()} F
                </p>
              </div>
              <TrendingUp size={32} color="#10b981" />
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
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total sorties</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>
                  {totalSortiesGlobal.toLocaleString()} F
                </p>
              </div>
              <TrendingDown size={32} color="#ef4444" />
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #fef3c7',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #f59e0b'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Reste à payer</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                  {resteAPayer.toLocaleString()} F
                </p>
                <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  Factures impayées
                </p>
              </div>
              <AlertCircle size={32} color="#f59e0b" />
            </div>
          </div>
        </div>

        {/* Liste des opérations */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}>
          {operations.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <p>Aucune opération enregistrée</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Date</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Mode</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Type</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Description</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#475569' }}>Montant</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#475569' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...operations].reverse().map((operation) => {
                    const mode = operation.mode || 'caisse'
                    return (
                    <tr key={operation.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem', color: '#64748b' }}>
                        {operation.date ? new Date(operation.date).toLocaleDateString('fr-FR') : '-'}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '6px',
                          background: mode === 'caisse' ? '#fef3c7' : '#dbeafe',
                          color: mode === 'caisse' ? '#92400e' : '#1e40af',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}>
                          {mode === 'caisse' ? 'Caisse' : 'Banque'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '6px',
                          background: operation.type === 'entree' ? '#d1fae5' : '#fee2e2',
                          color: operation.type === 'entree' ? '#065f46' : '#991b1b',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          textTransform: 'capitalize'
                        }}>
                          {operation.type === 'entree' ? 'Entrée' : 'Sortie'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: '#64748b' }}>{operation.description || '-'}</td>
                      <td style={{
                        padding: '1rem',
                        textAlign: 'right',
                        fontWeight: '500',
                        color: operation.type === 'entree' ? '#10b981' : '#ef4444'
                      }}>
                        {operation.type === 'entree' ? '+' : '-'}{operation.montant.toLocaleString()} F
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleGenerateReceipt(operation)}
                            style={{
                              padding: '0.5rem',
                              background: '#ecfdf5',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              color: '#10b981',
                              title: 'Générer le reçu de paiement'
                            }}
                          >
                            <Receipt size={18} />
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleEdit(operation)}
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
                                onClick={() => handleDelete(operation.id)}
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
                            </>
                          )}
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
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {editingOperation ? 'Modifier l\'opération' : 'Nouvelle opération'}
                </h2>
                <button onClick={resetForm} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
                  <X size={24} />
                </button>
              </div>

              {/* Liste déroulante des factures impayées */}
              {formData.type === 'entree' && facturesImpayees.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: '500' }}>
                    <AlertCircle size={18} color="#f59e0b" />
                    <span>Facture impayée ({facturesImpayees.length})</span>
                  </label>
                  <select
                    value={formData.factureId || ''}
                    onChange={(e) => {
                      const factureId = e.target.value
                      if (factureId) {
                        const facture = facturesImpayees.find(f => {
                          return String(f.id) === String(factureId) || f.id === factureId
                        })
                        if (facture) {
                          handleSelectFacture(facture)
                        }
                      } else {
                        setFormData({ ...formData, factureId: '', montant: '', description: '' })
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      background: 'white',
                      color: 'black'
                    }}
                  >
                    <option value="">Sélectionner une facture impayée (optionnel)</option>
                    {facturesImpayees.map((facture) => {
                      const montantPaye = facture.montantPaye || 0
                      const montantRestant = (facture.montantTTC || 0) - montantPaye
                      const clientName = getClientName(facture.clientId)
                      
                      return (
                        <option key={facture.id} value={facture.id}>
                          {facture.numero || 'Sans numéro'} - {clientName} - Reste: {montantRestant.toLocaleString()} F
                        </option>
                      )
                    })}
                  </select>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Mode *
                  </label>
                  <select
                    required
                    value={formData.mode}
                    onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      background: 'white'
                    }}
                  >
                    <option value="caisse">Caisse</option>
                    <option value="banque">Banque</option>
                  </select>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Type *</label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => {
                      setFormData({ 
                        ...formData, 
                        type: e.target.value,
                        factureId: e.target.value === 'sortie' ? '' : formData.factureId
                      })
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="entree">Entrée</option>
                    <option value="sortie">Sortie</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
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
                    {editingOperation ? 'Modifier' : 'Ajouter'}
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

export default Caisse
