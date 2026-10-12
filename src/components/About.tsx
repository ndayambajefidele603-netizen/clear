import { useReveal } from '../hooks/useReveal'
import './About.css'

export default function About() {
  const { ref, visible } = useReveal()
  const servicesRef = useReveal()

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
              CLEAR&TRANS brings the student-facing steps for clearance and transcript
              requests into one guided portal experience. Students can see the information
              they need to provide and return to follow request progress.
            </p>
            <div className="about__points">
              {[
                'Two clearly separated student services',
                'Document checklists attached to each request',
                'Review stages visible to students and reviewers',
                'A dashboard for request status and recent updates',
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
          <div className="about__stats-grid" ref={servicesRef.ref} style={{
            opacity: servicesRef.visible ? 1 : 0,
            transform: servicesRef.visible ? 'translateX(0)' : 'translateX(30px)',
            transition: 'all 0.7s ease 0.2s',
          }}>
            <div className="about__stat-card hover-lift">
              <span className="about__stat-number" aria-hidden="true">01</span>
              <span className="about__stat-desc">Choose a service and submit a request</span>
            </div>
            <div className="about__stat-card hover-lift">
              <span className="about__stat-number" aria-hidden="true">02</span>
              <span className="about__stat-desc">Provide the required supporting details</span>
            </div>
            <div className="about__stat-card hover-lift">
              <span className="about__stat-number" aria-hidden="true">03</span>
              <span className="about__stat-desc">Follow review progress through the portal</span>
            </div>
            <div className="about__stat-card hover-lift">
              <span className="about__stat-number" aria-hidden="true">04</span>
              <span className="about__stat-desc">Check the outcome and any next steps</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
