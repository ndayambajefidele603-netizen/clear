import { useReveal } from '../hooks/useReveal'
import './About.css'

export default function About() {
  const { ref, visible } = useReveal()
  const statsRef = useReveal()

  return (
    <section id="about" className="about section" ref={ref}>
      <div className="container">
        <div className="about__inner">
          <div className="about__content" style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateX(0)' : 'translateX(-30px)',
            transition: 'all 0.7s ease',
          }}>
            <h2 className="about__title">
              Built for Modern<br />
              <span className="about__highlight">Educational Institutions</span>
            </h2>
            <p className="about__text">
              CLEARKY is a comprehensive digital platform designed to eliminate the
              bureaucratic bottlenecks in student clearance and transcript processing.
              Our system connects departments, administrators, and students in a
              seamless digital workflow.
            </p>
            <div className="about__points">
              {[
                'Automated clearance routing across departments',
                'Digital transcript requests with e-signature',
                'Real-time notifications and status updates',
                'Detailed analytics and reporting',
              ].map((point, i) => (
                <div key={i} className="about__point" style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(15px)',
                  transition: `all 0.4s ease ${0.15 + i * 0.1}s`,
                }}>
                  <span className="about__check">✓</span>
                  {point}
                </div>
              ))}
            </div>
          </div>
          <div className="about__stats-grid" ref={statsRef.ref} style={{
            opacity: statsRef.visible ? 1 : 0,
            transform: statsRef.visible ? 'translateX(0)' : 'translateX(30px)',
            transition: 'all 0.7s ease 0.2s',
          }}>
            <div className="about__stat-card hover-lift">
              <span className="about__stat-number">98%</span>
              <span className="about__stat-desc">Faster clearance processing</span>
            </div>
            <div className="about__stat-card hover-lift">
              <span className="about__stat-number">0</span>
              <span className="about__stat-desc">Paperwork required</span>
            </div>
            <div className="about__stat-card hover-lift">
              <span className="about__stat-number">24/7</span>
              <span className="about__stat-desc">System availability</span>
            </div>
            <div className="about__stat-card hover-lift">
              <span className="about__stat-number">4.9★</span>
              <span className="about__stat-desc">User satisfaction</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
