import { useState } from 'react'
import jsPDF from 'jspdf'
import type { StudentRequest, StudentRecord } from '../context/AppContext'
import { UR_HIERARCHY } from '../context/AppContext'
import './CertificateModal.css'

interface CertificateModalProps {
  request: StudentRequest
  student: StudentRecord
  onClose: () => void
}

const SAMPLE_COURSES = [
  { code: 'CSC101', title: 'Introduction to Computer Programming', credits: 15, grade: 'A', points: 4.0 },
  { code: 'MAT101', title: 'Calculus & Applied Linear Algebra', credits: 15, grade: 'A', points: 4.0 },
  { code: 'PHY101', title: 'Fundamentals of Digital Electronics', credits: 15, grade: 'B+', points: 3.5 },
  { code: 'ENG101', title: 'Professional Academic Communication', credits: 15, grade: 'A', points: 4.0 },
  { code: 'CSC201', title: 'Data Structures & Algorithms', credits: 15, grade: 'A', points: 4.0 },
  { code: 'CSC202', title: 'Relational Database Management Systems', credits: 15, grade: 'A', points: 4.0 },
  { code: 'CSC203', title: 'Computer Networks & Internet Protocols', credits: 15, grade: 'A-', points: 3.75 },
  { code: 'MAT201', title: 'Discrete Mathematics for Computing', credits: 15, grade: 'A', points: 4.0 },
  { code: 'CSC301', title: 'Software Engineering Methodologies', credits: 15, grade: 'A', points: 4.0 },
  { code: 'CSC302', title: 'Operating Systems & Architecture', credits: 15, grade: 'A', points: 4.0 },
  { code: 'CSC303', title: 'Artificial Intelligence & Machine Learning', credits: 15, grade: 'A', points: 4.0 },
  { code: 'CSC304', title: 'Cybersecurity Principles & Web Technologies', credits: 15, grade: 'A', points: 4.0 },
  { code: 'CSC401', title: 'Final Year Capstone Research & Dissertation', credits: 30, grade: 'A', points: 4.0 },
  { code: 'CSC402', title: 'Cloud Computing Infrastructure & DevOps', credits: 15, grade: 'A', points: 4.0 },
  { code: 'CSC403', title: 'Professional Ethics & Tech Leadership', credits: 15, grade: 'A', points: 4.0 },
]

