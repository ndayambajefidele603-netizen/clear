import { useEffect, useState } from 'react'
import type { RequestDocument } from '../context/AppContext'
import './DocPreviewModal.css'

interface DocPreviewModalProps {
  doc: RequestDocument
  studentName: string
  studentId: string
  fileUrl?: string
  loadFile?: () => Promise<string | undefined>
  onClose: () => void
  onVerify?: (approved: boolean) => void
  isLeader?: boolean
}

export default function DocPreviewModal({
  doc,
  studentName,
  studentId,
  fileUrl,
  loadFile,
  onClose,
  onVerify,
  isLeader = false,
}: DocPreviewModalProps) {
  const [resolvedFileUrl, setResolvedFileUrl] = useState(fileUrl)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  useEffect(() => {
    let cancelled = false
    setResolvedFileUrl(fileUrl)
    setLoadError('')
    if (!fileUrl && loadFile) {
      void loadFile().then(url => {
        if (!cancelled) setResolvedFileUrl(url)
      }).catch(error => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : 'Could not load the saved attachment.')
      })
    }
    return () => { cancelled = true }
  }, [fileUrl, loadFile])

  const isImage = /\.(png|jpe?g|gif|webp)$/i.test(doc.fileName || '')
  const isPdf = /\.pdf$/i.test(doc.fileName || '')

  return (
    <div className="doc-modal__backdrop" onClick={onClose}>
      <section
        className="doc-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="doc-preview-title"
        onClick={event => event.stopPropagation()}
      >
        <header className="doc-modal__header">
          <div>
            <span className="doc-modal__badge">Request attachment</span>
            <h2 className="doc-modal__title" id="doc-preview-title">{doc.name}</h2>
            <p className="doc-modal__sub">{doc.desc}</p>
          </div>
          <button className="doc-modal__close" type="button" onClick={onClose} aria-label="Close document preview">✕</button>
        </header>

        <div className="doc-modal__paper">
          <dl className="doc-modal__details">
            <div><dt>Student</dt><dd>{studentName}</dd></div>
            <div><dt>Student ID</dt><dd>{studentId}</dd></div>
            <div><dt>Selected file</dt><dd>{doc.fileName || 'No file selected'}</dd></div>
            <div><dt>Review status</dt><dd>{doc.verified ? `Reviewed by ${doc.verifiedBy || 'leader'}` : doc.reviewStatus === 'correction_requested' ? 'Correction requested' : 'Awaiting review'}</dd></div>
          </dl>

          {resolvedFileUrl && isPdf && (
            <iframe className="doc-modal__file-frame" src={resolvedFileUrl} title={`Preview of ${doc.fileName}`} />
          )}
          {resolvedFileUrl && isImage && (
            <img className="doc-modal__image" src={resolvedFileUrl} alt={`Preview of ${doc.fileName}`} />
          )}
          {resolvedFileUrl && !isPdf && !isImage && (
            <a className="doc-modal__download" href={resolvedFileUrl} download={doc.fileName}>
              Download selected file
            </a>
          )}
          {!resolvedFileUrl && !loadError && (
            <div className="doc-modal__unavailable" role="status">
              <strong>No document preview is available for this session.</strong>
              <span>Sign in to the student account that uploaded this document. Files in this portal preview are not part of official University records.</span>
            </div>
          )}
          {loadError && <div className="doc-modal__unavailable" role="alert"><strong>Could not load attachment</strong><span>{loadError}</span></div>}
        </div>

        <footer className="doc-modal__actions">
          {isLeader && onVerify && resolvedFileUrl && (
            <div className="doc-modal__leader-actions">
              <button className="doc-modal__btn doc-modal__btn--ok" type="button" onClick={() => { onVerify(true); onClose() }}>
                ✓ Mark reviewed
              </button>
              <button className="doc-modal__btn doc-modal__btn--danger" type="button" onClick={() => { onVerify(false); onClose() }}>
                ✗ Request correction
              </button>
            </div>
          )}
          <button className="doc-modal__btn doc-modal__btn--close" type="button" onClick={onClose}>Close preview</button>
        </footer>
      </section>
    </div>
  )
}
