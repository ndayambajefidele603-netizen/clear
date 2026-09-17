import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp, LEADERS } from '../context/AppContext'
import './Login.css'

export default function Login() {
  const [role, setRole] = useState<'student' | 'leader'>('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { user, login, loginLeader } = useApp()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate(user.role === 'leader' ? '/leader' : '/dashboard', { replace: true })
    }
  }, [user, navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    await new Promise(r => setTimeout(r, 500))

    const err = role === 'student'
      ? login(email, password)
      : loginLeader(email, password)

    setLoading(false)
    if (err) {
      setError(err)
      return
    }
    navigate(role === 'leader' ? '/leader' : '/dashboard')
  }

  return (
    <section className="login">
      <div className="login__card">
        <div className="login__header">
          <img src="/ur-logo.png" alt="UR" className="login__logo" />
          <h2>Welcome to CLEARKY</h2>
          <p>University of Rwanda — Digital Clearance System</p>
        </div>

        <div className="login__tabs">
          <button className={`login__tab ${role === 'student' ? 'login__tab--active' : ''}`} onClick={() => { setRole('student'); setError('') }}>
            Student
          </button>
          <button className={`login__tab ${role === 'leader' ? 'login__tab--active' : ''}`} onClick={() => { setRole('leader'); setError('') }}>
            Leader / Staff
          </button>
        </div>

        <form className="login__form" onSubmit={handleLogin}>
          <div className="login__field">
            <label>University Email</label>
            <input
              type="email"
              placeholder={role === 'student' ? 'you@ur.ac.rw' : 'leader@ur.ac.rw'}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="login__field">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          {error && <div className="login__error">{error}</div>}

          {role === 'leader' && (
            <div className="login__info">
              <strong>Available leaders:</strong>
              <ul>
                {LEADERS.map(l => (
                  <li key={l.id}>{l.name} — <em>{l.email}</em> ({l.title})</li>
                ))}
              </ul>
            </div>
          )}

          {role === 'student' && (
            <div className="login__info">
              <p>Use any <strong>@ur.ac.rw</strong> email from the UR database (2022-2026).<br />
              Example: <em>jean.ndayambaje@ur.ac.rw</em></p>
            </div>
          )}

          <button type="submit" className="login__btn" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="login__footer">
          Don't have an account? <Link to="/signup">Create Account</Link>
        </p>
      </div>
    </section>
  )
}
