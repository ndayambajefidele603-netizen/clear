import Hero from '../components/Hero'
import Features from '../components/Features'
import About from '../components/About'
import Contact from '../components/Contact'

const workflowSteps = [
  { number: '01', title: 'Create your student profile', desc: 'Register with your university identity and complete your academic details in a few clicks.' },
  { number: '02', title: 'Upload required documents', desc: 'Submit transcripts, ID copies, and supporting records for digital verification.' },
  { number: '03', title: 'Approval pipeline', desc: 'Each leader reviews the request in sequence until the final issuance is approved.' },
  { number: '04', title: 'Receive certificate or transcript', desc: 'Track progress in real time and access your official documents when the request is ready.' },
]

const trustStats = [
  'Role-based access for students and leaders',
  'Automatic audit trail and activity history',
  'Paperless processing across all colleges',
  'Responsive system optimized for daily use',
]

export default function Home() {
  return (
    <main>
      <Hero />

      <section className="section" style={{ background: '#f8fafc' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <p style={{ fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '0.75rem', marginBottom: '12px' }}>How it works</p>
            <h2 className="section-title" style={{ marginBottom: '16px' }}>A smarter clearance journey</h2>
            <p className="section-subtitle">From registration to official issuance, each step is designed to reduce delays, improve transparency, and create a smoother student experience.</p>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '28px', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '0.75rem', marginBottom: '14px' }}>Why institutions choose us</p>
              <h2 className="section-title" style={{ textAlign: 'left', marginBottom: '18px' }}>Built for institutions that need speed, accountability, and trust.</h2>
              <p className="section-subtitle" style={{ textAlign: 'left', margin: '0 0 26px' }}>CLEAR&TRANS helps universities modernize approval workflows while keeping every step transparent for students and staff.</p>
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
              <p style={{ color: '#93c5fd', fontWeight: 700, marginBottom: '10px' }}>Live Operations Snapshot</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
                <div style={{ background: 'rgba(148, 163, 184, 0.12)', padding: '18px', borderRadius: '16px' }}>
                  <div style={{ fontSize: '1.7rem', fontWeight: 800 }}>96%</div>
                  <div style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>Student satisfaction</div>
                </div>
                <div style={{ background: 'rgba(59, 130, 246, 0.18)', padding: '18px', borderRadius: '16px' }}>
                  <div style={{ fontSize: '1.7rem', fontWeight: 800 }}>24/7</div>
                  <div style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>Access to portal</div>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.14)', padding: '18px', borderRadius: '16px' }}>
                  <div style={{ fontSize: '1.7rem', fontWeight: 800 }}>3x</div>
                  <div style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>Faster processing</div>
                </div>
                <div style={{ background: 'rgba(245, 158, 11, 0.12)', padding: '18px', borderRadius: '16px' }}>
                  <div style={{ fontSize: '1.7rem', fontWeight: 800 }}>100%</div>
                  <div style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>Digital trail</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Contact />
    </main>
  )
}
