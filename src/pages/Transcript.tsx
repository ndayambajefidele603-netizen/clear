import { useState } from 'react'
import { useApp, UR_HIERARCHY } from '../context/AppContext'
import Chat from '../components/Chat'
import CertificateModal from '../components/CertificateModal'
import './Transcript.css'

const DOC_TYPES = ['Academic Transcript', 'Certificate of Completion', 'Detailed Score Sheet', 'Degree Certificate']

export default function Transcript() {
  const { user, requests, uploadDoc, addUpdate } = useApp()
  const [activeTab, setActiveTab] = useState<'pipeline' | 'docs' | 'chat' | 'request'>('pipeline')
  const [selectedType, setSelectedType] = useState(DOC_TYPES[0])
  const [copies, setCopies] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [showCert, setShowCert] = useState(false)

  if (!user || user.role !== 'student') return null

  const request = requests.find(r => r.type === 'transcript')
  if (!request) return (
    <section className="transcript">
      <div className="container">
        <p>No transcript request found. Go to Dashboard to start one.</p>
      </div>
    </section>
  )

  const currentLeaderInfo = UR_HIERARCHY.find(l => l.level === request.currentLevel) || UR_HIERARCHY[0]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    addUpdate(`Transcript request submitted: ${selectedType} × ${copies}`, 'info')
  }

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
    <section className="transcript">
      <div className="container">
        <div className="transcript__header">
          <div>
            <h1 className="transcript__title">Transcript Requests</h1>
            <p className="transcript__subtitle">
              Current Reviewer: <strong>{currentLeaderInfo.title}</strong> ({currentLeaderInfo.name})
            </p>
          </div>
          <div className="transcript__badge-group" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="transcript__badge">{request.id}</span>
            <span className={`transcript__badge ${request.status === 'in_progress' ? 'transcript__badge--progress' : ''} ${request.status === 'completed' ? 'transcript__badge--done' : ''}`}>
              {request.status === 'in_progress' ? 'In Progress' : request.status === 'completed' ? 'Completed 🎉' : request.status}
            </span>
            {request.status === 'completed' && (
              <button
                className="transcript__btn"
                onClick={() => setShowCert(true)}
                style={{ background: '#10b981', color: '#fff', padding: '6px 14px', borderRadius: '20px', fontWeight: '700', fontSize: '0.85rem' }}
              >
                📊 View Official Transcript & Certificate
              </button>
            )}
          </div>
        </div>

        <div className="transcript__tabs">
          <button className={`transcript__tab ${activeTab === 'request' ? 'transcript__tab--active' : ''}`} onClick={() => setActiveTab('request')}>New Request</button>
          <button className={`transcript__tab ${activeTab === 'pipeline' ? 'transcript__tab--active' : ''}`} onClick={() => setActiveTab('pipeline')}>Approval Pipeline</button>
          <button className={`transcript__tab ${activeTab === 'docs' ? 'transcript__tab--active' : ''}`} onClick={() => setActiveTab('docs')}>Documents</button>
          <button className={`transcript__tab ${activeTab === 'chat' ? 'transcript__tab--active' : ''}`} onClick={() => setActiveTab('chat')}>AI Assistant</button>
        </div>

        {activeTab === 'request' && (
          <div className="transcript__card">
            <h2 className="transcript__card-title">Submit New Transcript Request</h2>
            {submitted ? (
              <div className="transcript__success">
                <div className="transcript__success-icon">✓</div>
                <h3>Request Submitted!</h3>
                <p>Your request will go through the approval pipeline: Class Rep → Department Head → College Principal → Registrar</p>
                <button className="transcript__btn" onClick={() => setSubmitted(false)}>Submit Another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="transcript__field">
                  <label>Document Type</label>
                  <div className="transcript__types">
                    {DOC_TYPES.map(t => (
                      <button key={t} type="button"
                        className={`transcript__type-btn ${selectedType === t ? 'transcript__type-btn--active' : ''}`}
                        onClick={() => setSelectedType(t)}
                      >{t}</button>
                    ))}
                  </div>
                </div>
                <div className="transcript__field">
                  <label>Number of Copies</label>
                  <div className="transcript__copies">
                    <button type="button" onClick={() => setCopies(Math.max(1, copies - 1))} disabled={copies <= 1}>−</button>
                    <span>{copies}</span>
                    <button type="button" onClick={() => setCopies(Math.min(10, copies + 1))} disabled={copies >= 10}>+</button>
                  </div>
                </div>
                <div className="transcript__field">
                  <label>Delivery Method</label>
                  <select className="transcript__select">
                    <option>Physical Pickup at Registrar Office</option>
                    <option>Email PDF (Encrypted Digital Copy)</option>
                    <option>DHL Courier Delivery</option>
                  </select>
                </div>
                <div className="transcript__field">
                  <label>Additional Notes / Destination</label>
                  <textarea className="transcript__textarea" placeholder="Provide embassy, university, or employment recipient details..." rows={3} />
                </div>
                <div className="transcript__fee">
                  <span>Processing Fee (Payable via MoMo/Irembo)</span>
                  <span className="transcript__fee-amount">FRW 5,000 × {copies} = FRW {(5000 * copies).toLocaleString()}</span>
                </div>
                <button type="submit" className="transcript__btn transcript__btn--submit">Submit Request →</button>
              </form>
            )}
          </div>
        )}

        {activeTab === 'pipeline' && (
          <div className="transcript__pipeline">
            <div className="transcript__pipeline-header">
              <h2>Hierarchical Approval Workflow</h2>
              <p>Each leader must approve before the transcript is issued</p>
            </div>
            <div className="transcript__levels">
              {UR_HIERARCHY.map((leader, i) => {
                const step = request.steps.find(s => s.level === leader.level)
                const isActive = request.currentLevel === leader.level
                const isDone = step?.status === 'approved'
                const isRejected = step?.status === 'rejected'
                return (
                  <div key={leader.id} className={`transcript__level ${isDone ? 'transcript__level--done' : ''} ${isActive ? 'transcript__level--active' : ''} ${isRejected ? 'transcript__level--rejected' : ''}`}>
                    <div className="transcript__level-connector" />
                    <div className="transcript__level-node">{isDone ? '✓' : isRejected ? '✗' : String(i + 1)}</div>
                    <div className="transcript__level-body">
                      <div className="transcript__level-header">
                        <div>
                          <h3>{leader.title}</h3>
                          <p className="transcript__level-name">{leader.name}</p>
                        </div>
                        <span className={`transcript__level-status ${isDone ? 'transcript__level-status--ok' : ''} ${isRejected ? 'transcript__level-status--rejected' : ''} ${isActive ? 'transcript__level-status--active' : ''}`}>
                          {isDone ? 'Approved' : isRejected ? 'Rejected' : isActive ? 'Awaiting...' : 'Pending'}
                        </span>
                      </div>
                      {step?.comment && <div className="transcript__level-comment"><strong>Comment:</strong> {step.comment}</div>}
                      {step?.signature && (
                        <div className="transcript__level-sig">
                          ✍️ Signed: <span className="transcript__sig-text">{step.signature}</span>
                        </div>
                      )}
                      {step?.date && <div className="transcript__level-date">{step.date}</div>}
                      {isActive && (
                        <div className="transcript__level-action">
                          <p className="transcript__level-hint">Currently with <strong>{leader.name}</strong> ({leader.title})</p>
                          <button className="transcript__btn" onClick={() => setActiveTab('chat')}>Ask AI Assistant →</button>
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
          <div className="transcript__docs">
            <div className="transcript__docs-header">
              <h2>Required Documents</h2>
              <p>Upload these documents for your transcript request</p>
            </div>
            <div className="transcript__docs-grid">
              {request.docs.map(doc => (
                <div key={doc.id} className={`transcript__doc-card ${doc.verified ? 'transcript__doc-card--ok' : ''}`}>
                  <div className="transcript__doc-icon">{doc.verified ? '✓' : doc.uploaded ? '⏳' : '📄'}</div>
                  <div className="transcript__doc-info">
                    <strong>{doc.name}</strong>
                    <p>{doc.desc}</p>
                    {doc.fileName && <span className="transcript__doc-file">{doc.fileName}</span>}
                  </div>
                  <div className="transcript__doc-actions">
                    <span className={`transcript__doc-status ${doc.verified ? 'transcript__doc-status--ok' : doc.uploaded ? 'transcript__doc-status--pending' : 'transcript__doc-status--missing'}`}>
                      {doc.verified ? 'Verified' : doc.uploaded ? 'Pending Review' : 'Not Uploaded'}
                    </span>
                    {!doc.verified && (
                      <button className="transcript__doc-upload" onClick={() => handleUpload(doc.id)}>
                        {doc.uploaded ? 'Re-upload' : 'Upload'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'chat' && <Chat request={request} />}
      </div>

      {/* Certificate Modal */}
      {showCert && (
        <CertificateModal request={request} student={user.profile} onClose={() => setShowCert(false)} />
      )}
    </section>
  )
}
