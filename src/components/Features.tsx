import { useReveal } from '../hooks/useReveal'
import './Features.css'

const features = [
  {
    icon: '✓',
    title: 'Digital Clearance',
    desc: 'Students complete clearance across all departments — library, finance, hostel, and academics — entirely online.',
  },
  {
    icon: '📜',
    title: 'Transcript Management',
    desc: 'Request, process, and issue academic transcripts digitally with secure verification and audit trails.',
  },
  {
    icon: '🔒',
    title: 'Secure Access',
    desc: 'Role-based authentication for students, staff, and administrators with end-to-end encryption.',
  },
  {
    icon: '📊',
    title: 'Real-time Dashboard',
    desc: 'Live tracking of clearance status, transcript requests, and department approvals at a glance.',
  },
  {
    icon: '📱',
    title: 'Mobile Friendly',
    desc: 'Fully responsive design that works seamlessly across desktops, tablets, and smartphones.',
  },
  {
    icon: '📎',
    title: 'Document Upload',
    desc: 'Upload and verify supporting documents directly through the platform with automatic validation.',
  },
]

export default function Features() {
  const { ref, visible } = useReveal()

  return (
    <section id="features" className="features section" ref={ref}>
      <div className="container">
        <div className={`features__header ${visible ? 'reveal--visible' : ''}`} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.6s ease' }}>
          <h2 className="section-title">Everything You Need</h2>
          <p className="section-subtitle">
            A complete digital ecosystem for managing student clearance and transcript workflows.
          </p>
        </div>
        <div className="features__grid">
          {features.map((f, i) => (
            <div
              key={i}
              className="features__card hover-lift hover-glow"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(30px)',
                transition: `all 0.5s ease ${0.1 + i * 0.08}s`,
              }}
            >
              <span className="features__icon">{f.icon}</span>
              <h3 className="features__title">{f.title}</h3>
              <p className="features__desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
