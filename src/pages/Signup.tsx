import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShowcase from '../components/AuthShowcase'
import { apiRequest } from '../lib/api'
import './Login.css'

export default function Signup() {
  const [step, setStep] = useState(1)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [dob, setDob] = useState('')
  const [studentId, setStudentId] = useState('')
  const [college, setCollege] = useState('')
  const [program, setProgram] = useState('')
  const [year, setYear] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false)
  const [acknowledgePreview, setAcknowledgePreview] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
    if (!studentId.trim() || !college || !program.trim() || !year) {
      setError('Enter your University student ID, college, program, and year of study.')
      return
    }
    setError('')
    setStep(3)
  }

  const handleSendCode = async () => {
    setError('')

    if (!acknowledgePreview) {
      setError('Please confirm that you understand this is a preview portal.')
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
    try {
      await apiRequest<{ message: string }>('/api/auth/signup/send-code', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      })
      setCodeSent(true)
      setVerificationCode('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the confirmation code.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void handleSendCode()
  }

  const handleVerifyCode = async () => {
    setError('')
    if (!/^\d{6}$/.test(verificationCode.trim())) {
      setError('Enter the six-digit code sent to your email.')
      return
    }

    setLoading(true)
    try {
      const verification = await apiRequest<{ verified: boolean; signupToken: string }>('/api/auth/signup/verify-code', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), code: verificationCode.trim() }),
      })
      if (!verification.verified || !verification.signupToken) throw new Error('Email confirmation failed.')
      await apiRequest<{ created: boolean }>('/api/auth/signup/register', {
        method: 'POST',
        body: JSON.stringify({
        name: fullName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        dob,
        college,
        program: program.trim(),
        year,
        studentId: studentId.trim(),
        signupToken: verification.signupToken,
        }),
      })
      navigate(`/login?registered=1&email=${encodeURIComponent(email.trim())}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Email confirmation failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="login">
      <div className="login__layout login__layout--signup">
        <AuthShowcase />
        <div className="login__card login__card--wide">
        <div className="login__header">
          <img src="/ur-logo.png" alt="University of Rwanda logo" className="login__logo" />
          <span className="login__eyebrow">STUDENT SERVICES PORTAL PREVIEW</span>
          <h1>Create your preview account</h1>
          <p>Create your account once, then sign in whenever you return.</p>
        </div>

        <div className="login__info" role="note">
          <strong>Not connected to University records</strong>
          <p>Your account and request progress are saved on the portal server. This preview does not verify student IDs or enrollment with the University.</p>
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

        {error && <div className="login__error" role="alert" aria-live="assertive" style={{ marginBottom: '1rem' }}>{error}</div>}

        <form className="login__form" onSubmit={step === 3 ? handleSubmit : (step === 1 ? handleNextStep1 : handleNextStep2)}>
          {step === 1 && (
            <div className="login__step-content">
              <div className="login__field">
                <label htmlFor="signup-full-name">Full Name</label>
                <input
                  id="signup-full-name"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="login__field">
                <label htmlFor="signup-phone">Phone Number</label>
                <input
                  id="signup-phone"
                  type="tel"
                  placeholder="+250 78X XXX XXX"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                />
              </div>
              <div className="login__field">
                <label htmlFor="signup-dob">Date of Birth</label>
                <input
                  id="signup-dob"
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
                <label htmlFor="signup-student-id">University Student ID</label>
                <input
                  id="signup-student-id"
                  type="text"
                  placeholder="UR/2026/CST/123"
                  value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                  autoComplete="off"
                  required
                />
                <small>Enter your student ID. This preview does not validate it against University records.</small>
              </div>
              <div className="login__field">
                <label htmlFor="signup-college">College</label>
                <select
                  id="signup-college"
                  className="login__select"
                  value={college}
                  onChange={e => setCollege(e.target.value)}
                  required
                >
                  <option value="" disabled>Select your college</option>
                  {['CST', 'CBE', 'CASS', 'CE', 'CMHS', 'CAFF', 'CVAS'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="login__field">
                <label htmlFor="signup-program">Program of Study</label>
                <input
                  id="signup-program"
                  type="text"
                  placeholder="e.g. Computer Science"
                  value={program}
                  onChange={e => setProgram(e.target.value)}
                  required
                />
              </div>
              <div className="login__field">
                <label htmlFor="signup-year">Year of Study</label>
                <select
                  id="signup-year"
                  className="login__select"
                  value={year}
                  onChange={e => setYear(e.target.value)}
                  required
                >
                  <option value="" disabled>Select your year</option>
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
                <label htmlFor="signup-email">Email address</label>
                <input
                  id="signup-email"
                  type="email"
                  placeholder="student.name@ur.ac.rw"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value)
                    setCodeSent(false)
                    setVerificationCode('')
                  }}
                  required
                />
                <small style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.78rem', marginTop: '4px', lineHeight: 1.5 }}>
                  We send a confirmation code to verify you can access this address. Email verification does not confirm student status.
                </small>
              </div>
              {!codeSent ? (
                <>
                  <div className="login__field">
                    <label htmlFor="signup-password">Password</label>
                    <div className="login__password-wrap">
                      <input
                        id="signup-password"
                        type={passwordVisible ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <button type="button" className="login__password-toggle" aria-label={passwordVisible ? 'Hide password' : 'Show password'} aria-pressed={passwordVisible} onClick={() => setPasswordVisible(value => !value)}>
                        {passwordVisible ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                  <div className="login__field">
                    <label htmlFor="signup-confirm-password">Confirm Password</label>
                    <div className="login__password-wrap">
                      <input
                        id="signup-confirm-password"
                        type={confirmPasswordVisible ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                      />
                      <button type="button" className="login__password-toggle" aria-label={confirmPasswordVisible ? 'Hide confirmation password' : 'Show confirmation password'} aria-pressed={confirmPasswordVisible} onClick={() => setConfirmPasswordVisible(value => !value)}>
                        {confirmPasswordVisible ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                  <label className="login__checkbox">
                    <input
                      type="checkbox"
                      checked={acknowledgePreview}
                      onChange={e => setAcknowledgePreview(e.target.checked)}
                      required
                    /> I understand this is a preview and is not connected to official University records.
                  </label>
                </>
              ) : (
                <>
                  <p role="status" style={{ color: '#166534' }}>
                    Confirmation code sent to {email.trim()}. The code expires in 15 minutes.
                  </p>
                  <div className="login__field">
                    <label htmlFor="signup-confirmation-code">Email confirmation code</label>
                    <input
                      id="signup-confirmation-code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      placeholder="6-digit code"
                      value={verificationCode}
                      onChange={e => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                    />
                  </div>
                  <button type="button" className="login__btn login__btn--outline" onClick={() => void handleSendCode()} disabled={loading}>
                    Resend confirmation code
                  </button>
                </>
              )}
              <div className="login__step-nav">
                <button type="button" className="login__btn login__btn--outline" onClick={() => { setError(''); setStep(2) }}>← Back</button>
                {!codeSent ? (
                  <button type="submit" className="login__btn" disabled={loading}>
                    {loading ? 'Sending code...' : 'Send confirmation code'}
                  </button>
                ) : (
                  <button type="button" className="login__btn" onClick={() => void handleVerifyCode()} disabled={loading}>
                    {loading ? 'Verifying...' : 'Verify email & create account'}
                  </button>
                )}
              </div>
            </div>
          )}
        </form>

        <p className="login__footer">
          Already have an account? <Link to="/login">Sign In with Credentials</Link>
        </p>
        </div>
      </div>
    </section>
  )
}
