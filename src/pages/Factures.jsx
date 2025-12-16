import React, { useState, useMemo } from 'react'
import Layout from '../components/Layout'
import { useData } from '../context/DataContext'
import { Receipt, Plus, Edit, Trash2, X, Search, DollarSign, CheckCircle, AlertCircle, Download } from 'lucide-react'
import { exportFacturePDF } from '../utils/exportUtils'

const Factures = () => {
  const { factures, setFactures, clients, contrats, operations, setOperations } = useData()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatut, setFilterStatut] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [showPaiementModal, setShowPaiementModal] = useState(false)
  const [selectedFacture, setSelectedFacture] = useState(null)
  const [editingFacture, setEditingFacture] = useState(null)
  const [formData, setFormData] = useState({
    numero: '',
    clientId: '',
    contratId: '',
    dateEmission: new Date().toISOString().split('T')[0],
    dateEcheance: '',
    montantHT: '',
    tauxTVA: '3',
    montantTTC: '',
    statut: 'non_payee',
    montantPaye: 0
  })
  const [montantPaiement, setMontantPaiement] = useState('')

  const filteredFactures = useMemo(() => {
    return factures.filter(facture => {
      const client = clients.find(c => {
        // Comparaison flexible pour gérer les IDs en nombre ou string
        return String(c.id) === String(facture.clientId) || c.id === facture.clientId
      })
      const matchesSearch = 
        facture.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client?.nom?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesFilter = filterStatut === 'all' || facture.statut === filterStatut
      
      return matchesSearch && matchesFilter
    })
  }, [factures, clients, searchTerm, filterStatut])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const montantHT = parseFloat(formData.montantHT) || 0
    const tauxRSPS = parseFloat(formData.tauxTVA) || 3
    const montantRSPS = montantHT * (tauxRSPS / 100)
    const montantTTC = montantHT - montantRSPS // Net à Payer = HT - RSPS
    
    // Convertir clientId en nombre si nécessaire pour assurer la cohérence
    const clientId = formData.clientId ? (typeof formData.clientId === 'string' ? Number(formData.clientId) : formData.clientId) : formData.clientId
    const contratId = formData.contratId ? (typeof formData.contratId === 'string' ? Number(formData.contratId) : formData.contratId) : formData.contratId
    
    if (editingFacture) {
      setFactures(factures.map(facture =>
        facture.id === editingFacture.id
          ? { 
              ...facture, 
              ...formData,
              clientId,
              contratId,
              montantHT,
              montantTVA: montantRSPS, // Garder le nom pour compatibilité mais c'est maintenant RSPS
              montantTTC,
              montantPaye: facture.montantPaye || 0,
              statut: getStatutPaiement(facture.montantPaye || 0, montantTTC)
            }
          : facture
      ))
    } else {
      const newFacture = {
        id: Date.now(),
        ...formData,
        clientId,
        contratId,
        montantHT,
        montantTVA: montantRSPS, // Garder le nom pour compatibilité mais c'est maintenant RSPS
        montantTTC,
        montantPaye: 0,
        statut: 'non_payee',
        dateCreation: new Date().toISOString()
      }
      setFactures([...factures, newFacture])
    }
    
    resetForm()
  }

  const getStatutPaiement = (paye, total) => {
    // Convertir en nombres pour s'assurer de la comparaison correcte
    const montantPaye = Number(paye) || 0
    const montantTotal = Number(total) || 0
    
    // Si le montant total est 0 ou négatif, retourner non_payee
    if (montantTotal <= 0) return 'non_payee'
    
    // Si aucun montant n'a été payé
    if (montantPaye === 0) return 'non_payee'
    
    // Utiliser Math.abs pour éviter les problèmes de précision des nombres décimaux
    // Si le montant payé est supérieur ou égal au montant total (avec une petite tolérance)
    if (Math.abs(montantPaye - montantTotal) < 0.01 || montantPaye >= montantTotal) {
      return 'payee'
    }
    
    // Sinon, c'est un paiement partiel
    return 'partiellement_payee'
  }

  const handlePaiement = () => {
    if (!selectedFacture || !montantPaiement || parseFloat(montantPaiement) <= 0) {
      alert('Veuillez entrer un montant valide')
      return
    }

    const montant = parseFloat(montantPaiement)
    const montantTotal = Number(selectedFacture.montantTTC) || 0
    const montantPayeActuel = Number(selectedFacture.montantPaye) || 0
    const nouveauMontantPaye = montantPayeActuel + montant
    
    // S'assurer que le montant payé ne dépasse pas le montant total
    const montantPayeFinal = Math.min(nouveauMontantPaye, montantTotal)
    
    // Calculer le nouveau statut en fonction du montant payé
    const nouveauStatut = getStatutPaiement(montantPayeFinal, montantTotal)
    
    // Afficher un message si le paiement devient intégral
    const ancienStatut = selectedFacture.statut
    if (nouveauStatut === 'payee' && ancienStatut !== 'payee') {
      alert('Facture intégralement payée ! Le statut a été mis à jour à "Payée".')
    }

    // Mettre à jour la facture avec le nouveau montant payé et le nouveau statut
    setFactures(factures.map(facture =>
      facture.id === selectedFacture.id
        ? {
            ...facture,
            montantPaye: montantPayeFinal,
            statut: nouveauStatut // Le statut est automatiquement mis à jour
          }
        : facture
    ))

    // Ajouter une opération de caisse
    const nouvelleOperation = {
      id: Date.now(),
      type: 'entree',
      montant: montant,
      description: `Paiement facture ${selectedFacture.numero}`,
      factureId: selectedFacture.id,
      date: new Date().toISOString().split('T')[0],
      dateCreation: new Date().toISOString()
    }
    setOperations([...operations, nouvelleOperation])

    setMontantPaiement('')
    setShowPaiementModal(false)
    setSelectedFacture(null)
  }

  const resetForm = () => {
    setFormData({
      numero: generateInvoiceNumber(), // Générer automatiquement le numéro
      clientId: '',
      contratId: '',
      dateEmission: new Date().toISOString().split('T')[0],
      dateEcheance: '',
      montantHT: '',
      tauxTVA: '3',
      montantTTC: '',
      statut: 'non_payee',
      montantPaye: 0
    })
    setEditingFacture(null)
    setShowModal(false)
  }

  const handleEdit = (facture) => {
    setEditingFacture(facture)
    setFormData({
      numero: facture.numero || '',
      clientId: facture.clientId || '',
      contratId: facture.contratId || '',
      dateEmission: facture.dateEmission ? facture.dateEmission.split('T')[0] : new Date().toISOString().split('T')[0],
      dateEcheance: facture.dateEcheance ? facture.dateEcheance.split('T')[0] : '',
      montantHT: facture.montantHT || '',
      tauxTVA: facture.tauxTVA || '18',
      montantTTC: facture.montantTTC || '',
      statut: facture.statut || 'non_payee',
      montantPaye: facture.montantPaye || 0
    })
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      setFactures(factures.filter(facture => facture.id !== id))
    }
  }

  const getClientName = (clientId) => {
    if (!clientId) return 'Client inconnu'
    // Gérer les cas où l'ID peut être un nombre ou une string
    const client = clients.find(c => {
      // Comparaison flexible : convertir les deux en string pour la comparaison
      return String(c.id) === String(clientId) || c.id === clientId
    })
    return client?.nom || 'Client inconnu'
  }

  const getStatutBadge = (statut) => {
    const statuts = {
      payee: { label: 'Payée', color: '#10b981', bg: '#d1fae5' },
      partiellement_payee: { label: 'Partiellement payée', color: '#f59e0b', bg: '#fef3c7' },
      non_payee: { label: 'Non payée', color: '#ef4444', bg: '#fee2e2' }
    }
    return statuts[statut] || statuts.non_payee
  }

  // Génération automatique du numéro de facture
  const generateInvoiceNumber = () => {
    const year = new Date().getFullYear()
    
    // Trouver le dernier numéro de facture pour cette année
    const facturesAnnee = factures.filter(f => {
      if (!f.numero) return false
      // Extraire l'année du numéro si format FAC-YYYY-XXXX
      const match = f.numero.match(/FAC-(\d{4})-/)
      return match && parseInt(match[1]) === year
    })
    
    if (facturesAnnee.length === 0) {
      // Première facture de l'année
      return `FAC-${year}-0001`
    }
    
    // Extraire le numéro séquentiel le plus élevé
    let maxNum = 0
    facturesAnnee.forEach(f => {
      const match = f.numero.match(/FAC-\d{4}-(\d+)/)
      if (match) {
        const num = parseInt(match[1])
        if (num > maxNum) maxNum = num
      }
    })
    
    // Incrémenter et formater avec 4 chiffres
    const nextNum = (maxNum + 1).toString().padStart(4, '0')
    return `FAC-${year}-${nextNum}`
  }

  return (
    <Layout>
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Gestion des Factures</h1>
          <button
            onClick={() => {
              // Générer le numéro automatiquement lors de l'ouverture du modal
              setFormData({
                ...formData,
                numero: generateInvoiceNumber(),
                dateEmission: new Date().toISOString().split('T')[0]
              })
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
            Nouvelle facture
          </button>
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Rechercher une facture..."
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
              onClick={() => setFilterStatut('non_payee')}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                background: filterStatut === 'non_payee' ? '#ef4444' : 'white',
                color: filterStatut === 'non_payee' ? 'white' : '#1e293b',
                cursor: 'pointer',
                fontWeight: filterStatut === 'non_payee' ? '600' : '400'
              }}
            >
              Non payées
            </button>
            <button
              onClick={() => setFilterStatut('partiellement_payee')}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                background: filterStatut === 'partiellement_payee' ? '#f59e0b' : 'white',
                color: filterStatut === 'partiellement_payee' ? 'white' : '#1e293b',
                cursor: 'pointer',
                fontWeight: filterStatut === 'partiellement_payee' ? '600' : '400'
              }}
            >
              Partiellement payées
            </button>
            <button
              onClick={() => setFilterStatut('payee')}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                background: filterStatut === 'payee' ? '#10b981' : 'white',
                color: filterStatut === 'payee' ? 'white' : '#1e293b',
                cursor: 'pointer',
                fontWeight: filterStatut === 'payee' ? '600' : '400'
              }}
            >
              Payées
            </button>
          </div>
        </div>

        {/* Liste des factures */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}>
          {filteredFactures.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <p>Aucune facture trouvée</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Numéro</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Client</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Date émission</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Montant TTC</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Payé / Restant</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Statut</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#475569' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFactures.map((facture) => {
                    const statutBadge = getStatutBadge(facture.statut)
                    const montantPaye = facture.montantPaye || 0
                    const montantRestant = (facture.montantTTC || 0) - montantPaye
                    
                    return (
                      <tr key={facture.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem', fontWeight: '500' }}>{facture.numero || '-'}</td>
                        <td style={{ padding: '1rem' }}>{getClientName(facture.clientId)}</td>
                        <td style={{ padding: '1rem', color: '#64748b' }}>
                          {facture.dateEmission ? new Date(facture.dateEmission).toLocaleDateString('fr-FR') : '-'}
                        </td>
                        <td style={{ padding: '1rem', color: '#64748b', fontWeight: '500' }}>
                          {facture.montantTTC ? `${Number(facture.montantTTC).toLocaleString()} F` : '-'}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            {montantPaye > 0 && (
                              <div style={{
                                fontSize: '0.75rem',
                                color: '#10b981',
                                fontWeight: 500
                              }}>
                                Payé: {montantPaye.toLocaleString()} F
                              </div>
                            )}
                            {montantRestant > 0 ? (
                              <div style={{
                                fontSize: '0.75rem',
                                color: '#ef4444',
                                fontWeight: 600
                              }}>
                                Reste: {montantRestant.toLocaleString()} F
                              </div>
                            ) : (
                              <div style={{
                                fontSize: '0.75rem',
                                color: '#10b981',
                                fontWeight: 600
                              }}>
                                Payé intégralement
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '6px',
                            background: statutBadge.bg,
                            color: statutBadge.color,
                            fontSize: '0.875rem',
                            fontWeight: '500'
                          }}>
                            {statutBadge.label}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button
                              onClick={async () => {
                                try {
                                  const client = clients.find(c => {
                                    return String(c.id) === String(facture.clientId) || c.id === facture.clientId
                                  })
                                  if (!client) {
                                    alert('Client introuvable pour cette facture')
                                    return
                                  }
                                  console.log('Génération du PDF pour la facture:', facture.numero)
                                  await exportFacturePDF(facture, client)
                                  console.log('PDF généré avec succès')
                                } catch (error) {
                                  console.error('Erreur lors de l\'export:', error)
                                  alert('Erreur lors de l\'export de la facture: ' + (error.message || 'Erreur inconnue'))
                                }
                              }}
                              style={{
                                padding: '0.5rem',
                                background: '#f0f9ff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                color: '#3b82f6'
                              }}
                              title="Exporter en PDF"
                            >
                              <Download size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedFacture(facture)
                                setShowPaiementModal(true)
                              }}
                              disabled={facture.statut === 'payee'}
                              style={{
                                padding: '0.5rem',
                                background: facture.statut === 'payee' ? '#f1f5f9' : '#f0fdf4',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: facture.statut === 'payee' ? 'not-allowed' : 'pointer',
                                color: facture.statut === 'payee' ? '#94a3b8' : '#10b981'
                              }}
                              title="Enregistrer un paiement"
                            >
                              <DollarSign size={18} />
                            </button>
                            <button
                              onClick={() => handleEdit(facture)}
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
                              onClick={() => handleDelete(facture.id)}
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

        {/* Modal de paiement */}
        {showPaiementModal && selectedFacture && (
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
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Enregistrer un paiement</h2>
                <button
                  onClick={() => {
                    setShowPaiementModal(false)
                    setSelectedFacture(null)
                    setMontantPaiement('')
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
                <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>Facture: <strong>{selectedFacture.numero}</strong></p>
                <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>Montant total: <strong>{Number(selectedFacture.montantTTC || 0).toLocaleString()} F</strong></p>
                <p style={{ color: '#64748b', marginBottom: '1rem' }}>
                  Payé: <strong style={{ color: '#10b981' }}>{Number(selectedFacture.montantPaye || 0).toLocaleString()} F</strong> | 
                  Reste: <strong style={{ color: '#ef4444' }}>{(Number(selectedFacture.montantTTC || 0) - Number(selectedFacture.montantPaye || 0)).toLocaleString()} F</strong>
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Montant du paiement (FCFA) *</label>
                <input
                  type="number"
                  required
                  value={montantPaiement}
                  onChange={(e) => setMontantPaiement(e.target.value)}
                  max={selectedFacture.montantTTC - (selectedFacture.montantPaye || 0)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                  placeholder={`Maximum: ${(selectedFacture.montantTTC - (selectedFacture.montantPaye || 0)).toLocaleString()} F`}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowPaiementModal(false)
                    setSelectedFacture(null)
                    setMontantPaiement('')
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
                  onClick={handlePaiement}
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
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {editingFacture ? 'Modifier la facture' : 'Nouvelle facture'}
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
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Numéro de facture *</label>
                    <input
                      type="text"
                      required
                      value={formData.numero}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      readOnly={!editingFacture} // Lecture seule pour les nouvelles factures
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        background: editingFacture ? 'white' : '#f8fafc',
                        color: editingFacture ? '#1e293b' : '#64748b'
                      }}
                    />
                    {!editingFacture && (
                      <small style={{ color: '#64748b', fontSize: '0.875rem' }}>
                        Numéro généré automatiquement
                      </small>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Client *</label>
                    <select
                      required
                      value={formData.clientId}
                      onChange={(e) => {
                        const selectedClientId = e.target.value
                        // Si un client est sélectionné, chercher un contrat actif pour ce client
                        if (selectedClientId) {
                          const contratActif = contrats.find(c => {
                            return (String(c.clientId) === String(selectedClientId) || c.clientId === selectedClientId) && 
                                   c.statut === 'actif'
                          })
                          
                          if (contratActif) {
                            // Remplir automatiquement le contrat et le montant
                            const ht = contratActif.montant || 0
                            const tauxRSPS = parseFloat(formData.tauxTVA) || 3
                            const rsps = ht * (tauxRSPS / 100)
                            const netAPayer = ht - rsps
                            setFormData({ 
                              ...formData, 
                              clientId: selectedClientId,
                              contratId: contratActif.id,
                              montantHT: ht.toString(),
                              montantTTC: netAPayer.toFixed(2)
                            })
                          } else {
                            setFormData({ ...formData, clientId: selectedClientId, contratId: '', montantHT: '', montantTTC: '' })
                          }
                        } else {
                          setFormData({ ...formData, clientId: '', contratId: '', montantHT: '', montantTTC: '' })
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
                      <option value="">Sélectionner un client</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>{client.nom}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Contrat (optionnel)</label>
                  <select
                    value={formData.contratId}
                    onChange={(e) => {
                      const selectedContratId = e.target.value
                      if (selectedContratId) {
                        const contrat = contrats.find(c => {
                          return String(c.id) === String(selectedContratId) || c.id === selectedContratId
                        })
                        if (contrat && contrat.montant) {
                          // Remplir automatiquement le montant HT avec le montant du contrat
                          const ht = contrat.montant
                          const tauxRSPS = parseFloat(formData.tauxTVA) || 3
                          const rsps = ht * (tauxRSPS / 100)
                          const netAPayer = ht - rsps
                          setFormData({ 
                            ...formData, 
                            contratId: selectedContratId,
                            montantHT: ht.toString(),
                            montantTTC: netAPayer.toFixed(2)
                          })
                        } else {
                          setFormData({ ...formData, contratId: selectedContratId })
                        }
                      } else {
                        setFormData({ ...formData, contratId: '', montantHT: '', montantTTC: '' })
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
                    <option value="">Sélectionner un contrat (optionnel)</option>
                    {contrats
                      .filter(contrat => !formData.clientId || contrat.clientId == formData.clientId)
                      .map(contrat => (
                        <option key={contrat.id} value={contrat.id}>
                          {contrat.numero || 'Sans numéro'} - {contrat.montant ? `${contrat.montant.toLocaleString()} F` : 'Montant non défini'}
                        </option>
                      ))}
                  </select>
                  <small style={{ color: '#64748b', fontSize: '0.875rem' }}>
                    Le montant HT sera automatiquement rempli si un contrat est sélectionné
                  </small>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Date d'émission *</label>
                    <input
                      type="date"
                      required
                      value={formData.dateEmission}
                      onChange={(e) => setFormData({ ...formData, dateEmission: e.target.value })}
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
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Date d'échéance</label>
                    <input
                      type="date"
                      value={formData.dateEcheance}
                      onChange={(e) => setFormData({ ...formData, dateEcheance: e.target.value })}
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
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Montant HT (FCFA) *</label>
                    <input
                      type="number"
                      required
                      value={formData.montantHT}
                      onChange={(e) => {
                        const ht = parseFloat(e.target.value) || 0
                        const tauxRSPS = parseFloat(formData.tauxTVA) || 3
                        const rsps = ht * (tauxRSPS / 100)
                        const netAPayer = ht - rsps // Net à Payer = HT - RSPS
                        setFormData({ ...formData, montantHT: e.target.value, montantTTC: netAPayer.toFixed(2) })
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
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Taux RSPS (%)</label>
                    <input
                      type="number"
                      value={formData.tauxTVA}
                      onChange={(e) => {
                        const taux = parseFloat(e.target.value) || 0
                        const ht = parseFloat(formData.montantHT) || 0
                        const rsps = ht * (taux / 100)
                        const netAPayer = ht - rsps // Net à Payer = HT - RSPS
                        setFormData({ ...formData, tauxTVA: e.target.value, montantTTC: netAPayer.toFixed(2) })
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
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Net à Payer (FCFA)</label>
                  <input
                    type="number"
                    value={formData.montantTTC}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      background: '#f8fafc',
                      fontWeight: 'bold'
                    }}
                  />
                  <small style={{ color: '#64748b', fontSize: '0.875rem' }}>
                    Calcul: Montant HT - (Montant HT × Taux RSPS %)
                  </small>
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
                    {editingFacture ? 'Modifier' : 'Créer'}
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

export default Factures
