import React, { createContext, useState, useContext, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = (user) => {
    setCurrentUser(user)
    localStorage.setItem('currentUser', JSON.stringify(user))
  }

  const logout = () => {
    setCurrentUser(null)
    localStorage.removeItem('currentUser')
  }

  const isAdmin = currentUser?.role === 'admin'
  const isComptable = currentUser?.role === 'comptable'

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, loading, isAdmin, isComptable }}>
      {children}
    </AuthContext.Provider>
  )
}



