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
          <h2>Welcome to CLEAR&TRANS</h2>
          <p>University of Rwanda — Digital Clearance & Transcript System</p>
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
              <strong>Click any leader to autofill credentials:</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                {LEADERS.map(l => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => { setEmail(l.email); setPassword('leader123') }}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      color: '#e2e8f0',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span><strong>L{l.level}: {l.title}</strong> — {l.name}</span>
                    <span style={{ color: '#38bdf8' }}>Autofill ➔</span>
                  </button>
                ))}
              </div>
              <p style={{ marginTop: '8px', fontSize: '0.75rem', color: '#94a3b8' }}>
                Default staff password format: <strong>leader123</strong> or your official UR access password.
              </p>
            </div>
          )}

          {role === 'student' && (
            <div className="login__info">
              <p>Sign in using your personal <strong>student email and password</strong>.</p>
              <p style={{ marginTop: '4px', fontSize: '0.75rem', color: '#94a3b8' }}>
                For demo/student records, the default credential format is <strong>UR@123456</strong> based on your student ID.
              </p>
              <p style={{ marginTop: '4px', fontSize: '0.75rem', color: '#94a3b8' }}>
                New student? Click <Link to="/signup" style={{ color: '#38bdf8' }}>Create Account</Link> to register in seconds.
              </p>
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
