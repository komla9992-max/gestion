import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import Layout from '../components/Layout'
import {
  Users, Building2, FileText, DollarSign, Search, Bell,
  TrendingUp, Calendar, Receipt, ArrowUpRight, ArrowDownRight,
  Clock, CheckCircle2, AlertTriangle, Activity, Plus, Eye,
  Percent, BarChart3, Target, Zap, X, ChevronLeft, ChevronRight,
  Lightbulb, BookOpen
} from 'lucide-react'

const Dashboard = () => {
  const { currentUser } = useAuth()
  const { employees, clients, contrats, factures, operations } = useData()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [showBanner, setShowBanner] = useState(true)

  React.useEffect(() => {
    if (!currentUser) {
      navigate('/login')
    }
  }, [currentUser, navigate])

  if (!currentUser) {
    return null
  }

  // Calculer les statistiques
  const totalEmployes = employees.length
  const totalClients = clients.length
  const totalContrats = contrats.length
  
  const facturesPayees = factures.filter(f => f.statut === 'payee')
  const facturesPartielles = factures.filter(f => f.statut === 'partiellement_payee')
  const contratsActifs = contrats.filter(c => c.statut === 'actif').length
  const contratsCompletes = contrats.filter(c => c.statut === 'termine').length
  
  // Métriques financières
  const chiffreAffaires = facturesPayees.reduce((sum, f) => sum + (f.montantTTC || 0), 0) +
    facturesPartielles.reduce((sum, f) => sum + (f.montantPaye || 0), 0)

  // Heures totales passées (calcul simulé pour l'exemple)
  const heuresTotal = useMemo(() => {
    // Simulation basée sur les contrats actifs
    return (contratsActifs * 45).toFixed(1)
  }, [contratsActifs])

  // Calcul des heures passées par jour (simulation)
  const heuresParJour = useMemo(() => {
    const jours = []
    const aujourdhui = new Date()
    
    for (let i = 14; i >= 0; i--) {
      const date = new Date(aujourdhui)
      date.setDate(date.getDate() - i)
      
      // Simulation de données
      const heures = Math.random() * 8 + 2
      
      jours.push({
        date: date,
        heures: parseFloat(heures.toFixed(1)),
        label: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
      })
    }
    
    return jours
  }, [])

  const maxHeures = Math.max(...heuresParJour.map(j => j.heures), 10)

  // Contrats en cours
  const contratsEnCours = useMemo(() => {
    return contrats
      .filter(c => c.statut === 'actif')
      .slice(0, 3)
      .map(c => ({
        ...c,
        client: clients.find(cl => cl.id === c.clientId || String(cl.id) === String(c.clientId)),
        progress: Math.floor(Math.random() * 50 + 25) // Simulation de progression
      }))
  }, [contrats, clients])

  // Messages de salutation
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bonjour'
    if (hour < 18) return 'Bon après-midi'
    return 'Bonsoir'
  }

  const getUserName = () => {
    return currentUser?.nom || currentUser?.username || 'Utilisateur'
  }

  return (
    <Layout>
      <div style={{ padding: '2rem', background: 'white', minHeight: '100vh' }}>
        {/* Header avec barre de recherche et profil */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            {/* Barre de recherche */}
            <div style={{ flex: 1, maxWidth: '500px', position: 'relative' }}>
              <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Rechercher des contrats, clients, factures..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem 0.875rem 3rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  background: '#f8fafc',
                  color: 'black',
                  outline: 'none'
                }}
              />
            </div>
            
            {/* Profil utilisateur */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Bell size={20} color="#64748b" />
              </button>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1rem'
              }}>
                {(getUserName().charAt(0) || 'U').toUpperCase()}
              </div>
            </div>
          </div>

          {/* Message de bienvenue */}
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'black', margin: 0 }}>
            {getGreeting()}, {getUserName()} 👋
          </h2>
        </div>

        {/* Bannière de notification */}
        {showBanner && (
        <div style={{ 
            background: '#fef3c7',
            borderRadius: '16px',
            padding: '1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
            gap: '1rem',
            position: 'relative'
        }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Lightbulb size={24} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#92400e', margin: '0 0 0.5rem 0' }}>
                Vérifiez vos contrats actifs
              </h3>
              <p style={{ fontSize: '0.9375rem', color: '#78350f', margin: 0 }}>
                Consultez vos contrats en cours et suivez leur progression pour rester à jour.
              </p>
            </div>
            <button
              onClick={() => navigate('/contrats')}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9375rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#d97706'
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f59e0b'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              Voir maintenant
            </button>
            <button
              onClick={() => setShowBanner(false)}
            style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#92400e'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(146, 64, 14, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* 4 Cartes de statistiques */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* Carte 1: Contrats actifs */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              background: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileText size={28} color="#f59e0b" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>Contrats actifs</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'black', margin: 0 }}>{contratsActifs}</p>
            </div>
          </div>

          {/* Carte 2: Contrats complétés */}
          <div style={{
                  background: 'white',
                  padding: '1.5rem',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
                  borderRadius: '12px',
              background: '#d1fae5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle2 size={28} color="#10b981" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>Complétés</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'black', margin: 0 }}>
                {contratsCompletes} / {totalContrats}
                    </p>
                  </div>
          </div>

          {/* Carte 3: Heures totales */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}>
                  <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              background: '#ede9fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
                  }}>
              <Clock size={28} color="#8b5cf6" />
                  </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>Heures totales</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'black', margin: 0 }}>{heuresTotal}h</p>
                </div>
        </div>

          {/* Carte 4: Factures payées */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              background: '#dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Receipt size={28} color="#3b82f6" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>Factures payées</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'black', margin: 0 }}>
                {facturesPayees.length} / {factures.length}
              </p>
            </div>
          </div>
        </div>

        {/* Graphique des heures passées */}
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #e2e8f0',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'black', margin: '0 0 0.25rem 0' }}>
                Heures passées
              </h3>
              <p style={{ fontSize: '0.9375rem', color: '#64748b', margin: 0 }}>
                {heuresTotal}h {((parseFloat(heuresTotal) % 1) * 60).toFixed(0)}m sur cette période
              </p>
            </div>
          </div>
          
          {/* Graphique en ligne */}
          <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '0.5rem', position: 'relative', paddingTop: '2rem' }}>
            {/* Axe Y */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingRight: '1rem' }}>
              {[0, 2, 5, 10, 20].map((val) => (
                <span key={val} style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{val}h</span>
              ))}
            </div>

            {/* Ligne de graphique */}
            <div style={{ marginLeft: '3rem', flex: 1, height: '100%', position: 'relative', display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
              {heuresParJour.map((jour, index) => {
                const height = (jour.heures / maxHeures) * 100
                return (
                  <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
                    <div style={{
                      width: '100%',
                      height: `${height}%`,
                      minHeight: '4px',
                      background: index === heuresParJour.length - 1 
                        ? 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)'
                        : 'linear-gradient(180deg, #8b5cf6 0%, #6366f1 100%)',
                      borderRadius: '4px 4px 0 0',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.8'
                      e.currentTarget.style.transform = 'scaleY(1.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1'
                      e.currentTarget.style.transform = 'scaleY(1)'
                    }}
                    title={`${jour.label}: ${jour.heures}h`}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#64748b', writingMode: index % 3 === 0 ? 'horizontal-tb' : 'horizontal-tb' }}>
                      {jour.label.split(' ')[0]}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Section Contrats en cours */}
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'black', margin: 0 }}>
              Contrats en cours
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ChevronLeft size={16} color="#64748b" />
              </button>
              <button style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ChevronRight size={16} color="#64748b" />
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {contratsEnCours.length > 0 ? contratsEnCours.map((contrat, index) => {
              const colors = [
                { bg: '#1e40af', text: 'white' },
                { bg: '#ea580c', text: 'white' },
                { bg: '#7c3aed', text: 'white' }
              ]
              const color = colors[index % colors.length]
              
              return (
                <div key={contrat.id} style={{
                  background: 'white',
                  border: '2px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '1.5rem',
                    cursor: 'pointer',
                  transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)'
                  }}
                  onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
                onClick={() => navigate('/contrats')}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: color.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem'
                  }}>
                    <span style={{ color: color.text, fontWeight: 'bold', fontSize: '1.125rem' }}>
                      {contrat.numero ? contrat.numero.charAt(0) : 'C'}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'black', margin: '0 0 0.5rem 0' }}>
                    {contrat.numero || 'Contrat sans numéro'}
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 1rem 0' }}>
                    {contrat.client?.nom || 'Client inconnu'}
                  </p>
                  
                  {/* Barre de progression */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Progression</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#10b981' }}>{contrat.progress}%</span>
                    </div>
                    <div style={{
                      height: '8px',
                      background: '#e2e8f0',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${contrat.progress}%`,
                        background: '#10b981',
                        borderRadius: '4px',
                        transition: 'width 0.3s'
                      }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.875rem', color: '#64748b' }}>
                    <span>Début: {contrat.dateDebut ? new Date(contrat.dateDebut).toLocaleDateString('fr-FR') : '-'}</span>
                    <span>Durée: {contrat.duree || 'N/A'}</span>
                  </div>
                </div>
              )
            }) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                <BookOpen size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p>Aucun contrat en cours</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Dashboard
