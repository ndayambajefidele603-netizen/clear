import { useReveal } from '../hooks/useReveal'
import './Features.css'

const features = [
  {
    icon: '✓',
    title: 'Digital Clearance',
    desc: 'Start a clearance request, provide the required information, and follow its review stages from your dashboard.',
  },
  {
    icon: '📜',
    title: 'Transcript Management',
    desc: 'Submit a transcript request and check its progress through the institutional review process.',
  },
  {
    icon: '◉',
    title: 'Role-specific workspaces',
    desc: 'Separate student and reviewer interfaces keep service requests and review tasks easy to navigate.',
  },
  {
    icon: '📊',
    title: 'Request dashboard',
    desc: 'See submitted services, review stages, document requirements, and recent status updates.',
  },
  {
    icon: '📱',
    title: 'Responsive access',
    desc: 'Use the portal on desktop, tablet, or mobile with layouts designed for smaller screens.',
  },
  {
    icon: '📎',
    title: 'Document Upload',
    desc: 'Keep supporting-document requirements together with each clearance or transcript request.',
  },
]

export default function Features() {
  const { ref, visible } = useReveal()

  return (
    <section id="features" className="features section" ref={ref} aria-labelledby="features-title">
      <div className="container">
        <div className={`features__header ${visible ? 'reveal--visible' : ''}`} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.6s ease' }}>
          <h2 id="features-title" className="section-title">Services and tools</h2>
          <p className="section-subtitle">
            A focused portal preview for student service requests, document requirements, and review progress.
          </p>
        </div>
        <div className="features__grid">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="features__card hover-lift hover-glow"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(30px)',
                transition: `all 0.5s ease ${0.1 + i * 0.08}s`,
              }}
            >
              <span className="features__icon" aria-hidden="true">{f.icon}</span>
              <h3 className="features__title">{f.title}</h3>
              <p className="features__desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
