import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Employes from './pages/Employes'
import Clients from './pages/Clients'
import Contrats from './pages/Contrats'
import Planning from './pages/Planning'
import Pointages from './pages/Pointages'
import Caisse from './pages/Caisse'
import Factures from './pages/Factures'
import Impayes from './pages/Impayes'
import Utilisateurs from './pages/Utilisateurs'
import Conges from './pages/Conges'
import Paie from './pages/Paie'
import Avances from './pages/Avances'
import Comptabilite from './pages/Comptabilite'

// Composant pour empêcher le scroll automatique
function ScrollRestoration() {
  const location = useLocation()
  
  useEffect(() => {
    // Désactiver le scroll automatique du navigateur
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
    
    // Empêcher tout scroll automatique lors du changement de route
    // Ne pas scroller vers le haut - garder la position actuelle
  }, [location.pathname])
  
  return null
}

function App() {
  // Désactiver le scroll automatique au chargement de l'application
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <ScrollRestoration />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/employes" element={<Employes />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/contrats" element={<Contrats />} />
            <Route path="/planning" element={<Planning />} />
            <Route path="/pointages" element={<Pointages />} />
            <Route path="/caisse" element={<Caisse />} />
            <Route path="/factures" element={<Factures />} />
            <Route path="/impayes" element={<Impayes />} />
            <Route path="/utilisateurs" element={<Utilisateurs />} />
            <Route path="/conges" element={<Conges />} />
            <Route path="/paie" element={<Paie />} />
            <Route path="/avances" element={<Avances />} />
            <Route path="/comptabilite" element={<Comptabilite />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  )
}

export default App
