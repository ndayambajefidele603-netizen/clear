import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useApp, LEADERS, getLeaderPreviewPassword, type StudentRequest, type StudentRecord } from '../context/AppContext'
import AuthShowcase from '../components/AuthShowcase'
import { apiRequest } from '../lib/api'
import './Login.css'

export default function Login() {
  const [role, setRole] = useState<'student' | 'leader'>('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const { setStudentSession, loginLeader } = useApp()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    if (searchParams.get('registered') === '1') {
      setMessage('Your account is ready. Sign in with the email and password you just registered.')
      setEmail(searchParams.get('email') || '')
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (role === 'leader') {
      const err = loginLeader(email, password)
      if (err) {
        setError(err)
        return
      }
      navigate('/leader', { replace: true })
      return
    }

    setLoading(true)
    try {
      const result = await apiRequest<{ token: string; profile: StudentRecord; requests: StudentRequest[] }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setStudentSession(result.profile, result.token, result.requests)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="login">
      <div className="login__layout">
        <AuthShowcase />
        <div className="login__card">
        <div className="login__header">
          <img src="/ur-logo.png" alt="University of Rwanda logo" className="login__logo" />
          <span className="login__eyebrow">STUDENT SERVICES PORTAL PREVIEW</span>
          <h1>Welcome back</h1>
          <p>Sign in to continue to your clearance and transcript workspace.</p>
        </div>

        <div className="login__tabs" role="tablist" aria-label="Choose sign-in role">
          <button type="button" role="tab" aria-selected={role === 'student'} className={`login__tab ${role === 'student' ? 'login__tab--active' : ''}`} onClick={() => { setRole('student'); setError('') }}>
            Student
          </button>
          <button type="button" role="tab" aria-selected={role === 'leader'} className={`login__tab ${role === 'leader' ? 'login__tab--active' : ''}`} onClick={() => { setRole('leader'); setError('') }}>
            Leader / Staff
          </button>
        </div>

        <form className="login__form" onSubmit={handleLogin}>
          <div className="login__field">
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              placeholder={role === 'student' ? 'you@example.com' : 'staff@ur.ac.rw'}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="login__field">
            <label htmlFor="login-password">Password</label>
            <div className="login__password-wrap">
              <input
                id="login-password"
                type={passwordVisible ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button type="button" className="login__password-toggle" aria-label={passwordVisible ? 'Hide password' : 'Show password'} aria-pressed={passwordVisible} onClick={() => setPasswordVisible(value => !value)}>
                {passwordVisible ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && <div className="login__error" role="alert" aria-live="assertive">{error}</div>}

          <div className="login__info" role="note">
            <strong>{role === 'student' ? 'Your student account' : 'Staff preview access'}</strong>
            <p>{role === 'student'
              ? 'Your account, request progress, and uploaded documents are saved to the portal server, so you can sign in again from another device.'
              : 'Staff sign-in is a demonstration flow and is not connected to University single sign-on.'}</p>
            <p>This preview is not connected to official University records.</p>
          </div>

          {role === 'leader' && (
            <div className="login__preview-accounts" aria-label="Leader preview accounts">
              <p>Quick-fill a local preview account:</p>
              {LEADERS.map(leader => (
                <button
                  key={leader.id}
                  type="button"
                  className="login__preview-account"
                  onClick={() => {
                    setEmail(leader.email)
                    setPassword(getLeaderPreviewPassword(leader))
                    setError('')
                  }}
                >
                  <span>{leader.title}<small>{leader.name}</small></span>
                  <span aria-hidden="true">Fill</span>
                </button>
              ))}
              <small>Preview credentials only — do not use for real University accounts.</small>
            </div>
          )}

          {message && role === 'student' && <div className="login__success" role="status">{message}</div>}
          <button type="submit" className="login__btn" disabled={loading}>
            {loading ? 'Signing in…' : `Sign in to ${role === 'student' ? 'student' : 'reviewer'} workspace`}
          </button>
        </form>

        <p className="login__footer">
          {role === 'student' ? <>New to the portal? <Link to="/signup">Create a preview account</Link></> : <>Need authorized staff access? <Link to="/#contact">Contact portal support</Link></>}
        </p>
        </div>
      </div>
    </section>
  )
}
