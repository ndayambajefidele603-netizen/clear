import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Hero from '../components/Hero'
import Features from '../components/Features'
import About from '../components/About'
import Contact from '../components/Contact'
import './Home.css'

const workflowSteps = [
  { number: '01', title: 'Create your account', desc: 'Register once, confirm your email, and sign in whenever you return.' },
  { number: '02', title: 'Choose a service', desc: 'Start a clearance or transcript request from your student dashboard.' },
  { number: '03', title: 'Upload supporting files', desc: 'Submit required documents securely through your portal account.' },
  { number: '04', title: 'Follow each next step', desc: 'Return to your account to see saved request progress and updates.' },
]

const trustStats = [
  'Separate student and reviewer workspaces',
  'Request status and review milestones',
  'Clearance and transcript services in one portal',
  'Responsive interface for desktop and mobile',
]

export default function Home() {
  const { user } = useApp()
  const serviceDestination = user ? (user.role === 'leader' ? '/leader' : '/dashboard') : '/signup'

  return (
    <div className="home-page">
      <Hero />

      <section className="section" style={{ background: '#f8fafc' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <p style={{ fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '0.75rem', marginBottom: '12px' }}>How it works</p>
            <h2 className="section-title" style={{ marginBottom: '16px' }}>A clear request journey</h2>
            <p className="section-subtitle">Explore how the portal preview organizes service requests and review progress. Official records and decisions remain with the University.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            {workflowSteps.map(step => (
              <div key={step.number} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '24px', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)' }}>
                <span style={{ display: 'inline-flex', width: '42px', height: '42px', borderRadius: '12px', background: '#dbeafe', color: '#1d4ed8', fontWeight: 800, alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>{step.number}</span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>{step.title}</h3>
                <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Features />
      <About />

      <section className="section" style={{ background: 'linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '28px', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '0.75rem', marginBottom: '14px' }}>Designed for student services</p>
              <h2 className="section-title" style={{ textAlign: 'left', marginBottom: '18px' }}>A clearer path through essential student services.</h2>
              <p className="section-subtitle" style={{ textAlign: 'left', margin: '0 0 26px' }}>A single portal experience for requesting services, submitting supporting information, and following review progress.</p>
              <div style={{ display: 'grid', gap: '14px' }}>
                {trustStats.map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#fff', border: '1px solid #dbeafe', borderRadius: '12px', padding: '12px 14px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: '#dcfce7', color: '#15803d', fontWeight: 700 }}>✓</span>
                    <span style={{ color: '#1e293b', fontWeight: 600 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: '#0f172a', color: '#fff', borderRadius: '24px', padding: '28px', boxShadow: '0 20px 45px rgba(15, 23, 42, 0.18)' }}>
              <p style={{ color: '#93c5fd', fontWeight: 700, marginBottom: '8px' }}>PORTAL AT A GLANCE</p>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Two services. One clear journey.</h3>
              <p style={{ color: '#cbd5e1', lineHeight: 1.7, marginBottom: '22px' }}>
                Start a request, provide the information it needs, and return to your dashboard to see its current stage.
              </p>
              <div style={{ display: 'grid', gap: '12px' }}>
                {['Academic clearance', 'Academic transcript'].map((service, index) => (
                  <Link key={service} to={serviceDestination} className="home-page__service-link">
                    <span style={{ color: index === 0 ? '#5eead4' : '#93c5fd', fontWeight: 800 }}>{index === 0 ? '01' : '02'}</span>
                    <span style={{ fontWeight: 650 }}>{service}</span>
                    <span aria-hidden="true" style={{ marginLeft: 'auto', color: '#94a3b8' }}>→</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Contact />
      <p style={{ background: '#f1f5f9', color: '#475569', padding: '14px 24px', textAlign: 'center', fontSize: '0.8rem' }}>
        Portal preview: connect approved University of Rwanda identity, student-record, and service systems before official deployment.
      </p>
    </div>
  )
}
