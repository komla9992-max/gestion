import React, { createContext, useState, useContext, useEffect } from 'react'

const DataContext = createContext()

export const useData = () => {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}

export const DataProvider = ({ children }) => {
  const [employees, setEmployees] = useState([])
  const [clients, setClients] = useState([])
  const [contrats, setContrats] = useState([])
  const [factures, setFactures] = useState([])
  const [operations, setOperations] = useState([])
  const [conges, setConges] = useState([])
  const [fichesPaie, setFichesPaie] = useState([])
  const [avances, setAvances] = useState([])

  // Persistance des données
  useEffect(() => {
    if (employees.length > 0) {
      localStorage.setItem('employees', JSON.stringify(employees))
    }
  }, [employees])

  useEffect(() => {
    if (clients.length > 0) {
      localStorage.setItem('clients', JSON.stringify(clients))
    }
  }, [clients])

  useEffect(() => {
    if (contrats.length > 0) {
      localStorage.setItem('contrats', JSON.stringify(contrats))
    }
  }, [contrats])

  useEffect(() => {
    if (factures.length > 0) {
      localStorage.setItem('factures', JSON.stringify(factures))
    }
  }, [factures])

  useEffect(() => {
    if (operations.length > 0) {
      localStorage.setItem('operations', JSON.stringify(operations))
    }
  }, [operations])

  useEffect(() => {
    if (conges.length > 0) {
      localStorage.setItem('conges', JSON.stringify(conges))
    }
  }, [conges])

  useEffect(() => {
    if (fichesPaie.length > 0) {
      localStorage.setItem('fichesPaie', JSON.stringify(fichesPaie))
    }
  }, [fichesPaie])

  useEffect(() => {
    if (avances.length > 0) {
      localStorage.setItem('avances', JSON.stringify(avances))
    }
  }, [avances])

  // Chargement des données sauvegardées
  useEffect(() => {
    const savedEmployees = localStorage.getItem('employees')
    const savedClients = localStorage.getItem('clients')
    const savedContrats = localStorage.getItem('contrats')
    const savedFactures = localStorage.getItem('factures')
    const savedOperations = localStorage.getItem('operations')
    const savedConges = localStorage.getItem('conges')
    const savedFichesPaie = localStorage.getItem('fichesPaie')
    const savedAvances = localStorage.getItem('avances')

    if (savedEmployees) setEmployees(JSON.parse(savedEmployees))
    if (savedClients) setClients(JSON.parse(savedClients))
    if (savedContrats) setContrats(JSON.parse(savedContrats))
    if (savedFactures) setFactures(JSON.parse(savedFactures))
    if (savedOperations) setOperations(JSON.parse(savedOperations))
    if (savedConges) setConges(JSON.parse(savedConges))
    if (savedFichesPaie) setFichesPaie(JSON.parse(savedFichesPaie))
    if (savedAvances) setAvances(JSON.parse(savedAvances))
  }, [])

  return (
    <DataContext.Provider value={{
      employees,
      setEmployees,
      clients,
      setClients,
      contrats,
      setContrats,
      factures,
      setFactures,
      operations,
      setOperations,
      conges,
      setConges,
      fichesPaie,
      setFichesPaie,
      avances,
      setAvances
    }}>
      {children}
    </DataContext.Provider>
  )
}

