import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import './Login.css'

export default function Signup() {
  const [step, setStep] = useState(1)
  const { login } = useApp()
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    login('student@ur.ac.rw', 'student')
    navigate('/dashboard')
  }

  return (
    <section className="login">
      <div className="login__card login__card--wide">
        <div className="login__header">
          <img src="/ur-logo.png" alt="UR" className="login__logo" />
          <h2>Create Your Account</h2>
          <p>Join the University of Rwanda digital clearance system</p>
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

        <form className="login__form" onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="login__step-content">
              <div className="login__field">
                <label>Full Name</label>
                <input type="text" placeholder="Jean-Paul Ndayambaje" required />
              </div>
              <div className="login__field">
                <label>Phone Number</label>
                <input type="tel" placeholder="+250 7XX XXX XXX" required />
              </div>
              <div className="login__field">
                <label>Date of Birth</label>
                <input type="date" required />
              </div>
              <button type="button" className="login__btn" onClick={() => setStep(2)}>Next →</button>
            </div>
          )}

          {step === 2 && (
            <div className="login__step-content">
              <div className="login__field">
                <label>Student ID</label>
                <input type="text" placeholder="UR/2024/CST/XXX" required />
              </div>
              <div className="login__field">
                <label>College</label>
                <select className="login__select" required>
                  <option value="">Select your college</option>
                  {['CST', 'CBE', 'CASS', 'CE', 'CMHS', 'CAFF', 'CVAS'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="login__field">
                <label>Program of Study</label>
                <input type="text" placeholder="e.g. Computer Science" required />
              </div>
              <div className="login__field">
                <label>Year of Study</label>
                <select className="login__select" required>
                  <option value="">Select year</option>
                  <option>Year 1</option>
                  <option>Year 2</option>
                  <option>Year 3</option>
                  <option>Year 4</option>
                  <option>Year 5+</option>
                </select>
              </div>
              <div className="login__step-nav">
                <button type="button" className="login__btn login__btn--outline" onClick={() => setStep(1)}>← Back</button>
                <button type="button" className="login__btn" onClick={() => setStep(3)}>Next →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="login__step-content">
              <div className="login__field">
                <label>Email Address</label>
                <input type="email" placeholder="you@ur.ac.rw" required />
              </div>
              <div className="login__field">
                <label>Password</label>
                <input type="password" placeholder="Min 8 characters" required minLength={8} />
              </div>
              <div className="login__field">
                <label>Confirm Password</label>
                <input type="password" placeholder="Re-enter password" required />
              </div>
              <label className="login__checkbox">
                <input type="checkbox" required /> I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
              </label>
              <div className="login__step-nav">
                <button type="button" className="login__btn login__btn--outline" onClick={() => setStep(2)}>← Back</button>
                <button type="submit" className="login__btn">Create Account</button>
              </div>
            </div>
          )}
        </form>

        <p className="login__footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </section>
  )
}
