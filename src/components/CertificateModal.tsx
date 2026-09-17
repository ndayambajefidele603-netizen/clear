import { useState } from 'react'
import type { StudentRequest, StudentRecord } from '../context/AppContext'
import { UR_HIERARCHY } from '../context/AppContext'
import './CertificateModal.css'

interface CertificateModalProps {
  request: StudentRequest
  student: StudentRecord
  onClose: () => void
}

export default function CertificateModal({ request, student, onClose }: CertificateModalProps) {
  const [copied, setCopied] = useState(false)
  const isClearance = request.type === 'clearance'
  const certRef = request.certificateRef || `${isClearance ? 'CLR' : 'TRS'}-CERT-${Math.floor(Math.random() * 8999 + 1000)}`
  const verificationUrl = `https://clearance.ur.ac.rw/verify/${certRef}`

  const handlePrint = () => {
    window.print()
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="cert-modal__backdrop" onClick={onClose}>
      <div className="cert-modal__dialog" onClick={e => e.stopPropagation()}>
        <div className="cert-modal__actions-bar no-print">
          <div className="cert-modal__status-tag">
            <span className="cert-modal__status-dot" />
            Official University Certificate
          </div>
          <div className="cert-modal__btn-group">
            <button className="cert-btn cert-btn--print" onClick={handlePrint}>
              🖨️ Print / Download PDF
            </button>
            <button className="cert-btn cert-btn--share" onClick={handleCopyLink}>
              {copied ? '✓ Link Copied' : '🔗 Copy Verify Link'}
            </button>
            <button className="cert-btn cert-btn--close" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        </div>

        {/* Printable Certificate Page */}
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
                      has fulfilled all institutional requirements and is officially cleared by all relevant departments, including Departmental Academic Affairs, Library, Finance & Administration, and the Office of the Registrar, with no outstanding liabilities.
                    </p>
                  ) : (
                    <p>
                      has satisfied all academic evaluation criteria and holds an authentic academic transcript issued directly by the University of Rwanda Office of the Registrar.
                    </p>
                  )}
                </div>

                <div className="cert-seal-row">
                  <div className="cert-badge-box">
                    <div className="cert-stamp">
                      <div className="cert-stamp-inner">
                        <span>UR APPROVED</span>
                        <small>DIGITAL SEAL</small>
                        <span className="cert-stamp-date">{request.completedAt || new Date().toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="cert-qr-box">
                    <svg viewBox="0 0 100 100" className="cert-qr-svg">
                      <rect width="100" height="100" fill="#ffffff" />
                      {/* Simulated QR Pattern */}
                      <path d="M10,10 h30 v30 h-30 z M15,15 h20 v20 h-20 z M20,20 h10 v10 h-10 z" fill="#1e293b" />
                      <path d="M60,10 h30 v30 h-30 z M65,15 h20 v20 h-20 z M70,20 h10 v10 h-10 z" fill="#1e293b" />
                      <path d="M10,60 h30 v30 h-30 z M15,65 h20 v20 h-20 z M20,70 h10 v10 h-10 z" fill="#1e293b" />
                      <path d="M45,15 h10 v10 h-10 z M45,35 h10 v10 h-10 z M15,45 h10 v10 h-10 z M35,45 h10 v10 h-10 z" fill="#1e293b" />
                      <path d="M60,60 h10 v10 h-10 z M80,60 h10 v10 h-10 z M70,70 h20 v10 h-20 z M60,80 h10 v10 h-10 z M80,80 h10 v10 h-10 z" fill="#1e293b" />
                    </svg>
                    <small>Scan to Verify</small>
                  </div>
                </div>

                {/* 4 Leader Digital Signatures */}
                <div className="cert-signatures">
                  {UR_HIERARCHY.map(leader => {
                    const step = request.steps.find(s => s.level === leader.level)
                    return (
                      <div key={leader.id} className="cert-sig-card">
                        <div className="cert-sig-line">
                          {step?.signature || leader.name}
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
      </div>
    </div>
  )
}
