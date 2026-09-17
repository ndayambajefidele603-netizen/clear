import { Link } from 'react-router-dom'
import './Hero.css'

export default function Hero() {
  return (
    <section id="hero" className="hero">
      <div className="hero__bg-shapes">
        <div className="hero__shape hero__shape--1 anim-float" style={{ animationDelay: '0s' }} />
        <div className="hero__shape hero__shape--2 anim-float" style={{ animationDelay: '1.5s' }} />
        <div className="hero__shape hero__shape--3 anim-float" style={{ animationDelay: '0.8s' }} />
      </div>
      <div className="container hero__inner">
        <div className="hero__content">
          <span className="hero__badge anim-fade-in-down delay-1">🚀 School Management Solution</span>
          <h1 className="hero__title anim-fade-in-up delay-2">
            Digital Clearance &<br />
            <span className="hero__highlight">Transcript System</span>
          </h1>
          <p className="hero__desc anim-fade-in-up delay-3">
            Streamline student clearances and transcript requests with our all-in-one
            digital platform. Fast, secure, and paperless.
          </p>
          <div className="hero__actions anim-fade-in-up delay-4">
            <Link to="/signup" className="hero__btn hero__btn--primary">
              Get Started Free
            </Link>
            <a href="#features" className="hero__btn hero__btn--secondary">
              Learn More →
            </a>
          </div>
          <div className="hero__stats anim-fade-in-up delay-5">
            <div className="hero__stat">
              <span className="hero__stat-number">500+</span>
              <span className="hero__stat-label">Schools</span>
            </div>
            <div className="hero__stat">
              <span className="hero__stat-number">50K+</span>
              <span className="hero__stat-label">Students</span>
            </div>
            <div className="hero__stat">
              <span className="hero__stat-number">99.9%</span>
              <span className="hero__stat-label">Uptime</span>
            </div>
          </div>
        </div>
        <div className="hero__visual anim-scale-in delay-3">
          <div className="hero__card hero__card--1 hover-lift">
            <div className="hero__card-header">
              <div className="hero__card-dots">
                <span /><span /><span />
              </div>
              <span>Clearance Status</span>
            </div>
            <div className="hero__card-body">
              {['Library', 'Finance', 'Department', 'Hostel'].map((item, i) => (
                <div key={item} className="hero__card-row">
                  <span>{item}</span>
                  <span className={`hero__card-badge ${i < 3 ? 'hero__card-badge--ok' : 'hero__card-badge--pending'}`}>
                    {i < 3 ? '✓ Cleared' : '○ Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="hero__card hero__card--2 hover-lift" style={{ animationDelay: '0.2s' }}>
            <div className="hero__card-header">
              <div className="hero__card-dots">
                <span /><span /><span />
              </div>
              <span>Transcript Request</span>
            </div>
            <div className="hero__card-body">
              <div className="hero__card-row">
                <span>Status</span>
                <span className="hero__card-badge hero__card-badge--ok">Processing</span>
              </div>
              <div className="hero__card-progress">
                <div className="hero__card-progress-bar anim-shimmer" style={{ width: '65%' }} />
              </div>
              <span className="hero__card-progress-label">65% complete</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
