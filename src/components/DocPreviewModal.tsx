import type { RequestDocument } from '../context/AppContext'
import './DocPreviewModal.css'

interface DocPreviewModalProps {
  doc: RequestDocument
  studentName?: string
  studentId?: string
  onClose: () => void
  onVerify?: (approved: boolean) => void
  isLeader?: boolean
}

export default function DocPreviewModal({ doc, studentName, studentId, onClose, onVerify, isLeader }: DocPreviewModalProps) {
  const name = studentName || 'Jean-Paul Ndayambaje'
  const regNo = studentId || 'UR/2024/CST/042'

  return (
    <div className="doc-modal__backdrop" onClick={onClose}>
      <div className="doc-modal__dialog" onClick={e => e.stopPropagation()}>
        <div className="doc-modal__header">
          <div>
            <span className="doc-modal__badge">Official Document Viewer</span>
            <h3 className="doc-modal__title">{doc.name}</h3>
            <p className="doc-modal__sub">{doc.desc}</p>
          </div>
          <button className="doc-modal__close" onClick={onClose}>✕</button>
        </div>

        {/* Document Preview Paper Canvas */}
        <div className="doc-modal__paper">
          <div className="doc-paper__header">
            <img src="/ur-logo.png" alt="UR Logo" className="doc-paper__logo" />
            <div>
              <h4 className="doc-paper__inst">UNIVERSITY OF RWANDA</h4>
              <p className="doc-paper__dept">CENTRAL CLEARANCE REGISTRY</p>
            </div>
            <div className="doc-paper__ref">
              <span>DOC REF: {doc.id.toUpperCase()}-2026</span>
              <small>DATE: {doc.verifiedDate || new Date().toLocaleDateString()}</small>
            </div>
          </div>

          <div className="doc-paper__divider" />

          <div className="doc-paper__meta">
            <div>
              <strong>Student Name:</strong> {name}
            </div>
            <div>
              <strong>Registration ID:</strong> {regNo}
            </div>
          </div>

          {/* Document Content Simulation based on doc.id or doc.name */}
          <div className="doc-paper__body">
            {doc.id === 'd1' || doc.name.includes('ID Card') ? (
              <div className="doc-sim doc-sim--id">
                <div className="doc-sim__id-card">
                  <div className="doc-sim__photo">👤</div>
                  <div className="doc-sim__id-info">
                    <h5>STUDENT IDENTIFICATION CARD</h5>
                    <p><strong>Name:</strong> {name}</p>
                    <p><strong>ID:</strong> {regNo}</p>
                    <p><strong>College:</strong> CST / Science & Tech</p>
                    <p className="doc-sim__valid">VALID UNTIL: 12/2026 · VERIFIED ACTIVE</p>
                  </div>
                </div>
              </div>
            ) : doc.id === 'd2' || doc.name.includes('Fee') ? (
              <div className="doc-sim doc-sim--fee">
                <h5>STATEMENT OF FINANCIAL CLEARANCE</h5>
                <p>Office of the Bursar & Financial Controller confirms:</p>
                <table className="doc-sim__table">
                  <thead>
                    <tr>
                      <th>Academic Year</th>
                      <th>Billed (FRW)</th>
                      <th>Paid (FRW)</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Year 1 - 2023</td>
                      <td>1,400,000</td>
                      <td>1,400,000</td>
                      <td>0 FRW</td>
                    </tr>
                    <tr>
                      <td>Year 2 - 2024</td>
                      <td>1,400,000</td>
                      <td>1,400,000</td>
                      <td>0 FRW</td>
                    </tr>
                    <tr>
                      <td>Year 3 - 2025</td>
                      <td>1,400,000</td>
                      <td>1,400,000</td>
                      <td>0 FRW</td>
                    </tr>
                  </tbody>
                </table>
                <p className="doc-sim__status-ok">✓ FINANCIAL OBLIGATIONS FULLY CLEARED (BALANCE: FRW 0)</p>
              </div>
            ) : doc.id === 'd3' || doc.name.includes('Library') ? (
              <div className="doc-sim doc-sim--lib">
                <h5>UNIVERSITY LIBRARY CLEARANCE SLIP</h5>
                <p>Main Campus Library Services</p>
                <div className="doc-sim__box">
                  <p>✔ All borrowed books & reference materials returned.</p>
                  <p>✔ No overdue fines or unreturned catalog items recorded.</p>
                  <p>✔ Library Card Status: Deactivated upon graduation.</p>
                </div>
                <div className="doc-sim__stamp">
                  UR LIBRARY APPROVED
                </div>
              </div>
            ) : doc.id === 'd4' || doc.name.includes('Project') ? (
              <div className="doc-sim doc-sim--proj">
                <h5>FINAL YEAR CAPSTONE / DISSERTATION REPORT</h5>
                <p><strong>Title:</strong> AI-Driven University Clearance Automation Architecture</p>
                <p><strong>Department:</strong> Computer Science & Information Systems</p>
                <div className="doc-sim__box">
                  <p><strong>Defense Grade:</strong> A (Excellent - 88%)</p>
                  <p><strong>Supervisor Signoff:</strong> Dr. Alice Uwimana</p>
                  <p><strong>Repository Submission:</strong> Hardcopy & Softcopy Deposited.</p>
                </div>
              </div>
            ) : (
              <div className="doc-sim doc-sim--gen">
                <h5>HOSTEL & PROPERTY VACATE CERTIFICATE</h5>
                <p>Campus Accommodation & Facilities Unit confirms:</p>
                <div className="doc-sim__box">
                  <p>✔ Room key returned to Hostel Manager.</p>
                  <p>✔ Furniture and room fixtures inspected with zero damages.</p>
                  <p>✔ Utility bills settled.</p>
                </div>
              </div>
            )}
          </div>

          <div className="doc-paper__footer">
            <span>Verified Status: <strong style={{ color: doc.verified ? '#166534' : '#b45309' }}>{doc.verified ? 'OFFICIALLY VERIFIED' : 'PENDING REVIEW'}</strong></span>
            {doc.verifiedBy && <span>Verified by: {doc.verifiedBy}</span>}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="doc-modal__actions">
          {isLeader && onVerify && (
            <div className="doc-modal__leader-actions">
              <button
                className="doc-modal__btn doc-modal__btn--ok"
                onClick={() => { onVerify(true); onClose() }}
              >
                ✓ Verify Document
              </button>
              <button
                className="doc-modal__btn doc-modal__btn--danger"
                onClick={() => { onVerify(false); onClose() }}
              >
                ✗ Reject Document
              </button>
            </div>
          )}
          <button className="doc-modal__btn doc-modal__btn--close" onClick={onClose}>
            Close Preview
          </button>
        </div>
      </div>
    </div>
  )
}
