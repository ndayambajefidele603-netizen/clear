import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import './Hero.css'

export default function Hero() {
  const { user } = useApp()
  const primaryDestination = user ? (user.role === 'leader' ? '/leader' : '/dashboard') : '/signup'

  return (
    <section id="hero" className="hero">
      <div className="hero__bg-shapes">
        <div className="hero__shape hero__shape--1 anim-float" style={{ animationDelay: '0s' }} />
        <div className="hero__shape hero__shape--2 anim-float" style={{ animationDelay: '1.5s' }} />
        <div className="hero__shape hero__shape--3 anim-float" style={{ animationDelay: '0.8s' }} />
      </div>
      <div className="container hero__inner">
        <div className="hero__content">
          <div className="hero__brand anim-fade-in-down delay-1">
            <img src="/ur-logo.png" alt="University of Rwanda" className="hero__brand-logo" />
            <div className="hero__brand-copy">
              <span>University of Rwanda</span>
              <small>Student services portal</small>
            </div>
          </div>
          <span className="hero__badge anim-fade-in-down delay-1">Clearance &amp; transcript services</span>
          <h1 className="hero__title anim-fade-in-up delay-2">
            Student services,<br />
            <span className="hero__highlight">clear and trackable.</span>
          </h1>
          <p className="hero__desc anim-fade-in-up delay-3">
            Submit a clearance or transcript request, follow its review progress, and see what
            action is needed from you in one convenient portal.
          </p>
          <div className="hero__actions anim-fade-in-up delay-4">
            <Link to={primaryDestination} className="hero__btn hero__btn--primary">
              {user ? 'Open your dashboard' : 'Create student account'}
            </Link>
            <Link to="/login" className="hero__btn hero__btn--secondary">Sign in</Link>
          </div>
          <p className="hero__note">One place to request services and keep track of next steps.</p>
        </div>
        <div className="hero__visual anim-scale-in delay-3" aria-label="Services available in the portal">
          <Link
            to={primaryDestination}
            className="hero__service-card hero__service-card--clearance"
            aria-label="Get started with academic clearance"
          >
            <span className="hero__service-icon" aria-hidden="true">✓</span>
            <div>
              <span className="hero__service-eyebrow">STUDENT SERVICE</span>
              <h2>Academic clearance</h2>
              <p>Submit supporting documents and follow each review stage.</p>
            </div>
            <span className="hero__service-arrow" aria-hidden="true">→</span>
          </Link>
          <Link
            to={primaryDestination}
            className="hero__service-card hero__service-card--transcript"
            aria-label="Get started with a transcript request"
          >
            <span className="hero__service-icon" aria-hidden="true">▤</span>
            <div>
              <span className="hero__service-eyebrow">STUDENT SERVICE</span>
              <h2>Transcript request</h2>
              <p>Request an academic record and check its processing status.</p>
            </div>
            <span className="hero__service-arrow" aria-hidden="true">→</span>
          </Link>
          <div className="hero__process-note">
            <span className="hero__process-mark" aria-hidden="true">i</span>
            <p>Each request follows the review steps configured by the institution.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
