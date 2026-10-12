import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp, UR_HIERARCHY, type RequestDocument, type StudentRequest } from '../context/AppContext'
import CertificateModal from '../components/CertificateModal'
import MeetingModal from '../components/MeetingModal'
import DocPreviewModal from '../components/DocPreviewModal'
import './Dashboard.css'

export default function Dashboard() {
  const { user, requests, createRequest, getDocumentPreviewUrl } = useApp()
  const navigate = useNavigate()
  const [selectedCertRequest, setSelectedCertRequest] = useState<StudentRequest | null>(null)
  const [showMeeting, setShowMeeting] = useState(false)
  const [creatingRequest, setCreatingRequest] = useState<'clearance' | 'transcript' | null>(null)
  const [requestError, setRequestError] = useState('')
  const [previewDoc, setPreviewDoc] = useState<(RequestDocument & { requestId: string; requestType: 'clearance' | 'transcript' }) | null>(null)

  if (!user || user.role !== 'student') return null

  const profile = user.profile
  const studentRequests = requests
  const clearance = studentRequests.find(r => r.type === 'clearance')
  const transcript = studentRequests.find(r => r.type === 'transcript')

  const activeRequests = [clearance, transcript].filter((request): request is StudentRequest => Boolean(request))
  const requestsInProgress = activeRequests.filter(request => request.status === 'in_progress').length
  const completedRequests = activeRequests.filter(request => request.status === 'completed').length
  const documentsToUpload = activeRequests.reduce(
    (count, request) => count + request.docs.filter(doc => !doc.uploaded).length,
    0,
  )
  const requestDocuments = activeRequests.flatMap(request =>
    request.docs.map(doc => ({ ...doc, requestId: request.id, requestType: request.type })),
  )
  const recentUpdates = activeRequests
    .flatMap(request => request.updates.map(update => ({ ...update, requestType: request.type })))
    .slice(-5)
    .reverse()

  const handleCreateRequest = async (type: 'clearance' | 'transcript') => {
    setRequestError('')
    setCreatingRequest(type)
    try {
      const created = await createRequest(type)
      if (!created) return
      navigate(type === 'clearance' ? '/clearance' : '/transcript')
    } catch (error) {
      console.error('Could not start student service request', error)
      setRequestError(error instanceof Error ? error.message : 'Could not start the request. Please try again.')
    } finally {
      setCreatingRequest(null)
    }
  }

  const currentLeader = clearance ? UR_HIERARCHY.find(l => l.level === clearance.currentLevel) || UR_HIERARCHY[0] : UR_HIERARCHY[0]

  return (
    <section className="dash">
      <div className="container">
        <div className="dash__header">
          <div>
            <span className="dash__eyebrow">STUDENT SERVICES PORTAL</span>
            <h1 className="dash__title">Welcome back, {profile.name.split(' ')[0]}</h1>
            <p className="dash__subtitle">{profile.program} · {profile.college} · {profile.year}</p>
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
                Clearance request summary
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
                Transcript request summary
              </button>
            )}
          </div>
        </div>

        <div className="dash__stats" aria-label="Request summary">
          <div className="dash__stat">
            <div className="dash__stat-value" style={{ color: '#1d4ed8' }}>{activeRequests.length}</div>
            <div className="dash__stat-label">Services requested</div>
          </div>
          <div className="dash__stat">
            <div className="dash__stat-value" style={{ color: '#b45309' }}>{requestsInProgress}</div>
            <div className="dash__stat-label">Under review</div>
          </div>
          <div className="dash__stat">
            <div className="dash__stat-value" style={{ color: '#047857' }}>{completedRequests}</div>
            <div className="dash__stat-label">Completed</div>
          </div>
          <div className="dash__stat">
            <div className="dash__stat-value" style={{ color: '#b91c1c' }}>{documentsToUpload}</div>
            <div className="dash__stat-label">Documents to upload</div>
          </div>
        </div>

        <section className="dash__services" aria-labelledby="dash-services-title">
          <div className="dash__section-heading">
            <div>
              <span className="dash__eyebrow">STUDENT SERVICES</span>
              <h2 id="dash-services-title">What would you like to do?</h2>
            </div>
            <p>Choose a service to start a request or continue tracking one.</p>
          </div>
          {requestError && <p className="dash__request-error" role="alert">{requestError}</p>}
          <div className="dash__service-grid">
            {([
              { type: 'clearance' as const, request: clearance, title: 'Academic clearance', description: 'Submit your clearance documents and follow the review process.', icon: '✓' },
              { type: 'transcript' as const, request: transcript, title: 'Academic transcript', description: 'Request your academic transcript and check its progress.', icon: '▤' },
            ]).map(service => (
              <article key={service.type} className={`dash__service-card dash__service-card--${service.type}`}>
                <span className="dash__service-icon" aria-hidden="true">{service.icon}</span>
                <div className="dash__service-copy">
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </div>
                {service.request ? (
                  <Link className="dash__service-link" to={service.type === 'clearance' ? '/clearance' : '/transcript'}>
                    Track request <span aria-hidden="true">→</span>
                  </Link>
                ) : (
                  <button className="dash__service-link" onClick={() => void handleCreateRequest(service.type)} disabled={creatingRequest !== null}>
                    {creatingRequest === service.type ? 'Preparing checklist…' : 'Start process'} <span aria-hidden="true">→</span>
                  </button>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="dash__issued-documents" aria-label="Issued documents">
          <div>
            <span className="dash__eyebrow">YOUR DOCUMENT LIBRARY</span>
            <h2>Final documents, all in one place</h2>
            <p>View and download clearance documents and transcripts released for your requests.</p>
          </div>
          <Link to="/documents" className="dash__issued-link">Open document library <span aria-hidden="true">→</span></Link>
        </section>

        <div className="dash__grid">
          <div className="dash__card">
            <div className="dash__card-header">
              <div>
                <span className="dash__eyebrow">YOUR ACTIVITY</span>
                <h2>Your requests</h2>
              </div>
            </div>
            {activeRequests.length ? activeRequests.map(req => (
              <div key={req.id} className="dash__request-card">
                <div className="dash__request-top">
                  <span className={`dash__request-badge dash__request-badge--${req.type}`}>
                    {req.type === 'clearance' ? 'Academic clearance' : 'Academic transcript'}
                  </span>
                  <span className={`dash__request-status-badge ${req.status === 'in_progress' ? 'dash__request-status-badge--progress' : ''} ${req.status === 'completed' ? 'dash__request-status-badge--done' : ''} ${req.status === 'rejected' ? 'dash__request-status-badge--rejected' : ''}`}>
                    {req.status === 'in_progress' ? 'In review' : req.status === 'completed' ? 'Completed' : req.status === 'rejected' ? 'Needs attention' : 'Documents needed'}
                  </span>
                </div>
                <p className="dash__request-id">{req.id}</p>
                <div className="dash__request-progress">
                  <div
                    className="dash__request-progress-bar"
                    role="progressbar"
                    aria-label={`${req.type} approval progress`}
                    aria-valuemin={0}
                    aria-valuemax={req.steps.length}
                    aria-valuenow={req.steps.filter(s => s.status === 'approved').length}
                    style={{ width: `${req.steps.length ? (req.steps.filter(s => s.status === 'approved').length / req.steps.length) * 100 : 0}%` }}
                  />
                </div>
                <div className="dash__request-bottom">
                  <span>{req.steps.filter(s => s.status === 'approved').length} of {req.steps.length} review stages approved</span>
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
            )) : (
              <div className="dash__empty-state">
                <span className="dash__empty-icon" aria-hidden="true">▤</span>
                <h3>No requests yet</h3>
                <p>Choose one of the services above to start. Its status and next steps will appear here.</p>
              </div>
            )}
          </div>
        </div>

        <div className="dash__section">
          <div className="dash__section-heading">
            <div>
              <span className="dash__eyebrow">DOCUMENT CHECKLIST</span>
              <h2>Documents</h2>
            </div>
            <p>Requirements are shown for requests you have started.</p>
          </div>
          {requestDocuments.length ? (
            <div className="dash__docs-grid">
            {requestDocuments.map(doc => (
              <button
                type="button"
                key={`${doc.requestId}:${doc.id}`}
                className={`dash__doc-card ${doc.verified ? 'dash__doc-card--ok' : ''} ${doc.uploaded && !doc.verified ? 'dash__doc-card--uploaded' : ''}`}
                disabled={!doc.uploaded}
                onClick={() => setPreviewDoc(doc)}
                aria-label={`${doc.uploaded ? 'Open' : 'No file selected for'} ${doc.name}, ${doc.requestType} requirement`}
              >
                <div className="dash__doc-icon">{doc.verified ? '✓' : doc.uploaded ? '⏳' : '📄'}</div>
                <div className="dash__doc-info">
                  <strong>{doc.name}</strong>
                  <p>{doc.requestType === 'clearance' ? 'Clearance' : 'Transcript'} · {doc.desc}</p>
                </div>
                <span className={`dash__doc-status ${doc.verified ? 'dash__doc-status--ok' : doc.uploaded ? 'dash__doc-status--pending' : 'dash__doc-status--missing'}`}>
                  {doc.verified ? 'Reviewed' : doc.reviewStatus === 'correction_requested' ? 'Correction requested' : doc.uploaded ? 'Uploaded to portal' : 'Not selected'}
                </span>
              </button>
            ))}
            </div>
          ) : (
            <p className="dash__empty-inline">Start a service request to see its document checklist here.</p>
          )}
        </div>

        <div className="dash__section">
          <div className="dash__section-heading">
            <div>
              <span className="dash__eyebrow">REQUEST HISTORY</span>
              <h2>Recent updates</h2>
            </div>
          </div>
          {recentUpdates.length ? (
            <div className="dash__updates">
            {recentUpdates.map(u => (
              <div key={u.id} className="dash__update">
                <span className={`dash__update-icon ${u.action === 'Approved' || u.action === 'Completed' || u.action === 'Final Approval' ? 'dash__update-icon--ok' : u.action === 'Rejected' ? 'dash__update-icon--warn' : ''}`}>
                  {u.action === 'Approved' || u.action === 'Completed' || u.action === 'Final Approval' ? '✓' : u.action === 'Rejected' ? '!' : '●'}
                </span>
                <p><strong>{u.requestType === 'clearance' ? 'Clearance' : 'Transcript'}:</strong> {u.details}</p>
                <span className="dash__update-time">{u.timestamp}</span>
              </div>
            ))}
            </div>
          ) : (
            <p className="dash__empty-inline">Updates will appear here when a request is submitted or reviewed.</p>
          )}
        </div>

        <div className="dash__quick-actions">
          <h3>Quick Actions</h3>
          <div className="dash__actions-grid">
            {clearance && <Link to="/clearance" className="dash__action">
              <span className="dash__action-icon" aria-hidden="true">✓</span>
              Track clearance
            </Link>}
            {transcript && <Link to="/transcript" className="dash__action">
              <span className="dash__action-icon" aria-hidden="true">▤</span>
              Track transcript
            </Link>}
            <button className="dash__action" onClick={() => setShowMeeting(true)} style={{ border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', font: 'inherit' }}>
              <span className="dash__action-icon" aria-hidden="true">▦</span>
              Book a meeting
            </button>
            {(clearance?.status === 'completed' || transcript?.status === 'completed') && (
              <button className="dash__action" onClick={() => setSelectedCertRequest(clearance?.status === 'completed' ? clearance : transcript || null)} style={{ border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', font: 'inherit' }}>
                <span className="dash__action-icon" aria-hidden="true">▣</span>
                View completed document
              </button>
            )}
            <Link to="/clearance?chat=1" className="dash__action">
              <span className="dash__action-icon" aria-hidden="true">✉</span>
              Ask the assistant
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
          loadFile={() => getDocumentPreviewUrl(profile.email, previewDoc.requestId, previewDoc.id)}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </section>
  )
}
