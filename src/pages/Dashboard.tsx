import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp, UR_HIERARCHY, type RequestDocument, type StudentRequest } from '../context/AppContext'
import CertificateModal from '../components/CertificateModal'
import MeetingModal from '../components/MeetingModal'
import DocPreviewModal from '../components/DocPreviewModal'
import './Dashboard.css'

export default function Dashboard() {
  const { user, requests } = useApp()
  const [selectedCertRequest, setSelectedCertRequest] = useState<StudentRequest | null>(null)
  const [showMeeting, setShowMeeting] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<RequestDocument | null>(null)

  if (!user || user.role !== 'student') return null

  const profile = user.profile
  const studentRequests = requests
  const clearance = studentRequests.find(r => r.type === 'clearance')
  const transcript = studentRequests.find(r => r.type === 'transcript')

  const activeRequests = [clearance, transcript].filter(Boolean)
  const totalApproved = clearance?.steps.filter(s => s.status === 'approved').length || 0
  const totalSteps = clearance?.steps.length || 4
  const verifiedDocs = clearance?.docs.filter(d => d.verified).length || 0
  const totalDocs = clearance?.docs.length || 0
  const currentLeader = clearance ? UR_HIERARCHY.find(l => l.level === clearance.currentLevel) || UR_HIERARCHY[0] : UR_HIERARCHY[0]

  return (
    <section className="dash">
      <div className="container">
        <div className="dash__header">
          <div>
            <h1 className="dash__title">Student Dashboard</h1>
            <p className="dash__subtitle">{profile.name} — {profile.college}</p>
          </div>
          <div className="dash__student-info" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="dash__badge">{profile.id}</span>
            {clearance?.status === 'completed' && (
              <button
                className="dash__btn-cert"
                onClick={() => setSelectedCertRequest(clearance)}
                style={{
                  padding: '6px 14px', borderRadius: '20px', background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff', border: 'none', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                📜 Clearance Certificate
              </button>
            )}
            {transcript?.status === 'completed' && (
              <button
                className="dash__btn-cert"
                onClick={() => setSelectedCertRequest(transcript)}
                style={{
                  padding: '6px 14px', borderRadius: '20px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: '#fff', border: 'none', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                }}
              >
                📊 Official Transcript Ready
              </button>
            )}
          </div>
        </div>

        <div className="dash__overview">
          <div className="dash__overview-card">
            <div className="dash__overview-header">
              <span>Completion status</span>
              <strong>{Math.round(((clearance?.steps.filter(s => s.status === 'approved').length || 0) / Math.max(clearance?.steps.length || 1, 1)) * 100)}%</strong>
            </div>
            <div className="dash__progress-track">
              <span className="dash__progress-fill" style={{ width: `${Math.round(((clearance?.steps.filter(s => s.status === 'approved').length || 0) / Math.max(clearance?.steps.length || 1, 1)) * 100)}%` }} />
            </div>
          </div>
          <div className="dash__overview-card">
            <div className="dash__overview-header">
              <span>Document verification</span>
              <strong>{Math.round(((verifiedDocs || 0) / Math.max(totalDocs || 1, 1)) * 100)}%</strong>
            </div>
            <div className="dash__progress-track dash__progress-track--green">
              <span className="dash__progress-fill dash__progress-fill--green" style={{ width: `${Math.round(((verifiedDocs || 0) / Math.max(totalDocs || 1, 1)) * 100)}%` }} />
            </div>
          </div>
        </div>

        <div className="dash__stats">
          <div className="dash__stat">
            <div className="dash__stat-value" style={{ color: '#3b82f6' }}>{totalApproved}/{totalSteps}</div>
            <div className="dash__stat-label">Clearance Levels Approved</div>
          </div>
          <div className="dash__stat">
            <div className="dash__stat-value" style={{ color: '#10b981' }}>
              {clearance ? UR_HIERARCHY[clearance.currentLevel - 1]?.title.split(' ').slice(0, 2).join(' ') : '—'}
            </div>
            <div className="dash__stat-label">Current Clearance Level</div>
          </div>
          <div className="dash__stat">
            <div className="dash__stat-value" style={{ color: '#f59e0b' }}>{verifiedDocs}/{totalDocs}</div>
            <div className="dash__stat-label">Documents Verified</div>
          </div>
          <div className="dash__stat">
            <div className="dash__stat-value" style={{ color: '#ef4444' }}>
              {clearance?.updates.length || 0}
            </div>
            <div className="dash__stat-label">Status Updates</div>
          </div>
        </div>

        <div className="dash__grid">
          <div className="dash__card">
            <div className="dash__card-header">
              <h3>Clearance — Approval Pipeline</h3>
              <Link to="/clearance" className="dash__card-link">Full Details →</Link>
            </div>
            <div className="dash__pipeline">
              {UR_HIERARCHY.map((leader, i) => {
                const step = clearance?.steps.find(s => s.level === leader.level)
                const isActive = clearance?.currentLevel === leader.level
                const isDone = step?.status === 'approved'
                return (
                  <div key={leader.id} className={`dash__pipeline-step ${isDone ? 'dash__pipeline-step--done' : ''} ${isActive ? 'dash__pipeline-step--active' : ''}`}>
                    <div className="dash__pipeline-connector" />
                    <div className="dash__pipeline-node">
                      {isDone ? '✓' : isActive ? '●' : String(i + 1)}
                    </div>
                    <div className="dash__pipeline-info">
                      <strong>{leader.title}</strong>
                      <span>{leader.name}</span>
                      {isActive && <span className="dash__pipeline-tag">Current Reviewer</span>}
                      {step?.status === 'approved' && <span className="dash__pipeline-tag dash__pipeline-tag--ok">Approved</span>}
                      {step?.status === 'rejected' && <span className="dash__pipeline-tag" style={{ background: '#fee2e2', color: '#dc2626' }}>Rejected</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="dash__card">
            <div className="dash__card-header">
              <h3>Active Requests</h3>
            </div>
            {activeRequests.map(req => req && (
              <div key={req.id} className="dash__request-card">
                <div className="dash__request-top">
                  <span className={`dash__request-badge dash__request-badge--${req.type}`}>
                    {req.type === 'clearance' ? 'Clearance' : 'Transcript'}
                  </span>
                  <span className={`dash__request-status-badge ${req.status === 'in_progress' ? 'dash__request-status-badge--progress' : ''} ${req.status === 'completed' ? 'dash__request-status-badge--done' : ''} ${req.status === 'rejected' ? 'dash__request-status-badge--rejected' : ''}`}>
                    {req.status === 'in_progress' ? 'In Progress' : req.status === 'completed' ? 'Completed 🎉' : 'Rejected'}
                  </span>
                </div>
                <p className="dash__request-id">{req.id}</p>
                <div className="dash__request-progress">
                  <div className="dash__request-progress-bar" style={{ width: `${(req.steps.filter(s => s.status === 'approved').length / req.steps.length) * 100}%` }} />
                </div>
                <div className="dash__request-bottom">
                  <span>{req.steps.filter(s => s.status === 'approved').length}/{req.steps.length} approvals</span>
                  <span>{req.createdAt}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <Link to={req.type === 'clearance' ? '/clearance' : '/transcript'} className="dash__request-btn" style={{ flex: 1, textAlign: 'center' }}>
                    View Details →
                  </Link>
                  {req.status === 'completed' && (
                    <button
                      onClick={() => setSelectedCertRequest(req)}
                      className="dash__request-btn"
                      style={{ background: req.type === 'clearance' ? '#10b981' : '#2563eb', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                    >
                      {req.type === 'clearance' ? '📜 View Certificate' : '📊 View Transcript'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dash__section">
          <h3>Required Documents</h3>
          <div className="dash__docs-grid">
            {clearance?.docs.map(doc => (
              <div
                key={doc.id}
                className={`dash__doc-card ${doc.verified ? 'dash__doc-card--ok' : ''} ${doc.uploaded && !doc.verified ? 'dash__doc-card--uploaded' : ''}`}
                onClick={() => setPreviewDoc(doc)}
                style={{ cursor: 'pointer' }}
                title="Click to preview document"
              >
                <div className="dash__doc-icon">{doc.verified ? '✓' : doc.uploaded ? '⏳' : '📄'}</div>
                <div className="dash__doc-info">
                  <strong>{doc.name}</strong>
                  <p>{doc.desc}</p>
                </div>
                <span className={`dash__doc-status ${doc.verified ? 'dash__doc-status--ok' : doc.uploaded ? 'dash__doc-status--pending' : 'dash__doc-status--missing'}`}>
                  {doc.verified ? 'Verified' : doc.uploaded ? 'Pending Review' : 'Not Uploaded'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="dash__section">
          <h3>Recent Updates</h3>
          <div className="dash__updates">
            {clearance?.updates.slice(-5).reverse().map(u => (
              <div key={u.id} className="dash__update">
                <span className={`dash__update-icon ${u.action === 'Approved' || u.action === 'Completed' || u.action === 'Final Approval' ? 'dash__update-icon--ok' : u.action === 'Rejected' ? 'dash__update-icon--warn' : ''}`}>
                  {u.action === 'Approved' || u.action === 'Completed' || u.action === 'Final Approval' ? '✓' : u.action === 'Rejected' ? '!' : '●'}
                </span>
                <p>{u.details}</p>
                <span className="dash__update-time">{u.timestamp}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dash__quick-actions">
          <h3>Quick Actions</h3>
          <div className="dash__actions-grid">
            <Link to="/clearance" className="dash__action">
              <span className="dash__action-icon">✓</span>
              Track Clearance
            </Link>
            <button className="dash__action" onClick={() => setShowMeeting(true)} style={{ border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', font: 'inherit' }}>
              <span className="dash__action-icon">📅</span>
              Book Leader Meeting
            </button>
            {(clearance?.status === 'completed' || transcript?.status === 'completed') && (
              <button className="dash__action" onClick={() => setSelectedCertRequest(clearance?.status === 'completed' ? clearance : transcript || null)} style={{ border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', font: 'inherit' }}>
                <span className="dash__action-icon">📜</span>
                View Official Documents ✓
              </button>
            )}
            <Link to="/clearance?chat=1" className="dash__action">
              <span className="dash__action-icon">💬</span>
              AI Assistant
            </Link>
          </div>
        </div>
      </div>

      {/* Certificate Modal */}
      {selectedCertRequest && (
        <CertificateModal request={selectedCertRequest} student={profile} onClose={() => setSelectedCertRequest(null)} />
      )}

      {/* Meeting Modal */}
      {showMeeting && (
        <MeetingModal leader={currentLeader} student={profile} onClose={() => setShowMeeting(false)} />
      )}

      {/* Doc Preview Modal */}
      {previewDoc && (
        <DocPreviewModal
          doc={previewDoc}
          studentName={profile.name}
          studentId={profile.id}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </section>
  )
}
