import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useApp, UR_HIERARCHY, type RequestDocument } from '../context/AppContext'
import Chat from '../components/Chat'
import CertificateModal from '../components/CertificateModal'
import MeetingModal from '../components/MeetingModal'
import DocPreviewModal from '../components/DocPreviewModal'
import './Clearance.css'

export default function Clearance() {
  const { user, requests, uploadDoc, submitRequest, getDocumentPreviewUrl } = useApp()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<'pipeline' | 'docs' | 'chat'>(searchParams.get('chat') ? 'chat' : 'docs')
  const [showCert, setShowCert] = useState(false)
  const [showMeeting, setShowMeeting] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<RequestDocument | null>(null)
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!user || user.role !== 'student') return null

  const request = requests.find(r => r.type === 'clearance')
  if (!request) return (
    <section className="clearance">
      <div className="container">
        <p>No clearance request found. Go to Dashboard to start one.</p>
      </div>
    </section>
  )

  const currentLeaderInfo = UR_HIERARCHY.find(l => l.level === request.currentLevel) || UR_HIERARCHY[0]
  const missingDocuments = request.docs.filter(doc => !doc.uploaded).length
  const handleUpload = (docId: string) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/pdf,image/jpeg,image/png,image/webp,image/gif'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) void uploadDoc(request.id, docId, file).then(error => {
        if (error) window.alert(error)
      }).catch(error => {
        console.error('Failed to save clearance attachment', error)
        window.alert('Could not upload the file. Please check your connection and try again.')
      })
    }
    input.click()
  }
  const handleSubmitRequest = async () => {
    setSubmitting(true)
    setSubmitError('')
    const error = await submitRequest(request.id)
    setSubmitting(false)
    if (error) setSubmitError(error)
    else setActiveTab('pipeline')
  }

  return (
    <section className="clearance">
      <div className="container">
        <div className="clearance__header">
          <div>
            <h1 className="clearance__title">Digital Clearance</h1>
            <p className="clearance__subtitle">
              Current Reviewer: <strong>{currentLeaderInfo.title}</strong> ({currentLeaderInfo.name})
            </p>
          </div>
          <div className="clearance__badge-group" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="clearance__badge">{request.id}</span>
            <span className={`clearance__badge ${request.status === 'in_progress' ? 'clearance__badge--progress' : ''} ${request.status === 'completed' ? 'clearance__badge--done' : ''} ${request.status === 'rejected' ? 'clearance__badge--rejected' : ''}`}>
              {request.status === 'draft' ? 'Documents needed' : request.status === 'in_progress' ? 'In Progress' : request.status === 'completed' ? 'Completed 🎉' : 'Needs attention'}
            </span>
            {request.status === 'completed' && (
              <button
                className="clearance__btn"
                onClick={() => setShowCert(true)}
                style={{ background: '#10b981', color: '#fff', padding: '6px 14px', borderRadius: '20px', fontWeight: '700', fontSize: '0.85rem' }}
              >
                View completed request summary
              </button>
            )}
          </div>
        </div>

        <div className="clearance__tabs">
          <button className={`clearance__tab ${activeTab === 'pipeline' ? 'clearance__tab--active' : ''}`} onClick={() => setActiveTab('pipeline')}>
            Approval Pipeline
          </button>
          <button className={`clearance__tab ${activeTab === 'docs' ? 'clearance__tab--active' : ''}`} onClick={() => setActiveTab('docs')}>
            Documents ({request.docs.filter(d => d.verified).length}/{request.docs.length})
          </button>
          <button className={`clearance__tab ${activeTab === 'chat' ? 'clearance__tab--active' : ''}`} onClick={() => setActiveTab('chat')}>
            Help & guidance
          </button>
        </div>

        {activeTab === 'pipeline' && (
          <div className="clearance__pipeline">
            <div className="clearance__pipeline-header">
              <h2>Hierarchical Approval Workflow</h2>
              <p>Each leader must approve before moving to the next level</p>
            </div>
            <div className="clearance__levels">
              {UR_HIERARCHY.map((leader, i) => {
                const step = request.steps.find(s => s.level === leader.level)
                const isActive = request.currentLevel === leader.level
                const isDone = step?.status === 'approved'
                const isRejected = step?.status === 'rejected'
                return (
                  <div key={leader.id} className={`clearance__level ${isDone ? 'clearance__level--done' : ''} ${isActive ? 'clearance__level--active' : ''} ${isRejected ? 'clearance__level--rejected' : ''}`}>
                    <div className="clearance__level-connector" />
                    <div className="clearance__level-node">
                      {isDone ? '✓' : isRejected ? '✗' : String(i + 1)}
                    </div>
                    <div className="clearance__level-body">
                      <div className="clearance__level-header">
                        <div>
                          <h3>{leader.title}</h3>
                          <p className="clearance__level-name">{leader.name}</p>
                        </div>
                        <span className={`clearance__level-status ${isDone ? 'clearance__level-status--ok' : ''} ${isRejected ? 'clearance__level-status--rejected' : ''} ${isActive ? 'clearance__level-status--active' : ''}`}>
                          {isDone ? 'Approved' : isRejected ? 'Rejected' : isActive ? 'Awaiting...' : 'Pending'}
                        </span>
                      </div>
                      {step?.comment && (
                        <div className="clearance__level-comment">
                          <strong>Comment:</strong> {step.comment}
                        </div>
                      )}
                      {step?.signature && (
                        <div className="clearance__level-sig">
                          Recorded e-signature (preview): <span className="clearance__sig-text">{step.signature}</span>
                        </div>
                      )}
                      {step?.date && <div className="clearance__level-date">{step.date}</div>}
                      {isActive && (
                        <div className="clearance__level-action">
                          <p className="clearance__level-hint">
                            Currently with <strong>{leader.name}</strong> ({leader.title}) — Office: {leader.office} ({leader.officeHours})
                          </p>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                            <button className="clearance__btn" onClick={() => setShowMeeting(true)}>
                              📅 Book Meeting / Office Hours
                            </button>
                            <button className="clearance__btn" style={{ background: '#334155', color: '#fff' }} onClick={() => setActiveTab('chat')}>
                              Get portal guidance →
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="clearance__docs">
            <div className="clearance__docs-header">
              <h2>Required Documents</h2>
              <p>Upload each item to your secure portal account. You can sign in again later to continue.</p>
            </div>
            <div className="clearance__docs-grid">
              {request.docs.map(doc => (
                <div key={doc.id} className={`clearance__doc ${doc.verified ? 'clearance__doc--ok' : ''} ${doc.uploaded && !doc.verified ? 'clearance__doc--pending' : ''}`}>
                  <div className="clearance__doc-icon">{doc.verified ? '✓' : doc.uploaded ? '⏳' : '📄'}</div>
                  <div className="clearance__doc-info">
                    <strong>{doc.name}</strong>
                    <p>{doc.desc}</p>
                    {doc.fileName && <span className="clearance__doc-file">{doc.fileName}</span>}
                  </div>
                  <div className="clearance__doc-actions" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                    <span className={`clearance__doc-status ${doc.verified ? 'clearance__doc-status--ok' : doc.uploaded ? 'clearance__doc-status--pending' : 'clearance__doc-status--missing'}`}>
                      {doc.verified ? 'Reviewed' : doc.reviewStatus === 'correction_requested' ? 'Correction requested' : doc.uploaded ? 'Uploaded to portal' : 'Not selected'}
                    </span>
                    <button
                      className="clearance__doc-upload"
                      style={{ background: '#0284c7', color: '#fff' }}
                      disabled={!doc.uploaded}
                      title={!doc.uploaded ? 'Select the required file before previewing it.' : 'Open the selected file'}
                      onClick={() => setPreviewDoc(doc)}
                    >
                      👁️ {doc.uploaded ? 'Preview selected file' : 'Select file first'}
                    </button>
                    {!doc.verified && (
                      <button className="clearance__doc-upload" onClick={() => handleUpload(doc.id)}>
                        {doc.uploaded ? 'Select again' : 'Select file'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {request.status === 'draft' && (
              <div className="clearance__submit-panel">
                <div>
                  <strong>{missingDocuments ? `${missingDocuments} document${missingDocuments === 1 ? '' : 's'} remaining` : 'Your checklist is complete'}</strong>
                  <p>{missingDocuments ? 'Add each required document before sending your request for review.' : 'Your documents are saved to your portal account and ready to submit.'}</p>
                </div>
                <button className="clearance__btn" disabled={missingDocuments > 0 || submitting} onClick={() => void handleSubmitRequest()}>
                  {submitting ? 'Submitting…' : 'Submit clearance request'}
                </button>
                {submitError && <p className="clearance__submit-error" role="alert">{submitError}</p>}
              </div>
            )}
            <div className="clearance__docs-note">
              <strong>Preview notice:</strong> Files are saved to your portal account for this preview and are not sent to University systems. Only PDF or common image files up to 10 MB are accepted.
            </div>
          </div>
        )}

        {activeTab === 'chat' && <Chat request={request} />}
      </div>

      {/* Certificate Modal */}
      {showCert && (
        <CertificateModal request={request} student={user.profile} onClose={() => setShowCert(false)} />
      )}

      {/* Meeting Modal */}
      {showMeeting && (
        <MeetingModal leader={currentLeaderInfo} student={user.profile} onClose={() => setShowMeeting(false)} />
      )}

      {/* Doc Preview Modal */}
      {previewDoc && (
        <DocPreviewModal
          doc={previewDoc}
          studentName={user.profile.name}
          studentId={user.profile.id}
          loadFile={() => getDocumentPreviewUrl(user.profile.email, request.id, previewDoc.id)}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </section>
  )
}
