import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import './Navbar.css'

const studentLinks = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Clearance', path: '/clearance' },
  { label: 'Transcript', path: '/transcript' },
  { label: 'Documents', path: '/documents' },
  { label: 'Help', path: '/#contact' },
]

const leaderLinks = [
  { label: 'Home', path: '/' },
  { label: 'Reviews', path: '/leader' },
  { label: 'Help', path: '/#contact' },
]

const publicLinks = [
  { label: 'Home', path: '/' },
  { label: 'Services', path: '/#features' },
  { label: 'How it works', path: '/#about' },
  { label: 'Help & support', path: '/#contact' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useApp()

  const handleLogout = () => {
    logout()
    navigate('/')
    setUserMenuOpen(false)
  }

  const links = user?.role === 'leader' ? leaderLinks : user ? studentLinks : publicLinks
  const profileName = user?.role === 'student'
    ? user.profile.name
    : user?.role === 'leader'
    ? user.profile.name
    : ''
  const profileId = user?.role === 'student'
    ? user.profile.id
    : user?.role === 'leader'
    ? user.profile.title
    : ''

  return (
    <nav className="navbar" aria-label="Main navigation">
      <div className="container navbar__inner">
        <Link to="/" className="navbar__logo" aria-label="University of Rwanda clearance and transcript portal home">
          <img src="/ur-logo.png" alt="University of Rwanda logo" className="navbar__logo-img" />
          <span className="navbar__logo-text">
            <span className="navbar__logo-brand">CLEARANCE & TRANSCRIPT</span>
            <span className="navbar__logo-sub">Student services</span>
          </span>
        </Link>

        <ul id="primary-navigation" className={`navbar__links ${menuOpen ? 'navbar__links--open' : ''}`}>
          {links.map(link => (
            <li key={link.path}>
              <Link
                to={link.path}
                className={`navbar__link ${location.pathname === link.path ? 'navbar__link--active' : ''}`}
                aria-current={location.pathname === link.path ? 'page' : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            {user ? (
              <div className="navbar__user-wrap">
                <button
                  className="navbar__user-btn"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <span className="navbar__user-avatar">{profileName.split(' ').map((n: string) => n[0]).join('')}</span>
                  <span className="navbar__user-name">{profileName.split(' ')[0]}</span>
                  {user.role === 'leader' && <span className="navbar__user-role">Leader</span>}
                </button>
                {userMenuOpen && (
                  <div className="navbar__user-dropdown">
                    <div className="navbar__dropdown-header">
                      <strong>{profileName}</strong>
                      <span>{profileId}</span>
                      <span className="navbar__dropdown-role">{user.role === 'leader' ? 'Leader' : 'Student'}</span>
                    </div>
                    {user.role === 'student' && (
                      <Link to="/dashboard" className="navbar__dropdown-link" onClick={() => setUserMenuOpen(false)}>Dashboard</Link>
                    )}
                    {user.role === 'leader' && (
                      <Link to="/leader" className="navbar__dropdown-link" onClick={() => setUserMenuOpen(false)}>Reviews</Link>
                    )}
                    <button className="navbar__dropdown-btn" onClick={handleLogout}>Sign Out</button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="navbar__cta" onClick={() => setMenuOpen(false)}>
                Sign In
              </Link>
            )}
          </li>
        </ul>

        <div className="navbar__right">
          {user && (
            <Link to="/#contact" className="navbar__chat-link" aria-label="Open portal support contacts">?</Link>
          )}
        </div>

        <button
          type="button"
          className={`navbar__burger ${menuOpen ? 'navbar__burger--open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </nav>
  )
}
