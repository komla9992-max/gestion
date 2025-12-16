import React, { useState, useMemo } from 'react'
import Layout from '../components/Layout'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import {
  Wallet, CreditCard, TrendingUp, TrendingDown, DollarSign,
  ArrowUpRight, ArrowDownRight, Filter, Search, Calendar,
  Download, RefreshCw, PieChart, BarChart3, Activity,
  AlertCircle, CheckCircle2, XCircle, FileText
} from 'lucide-react'

const CentralisationCaisse = () => {
  const { operations } = useData()
  const [activeTab, setActiveTab] = useState('global') // global, caisse, banque
  const [filterDate, setFilterDate] = useState({
    debut: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    fin: new Date().toISOString().split('T')[0]
  })
  const [filterType, setFilterType] = useState('all') // all, entree, sortie
  const [searchTerm, setSearchTerm] = useState('')

  // Séparer les opérations par mode
  const operationsCaisse = useMemo(() => {
    return operations.filter(op => op.mode === 'caisse')
  }, [operations])

  const operationsBanque = useMemo(() => {
    return operations.filter(op => op.mode === 'banque')
  }, [operations])

  // Filtrer par date et type
  const filterOperations = (ops) => {
    return ops.filter(op => {
      // Filtre par date
      if (filterDate.debut && op.date) {
        const opDate = new Date(op.date)
        const debutDate = new Date(filterDate.debut)
        if (opDate < debutDate) return false
      }
      if (filterDate.fin && op.date) {
        const opDate = new Date(op.date)
        const finDate = new Date(filterDate.fin)
        finDate.setHours(23, 59, 59, 999)
        if (opDate > finDate) return false
      }

      // Filtre par type
      if (filterType !== 'all' && op.type !== filterType) return false

      // Filtre par recherche
      if (searchTerm && !op.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }

      return true
    })
  }

  // Calculer les statistiques globales
  const statsGlobales = useMemo(() => {
    const ops = filterOperations(operations)
    const entrees = ops.filter(op => op.type === 'entree').reduce((sum, op) => sum + (op.montant || 0), 0)
    const sorties = ops.filter(op => op.type === 'sortie').reduce((sum, op) => sum + (op.montant || 0), 0)
    const solde = entrees - sorties

    return {
      solde,
      entrees,
      sorties,
      totalOperations: ops.length
    }
  }, [operations, filterDate, filterType, searchTerm])

  // Calculer les statistiques Caisse
  const statsCaisse = useMemo(() => {
    const ops = filterOperations(operationsCaisse)
    const entrees = ops.filter(op => op.type === 'entree').reduce((sum, op) => sum + (op.montant || 0), 0)
    const sorties = ops.filter(op => op.type === 'sortie').reduce((sum, op) => sum + (op.montant || 0), 0)
    const solde = entrees - sorties

    return {
      solde,
      entrees,
      sorties,
      totalOperations: ops.length
    }
  }, [operationsCaisse, filterDate, filterType, searchTerm])

  // Calculer les statistiques Banque
  const statsBanque = useMemo(() => {
    const ops = filterOperations(operationsBanque)
    const entrees = ops.filter(op => op.type === 'entree').reduce((sum, op) => sum + (op.montant || 0), 0)
    const sorties = ops.filter(op => op.type === 'sortie').reduce((sum, op) => sum + (op.montant || 0), 0)
    const solde = entrees - sorties

    return {
      solde,
      entrees,
      sorties,
      totalOperations: ops.length
    }
  }, [operationsBanque, filterDate, filterType, searchTerm])

  // Opérations filtrées selon l'onglet actif
  const operationsFiltrees = useMemo(() => {
    let ops = []
    if (activeTab === 'caisse') {
      ops = filterOperations(operationsCaisse)
    } else if (activeTab === 'banque') {
      ops = filterOperations(operationsBanque)
    } else {
      ops = filterOperations(operations)
    }
    return ops.sort((a, b) => {
      const dateA = new Date(a.date || a.dateCreation || 0)
      const dateB = new Date(b.date || b.dateCreation || 0)
      return dateB - dateA
    })
  }, [activeTab, operations, operationsCaisse, operationsBanque, filterDate, filterType, searchTerm])

  // Calculer les opérations avec solde cumulé (en ordre chronologique inverse)
  const operationsAvecSolde = useMemo(() => {
    // Trier par date croissante pour calculer le solde depuis le début
    const opsTriees = [...operationsFiltrees].sort((a, b) => {
      const dateA = new Date(a.date || a.dateCreation || 0)
      const dateB = new Date(b.date || b.dateCreation || 0)
      return dateA - dateB
    })
    
    let soldeCumule = 0
    const opsAvecSolde = opsTriees.map(op => {
      if (op.type === 'entree') {
        soldeCumule += op.montant || 0
      } else {
        soldeCumule -= op.montant || 0
      }
      return {
        ...op,
        soldeCumule
      }
    })
    
    // Reverser pour afficher du plus récent au plus ancien
    return opsAvecSolde.reverse()
  }, [operationsFiltrees])

  // Obtenir les stats actuelles selon l'onglet
  const statsActuelles = activeTab === 'caisse' ? statsCaisse : activeTab === 'banque' ? statsBanque : statsGlobales

  return (
    <Layout>
      <div style={{ padding: '2rem', background: '#f8fafc', minHeight: '100vh' }}>
        {/* En-tête */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>
              Centralisation Caisse & Banque
            </h1>
          </div>
          <p style={{ color: '#64748b', margin: 0 }}>
            Vue d'ensemble consolidée des opérations financières
          </p>
        </div>

        {/* Onglets */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '2rem',
          borderBottom: '2px solid #e2e8f0'
        }}>
          <button
            onClick={() => setActiveTab('global')}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === 'global' ? '#6366f1' : 'transparent',
              color: activeTab === 'global' ? 'white' : '#64748b',
              border: 'none',
              borderBottom: activeTab === 'global' ? '2px solid #6366f1' : '2px solid transparent',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            Vue Globale
          </button>
          <button
            onClick={() => setActiveTab('caisse')}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === 'caisse' ? '#f59e0b' : 'transparent',
              color: activeTab === 'caisse' ? 'white' : '#64748b',
              border: 'none',
              borderBottom: activeTab === 'caisse' ? '2px solid #f59e0b' : '2px solid transparent',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            <Wallet size={18} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Caisse
          </button>
          <button
            onClick={() => setActiveTab('banque')}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === 'banque' ? '#3b82f6' : 'transparent',
              color: activeTab === 'banque' ? 'white' : '#64748b',
              border: 'none',
              borderBottom: activeTab === 'banque' ? '2px solid #3b82f6' : '2px solid transparent',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            <CreditCard size={18} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Banque
          </button>
        </div>

        {/* Statistiques principales */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* Solde */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '1.5rem',
            borderRadius: '12px',
            color: 'white',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ opacity: 0.9, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  Solde {activeTab === 'caisse' ? 'Caisse' : activeTab === 'banque' ? 'Banque' : 'Global'}
                </p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
                  {statsActuelles.solde.toLocaleString()} F
                </p>
              </div>
              <Wallet size={40} style={{ opacity: 0.8 }} />
            </div>
          </div>

          {/* Total Entrées */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Entrées</p>
                <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#10b981', margin: 0 }}>
                  {statsActuelles.entrees.toLocaleString()} F
                </p>
              </div>
              <TrendingUp size={32} color="#10b981" />
            </div>
          </div>

          {/* Total Sorties */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Sorties</p>
                <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#ef4444', margin: 0 }}>
                  {statsActuelles.sorties.toLocaleString()} F
                </p>
              </div>
              <TrendingDown size={32} color="#ef4444" />
            </div>
          </div>

          {/* Nombre d'opérations */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Opérations</p>
                <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#6366f1', margin: 0 }}>
                  {statsActuelles.totalOperations}
                </p>
              </div>
              <Activity size={32} color="#6366f1" />
            </div>
          </div>
        </div>

        {/* Vue Globale - Comparaison Caisse/Banque */}
        {activeTab === 'global' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Wallet size={20} color="#f59e0b" />
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', margin: 0 }}>Caisse</h3>
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>Solde</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', margin: '0.25rem 0 0 0' }}>
                  {statsCaisse.solde.toLocaleString()} F
                </p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <div>
                  <p style={{ color: '#64748b', fontSize: '0.75rem', margin: 0 }}>Entrées</p>
                  <p style={{ fontSize: '1rem', fontWeight: '600', color: '#10b981', margin: '0.25rem 0 0 0' }}>
                    {statsCaisse.entrees.toLocaleString()} F
                  </p>
                </div>
                <div>
                  <p style={{ color: '#64748b', fontSize: '0.75rem', margin: 0 }}>Sorties</p>
                  <p style={{ fontSize: '1rem', fontWeight: '600', color: '#ef4444', margin: '0.25rem 0 0 0' }}>
                    {statsCaisse.sorties.toLocaleString()} F
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <CreditCard size={20} color="#3b82f6" />
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', margin: 0 }}>Banque</h3>
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>Solde</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', margin: '0.25rem 0 0 0' }}>
                  {statsBanque.solde.toLocaleString()} F
                </p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <div>
                  <p style={{ color: '#64748b', fontSize: '0.75rem', margin: 0 }}>Entrées</p>
                  <p style={{ fontSize: '1rem', fontWeight: '600', color: '#10b981', margin: '0.25rem 0 0 0' }}>
                    {statsBanque.entrees.toLocaleString()} F
                  </p>
                </div>
                <div>
                  <p style={{ color: '#64748b', fontSize: '0.75rem', margin: 0 }}>Sorties</p>
                  <p style={{ fontSize: '1rem', fontWeight: '600', color: '#ef4444', margin: '0.25rem 0 0 0' }}>
                    {statsBanque.sorties.toLocaleString()} F
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1e293b', fontSize: '0.875rem' }}>
                Date début
              </label>
              <input
                type="date"
                value={filterDate.debut}
                onChange={(e) => setFilterDate({ ...filterDate, debut: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1e293b', fontSize: '0.875rem' }}>
                Date fin
              </label>
              <input
                type="date"
                value={filterDate.fin}
                onChange={(e) => setFilterDate({ ...filterDate, fin: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1e293b', fontSize: '0.875rem' }}>
                Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  background: 'white'
                }}
              >
                <option value="all">Tous</option>
                <option value="entree">Entrées</option>
                <option value="sortie">Sorties</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1e293b', fontSize: '0.875rem' }}>
                Recherche
              </label>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="Description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
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
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b', margin: 0 }}>
              Opérations ({operationsFiltrees.length})
            </h2>
          </div>
          {operationsAvecSolde.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <Activity size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p style={{ fontSize: '1.125rem', margin: 0 }}>Aucune opération trouvée</p>
              <p style={{ fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>
                Modifiez vos filtres pour voir plus de résultats
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Date</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Mode</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Type</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Description</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#475569' }}>Montant</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#475569' }}>Solde</th>
                  </tr>
                </thead>
                <tbody>
                  {operationsAvecSolde.map((operation) => {
                    const soldeCumule = operation.soldeCumule || 0

                    const mode = operation.mode || 'caisse'
                    return (
                      <tr key={operation.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.875rem' }}>
                          {operation.date ? new Date(operation.date).toLocaleDateString('fr-FR') : '-'}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            padding: '0.375rem 0.75rem',
                            borderRadius: '6px',
                            background: mode === 'caisse' ? '#fef3c7' : '#dbeafe',
                            color: mode === 'caisse' ? '#92400e' : '#1e40af',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            textTransform: 'uppercase'
                          }}>
                            {mode === 'caisse' ? 'Caisse' : 'Banque'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            padding: '0.375rem 0.75rem',
                            borderRadius: '6px',
                            background: operation.type === 'entree' ? '#d1fae5' : '#fee2e2',
                            color: operation.type === 'entree' ? '#065f46' : '#991b1b',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            textTransform: 'uppercase'
                          }}>
                            {operation.type === 'entree' ? (
                              <>
                                <ArrowUpRight size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.25rem' }} />
                                Entrée
                              </>
                            ) : (
                              <>
                                <ArrowDownRight size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.25rem' }} />
                                Sortie
                              </>
                            )}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', color: '#1e293b', fontWeight: '500' }}>
                          {operation.description || '-'}
                        </td>
                        <td style={{
                          padding: '1rem',
                          textAlign: 'right',
                          fontWeight: '600',
                          color: operation.type === 'entree' ? '#10b981' : '#ef4444'
                        }}>
                          {operation.type === 'entree' ? '+' : '-'}{(operation.montant || 0).toLocaleString()} F
                        </td>
                        <td style={{
                          padding: '1rem',
                          textAlign: 'right',
                          fontWeight: '600',
                          color: soldeCumule >= 0 ? '#10b981' : '#ef4444'
                        }}>
                          {soldeCumule.toLocaleString()} F
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default CentralisationCaisse