export default function CertificateModal({ request, student, onClose }: CertificateModalProps) {
  const [copied, setCopied] = useState(false)
  const isClearance = request.type === 'clearance'
  const [viewMode, setViewMode] = useState<'cert' | 'transcript'>(isClearance ? 'cert' : 'transcript')
  const certRef = request.certificateRef || `${isClearance ? 'CLR' : 'TRS'}-CERT-${Math.floor(Math.random() * 8999 + 1000)}`
  const verificationUrl = `https://clearance.ur.ac.rw/verify/${certRef}`

  if (request.status !== 'completed') {
    return null
  }

  const getDynamicSignature = (leader: (typeof UR_HIERARCHY)[number], step?: typeof request.steps[number]) => {
    const fullName = leader.name
    const initials = leader.name.split(' ').map(piece => piece[0]).join('').toUpperCase()
    const date = step?.date || new Date().toLocaleDateString()
    return step?.signature || `${fullName} • ${leader.title} • ${date} • ${initials}`
  }

  const handlePrint = () => {
    window.print()
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const downloadDocument = () => {
    // Try server-side download first
    const serverUrl = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/requests/${request.id}/certificate`
    fetch(serverUrl)
      .then(resp => {
        if (!resp.ok) throw new Error('server pdf not available')
        return resp.blob()
      })
      .then(blob => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${student.id}-${isClearance ? 'clearance' : 'transcript'}-${request.id}.pdf`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
      })
      .catch(() => {
        // fallback to client-side generation

    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 48

    doc.setFillColor(15, 23, 42)
    doc.rect(0, 0, pageWidth, 82, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text('UNIVERSITY OF RWANDA', margin, 34)
    doc.setFontSize(12)
    doc.text('CLEAR&TRANS OFFICIAL RECORDS', margin, 54)

    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.text(isClearance ? 'OFFICIAL CLEARANCE CERTIFICATE' : 'OFFICIAL ACADEMIC TRANSCRIPT', margin, 120)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    const lines = [
      `Student Name: ${student.name}`,
      `Registration No: ${student.id}`,
      `College: ${student.college}`,
      `Program: ${student.program}`,
      `Year: ${student.year}`,
      `Reference Code: ${certRef}`,
      `Issue Date: ${request.completedAt || new Date().toLocaleDateString()}`,
      '',
      isClearance
        ? 'This certificate confirms that the student has fulfilled all institutional clearance requirements and is approved without outstanding liabilities.'
        : 'This transcript confirms that the student has satisfied all academic evaluation requirements and is officially certified by the University of Rwanda.',
      '',
      'Status: APPROVED',
      'Verified through the CLEAR&TRANS digital approval system.',
    ]

    lines.forEach((line, index) => {
      const y = 150 + index * 20
      if (y > pageHeight - 120) {
        doc.addPage()
      }
      doc.text(line, margin, y)
    })

    const signStart = 430
    const signSpacing = 110

    request.steps.forEach((step, idx) => {
      const leader = UR_HIERARCHY[idx]
      if (!leader) return

      const x = margin + idx * signSpacing
      doc.setDrawColor(148, 163, 184)
      doc.line(x, signStart, x + 80, signStart)
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(10)
      doc.text(String(step.signature || `${leader.name} • ${leader.title}`), x, signStart + 18)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text(leader.title, x, signStart + 32)
      doc.text(leader.name, x, signStart + 46)
    })

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 41, 59)
    doc.setFontSize(10)
    doc.text('Verification URL: https://clearance.ur.ac.rw/verify/' + certRef, margin, pageHeight - 40)

    doc.save(`${student.id}-${isClearance ? 'clearance' : 'transcript'}-${certRef}.pdf`)
      })
  }

  return (
    <div className="cert-modal__backdrop" onClick={onClose}>
      <div className="cert-modal__dialog" onClick={e => e.stopPropagation()}>
        <div className="cert-modal__actions-bar no-print">
          <div className="cert-modal__status-tag">
            <span className="cert-modal__status-dot" />
            {isClearance ? 'Official Clearance Certificate' : 'Official Academic Transcript & Certificate'}
          </div>

          {!isClearance && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className="cert-btn"
                onClick={() => setViewMode('transcript')}
                style={{
                  background: viewMode === 'transcript' ? '#2563eb' : '#334155',
                  color: '#fff',
                  fontSize: '0.8rem',
                  padding: '4px 10px'
                }}
              >
                📊 Full Academic Transcript
              </button>
              <button
                type="button"
                className="cert-btn"
                onClick={() => setViewMode('cert')}
                style={{
                  background: viewMode === 'cert' ? '#2563eb' : '#334155',
                  color: '#fff',
                  fontSize: '0.8rem',
                  padding: '4px 10px'
                }}
              >
                📜 Transcript Certificate
              </button>
            </div>
          )}

          <div className="cert-modal__btn-group">
            <button className="cert-btn cert-btn--print" onClick={handlePrint}>
              🖨️ Print / Download PDF
            </button>
            <button className="cert-btn cert-btn--share" onClick={downloadDocument}>
              ⬇️ Download Official File
            </button>
            <button className="cert-btn cert-btn--share" onClick={handleCopyLink}>
              {copied ? '✓ Link Copied' : '🔗 Copy Verify Link'}
            </button>
            <button className="cert-btn cert-btn--close" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        </div>

        {/* VIEW 1: Official Certificate Page */}
        {viewMode === 'cert' && (
          <div className="cert-page" id="printable-certificate">
            <div className="cert-border">
              <div className="cert-inner">
                {/* Decorative Corner Flourishes */}
                <div className="cert-corner cert-corner--tl" />
                <div className="cert-corner cert-corner--tr" />
                <div className="cert-corner cert-corner--bl" />
                <div className="cert-corner cert-corner--br" />

                {/* Watermark Logo */}
                <div className="cert-watermark">UR</div>

                {/* Certificate Header */}
                <header className="cert-header">
                  <div className="cert-republic">
                    <span>REPUBLIC OF RWANDA</span>
                    <small>MINISTRY OF EDUCATION</small>
                  </div>
                  <div className="cert-brand-row">
                    <img src="/ur-logo.png" alt="University of Rwanda" className="cert-logo" />
                    <div className="cert-title-group">
                      <h1 className="cert-univ-name">UNIVERSITY OF RWANDA</h1>
                      <h2 className="cert-doc-title">
                        {isClearance ? 'OFFICIAL CERTIFICATE OF CLEARANCE' : 'OFFICIAL ACADEMIC TRANSCRIPT CERTIFICATE'}
                      </h2>
                      <p className="cert-ref-no">Reference Code: <strong>{certRef}</strong></p>
                    </div>
                  </div>
                </header>

                {/* Preamble & Student Details */}
                <main className="cert-body">
                  <p className="cert-salutation">This is to certify that</p>
                  <h2 className="cert-student-name">{student.name}</h2>
                  <p className="cert-meta-line">
                    Registration No: <strong>{student.id}</strong> | College: <strong>{student.college}</strong>
                  </p>
                  <p className="cert-meta-sub">
                    Program: <strong>{student.program}</strong> ({student.year})
                  </p>

                  <div className="cert-statement">
                    {isClearance ? (
                      <p>
                        has fulfilled all institutional requirements and is officially cleared by all relevant university authorities, including Academic Affairs, Department Head, College Dean, and Office of the Registrar, with zero outstanding liabilities.
                      </p>
                    ) : (
                      <p>
                        has satisfied all academic evaluation criteria and holds an authentic, official academic transcript issued directly by the University of Rwanda Office of the Registrar under reference <strong>{certRef}</strong>.
                      </p>
                    )}
                  </div>

                  <div className="cert-seal-row">
                    <div className="cert-badge-box">
                      <div className="cert-stamp">
                        <div className="cert-stamp-inner">
                          <span>UR APPROVED</span>
                          <small>OFFICIAL SEAL</small>
                          <span className="cert-stamp-date">{request.completedAt || new Date().toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="cert-qr-box">
                      <svg viewBox="0 0 100 100" className="cert-qr-svg">
                        <rect width="100" height="100" fill="#ffffff" />
                        <path d="M10,10 h30 v30 h-30 z M15,15 h20 v20 h-20 z M20,20 h10 v10 h-10 z" fill="#1e293b" />
                        <path d="M60,10 h30 v30 h-30 z M65,15 h20 v20 h-20 z M70,20 h10 v10 h-10 z" fill="#1e293b" />
                        <path d="M10,60 h30 v30 h-30 z M15,65 h20 v20 h-20 z M20,70 h10 v10 h-10 z" fill="#1e293b" />
                        <path d="M45,15 h10 v10 h-10 z M45,35 h10 v10 h-10 z M15,45 h10 v10 h-10 z M35,45 h10 v10 h-10 z" fill="#1e293b" />
                        <path d="M60,60 h10 v10 h-10 z M80,60 h10 v10 h-10 z M70,70 h20 v10 h-20 z M60,80 h10 v10 h-10 z M80,80 h10 v10 h-10 z" fill="#1e293b" />
                      </svg>
                      <small>Scan to Verify Online</small>
                    </div>
                  </div>

                  {/* 4 Leader Digital Signatures */}
                  <div className="cert-signatures">
                    {UR_HIERARCHY.map(leader => {
                      const step = request.steps.find(s => s.level === leader.level)
                      return (
                        <div key={leader.id} className="cert-sig-card">
                          <div className="cert-sig-line" style={{ fontFamily: 'cursive, serif' }}>
                            {getDynamicSignature(leader, step)}
                          </div>
                          <strong className="cert-sig-title">{leader.title}</strong>
                          <span className="cert-sig-name">{leader.name}</span>
                          <span className="cert-sig-date">{step?.date || 'Verified'}</span>
                        </div>
                      )
                    })}
                  </div>
                </main>

                {/* Certificate Footer */}
                <footer className="cert-footer">
                  <p>Issued by the University of Rwanda Central Clearance Registry · Valid without physical alteration.</p>
                  <p className="cert-footer-verify">Verification URL: {verificationUrl}</p>
                </footer>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: Complete Official Academic Transcript Document */}
        {viewMode === 'transcript' && (
          <div className="cert-page" id="printable-transcript" style={{ color: '#0f172a', background: '#fff', padding: '2rem' }}>
            {/* Transcript Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img src="/ur-logo.png" alt="University of Rwanda" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
                <div>
                  <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>UNIVERSITY OF RWANDA</h1>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>OFFICE OF THE REGISTRAR & ACADEMIC AFFAIRS</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>P.O. Box 4285 Kigali, Rwanda | registrar@ur.ac.rw</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'inline-block', background: '#0f172a', color: '#fff', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700, borderRadius: '4px', marginBottom: '4px' }}>
                  OFFICIAL TRANSCRIPT
                </span>
                <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700 }}>Serial: {certRef}</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Issued: {request.completedAt || new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Student Info Box */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div><strong>Student Name:</strong> {student.name}</div>
              <div><strong>Registration No:</strong> {student.id}</div>
              <div><strong>College:</strong> {student.college}</div>
              <div><strong>Program:</strong> {student.program}</div>
              <div><strong>Year of Study:</strong> {student.year}</div>
              <div><strong>Cumulative GPA:</strong> <span style={{ color: '#059669', fontWeight: 800 }}>3.86 / 4.00</span></div>
              <div><strong>Award Standing:</strong> <span style={{ fontWeight: 700, color: '#1d4ed8' }}>First Class Honours</span></div>
              <div><strong>Status:</strong> <span style={{ color: '#059669', fontWeight: 700 }}>Graduated / Fully Cleared</span></div>
            </div>

            {/* Course Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
              <thead>
                <tr style={{ background: '#0f172a', color: '#fff', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px', border: '1px solid #334155' }}>Course Code</th>
                  <th style={{ padding: '8px 10px', border: '1px solid #334155' }}>Course Module Title</th>
                  <th style={{ padding: '8px 10px', border: '1px solid #334155', textAlign: 'center' }}>Credits</th>
                  <th style={{ padding: '8px 10px', border: '1px solid #334155', textAlign: 'center' }}>Letter Grade</th>
                  <th style={{ padding: '8px 10px', border: '1px solid #334155', textAlign: 'center' }}>Grade Points</th>
                </tr>
              </thead>
              <tbody>
                {SAMPLE_COURSES.map((c, idx) => (
                  <tr key={c.code} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 700, border: '1px solid #e2e8f0' }}>{c.code}</td>
                    <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0' }}>{c.title}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>{c.credits}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700, color: '#059669', border: '1px solid #e2e8f0' }}>{c.grade}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 600, border: '1px solid #e2e8f0' }}>{c.points.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f1f5f9', fontWeight: 700 }}>
                  <td colSpan={2} style={{ padding: '8px 10px', border: '1px solid #cbd5e1' }}>Cumulative Total Earned Credits: 240 Credits</td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', border: '1px solid #cbd5e1' }}>240</td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', border: '1px solid #cbd5e1', color: '#059669' }}>CGPA: 3.86</td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', border: '1px solid #cbd5e1' }}>Grade: A</td>
                </tr>
              </tfoot>
            </table>

            {/* Official Certification and Signatures */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '2px solid #e2e8f0', paddingTop: '1rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '50%',
                  border: '2px dashed #059669', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', color: '#059669',
                  fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', textAlign: 'center'
                }}>
                  <span>UR OFFICIAL</span>
                  <span>REGISTRAR</span>
                  <span>SEAL</span>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#475569' }}>This official transcript is digitally certified under the</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700 }}>University of Rwanda Academic Quality Assurance Framework.</p>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Verify authentic digital copy: {verificationUrl}</p>
                </div>
              </div>

              <div style={{ textAlign: 'center', minWidth: '180px' }}>
                <div style={{ fontFamily: 'Brush Script MT, cursive', fontSize: '1.4rem', color: '#1e3a8a', borderBottom: '1px solid #0f172a', paddingBottom: '4px', marginBottom: '4px' }}>
                  {request.steps.find(s => s.level === 4)?.signature || 'Dr. Rose Mukamana'}
                </div>
                <strong style={{ fontSize: '0.8rem', display: 'block', color: '#0f172a' }}>Dr. Rose Mukamana</strong>
                <span style={{ fontSize: '0.75rem', color: '#475569' }}>Academic Registrar / DVC</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
