import { useEffect, useState } from 'react'
import jsPDF from 'jspdf'
import type { StudentRequest, StudentRecord } from '../context/AppContext'
import './CertificateModal.css'

interface CertificateModalProps {
  request: StudentRequest
  student: StudentRecord
  onClose: () => void
}

export default function CertificateModal({ request, student, onClose }: CertificateModalProps) {
  const [copied, setCopied] = useState(false)
  const [shareMessage, setShareMessage] = useState('')
  const reference = request.certificateRef || request.id
  const serviceName = request.type === 'clearance' ? 'Clearance' : 'Transcript'
  const fileName = `${student.id}-${request.type}-preview-summary.pdf`

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  if (request.status !== 'completed') return null

  const createSummaryPdf = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
    const margin = 48
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let y = 56

    doc.setFillColor(15, 39, 71)
    doc.rect(0, 0, pageWidth, 112, 'F')
    doc.setFillColor(202, 157, 67)
    doc.rect(0, 108, pageWidth, 4, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('CLEAR&TRANS  |  STUDENT SERVICES PORTAL PREVIEW', margin, 32)
    doc.setFontSize(22)
    doc.text(`${serviceName} Request Summary`, margin, 64)
    doc.setFontSize(12)
    doc.text('UNOFFICIAL PREVIEW · NOT A UNIVERSITY RECORD', margin, 88)

    doc.setTextColor(15, 23, 42)
    y = 146
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('STUDENT INFORMATION', margin, y)
    doc.setDrawColor(203, 213, 225)
    doc.line(margin, y + 8, pageWidth - margin, y + 8)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    const details = [
      ['Student name', student.name],
      ['Student ID', student.id],
      ['College', student.college],
      ['Program', student.program],
      ['Year of study', student.year],
      ['Request reference', reference],
      ['Submitted', request.createdAt],
      ['Completed', request.completedAt || 'Not recorded'],
    ]
    details.forEach(([label, value], index) => {
      const column = index % 2
      const row = Math.floor(index / 2)
      const x = margin + column * ((pageWidth - margin * 2) / 2)
      const rowY = y + 38 + row * 42
      doc.setTextColor(100, 116, 139)
      doc.setFontSize(10)
      doc.text(label.toUpperCase(), x, rowY)
      doc.setTextColor(15, 23, 42)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text(doc.splitTextToSize(value, (pageWidth - margin * 2) / 2 - 18), x, rowY + 17)
      doc.setFont('helvetica', 'normal')
    })

    y += 220
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('REVIEW RECORD', margin, y)
    doc.setDrawColor(203, 213, 225)
    doc.line(margin, y + 8, pageWidth - margin, y + 8)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    request.steps.forEach(step => {
      const detail = `Level ${step.level} · ${step.status.toUpperCase()}${step.signedBy ? ` · Recorded reviewer: ${step.signedBy}` : ''}${step.date ? ` · ${step.date}` : ''}`
      const lines = doc.splitTextToSize(detail, pageWidth - margin * 2 - 20)
      const commentLines = step.comment ? doc.splitTextToSize(`Review note: ${step.comment}`, pageWidth - margin * 2 - 32) : []
      const blockHeight = lines.length * 16 + commentLines.length * 15 + 12
      if (y + blockHeight > pageHeight - 82) {
        doc.addPage()
        y = 56
      }
      y += 24
      doc.setDrawColor(226, 232, 240)
      doc.roundedRect(margin, y - 16, pageWidth - margin * 2, blockHeight + 8, 5, 5, 'S')
      doc.text(lines, margin + 12, y)
      y += lines.length * 16
      if (commentLines.length) {
        doc.setTextColor(71, 85, 105)
        doc.text(commentLines, margin + 20, y)
        doc.setTextColor(15, 23, 42)
        y += commentLines.length * 15
      }
    })

    const finalStep = [...request.steps].reverse().find(step => step.status === 'approved')
    if (finalStep?.signedBy) {
      y += 18
      if (y > pageHeight - 130) {
        doc.addPage()
        y = 56
      }
      doc.setFillColor(241, 245, 249)
      doc.roundedRect(margin, y, pageWidth - margin * 2, 72, 6, 6, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('FINAL REVIEWER SIGN-OFF · PREVIEW', margin + 14, y + 22)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.text(doc.splitTextToSize(`Recorded name: ${finalStep.signature || finalStep.signedBy}`, pageWidth - margin * 2 - 28), margin + 14, y + 42)
      doc.text(`Date: ${finalStep.date || request.completedAt || 'Not recorded'}`, margin + 14, y + 59)
      y += 84
    }

    y += 12
    if (y > pageHeight - 120) {
      doc.addPage()
      y = 56
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('DOCUMENT CHECKLIST', margin, y)
    doc.setDrawColor(203, 213, 225)
    doc.line(margin, y + 8, pageWidth - margin, y + 8)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    request.docs.forEach(item => {
      if (y > pageHeight - 76) {
        doc.addPage()
        y = 56
      }
      y += 22
      const status = item.verified ? 'Reviewed' : item.reviewStatus === 'correction_requested' ? 'Correction requested' : item.uploaded ? 'Selected' : 'Not selected'
      doc.text(doc.splitTextToSize(`${item.name} — ${status}`, pageWidth - margin * 2), margin, y)
    })

    const pageCount = doc.internal.pages.length - 1
    for (let page = 1; page <= pageCount; page++) {
      doc.setPage(page)
      doc.setDrawColor(203, 213, 225)
      doc.line(margin, pageHeight - 48, pageWidth - margin, pageHeight - 48)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(153, 27, 27)
      doc.text('PREVIEW ONLY · NOT VALID AS AN OFFICIAL UNIVERSITY RECORD', margin, pageHeight - 30)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 116, 139)
      doc.text(`Page ${page} of ${pageCount}`, pageWidth - margin, pageHeight - 30, { align: 'right' })
    }
    return doc
  }

  const downloadSummary = () => {
    createSummaryPdf().save(fileName)
  }

  const shareSummary = async () => {
    setShareMessage('')
    const pdf = createSummaryPdf()
    const file = new File([pdf.output('blob')], fileName, { type: 'application/pdf' })
    try {
      if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `${serviceName} request summary`,
          text: `To email this preview summary to yourself, choose an email app and address it to ${student.email}.`,
          files: [file],
        })
        setShareMessage('The PDF was shared. Choose an email app in your device share menu to send it by email.')
        return
      }
      pdf.save(fileName)
      setShareMessage('File sharing is not available in this browser. The PDF was downloaded; attach it to an email.')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setShareMessage('Could not open the share menu. Download the PDF and attach it to an email.')
    }
  }

  const copyReference = async () => {
    await navigator.clipboard.writeText(reference)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="cert-modal__backdrop" onClick={onClose}>
      <section
        className="cert-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-summary-title"
        onClick={event => event.stopPropagation()}
      >
        <header className="cert-modal__actions-bar no-print">
          <div className="cert-modal__status-tag">Completed request summary · Preview only</div>
          <div className="cert-modal__btn-group">
            <button type="button" className="cert-btn cert-btn--print" onClick={() => window.print()}>Print summary</button>
            <button type="button" className="cert-btn cert-btn--share" onClick={downloadSummary}>Download summary PDF</button>
            <button type="button" className="cert-btn cert-btn--share" onClick={() => void shareSummary()}>Share PDF by email</button>
            <button type="button" className="cert-btn cert-btn--share" onClick={() => void copyReference()}>{copied ? 'Reference copied' : 'Copy reference'}</button>
            <button type="button" className="cert-btn cert-btn--close" onClick={onClose} aria-label="Close summary">✕</button>
          </div>
        </header>

        <main className="request-summary" id="printable-summary">
          {shareMessage && <p className="request-summary__share-message" role="status">{shareMessage}</p>}
          <div className="request-summary__notice" role="note">
            Preview only — this portal is not connected to University of Rwanda student, finance, library, or academic records. This summary is not an official certificate or transcript.
          </div>
          <p className="request-summary__eyebrow">CLEAR&TRANS · STUDENT SERVICES PORTAL PREVIEW</p>
          <h1 id="request-summary-title">{serviceName} request summary</h1>
          <p className="request-summary__reference">Reference: <strong>{reference}</strong></p>

          <section className="request-summary__section" aria-labelledby="student-details-heading">
            <h2 id="student-details-heading">Student details</h2>
            <dl>
              <div><dt>Name</dt><dd>{student.name}</dd></div>
              <div><dt>Student ID</dt><dd>{student.id}</dd></div>
              <div><dt>College</dt><dd>{student.college}</dd></div>
              <div><dt>Program</dt><dd>{student.program}</dd></div>
              <div><dt>Year of study</dt><dd>{student.year}</dd></div>
            </dl>
          </section>

          <section className="request-summary__section" aria-labelledby="request-details-heading">
            <h2 id="request-details-heading">Request details</h2>
            <dl>
              <div><dt>Status</dt><dd>{request.status}</dd></div>
              <div><dt>Created</dt><dd>{request.createdAt}</dd></div>
              <div><dt>Completed</dt><dd>{request.completedAt || 'Not recorded'}</dd></div>
            </dl>
          </section>

          <section className="request-summary__section" aria-labelledby="review-steps-heading">
            <h2 id="review-steps-heading">Review record</h2>
            <ol className="request-summary__steps">
              {request.steps.map(step => (
                <li key={step.level}>
                  <div>
                    <strong>Level {step.level}: {step.status}</strong>
                    {step.signedBy && <span>Recorded reviewer (preview): {step.signedBy}</span>}
                    {step.signature && <span>Recorded e-signature (preview): {step.signature}</span>}
                    {step.date && <span>Date: {step.date}</span>}
                    {step.comment && <span>Comment: {step.comment}</span>}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {(() => {
            const finalStep = [...request.steps].reverse().find(step => step.status === 'approved')
            return finalStep?.signedBy ? (
              <section className="request-summary__signoff" aria-label="Final reviewer sign-off preview">
                <p>Final reviewer sign-off · Preview</p>
                <strong>{finalStep.signature || finalStep.signedBy}</strong>
                <span>{finalStep.signedBy} · {finalStep.date || request.completedAt || 'Date not recorded'}</span>
              </section>
            ) : null
          })()}

          <section className="request-summary__section" aria-labelledby="documents-heading">
            <h2 id="documents-heading">Document checklist</h2>
            <ul className="request-summary__documents">
              {request.docs.map(item => (
                <li key={item.id}>
                  <span>{item.name}</span>
                  <span>{item.verified ? 'Reviewed' : item.reviewStatus === 'correction_requested' ? 'Correction requested' : item.uploaded ? 'Selected' : 'Not selected'}</span>
                </li>
              ))}
            </ul>
          </section>
          <p className="request-summary__footer">Generated by the portal preview. Contact the relevant University office for official records.</p>
        </main>
      </section>
    </div>
  )
}
