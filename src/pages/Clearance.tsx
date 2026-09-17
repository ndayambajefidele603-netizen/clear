import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useApp, UR_HIERARCHY, type RequestDocument } from '../context/AppContext'
import Chat from '../components/Chat'
import CertificateModal from '../components/CertificateModal'
import MeetingModal from '../components/MeetingModal'
import DocPreviewModal from '../components/DocPreviewModal'
import './Clearance.css'

export default function Clearance() {
  const { user, requests, uploadDoc } = useApp()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<'pipeline' | 'docs' | 'chat'>(searchParams.get('chat') ? 'chat' : 'pipeline')
  const [showCert, setShowCert] = useState(false)
  const [showMeeting, setShowMeeting] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<RequestDocument | null>(null)

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
  const handleUpload = (docId: string) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) uploadDoc(request.id, docId, file.name)
    }
    input.click()
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
              {request.status === 'in_progress' ? 'In Progress' : request.status === 'completed' ? 'Completed 🎉' : 'Rejected'}
            </span>
            <button
              className="clearance__btn"
              onClick={() => setShowCert(true)}
              style={{ background: request.status === 'completed' ? '#10b981' : '#2563eb', color: '#fff', padding: '6px 14px', borderRadius: '20px', fontWeight: '700', fontSize: '0.85rem' }}
            >
              📜 {request.status === 'completed' ? 'View Official Certificate' : 'Certificate Preview'}
            </button>
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
            AI Assistant
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
                          ✍️ Signed: <span className="clearance__sig-text">{step.signature}</span>
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
                              Ask AI Assistant →
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
              <p>Upload documents for leader verification or click any card to inspect preview</p>
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
                      {doc.verified ? 'Verified' : doc.uploaded ? 'Pending Review' : 'Not Uploaded'}
                    </span>
                    <button
                      className="clearance__doc-upload"
                      style={{ background: '#0284c7', color: '#fff' }}
                      onClick={() => setPreviewDoc(doc)}
                    >
                      👁️ Preview
                    </button>
                    {!doc.verified && (
                      <button className="clearance__doc-upload" onClick={() => handleUpload(doc.id)}>
                        {doc.uploaded ? 'Re-upload' : 'Upload'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="clearance__docs-note">
              <strong>Note:</strong> All documents must be verified by the current leader before moving to the next level.
              Upload clear, legible copies. You'll be notified when a leader verifies your document.
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
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </section>
  )
}
