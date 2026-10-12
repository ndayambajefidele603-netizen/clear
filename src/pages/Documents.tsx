import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { API_BASE } from '../lib/api'
import './Documents.css'

type IssuedDocument = {
  requestId: string
  requestType: 'clearance' | 'transcript'
  fileName: string
  uploadedAt: string
  sentAt: string
}

export default function Documents() {
  const { user, sessionToken } = useApp()
  const [documents, setDocuments] = useState<IssuedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState<string | null>(null)

  const loadDocuments = useCallback(async () => {
    if (!sessionToken) {
      setLoading(false)
      setError('Sign in again to view your issued documents.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE}/api/student/final-documents`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      })
      const result = await response.json() as { documents?: IssuedDocument[]; error?: string }
      if (!response.ok) throw new Error(result.error || 'Could not load your issued documents.')
      setDocuments(result.documents || [])
    } catch (loadError) {
      console.error('Could not load issued student documents', loadError)
      setError(loadError instanceof Error ? loadError.message : 'Could not load your issued documents.')
    } finally {
      setLoading(false)
    }
  }, [sessionToken])

  useEffect(() => {
    void loadDocuments()
  }, [loadDocuments])

  const downloadDocument = async (document: IssuedDocument) => {
    if (!sessionToken) return
    setDownloading(document.requestId)
    setError('')
    try {
      const response = await fetch(
        `${API_BASE}/api/student/final-documents/${encodeURIComponent(document.requestId)}`,
        { headers: { Authorization: `Bearer ${sessionToken}` } },
      )
      if (!response.ok) {
        const result = await response.json() as { error?: string }
        throw new Error(result.error || 'Could not download this document.')
      }
      const url = URL.createObjectURL(await response.blob())
      const anchor = window.document.createElement('a')
      anchor.href = url
      anchor.download = document.fileName
      window.document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (downloadError) {
      console.error('Could not download issued student document', downloadError)
      setError(downloadError instanceof Error ? downloadError.message : 'Could not download this document.')
    } finally {
      setDownloading(null)
    }
  }

  if (!user || user.role !== 'student') return null

  return (
    <section className="issued-documents">
      <div className="container">
        <header className="issued-documents__header">
          <div>
            <span className="issued-documents__eyebrow">STUDENT RECORDS</span>
            <h1>Your issued documents</h1>
            <p>Access final clearance documents and transcript PDFs released for your requests.</p>
          </div>
          <span className="issued-documents__secure-badge"><span aria-hidden="true">✓</span> Private to your account</span>
        </header>

        <div className="issued-documents__notice">
          <span className="issued-documents__notice-icon" aria-hidden="true">i</span>
          <p>
            Documents appear here after final review and release. This preview is not connected to University
            issuance systems; approved University SSO is required before official files can be issued here.
          </p>
        </div>

        {error && <p className="issued-documents__error" role="alert">{error}</p>}

        {loading ? (
          <div className="issued-documents__empty" role="status">Loading your secure document library…</div>
        ) : documents.length ? (
          <div className="issued-documents__list">
            {documents.map(document => (
              <article className="issued-documents__card" key={document.requestId}>
                <span className={`issued-documents__icon issued-documents__icon--${document.requestType}`} aria-hidden="true">
                  {document.requestType === 'transcript' ? '▤' : '✓'}
                </span>
                <div className="issued-documents__details">
                  <span className="issued-documents__kind">
                    {document.requestType === 'transcript' ? 'ACADEMIC TRANSCRIPT' : 'ACADEMIC CLEARANCE'}
                  </span>
                  <h2>{document.requestType === 'transcript' ? 'Final transcript' : 'Final clearance document'}</h2>
                  <p>{document.fileName}</p>
                  <span className="issued-documents__meta">Request {document.requestId} · Issued {new Date(document.sentAt).toLocaleDateString()}</span>
                </div>
                <button
                  type="button"
                  className="issued-documents__download"
                  onClick={() => void downloadDocument(document)}
                  disabled={downloading === document.requestId}
                >
                  {downloading === document.requestId ? 'Preparing PDF…' : 'Download PDF'}
                  <span aria-hidden="true">↓</span>
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="issued-documents__empty">
            <span className="issued-documents__empty-icon" aria-hidden="true">▤</span>
            <h2>No final documents yet</h2>
            <p>Official document release is not active in this preview. After University SSO and approved records integration are configured, released PDFs will be emailed to you and saved here.</p>
            <Link to="/dashboard" className="issued-documents__back">Return to your dashboard</Link>
          </div>
        )}
      </div>
    </section>
  )
}
