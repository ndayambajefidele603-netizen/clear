import { useState } from 'react'
import { useApp, LEADERS, COLLEGES, type RequestDocument, type StudentRecord } from '../context/AppContext'
import DocPreviewModal from '../components/DocPreviewModal'
import './LeaderDashboard.css'

export default function LeaderDashboard() {
  const { user, verifyDoc, approveRequest, rejectRequest, meetingSlots, cancelMeeting, allStudents, getStudentRequests } = useApp()
  const [tab, setTab] = useState<'pending' | 'students' | 'meetings' | 'history'>('pending')
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [sigModal, setSigModal] = useState<{ studentEmail: string; action: 'approve' | 'reject' } | null>(null)
  const [signature, setSignature] = useState('')
  const [previewDocModal, setPreviewDocModal] = useState<{ doc: RequestDocument; student: StudentRecord } | null>(null)

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
  // Dynamic list of students whose clearance request is currently waiting at this leader's level
  const pendingStudents = allStudents.filter(student => {
    const reqs = getStudentRequests(student.email)
    const clearanceReq = reqs.find(r => r.type === 'clearance')
    if (!clearanceReq) return false
    return clearanceReq.status === 'in_progress' && clearanceReq.currentLevel === leader.level
  })

  const mySlots = meetingSlots.filter(s => s.leaderId === leader.id)
  const bookedSlots = mySlots.filter(s => !s.available)
  const availableSlots = mySlots.filter(s => s.available)

  const handleVerify = (studentEmail: string, docId: string, approved: boolean) => {
    const reqs = getStudentRequests(studentEmail)
    const clearanceReq = reqs.find(r => r.type === 'clearance') || reqs[0]
    verifyDoc(studentEmail, clearanceReq?.id || 'CLR-2026', docId, approved, leader.name)
  }

  const openSignatureModal = (studentEmail: string, action: 'approve' | 'reject') => {
    setSignature(leader.name)
    setSigModal({ studentEmail, action })
  }

  const confirmSignature = () => {
    if (!sigModal || !signature.trim()) return
    const studentEmail = sigModal.studentEmail
    const reqs = getStudentRequests(studentEmail)
    const clearanceReq = reqs.find(r => r.type === 'clearance') || reqs[0]

    if (sigModal.action === 'approve') {
      approveRequest(studentEmail, clearanceReq?.id || 'CLR-2026', comment || 'Approved — all requirements met.', leader.name, signature.trim())
    } else {
      rejectRequest(studentEmail, clearanceReq?.id || 'CLR-2026', comment || 'Requirements not met.', leader.name, signature.trim())
    }
    setComment('')
    setSigModal(null)
    setSignature('')
    setSelectedStudent(null)
  }

  const closeSigModal = () => {
    setSigModal(null)
    setSignature('')
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
        {/* Leader Profile Header */}
        <div className="ldash__profile">
          <div className="ldash__profile-avatar">{leader.avatar}</div>
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
            <span className="ldash__stat-num">{pendingStudents.length}</span>
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
            <span className="ldash__stat-lbl">Total Students (2022-26)</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="ldash__tabs">
          <button className={`ldash__tab ${tab === 'pending' ? 'ldash__tab--active' : ''}`} onClick={() => setTab('pending')}>
            📋 Pending Reviews ({pendingStudents.length})
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
            {pendingStudents.length === 0 ? (
              <div className="ldash__empty">
                <p>✨ No pending reviews. All students at your level have been processed.</p>
              </div>
            ) : (
              <div className="ldash__student-list">
                {pendingStudents.map(student => {
                  const reqs = getStudentRequests(student.email)
                  const clearanceReq = reqs.find(r => r.type === 'clearance') || reqs[0]

                  return (
                    <div key={student.id} className={`ldash__student-card ${selectedStudent === student.id ? 'ldash__student-card--open' : ''}`}>
                      <button className="ldash__student-header" onClick={() => setSelectedStudent(selectedStudent === student.id ? null : student.id)}>
                        <div className="ldash__student-avatar">{student.name.split(' ').map(n => n[0]).join('')}</div>
                        <div className="ldash__student-info">
                          <strong>{student.name}</strong>
                          <p>{student.id} · {student.program} · {student.year}</p>
                        </div>
                        <span className="ldash__student-badge">Level {leader.level}</span>
                      </button>

                      {selectedStudent === student.id && (
                        <div className="ldash__student-body">
                          <div className="ldash__student-details">
                            <p><strong>Email:</strong> {student.email}</p>
                            <p><strong>Phone:</strong> {student.phone}</p>
                            <p><strong>College:</strong> {student.college}</p>
                            <p><strong>Enrolled:</strong> {student.enrollmentYear}</p>
                            <p><strong>Status:</strong> {student.status}</p>
                          </div>
                          <div className="ldash__student-docs">
                            <h4>Verify Required Documents</h4>
                            {clearanceReq.docs.map(doc => (
                              <div key={doc.id} className="ldash__doc-row">
                                <div className="ldash__doc-name-col">
                                  <strong>{doc.name}</strong>
                                  <span className={`ldash__doc-tag ${doc.verified ? 'ldash__doc-tag--ok' : doc.uploaded ? 'ldash__doc-tag--pending' : 'ldash__doc-tag--none'}`}>
                                    {doc.verified ? '✓ Verified' : doc.uploaded ? 'Uploaded' : 'Missing'}
                                  </span>
                                </div>
                                <div className="ldash__doc-btn-group">
                                  <button
                                    className="ldash__btn ldash__btn--sm ldash__btn--info"
                                    onClick={() => setPreviewDocModal({ doc, student })}
                                  >
                                    👁️ Inspection Preview
                                  </button>
                                  <button
                                    className="ldash__btn ldash__btn--sm ldash__btn--ok"
                                    onClick={() => handleVerify(student.email, doc.id, true)}
                                  >
                                    ✓ Approve
                                  </button>
                                  <button
                                    className="ldash__btn ldash__btn--sm ldash__btn--danger"
                                    onClick={() => handleVerify(student.email, doc.id, false)}
                                  >
                                    ✗ Reject
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="ldash__student-action">
                            <h4>Final Decision & Forward</h4>
                            <textarea
                              className="ldash__comment"
                              placeholder="Add review comment or notes for next leader level..."
                              value={comment}
                              onChange={e => setComment(e.target.value)}
                              rows={2}
                            />
                            <div className="ldash__action-row">
                              <button className="ldash__btn ldash__btn--approve" onClick={() => openSignatureModal(student.email, 'approve')}>
                                ✓ Approve & Forward →
                              </button>
                              <button className="ldash__btn ldash__btn--reject" onClick={() => openSignatureModal(student.email, 'reject')}>
                                ✗ Reject Clearance
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
              <p>Showing {filteredStudents.length} of {allStudents.length} students registered from 2022 to 2026</p>
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
                  <span><span className={`ldash__db-status ${s.status === 'active' ? 'ldash__db-status--active' : s.status === 'graduated' ? 'ldash__db-status--grad' : 'ldash__db-status--wd'}`}>{s.status}</span></span>
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
              Type your full name as an electronic signature to {sigModal.action === 'approve' ? 'approve' : 'reject'} this request.
            </p>
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
              By signing, you acknowledge that this constitutes a legally binding electronic signature in accordance with applicable laws.
            </p>
            <div className="ldash__modal-actions">
              <button className="ldash__btn ldash__btn--cancel" onClick={closeSigModal}>Cancel</button>
              <button
                className={`ldash__btn ${sigModal.action === 'approve' ? 'ldash__btn--approve' : 'ldash__btn--reject'}`}
                onClick={confirmSignature}
                disabled={!signature.trim()}
              >
                {sigModal.action === 'approve' ? '✓ Sign & Approve' : '✗ Sign & Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Doc Preview Modal */}
      {previewDocModal && (
        <DocPreviewModal
          doc={previewDocModal.doc}
          studentName={previewDocModal.student.name}
          studentId={previewDocModal.student.id}
          isLeader={true}
          onClose={() => setPreviewDocModal(null)}
          onVerify={(approved) => handleVerify(previewDocModal.student.email, previewDocModal.doc.id, approved)}
        />
      )}
    </section>
  )
}
