import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import './Navbar.css'

const studentLinks = [
  { label: 'Home', path: '/' },
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Clearance', path: '/clearance' },
  { label: 'Transcript', path: '/transcript' },
]

const leaderLinks = [
  { label: 'Home', path: '/' },
  { label: 'Reviews', path: '/leader' },
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

  const links = user?.role === 'leader' ? leaderLinks : studentLinks
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
    <nav className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="navbar__logo">
          <img src="/ur-logo.png" alt="UR" className="navbar__logo-img" />
          <span className="navbar__logo-text">
            <span className="navbar__logo-brand">CLEAR&amp;TRANS</span>
            <span className="navbar__logo-sub">Univ. of Rwanda</span>
          </span>
        </Link>

        <ul className={`navbar__links ${menuOpen ? 'navbar__links--open' : ''}`}>
          {links.map(link => (
            <li key={link.path}>
              <Link
                to={link.path}
                className={`navbar__link ${location.pathname === link.path ? 'navbar__link--active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            {user ? (
              <div className="navbar__user-wrap">
                <button className="navbar__user-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
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
          {user?.role === 'student' && (
            <Link to="/clearance?chat=1" className="navbar__chat-link" title="AI Assistant">💬</Link>
          )}
        </div>

        <button
          className={`navbar__burger ${menuOpen ? 'navbar__burger--open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </nav>
  )
}
