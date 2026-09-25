import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import './Login.css'

export default function Signup() {
  const [step, setStep] = useState(1)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('+250 78')
  const [dob, setDob] = useState('2001-05-15')
  const [studentId, setStudentId] = useState('')
  const [college, setCollege] = useState('CST')
  const [program, setProgram] = useState('Computer Science')
  const [year, setYear] = useState('Year 4')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { registerStudent } = useApp()
  const navigate = useNavigate()

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) {
      setError('Please enter your full name.')
      return
    }
    setError('')
    setStep(2)
  }

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault()
    if (!program.trim()) {
      setError('Please enter your program of study.')
      return
    }
    setError('')
    setStep(3)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!agreeTerms) {
      setError('Please accept the Terms of Service to proceed.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter matching passwords.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid university email address.')
      return
    }

    setLoading(true)
    await new Promise(r => setTimeout(r, 400))

    const res = registerStudent({
      name: fullName.trim(),
      email: email.trim(),
      password,
      phone: phone.trim(),
      dob,
      college,
      program: program.trim(),
      year,
      studentId: studentId.trim() || undefined,
    })

    setLoading(false)
    if (!res.success) {
      setError(res.error || 'Registration failed.')
      return
    }

    navigate('/dashboard')
  }

  return (
    <section className="login">
      <div className="login__card login__card--wide">
        <div className="login__header">
          <img src="/ur-logo.png" alt="UR" className="login__logo" />
          <h2>Create Your Account</h2>
          <p>Join the University of Rwanda digital clearance & transcript system</p>
        </div>

        <div className="login__steps">
          <div className={`login__step-indicator ${step >= 1 ? 'login__step-indicator--active' : ''}`}>
            <span>1</span>
            <label>Personal</label>
          </div>
          <div className="login__step-line" />
          <div className={`login__step-indicator ${step >= 2 ? 'login__step-indicator--active' : ''}`}>
            <span>2</span>
            <label>Academic</label>
          </div>
          <div className="login__step-line" />
          <div className={`login__step-indicator ${step >= 3 ? 'login__step-indicator--active' : ''}`}>
            <span>3</span>
            <label>Credentials</label>
          </div>
        </div>

        {error && <div className="login__error" style={{ marginBottom: '1rem' }}>{error}</div>}

        <form className="login__form" onSubmit={step === 3 ? handleSubmit : (step === 1 ? handleNextStep1 : handleNextStep2)}>
          {step === 1 && (
            <div className="login__step-content">
              <div className="login__field">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="Jean-Paul Ndayambaje"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="login__field">
                <label>Phone Number</label>
                <input
                  type="tel"
                  placeholder="+250 78X XXX XXX"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                />
              </div>
              <div className="login__field">
                <label>Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="login__btn">Next: Academic Info →</button>
            </div>
          )}

          {step === 2 && (
            <div className="login__step-content">
              <div className="login__field">
                <label>Student ID (Optional - auto-generated if blank)</label>
                <input
                  type="text"
                  placeholder="UR/2026/CST/123"
                  value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                />
              </div>
              <div className="login__field">
                <label>College</label>
                <select
                  className="login__select"
                  value={college}
                  onChange={e => setCollege(e.target.value)}
                  required
                >
                  {['CST', 'CBE', 'CASS', 'CE', 'CMHS', 'CAFF', 'CVAS'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="login__field">
                <label>Program of Study</label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science"
                  value={program}
                  onChange={e => setProgram(e.target.value)}
                  required
                />
              </div>
              <div className="login__field">
                <label>Year of Study</label>
                <select
                  className="login__select"
                  value={year}
                  onChange={e => setYear(e.target.value)}
                  required
                >
                  <option value="Year 1">Year 1</option>
                  <option value="Year 2">Year 2</option>
                  <option value="Year 3">Year 3</option>
                  <option value="Year 4">Year 4</option>
                  <option value="Year 5+">Year 5+</option>
                </select>
              </div>
              <div className="login__step-nav">
                <button type="button" className="login__btn login__btn--outline" onClick={() => { setError(''); setStep(1) }}>← Back</button>
                <button type="submit" className="login__btn">Next: Set Credentials →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="login__step-content">
              <div className="login__field">
                <label>University Email</label>
                <input
                  type="email"
                  placeholder="student.name@ur.ac.rw"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <small style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.75rem', marginTop: '2px' }}>
                  You will use this email and password to log into your account.
                </small>
              </div>
              <div className="login__field">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="login__field">
                <label>Confirm Password</label>
                <input
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <label className="login__checkbox">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={e => setAgreeTerms(e.target.checked)}
                  required
                /> I agree to the <a href="#">Terms of Service</a> and <a href="#">University Clearance Regulations</a>
              </label>
              <div className="login__step-nav">
                <button type="button" className="login__btn login__btn--outline" onClick={() => { setError(''); setStep(2) }}>← Back</button>
                <button type="submit" className="login__btn" disabled={loading}>
                  {loading ? 'Registering Account...' : 'Create Account & Access Dashboard'}
                </button>
              </div>
            </div>
          )}
        </form>

        <p className="login__footer">
          Already have an account? <Link to="/login">Sign In with Credentials</Link>
        </p>
      </div>
    </section>
  )
}
