import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
      LayoutDashboard, Users, Building2, FileText, Calendar,
      Clock, DollarSign, Receipt, AlertCircle, UserCog,
      Briefcase, Wallet, BookOpen, Menu, X, LogOut, ArrowDownCircle
    } from 'lucide-react'

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { currentUser, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const navRef = useRef(null)
  const scrollPositionRef = useRef(0)
  const isScrollingRef = useRef(false)

  const menuItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord', page: 'dashboard' },
    { to: '/employes', icon: Users, label: 'Employés', page: 'employes' },
    { to: '/clients', icon: Building2, label: 'Clients', page: 'clients' },
    { to: '/contrats', icon: FileText, label: 'Contrats', page: 'contrats' },
    { to: '/planning', icon: Calendar, label: 'Planning', page: 'planning' },
    { to: '/pointages', icon: Clock, label: 'Pointages', page: 'pointages' },
        { to: '/caisse', icon: DollarSign, label: 'Caisse', page: 'caisse' },
        { to: '/factures', icon: Receipt, label: 'Factures', page: 'factures' },
    { to: '/impayes', icon: AlertCircle, label: 'Impayés', page: 'impayes' },
    { to: '/utilisateurs', icon: UserCog, label: 'Utilisateurs', page: 'utilisateurs' },
    { to: '/conges', icon: Briefcase, label: 'Congés', page: 'conges' },
    { to: '/paie', icon: Wallet, label: 'Paie', page: 'paie' },
    { to: '/avances', icon: ArrowDownCircle, label: 'Avances', page: 'avances' },
    { to: '/comptabilite', icon: BookOpen, label: 'Comptabilité', page: 'comptabilite' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Sauvegarder la position du scroll en temps réel
  useEffect(() => {
    const navElement = navRef.current
    if (!navElement) return

    const handleScroll = () => {
      if (!isScrollingRef.current) {
        scrollPositionRef.current = navElement.scrollTop
      }
    }

    navElement.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      navElement.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Restaurer la position du scroll après chaque render
  useLayoutEffect(() => {
    const navElement = navRef.current
    if (!navElement) return

    const savedScroll = scrollPositionRef.current
    
    // Restaurer la position du scroll
    if (savedScroll > 0) {
      isScrollingRef.current = true
      navElement.scrollTop = savedScroll
      
      // Réinitialiser le flag après un court délai
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          isScrollingRef.current = false
        })
      })
    }
  }, [location.pathname, sidebarOpen])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'white', width: '100%', overflow: 'hidden' }}>
      {/* Sidebar violette avec gradient */}
      <aside style={{
        width: sidebarOpen ? '260px' : '70px',
        background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
        transition: 'width 0.3s',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        left: 0,
        top: 0,
        zIndex: 1000,
        overflow: 'hidden',
        boxShadow: '2px 0 8px rgba(0,0,0,0.1)'
      }}>
        {/* Logo/Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          position: 'relative'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
            width: '100%'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '90px',
              aspectRatio: '3/4',
              borderRadius: '12px',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              padding: '8px'
            }}>
              <img 
                src="/images/télécharger.jpg" 
                alt="CGSP Logo" 
                style={{
                  width: '100%',
                  height: '100%',
                  flexShrink: 0,
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
            </div>
            {sidebarOpen && (
              <h1 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 'bold', margin: 0, textAlign: 'center' }}>
                CGSP
              </h1>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '8px',
              flexShrink: 0,
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav 
          ref={navRef}
          style={{ 
            flex: 1, 
            overflowY: 'auto', 
            overflowX: 'hidden',
            padding: '1rem 0',
            scrollBehavior: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {menuItems.filter((item) => {
            // Si l'utilisateur est admin, il a accès à tout
            if (currentUser?.role === 'admin') {
              return true
            }
            // Sinon, vérifier les permissions
            const userPermissions = currentUser?.permissions || []
            return userPermissions.includes(item.page)
          }).map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/')
            
            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.875rem 1.5rem',
                  color: 'white',
                  background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  gap: '1rem',
                  margin: '0.25rem 0.5rem',
                  borderRadius: '12px'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <Icon size={20} />
                {sidebarOpen && <span style={{ fontWeight: isActive ? '600' : '400' }}>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User Info */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          color: 'white'
        }}>
          {sidebarOpen && (
            <div style={{ marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'white' }}>
                {currentUser?.nom || currentUser?.username}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                {currentUser?.role || 'Utilisateur'}
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.875rem',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            <LogOut size={16} />
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        marginLeft: sidebarOpen ? '260px' : '70px',
        flex: 1,
        transition: 'margin-left 0.3s',
        minHeight: '100vh',
        width: '100%',
        maxWidth: `calc(100vw - ${sidebarOpen ? '260px' : '70px'})`,
        background: 'white',
        color: 'black',
        overflow: 'auto',
        position: 'relative'
      }}>
        {children}
      </main>
    </div>
  )
}

export default Layout
