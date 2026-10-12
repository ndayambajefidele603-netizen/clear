import { useState } from 'react'
import { useApp, LEADERS, COLLEGES, type RequestDocument, type StudentRecord } from '../context/AppContext'
import DocPreviewModal from '../components/DocPreviewModal'
import './LeaderDashboard.css'

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

async function sendFinalApprovalEmail(payload: {
  email: string
  studentName: string
  requestId: string
  requestType: string
  leaderName: string
  signature: string
  comment: string
}) {
  let response: Response
  try {
    response = await fetch(`${API_BASE}/api/notifications/final-approval`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error('Could not reach the email service. Check that the backend is running, then try again.')
  }

  let result: { error?: string; message?: string }
  try {
    result = await response.json() as { error?: string; message?: string }
  } catch {
    throw new Error('The email service returned an invalid response. Please try again later.')
  }
  if (!response.ok) {
    throw new Error(result.error || `Email delivery failed (status ${response.status}).`)
  }
}

export default function LeaderDashboard() {
  const { user, verifyDoc, approveRequest, rejectRequest, meetingSlots, cancelMeeting, allStudents, getStudentRequests, getDocumentPreviewUrl, hasDocumentPreviewUrl } = useApp()
  const [tab, setTab] = useState<'pending' | 'students' | 'meetings' | 'history'>('pending')
  const [requestTypeFilter, setRequestTypeFilter] = useState<'all' | 'clearance' | 'transcript'>('all')
  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [sigModal, setSigModal] = useState<{ studentEmail: string; requestId: string; requestType: string; action: 'approve' | 'reject' } | null>(null)
  const [signature, setSignature] = useState('')
  const [previewDocModal, setPreviewDocModal] = useState<{ doc: RequestDocument; student: StudentRecord; requestId: string } | null>(null)
  const [finalEmailSending, setFinalEmailSending] = useState(false)
  const [finalEmailError, setFinalEmailError] = useState('')
  const [finalEmailNotice, setFinalEmailNotice] = useState('')

  // Database search & filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [collegeFilter, setCollegeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  if (!user || user.role !== 'leader') {
    return (
      <section className="ldash"><div className="container"><p>Access denied. Leader login required.</p></div></section>
    )
  }

  const leader = user.profile

  // Dynamic list of student requests currently waiting at this leader's level
  const pendingItems = allStudents.flatMap(student => {
    const reqs = getStudentRequests(student.email)
    return reqs
      .filter(r => r.status === 'in_progress' && r.currentLevel === leader.level)
      .map(req => ({ student, request: req }))
  }).filter(item => {
    if (requestTypeFilter === 'all') return true
    return item.request.type === requestTypeFilter
  })

  const mySlots = meetingSlots.filter(s => s.leaderId === leader.id)
  const bookedSlots = mySlots.filter(s => !s.available)
  const availableSlots = mySlots.filter(s => s.available)

  const handleVerify = (studentEmail: string, requestId: string, docId: string, approved: boolean) => {
    verifyDoc(studentEmail, requestId, docId, approved, leader.name)
  }

  const openSignatureModal = (studentEmail: string, requestId: string, requestType: string, action: 'approve' | 'reject') => {
    setSignature(leader.name)
    setFinalEmailError('')
    setSigModal({ studentEmail, requestId, requestType, action })
  }

  const confirmSignature = async () => {
    if (!sigModal || !signature.trim()) return
    const { studentEmail, requestId, action } = sigModal

    if (action === 'approve') {
      if (leader.level === LEADERS.length) {
        const student = allStudents.find(record => record.email.toLowerCase() === studentEmail.toLowerCase())
        const request = getStudentRequests(studentEmail).find(record => record.id === requestId)
        if (!student || !request || request.status !== 'in_progress' || request.currentLevel !== leader.level) {
          setFinalEmailError('Could not verify this student request. It was not completed.')
          return
        }
        setFinalEmailSending(true)
        setFinalEmailError('')
        try {
          await sendFinalApprovalEmail({
            email: student.email,
            studentName: student.name,
            requestId,
            requestType: sigModal.requestType,
            leaderName: leader.name,
            signature: signature.trim(),
            comment: comment.trim() || 'Approved — all required documents verified and approved.',
          })
          setFinalEmailNotice(`Final approval email sent to ${student.email}.`)
        } catch (error) {
          setFinalEmailError(error instanceof Error ? error.message : 'Could not send the final approval email.')
          setFinalEmailSending(false)
          return
        }
        setFinalEmailSending(false)
      }
      approveRequest(studentEmail, requestId, comment || 'Approved — all required documents verified and approved.', leader.name, signature.trim())
    } else {
      rejectRequest(studentEmail, requestId, comment || 'Requirements not met.', leader.name, signature.trim())
    }
    setComment('')
    setSigModal(null)
    setSignature('')
    setSelectedItemKey(null)
  }

  const closeSigModal = () => {
    if (finalEmailSending) return
    setSigModal(null)
    setSignature('')
    setFinalEmailError('')
  }

  // Filtered students for Database tab
  const filteredStudents = allStudents.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCollege = collegeFilter === 'All' || s.college.includes(collegeFilter) || s.college === collegeFilter
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter
    return matchesSearch && matchesCollege && matchesStatus
  })

  return (
    <section className="ldash">
      <div className="container">
        {finalEmailNotice && <p role="status" className="ldash__bio">{finalEmailNotice}</p>}
        {/* Leader Profile Header */}
        <div className="ldash__profile">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/ur-logo.png" alt="University of Rwanda" style={{ width: '52px', height: '52px', objectFit: 'contain' }} />
            <div className="ldash__profile-avatar">{leader.avatar}</div>
          </div>
          <div className="ldash__profile-info">
            <h1 className="ldash__title">{leader.title}</h1>
            <p className="ldash__name">{leader.name}</p>
            <p className="ldash__meta">
              <span>📧 {leader.email}</span>
              <span>📞 {leader.phone}</span>
              <span>🏛️ {leader.office}</span>
              <span>🕐 {leader.officeHours}</span>
            </p>
          </div>
          <div className="ldash__level-badge">
            Level {leader.level}/{LEADERS.length}
          </div>
        </div>

        <div className="ldash__bio">
          <p>{leader.bio}</p>
          <p className="ldash__hierarchy">
            <strong>Approval Chain:</strong> {LEADERS.map(l => `${l.title} (${l.name})`).join(' → ')}
          </p>
        </div>

        {/* Stats */}
        <div className="ldash__stats">
          <div className="ldash__stat">
            <span className="ldash__stat-num">{pendingItems.length}</span>
            <span className="ldash__stat-lbl">Pending Reviews</span>
          </div>
          <div className="ldash__stat">
            <span className="ldash__stat-num">{bookedSlots.length}</span>
            <span className="ldash__stat-lbl">Scheduled Meetings</span>
          </div>
          <div className="ldash__stat">
            <span className="ldash__stat-num">{availableSlots.length}</span>
            <span className="ldash__stat-lbl">Available Slots</span>
          </div>
          <div className="ldash__stat">
            <span className="ldash__stat-num">{allStudents.length}</span>
            <span className="ldash__stat-lbl">Total Students</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="ldash__tabs">
          <button className={`ldash__tab ${tab === 'pending' ? 'ldash__tab--active' : ''}`} onClick={() => setTab('pending')}>
            📋 Pending Reviews ({pendingItems.length})
          </button>
          <button className={`ldash__tab ${tab === 'students' ? 'ldash__tab--active' : ''}`} onClick={() => setTab('students')}>
            👥 Student Database ({allStudents.length})
          </button>
          <button className={`ldash__tab ${tab === 'meetings' ? 'ldash__tab--active' : ''}`} onClick={() => setTab('meetings')}>
            📅 Meetings ({bookedSlots.length}/{mySlots.length})
          </button>
          <button className={`ldash__tab ${tab === 'history' ? 'ldash__tab--active' : ''}`} onClick={() => setTab('history')}>
            📜 Approval History
          </button>
        </div>

        {/* Pending Reviews */}
        {tab === 'pending' && (
          <div className="ldash__content">
            {/* Sub-filter for Clearance vs Transcript */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Filter Request Type:</span>
              <button
                type="button"
                onClick={() => setRequestTypeFilter('all')}
                style={{
                  padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', cursor: 'pointer',
                  background: requestTypeFilter === 'all' ? '#2563eb' : 'rgba(255,255,255,0.06)',
                  color: '#fff', border: 'none'
                }}
              >
                All Requests ({allStudents.flatMap(s => getStudentRequests(s.email).filter(r => r.status === 'in_progress' && r.currentLevel === leader.level)).length})
              </button>
              <button
                type="button"
                onClick={() => setRequestTypeFilter('clearance')}
                style={{
                  padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', cursor: 'pointer',
                  background: requestTypeFilter === 'clearance' ? '#2563eb' : 'rgba(255,255,255,0.06)',
                  color: '#fff', border: 'none'
                }}
              >
                Clearance ({allStudents.flatMap(s => getStudentRequests(s.email).filter(r => r.type === 'clearance' && r.status === 'in_progress' && r.currentLevel === leader.level)).length})
              </button>
              <button
                type="button"
                onClick={() => setRequestTypeFilter('transcript')}
                style={{
                  padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', cursor: 'pointer',
                  background: requestTypeFilter === 'transcript' ? '#2563eb' : 'rgba(255,255,255,0.06)',
                  color: '#fff', border: 'none'
                }}
              >
                Transcript ({allStudents.flatMap(s => getStudentRequests(s.email).filter(r => r.type === 'transcript' && r.status === 'in_progress' && r.currentLevel === leader.level)).length})
              </button>
            </div>

            {pendingItems.length === 0 ? (
              <div className="ldash__empty">
                <p>✨ No pending requests waiting at Level {leader.level}. All student documents at your stage have been processed.</p>
              </div>
            ) : (
              <div className="ldash__student-list">
                {pendingItems.map(({ student, request }) => {
                  const itemKey = `${student.id}_${request.id}`
                  const isOpen = selectedItemKey === itemKey
                  const approvedDocsCount = request.docs.filter(d => d.verified && hasDocumentPreviewUrl(student.email, request.id, d.id)).length
                  const totalDocsCount = request.docs.length
                  const allDocsApproved = totalDocsCount > 0 && request.docs.every(doc =>
                    doc.uploaded && doc.verified && hasDocumentPreviewUrl(student.email, request.id, doc.id)
                  )

                  return (
                    <div key={itemKey} className={`ldash__student-card ${isOpen ? 'ldash__student-card--open' : ''}`}>
                      <button className="ldash__student-header" onClick={() => setSelectedItemKey(isOpen ? null : itemKey)}>
                        <div className="ldash__student-avatar">{student.name.split(' ').map(n => n[0]).join('')}</div>
                        <div className="ldash__student-info">
                          <strong>{student.name}</strong>
                          <p>{student.id} · {student.program} · {student.year}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{
                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                            background: request.type === 'clearance' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                            color: request.type === 'clearance' ? '#60a5fa' : '#34d399',
                            border: `1px solid ${request.type === 'clearance' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`
                          }}>
                            {request.type === 'clearance' ? 'Clearance' : 'Transcript'} ({request.id})
                          </span>
                          <span className="ldash__student-badge">Level {leader.level}</span>
                        </div>
                      </button>

                      {isOpen && (
                        <div className="ldash__student-body">
                          <div className="ldash__student-details">
                            <p><strong>Email:</strong> {student.email}</p>
                            <p><strong>Phone:</strong> {student.phone}</p>
                            <p><strong>College:</strong> {student.college}</p>
                            <p><strong>Enrollment year:</strong> {student.enrollmentYear ?? 'Not linked to University records'}</p>
                            <p><strong>Status:</strong> {student.status ?? 'Not linked to University records'}</p>
                          </div>

                          <div className="ldash__student-docs">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <h4>Review Required Documents ({approvedDocsCount}/{totalDocsCount} Reviewed)</h4>
                            </div>
                            <p className="ldash__section-desc">Open each attachment to inspect its contents before recording a review. Files need to be selected again after a page reload.</p>

                            {request.docs.map(doc => (
                              <div key={doc.id} className="ldash__doc-row">
                                <div className="ldash__doc-name-col">
                                  <strong>{doc.name}</strong>
                                  <span className={`ldash__doc-tag ${doc.verified ? 'ldash__doc-tag--ok' : doc.uploaded ? 'ldash__doc-tag--pending' : 'ldash__doc-tag--none'}`}>
                                    {doc.verified ? '✓ Reviewed' : doc.reviewStatus === 'correction_requested' ? 'Correction requested' : hasDocumentPreviewUrl(student.email, request.id, doc.id) ? 'Ready to review' : doc.uploaded ? 'Open to load saved file' : 'Missing'}
                                  </span>
                                </div>
                                <div className="ldash__doc-btn-group">
                                  <button
                                    className="ldash__btn ldash__btn--sm ldash__btn--info"
                                    disabled={!doc.uploaded}
                                    title={!doc.uploaded ? 'The student must select this file before it can be reviewed.' : 'Open the saved attachment'}
                                    onClick={() => setPreviewDocModal({ doc, student, requestId: request.id })}
                                  >
                                    👁️ {doc.uploaded ? 'Review file' : 'No file selected'}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="ldash__student-action">
                            <h4>Final Decision & Level Sign-off</h4>

                            {!allDocsApproved && (
                              <div style={{
                                background: 'rgba(239, 68, 68, 0.12)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '8px',
                                padding: '10px 14px',
                                color: '#fca5a5',
                                fontSize: '0.85rem',
                                marginBottom: '10px'
                              }}>
                                ⚠️ <strong>Document review required:</strong> Review every selected attachment before recording a decision in this portal preview.
                              </div>
                            )}

                            {allDocsApproved && (
                              <div style={{
                                background: 'rgba(16, 185, 129, 0.12)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                borderRadius: '8px',
                                padding: '10px 14px',
                                color: '#6ee7b7',
                                fontSize: '0.85rem',
                                marginBottom: '10px'
                              }}>
                                ✓ <strong>All documents reviewed:</strong> You may now record the next preview workflow decision.
                              </div>
                            )}

                            <textarea
                              className="ldash__comment"
                              placeholder={`Add review comments or notes for ${leader.level === 4 ? 'final preview decision' : 'next review stage'}...`}
                              value={comment}
                              onChange={e => setComment(e.target.value)}
                              rows={2}
                            />
                            <div className="ldash__action-row">
                              <button
                                className="ldash__btn ldash__btn--approve"
                                onClick={() => openSignatureModal(student.email, request.id, request.type, 'approve')}
                                disabled={!allDocsApproved}
                                style={{ opacity: allDocsApproved ? 1 : 0.5, cursor: allDocsApproved ? 'pointer' : 'not-allowed' }}
                                title={!allDocsApproved ? 'Approve all required documents first' : 'Sign and forward'}
                              >
                                {leader.level === 4 ? '✓ Complete & notify student →' : '✓ Approve & Forward →'}
                              </button>
                              <button
                                className="ldash__btn ldash__btn--reject"
                                onClick={() => openSignatureModal(student.email, request.id, request.type, 'reject')}
                              >
                                ✗ Reject Request
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Student Database */}
        {tab === 'students' && (
          <div className="ldash__content">
            <div className="ldash__db-filter-bar" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              <input
                type="text"
                placeholder="🔍 Search name, ID, or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ flex: '1 1 240px', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: '#0f172a', color: '#fff' }}
              />
              <select
                value={collegeFilter}
                onChange={e => setCollegeFilter(e.target.value)}
                style={{ padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: '#0f172a', color: '#fff' }}
              >
                <option value="All">All Colleges</option>
                {COLLEGES.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
              </select>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: '#0f172a', color: '#fff' }}
              >
                <option value="All">All Statuses</option>
                <option value="active">Active</option>
                <option value="graduated">Graduated</option>
              </select>
            </div>

            <div className="ldash__db-header">
              <p>Showing {filteredStudents.length} of {allStudents.length} student profiles in this preview. Live University records are not connected.</p>
              <span className="ldash__db-count">{filteredStudents.filter(s => s.status === 'active').length} Active · {filteredStudents.filter(s => s.status === 'graduated').length} Graduated</span>
            </div>

            <div className="ldash__db-table">
              <div className="ldash__db-row ldash__db-row--header">
                <span>ID</span>
                <span>Name</span>
                <span>College</span>
                <span>Program</span>
                <span>Year</span>
                <span>Status</span>
              </div>
              {filteredStudents.slice(0, 50).map(s => (
                <div key={s.id} className="ldash__db-row">
                  <span className="ldash__db-id">{s.id}</span>
                  <span>{s.name}</span>
                  <span>{s.college.split('(')[1]?.replace(')', '') || s.college}</span>
                  <span>{s.program}</span>
                  <span>{s.year}</span>
                  <span><span className={`ldash__db-status ${s.status === 'active' ? 'ldash__db-status--active' : s.status === 'graduated' ? 'ldash__db-status--grad' : 'ldash__db-status--wd'}`}>{s.status || 'Not linked'}</span></span>
                </div>
              ))}
            </div>
            {filteredStudents.length > 50 && (
              <p className="ldash__db-more">+ {filteredStudents.length - 50} more records matched...</p>
            )}
          </div>
        )}

        {/* Meetings */}
        {tab === 'meetings' && (
          <div className="ldash__content">
            <h3 className="ldash__section-title">📅 Office Hours — {leader.officeHours}</h3>
            <p className="ldash__section-desc">Location: {leader.office}. Face-to-face meetings are required for clearance sign-off.</p>

            {bookedSlots.length > 0 && (
              <>
                <h4 className="ldash__subsection">Booked Meetings ({bookedSlots.length})</h4>
                <div className="ldash__meeting-list">
                  {bookedSlots.map(slot => {
                    const stud = allStudents.find(s => s.id === slot.studentId)
                    return (
                      <div key={slot.id} className="ldash__meeting">
                        <div className="ldash__meeting-date">
                          <strong>{slot.date}</strong>
                          <span>{slot.time}</span>
                        </div>
                        <div className="ldash__meeting-info">
                          <strong>{stud?.name || 'Student ID: ' + slot.studentId}</strong>
                          <p>{slot.reason || 'Clearance meeting'}</p>
                        </div>
                        <button className="ldash__btn ldash__btn--sm ldash__btn--danger" onClick={() => cancelMeeting(slot.id)}>Cancel</button>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            <h4 className="ldash__subsection">Available Slots ({availableSlots.length})</h4>
            <div className="ldash__meeting-list">
              {availableSlots.slice(0, 12).map(slot => (
                <div key={slot.id} className="ldash__meeting ldash__meeting--avail">
                  <div className="ldash__meeting-date">
                    <strong>{slot.date}</strong>
                    <span>{slot.time}</span>
                  </div>
                  <span className="ldash__avail-tag">Available</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        {tab === 'history' && (
          <div className="ldash__content">
            <h3 className="ldash__section-title">📜 Approval History</h3>
            <div className="ldash__history-list">
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} className="ldash__history-item">
                  <div className="ldash__history-icon">
                    {['✓', '✓', '✓', '✗', '✓'][i % 5]}
                  </div>
                  <div className="ldash__history-info">
                    <strong>Student #{2022001 + i}</strong>
                    <p>{['Approved — all docs verified', 'Approved — fee clearance confirmed', 'Approved — library returned', 'Rejected — missing project report', 'Approved — hostel vacated'][i % 5]}</p>
                  </div>
                  <span className="ldash__history-date">
                    {['02 Jun', '28 May', '25 May', '20 May', '18 May'][i % 5]} 2026
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Signature Modal */}
      {sigModal && (
        <div className="ldash__modal-overlay" onClick={closeSigModal}>
          <div className="ldash__modal" onClick={e => e.stopPropagation()}>
            <h3 className="ldash__modal-title">Digital Signature Required</h3>
            <p className="ldash__modal-desc">
              Type your full name to record your {sigModal.action === 'approve' ? 'approval' : 'rejection'} in this portal preview.
            </p>
            {sigModal.action === 'approve' && leader.level === LEADERS.length && (
              <p className="ldash__modal-desc">
                This preview can send an approval notification to{' '}
                <strong>{allStudents.find(student => student.email.toLowerCase() === sigModal.studentEmail.toLowerCase())?.email || sigModal.studentEmail}</strong>,
                but cannot securely issue or email an official document yet.
              </p>
            )}
            <div className="ldash__modal-field">
              <label>E-Signature</label>
              <input
                type="text"
                className="ldash__sig-input"
                value={signature}
                onChange={e => setSignature(e.target.value)}
                placeholder="Type your full name..."
                autoFocus
              />
            </div>
            <p className="ldash__sig-disclaimer">
              This typed name is a preview sign-off record only. It is not a verified or legally binding electronic signature.
            </p>
            <div className="ldash__modal-actions">
              <button className="ldash__btn ldash__btn--cancel" onClick={closeSigModal} disabled={finalEmailSending}>Cancel</button>
              <button
                className={`ldash__btn ${sigModal.action === 'approve' ? 'ldash__btn--approve' : 'ldash__btn--reject'}`}
                onClick={() => void confirmSignature()}
                disabled={!signature.trim()
                  || finalEmailSending}
              >
                {finalEmailSending
                  ? 'Sending email…'
                  : sigModal.action === 'approve' && leader.level === LEADERS.length
                    ? '✓ Sign, approve & notify student'
                    : sigModal.action === 'approve' ? '✓ Sign & Approve' : '✗ Sign & Reject'}
              </button>
            </div>
            {finalEmailError && <p role="alert" style={{ color: '#fca5a5', marginTop: '12px' }}>{finalEmailError}</p>}
          </div>
        </div>
      )}

      {/* Doc Preview Modal */}
      {previewDocModal && (
        <DocPreviewModal
          doc={previewDocModal.doc}
          studentName={previewDocModal.student.name}
          studentId={previewDocModal.student.id}
          loadFile={() => getDocumentPreviewUrl(previewDocModal.student.email, previewDocModal.requestId, previewDocModal.doc.id)}
          isLeader={true}
          onClose={() => setPreviewDocModal(null)}
          onVerify={(approved) => handleVerify(previewDocModal.student.email, previewDocModal.requestId, previewDocModal.doc.id, approved)}
        />
      )}
    </section>
  )
}
