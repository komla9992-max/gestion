import React, { useMemo } from 'react'
import Layout from '../components/Layout'
import { useData } from '../context/DataContext'
import { AlertCircle, CheckCircle } from 'lucide-react'

const Impayes = () => {
  const { factures, clients } = useData()

  const facturesImpayees = useMemo(() => {
    return factures.filter(facture => 
      facture.statut === 'non_payee' || facture.statut === 'partiellement_payee'
    )
  }, [factures])

  const totalImpaye = useMemo(() => {
    return facturesImpayees.reduce((acc, facture) => {
      const montantPaye = facture.montantPaye || 0
      const montantRestant = (facture.montantTTC || 0) - montantPaye
      return acc + montantRestant
    }, 0)
  }, [facturesImpayees])

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
      partiellement_payee: { label: 'Partiellement payée', color: '#f59e0b', bg: '#fef3c7' },
      non_payee: { label: 'Non payée', color: '#ef4444', bg: '#fee2e2' }
    }
    return statuts[statut] || statuts.non_payee
  }

  return (
    <Layout>
      <div style={{ padding: '2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Factures Impayées</h1>
          <p style={{ color: '#64748b' }}>Liste des factures non payées ou partiellement payées</p>
        </div>

        {/* Statistique */}
        <div style={{
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          padding: '1.5rem',
          borderRadius: '12px',
          color: 'white',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ opacity: 0.9, fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total des impayés</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {totalImpaye.toLocaleString()} F
              </p>
              <p style={{ opacity: 0.8, fontSize: '0.875rem', marginTop: '0.5rem' }}>
                {facturesImpayees.length} facture{facturesImpayees.length > 1 ? 's' : ''} impayée{facturesImpayees.length > 1 ? 's' : ''}
              </p>
            </div>
            <AlertCircle size={48} style={{ opacity: 0.8 }} />
          </div>
        </div>

        {/* Liste des factures impayées */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}>
          {facturesImpayees.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <CheckCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5, color: '#10b981' }} />
              <p>Aucune facture impayée</p>
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
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Payé</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Reste à payer</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {facturesImpayees.map((facture) => {
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
                          {facture.montantTTC ? `${facture.montantTTC.toLocaleString()} F` : '-'}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {montantPaye > 0 ? (
                            <span style={{ color: '#10b981', fontWeight: '500' }}>
                              {montantPaye.toLocaleString()} F
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>-</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ color: '#ef4444', fontWeight: '600', fontSize: '1rem' }}>
                            {montantRestant.toLocaleString()} F
                          </span>
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

export default Impayes
