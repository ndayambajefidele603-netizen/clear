import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react'
import { STUDENT_DB } from '../database/studentDb'
import {
  LEADERS, COLLEGES, type LeaderRecord, type StudentRecord,
  type MeetingSlot, type AuditEntry, generateMeetingSlots,
} from '../database/schema'
import { API_BASE, apiRequest } from '../lib/api'

export type { StudentRecord, LeaderRecord, MeetingSlot, AuditEntry }

export interface ApprovalStep {
  level: number
  status: 'pending' | 'approved' | 'rejected'
  comment?: string
  date?: string
  signedBy?: string
  signature?: string
}

export interface RequestDocument {
  id: string
  name: string
  desc: string
  uploaded: boolean
  verified: boolean
  reviewStatus?: 'approved' | 'correction_requested'
  verifiedBy?: string
  verifiedDate?: string
  fileName?: string
}

export interface StudentRequest {
  id: string
  type: 'clearance' | 'transcript'
  status: 'draft' | 'in_progress' | 'completed' | 'rejected'
  currentLevel: number
  steps: ApprovalStep[]
  docs: RequestDocument[]
  updates: AuditEntry[]
  createdAt: string
  completedAt?: string
  certificateRef?: string
}

export type AppUser = {
  role: 'student'
  profile: StudentRecord
  requests: StudentRequest[]
} | {
  role: 'leader'
  profile: LeaderRecord
  pendingRequests: StudentRequest[]
  students: StudentRecord[]
}

interface AppState {
  user: AppUser | null
  sessionToken: string | null
  sessionReady: boolean
  allStudents: StudentRecord[]
  meetingSlots: MeetingSlot[]
  notifications: AuditEntry[]
  setStudentSession: (profile: StudentRecord, token: string, requests: StudentRequest[]) => void
  loginLeader: (email: string, password: string) => string | null
  logout: () => void
  createRequest: (type: 'clearance' | 'transcript') => Promise<StudentRequest | null>
  submitRequest: (requestId: string) => Promise<string | null>
  uploadDoc: (requestId: string, docId: string, file: File) => Promise<string | null>
  verifyDoc: (studentEmail: string, requestId: string, docId: string, approved: boolean, leaderName: string) => void
  approveRequest: (studentEmail: string, requestId: string, comment: string, leaderName: string, signature?: string) => void
  rejectRequest: (studentEmail: string, requestId: string, comment: string, leaderName: string, signature?: string) => void
  bookMeeting: (slotId: string, studentId: string, reason: string) => void
  cancelMeeting: (slotId: string) => void
  getStudentByEmail: (email: string) => StudentRecord | undefined
  getStudentById: (id: string) => StudentRecord | undefined
  getDocumentPreviewUrl: (studentEmail: string, requestId: string, docId: string) => Promise<string | undefined>
  hasDocumentPreviewUrl: (studentEmail: string, requestId: string, docId: string) => boolean
  dismissNotification: (id: string) => void
  requests: StudentRequest[]
  getStudentRequests: (email: string) => StudentRequest[]
  addUpdate: (text: string, type: string) => void
}

const AppContext = createContext<AppState | null>(null)

function pad(n: number) { return String(n).padStart(3, '0') }
function attachmentKey(studentEmail: string, requestId: string, docId: string) {
  return `${studentEmail.toLowerCase()}:${requestId}:${docId}`
}

const DOCS_CLEARANCE: RequestDocument[] = [
  { id: 'd1', name: 'Student ID Card', desc: 'Clear copy of your student ID', uploaded: false, verified: false, fileName: '' },
  { id: 'd2', name: 'Fee Clearance Statement', desc: 'Proof of paid tuition from Finance', uploaded: false, verified: false, fileName: '' },
  { id: 'd3', name: 'Library Clearance Slip', desc: 'Library return confirmation', uploaded: false, verified: false, fileName: '' },
  { id: 'd4', name: 'Final Year Project Report', desc: 'Approved project/dissertation', uploaded: false, verified: false, fileName: '' },
  { id: 'd5', name: 'Hostel Clearance Form', desc: 'Hostel vacate confirmation', uploaded: false, verified: false, fileName: '' },
]

const DOCS_TRANSCRIPT: RequestDocument[] = [
  { id: 't1', name: 'Transcript Application Form', desc: 'Signed application form', uploaded: false, verified: false, fileName: '' },
  { id: 't2', name: 'ID Copy', desc: 'Copy of student ID or national passport', uploaded: false, verified: false, fileName: '' },
  { id: 't3', name: 'Processing Fee Receipt', desc: 'Proof of fee payment (MoMo / Irembo)', uploaded: false, verified: false, fileName: '' },
]

const STORAGE_KEYS = {
  REQUESTS: 'clear&trans_requests_store',
  SESSION: 'clear&trans_active_session',
  REQUESTS_MIGRATED: 'clear&trans_requests_migrated',
}

interface StoredStudentSession {
  token: string
  profile: StudentRecord
}

function getGeneratedLeaderPassword(leader: LeaderRecord): string {
  const titles = new Set(['dr', 'prof', 'mr', 'mrs', 'ms'])
  const initials = leader.name
    .split(/\s+/)
    .filter(part => !titles.has(part.replace(/\./g, '').toLowerCase()))
    .map(part => part[0])
    .join('')
    .toUpperCase()
  return `${initials || 'LEADER'}123`
}

export function getLeaderPreviewPassword(leader: LeaderRecord): string {
  return getGeneratedLeaderPassword(leader)
}

function loadStudentSession(): StoredStudentSession | null {
  try {
    const value = localStorage.getItem(STORAGE_KEYS.SESSION)
    if (!value) return null
    const parsed = JSON.parse(value) as StoredStudentSession
    return parsed.token && parsed.profile ? parsed : null
  } catch (error) {
    console.error('Could not read saved portal session', error)
    return null
  }
}

function loadRequestsStore(): Record<string, StudentRequest[]> {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.REQUESTS)
    return data ? JSON.parse(data) as Record<string, StudentRequest[]> : {}
  } catch (error) {
    console.error('Failed to load requests store', error)
    return {}
  }
}

function saveRequestsStore(store: Record<string, StudentRequest[]>) {
  try {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(store))
  } catch (error) {
    console.error('Failed to save legacy reviewer preview requests', error)
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [savedSession] = useState(() => loadStudentSession())
  const [sessionToken, setSessionToken] = useState<string | null>(savedSession?.token || null)
  const [sessionReady, setSessionReady] = useState(!savedSession)
  const [allStudents, setAllStudents] = useState<StudentRecord[]>(STUDENT_DB)
  const [user, setUser] = useState<AppUser | null>(
    savedSession ? { role: 'student', profile: savedSession.profile, requests: [] } : null,
  )

  const [meetingSlots, setMeetingSlots] = useState(() => generateMeetingSlots())
  const [notifications, setNotifications] = useState<AuditEntry[]>([])
  const documentPreviewUrls = useRef(new Map<string, string>())

  const requestsStore = useRef<Record<string, StudentRequest[]>>(loadRequestsStore())
  const [, forceRender] = useState(0)

  useEffect(() => {
    if (!savedSession) return
    let active = true
    apiRequest<{ profile: StudentRecord; requests: StudentRequest[] }>('/api/auth/session', {}, savedSession.token)
      .then(result => {
        if (!active) return
        requestsStore.current[savedSession.profile.email.toLowerCase()] = result.requests
        setUser({ role: 'student', profile: result.profile, requests: result.requests })
        setAllStudents(previous => [result.profile, ...previous.filter(student => student.email.toLowerCase() !== result.profile.email.toLowerCase())])
      })
      .catch(error => {
        console.error('Could not restore portal session', error)
        if (!active) return
        localStorage.removeItem(STORAGE_KEYS.SESSION)
        setSessionToken(null)
        setUser(null)
      })
      .finally(() => {
        if (active) setSessionReady(true)
      })
    return () => { active = false }
  }, [savedSession])

  useEffect(() => {
    if (!sessionToken || !user || user.role !== 'student') {
      if (!sessionToken) localStorage.removeItem(STORAGE_KEYS.SESSION)
      return
    }
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({ token: sessionToken, profile: user.profile }))
    } catch (error) {
      console.error('Could not save portal session', error)
    }
  }, [sessionToken, user])

  const addNotif = useCallback((entry: AuditEntry) => {
    setNotifications(prev => [entry, ...prev])
  }, [])

  const getStudentByEmail = useCallback((email: string) => {
    return allStudents.find(s => s.email.toLowerCase() === email.toLowerCase())
  }, [allStudents])

  const getStudentById = useCallback((id: string) => {
    return allStudents.find(s => s.id === id)
  }, [allStudents])

  const getDocumentPreviewUrl = useCallback(async (studentEmail: string, requestId: string, docId: string) => {
    const key = attachmentKey(studentEmail, requestId, docId)
    const existingUrl = documentPreviewUrls.current.get(key)
    if (existingUrl) return existingUrl
    if (sessionToken && user?.role === 'student' && user.profile.email.toLowerCase() === studentEmail.toLowerCase()) {
      const response = await fetch(`${API_BASE}/api/student/requests/${encodeURIComponent(requestId)}/documents/${encodeURIComponent(docId)}`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      })
      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Could not load this document from the portal.')
      }
      const url = URL.createObjectURL(await response.blob())
      documentPreviewUrls.current.set(key, url)
      forceRender(version => version + 1)
      return url
    }
    return undefined
  }, [sessionToken, user])

  const hasDocumentPreviewUrl = useCallback((studentEmail: string, requestId: string, docId: string) => {
    return documentPreviewUrls.current.has(attachmentKey(studentEmail, requestId, docId))
  }, [])

  const getStudentRequests = useCallback((email: string): StudentRequest[] => {
    const key = email.toLowerCase()
    return requestsStore.current[key] || []
  }, [])

  const setStudentSession = useCallback((profile: StudentRecord, token: string, studentRequests: StudentRequest[]) => {
    const email = profile.email.toLowerCase()
    requestsStore.current[email] = studentRequests
    setSessionToken(token)
    setAllStudents(previous => [profile, ...previous.filter(student => student.email.toLowerCase() !== email)])
    setUser({ role: 'student', profile, requests: studentRequests })
    setSessionReady(true)
  }, [])

  const saveStudentRequests = useCallback(async (email: string, studentRequests: StudentRequest[]) => {
    if (!sessionToken) throw new Error('Your session has expired. Please sign in again.')
    await apiRequest<{ saved: boolean }>('/api/student/requests', {
      method: 'PUT',
      body: JSON.stringify({ requests: studentRequests }),
    }, sessionToken)
    requestsStore.current[email.toLowerCase()] = studentRequests
    setUser(current => current?.role === 'student' && current.profile.email.toLowerCase() === email.toLowerCase()
      ? { ...current, requests: studentRequests }
      : current)
  }, [sessionToken])

  const createRequest = useCallback(async (type: 'clearance' | 'transcript'): Promise<StudentRequest | null> => {
    if (!user || user.role !== 'student') return null
    const key = user.profile.email.toLowerCase()
    const existing = getStudentRequests(key).find(req => req.type === type)
    if (existing) return existing

    const now = new Date()
    const prefix = type === 'clearance' ? 'CLR' : 'TRS'
    const request: StudentRequest = {
      id: `${prefix}-${now.getFullYear()}-${pad(Math.floor(Math.random() * 900) + 100)}`,
      type,
      status: 'draft',
      currentLevel: 1,
      steps: LEADERS.map(leader => ({ level: leader.level, status: 'pending' as const })),
      docs: (type === 'clearance' ? DOCS_CLEARANCE : DOCS_TRANSCRIPT).map(doc => ({ ...doc, uploaded: false, verified: false, fileName: '' })),
      updates: [{
        id: `u-${Date.now()}-${Math.random()}`,
        timestamp: now.toLocaleDateString(),
        actor: 'System',
        action: 'Draft Created',
        details: `${type === 'clearance' ? 'Clearance' : 'Transcript'} checklist created. Upload the required documents, then submit for review.`,
        level: 0,
      }],
      createdAt: now.toLocaleDateString(),
    }

    const nextRequests = [...getStudentRequests(key), request]
    await saveStudentRequests(key, nextRequests)
    addNotif({
      id: `n-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      actor: 'System',
      action: 'Request Created',
      details: `${type === 'clearance' ? 'Clearance' : 'Transcript'} checklist ${request.id} is ready for documents.`,
      level: 0,
    })
    return request
  }, [addNotif, getStudentRequests, saveStudentRequests, user])

  const submitRequest = useCallback(async (requestId: string): Promise<string | null> => {
    if (!user || user.role !== 'student') return 'Sign in as a student to submit a request.'
    const email = user.profile.email.toLowerCase()
    const existing = getStudentRequests(email)
    const target = existing.find(request => request.id === requestId)
    if (!target) return 'Request not found.'
    if (target.status !== 'draft') return 'This request has already been submitted.'
    const missing = target.docs.filter(doc => !doc.uploaded)
    if (missing.length) return `Upload all required documents before submitting. ${missing.length} document${missing.length === 1 ? '' : 's'} remaining.`
    const now = new Date().toLocaleDateString()
    const updated = existing.map(request => request.id === requestId ? {
      ...request,
      status: 'in_progress' as const,
      updates: [...request.updates, {
        id: `u-${Date.now()}`, timestamp: now,
        actor: user.profile.name, action: 'Submitted',
        details: `${request.type === 'clearance' ? 'Clearance' : 'Transcript'} request submitted. Awaiting Level 1 (${LEADERS[0].title}) review.`,
        level: 0,
      }],
    } : request)
    try {
      await saveStudentRequests(email, updated)
      return null
    } catch (error) {
      console.error('Failed to submit request', error)
      return error instanceof Error ? error.message : 'Could not submit this request. Please try again.'
    }
  }, [getStudentRequests, saveStudentRequests, user])

  // ───── Leader Login ─────
  const loginLeader = useCallback((email: string, password: string): string | null => {
    const lower = email.trim().toLowerCase()
    const leader = LEADERS.find(l => l.email.toLowerCase() === lower)
    if (!leader) return 'Leader not found. Use a valid UR leader email.'
    if (!password) return 'Please enter your leader password.'

    const expectedPassword = getGeneratedLeaderPassword(leader)
    if (password !== expectedPassword) {
      return 'Incorrect password for this local preview reviewer account.'
    }

    setSessionToken(null)
    setUser({
      role: 'leader',
      profile: leader,
      pendingRequests: [],
      students: allStudents,
    })
    addNotif({
      id: `n-${Date.now()}`, timestamp: new Date().toLocaleTimeString(),
      actor: 'System', action: 'Leader Access',
      details: `Signed in as ${leader.name} (${leader.title})`,
      level: leader.level,
    })
    return null
  }, [addNotif, allStudents])

  const logout = useCallback(() => {
    if (sessionToken) {
      void apiRequest<{ loggedOut: boolean }>('/api/auth/logout', { method: 'POST' }, sessionToken)
        .catch(error => console.error('Could not invalidate portal session', error))
    }
    setUser(null)
    setSessionToken(null)
    localStorage.removeItem(STORAGE_KEYS.SESSION)
    setNotifications([])
  }, [sessionToken])

  const uploadDoc = useCallback(async (requestId: string, docId: string, file: File) => {
    if (!user || user.role !== 'student') return 'Sign in as a student to select a document.'
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    const isImage = file.type.startsWith('image/')
    if (!isPdf && !isImage) return 'Choose a PDF or image file.'
    if (file.size > 10 * 1024 * 1024) return 'The selected file exceeds the 10 MB limit.'
    const key = user.profile.email.toLowerCase()
    const fileKey = attachmentKey(key, requestId, docId)
    const currentRequest = getStudentRequests(key).find(req => req.id === requestId)
    if (!currentRequest || !['draft', 'in_progress'].includes(currentRequest.status) || !currentRequest.docs.some(doc => doc.id === docId)) {
      return 'This document requirement is not part of an active request.'
    }
    if (!sessionToken) return 'Sign in again before uploading documents.'
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result
          if (typeof result !== 'string') reject(new Error('The selected file could not be read.'))
          else resolve(result.slice(result.indexOf(',') + 1))
        }
        reader.onerror = () => reject(reader.error || new Error('The selected file could not be read.'))
        reader.readAsDataURL(file)
      })
      await apiRequest<{ uploaded: boolean }>(`/api/student/requests/${encodeURIComponent(requestId)}/documents/${encodeURIComponent(docId)}`, {
        method: 'PUT',
        body: JSON.stringify({ fileName: file.name, mimeType: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'), data }),
      }, sessionToken)
    } catch (error) {
      console.error('Failed to persist request attachment', error)
      return error instanceof Error ? error.message : 'Could not upload the file. Please try again.'
    }
    const previousUrl = documentPreviewUrls.current.get(fileKey)
    if (previousUrl) URL.revokeObjectURL(previousUrl)
    documentPreviewUrls.current.set(fileKey, URL.createObjectURL(file))
    const updated = (requestsStore.current[key] || user.requests).map(req => {
      if (req.id !== requestId) return req
      return {
        ...req,
        docs: req.docs.map(d => d.id === docId ? {
          ...d,
          uploaded: true,
          verified: false,
          reviewStatus: undefined,
          verifiedBy: undefined,
          verifiedDate: undefined,
          fileName: file.name,
        } : d),
        updates: [...req.updates, {
          id: `u-${Date.now()}`, timestamp: new Date().toLocaleDateString(),
          actor: user.profile.name, action: 'Selected Document',
          details: `"${file.name}" was uploaded to the portal for review.`,
          level: req.currentLevel,
        }],
      }
    })
    try {
      await saveStudentRequests(key, updated)
    } catch (error) {
      console.error('Failed to save document status', error)
      return error instanceof Error ? error.message : 'Could not save the document status.'
    }
    addNotif({
      id: `n-${Date.now()}`, timestamp: new Date().toLocaleTimeString(),
      actor: user.profile.name, action: 'Document Selected',
      details: `Document "${file.name}" uploaded to the portal for ${requestId}.`,
      level: 0,
    })
    forceRender(version => version + 1)
    return null
  }, [user, addNotif, getStudentRequests, saveStudentRequests, sessionToken])

  const verifyDoc = useCallback((studentEmail: string, requestId: string, docId: string, approved: boolean, leaderName: string) => {
    if (!user || user.role !== 'leader' || user.profile.name !== leaderName) return
    const key = studentEmail.toLowerCase()
    if (!documentPreviewUrls.current.has(attachmentKey(key, requestId, docId))) return
    const existing = getStudentRequests(key)
    const targetRequest = existing.find(req => req.id === requestId)
    if (!targetRequest || targetRequest.status !== 'in_progress' || targetRequest.currentLevel !== user.profile.level || !targetRequest.docs.some(doc => doc.id === docId && doc.uploaded)) return
    const updated = existing.map(req => {
      const isMatch = req.id === requestId
      if (!isMatch) return req
      return {
        ...req,
        docs: req.docs.map(d => d.id === docId && d.uploaded ? {
          ...d,
          verified: approved,
          reviewStatus: approved ? 'approved' as const : 'correction_requested' as const,
          verifiedBy: leaderName,
          verifiedDate: new Date().toLocaleDateString(),
        } : d),
      }
    })
    requestsStore.current[key] = updated
    saveRequestsStore(requestsStore.current)

    addNotif({
      id: `n-${Date.now()}`, timestamp: new Date().toLocaleTimeString(),
      actor: leaderName, action: approved ? 'Document Approved' : 'Document Rejected',
      details: `Document ${docId} ${approved ? 'approved ✓' : 'rejected ✗'} by ${leaderName}.`,
      level: 0,
    })
    forceRender(n => n + 1)
  }, [addNotif, getStudentRequests, user])

  const advanceStudentRequest = useCallback((key: string, requestId: string, comment: string, leaderName: string, approved: boolean, signature?: string): StudentRequest | null => {
    if (!user || user.role !== 'leader' || user.profile.name !== leaderName) return null
    const existing = getStudentRequests(key)
    const targetRequest = existing.find(req => req.id === requestId)
    if (!targetRequest || targetRequest.status !== 'in_progress' || targetRequest.currentLevel !== user.profile.level) return null
    if (approved && (targetRequest.docs.length === 0 || targetRequest.docs.some(doc => !doc.uploaded || !doc.verified || !documentPreviewUrls.current.has(attachmentKey(key, requestId, doc.id))))) return null
    let updatedReq: StudentRequest | null = null
    const updated = existing.map(req => {
      const isMatch = req.id === requestId
      if (!isMatch) return req

      const now = new Date().toLocaleDateString()
      if (approved) {
        const newSteps = req.steps.map(s =>
          s.level === req.currentLevel ? { ...s, status: 'approved' as const, comment, date: now, signedBy: leaderName, signature } : s
        )
        const nextLevel = req.currentLevel + 1
        if (nextLevel > 4) {
          const certRef = `${req.type === 'clearance' ? 'CLR' : 'TRS'}-CERT-${new Date().getFullYear()}-${pad(Math.floor(Math.random() * 899) + 100)}`
          updatedReq = {
            ...req, status: 'completed', currentLevel: 4, steps: newSteps,
            completedAt: now, certificateRef: certRef,
            updates: [...req.updates, {
              id: `u-${Date.now()}`, timestamp: now,
              actor: leaderName, action: 'Final Approval & Issuance',
              details: `${req.type === 'clearance' ? 'Clearance' : 'Transcript'} request completed in the portal preview. Reference: ${certRef}.`,
              level: 4,
            }],
          }
          addNotif({
            id: `n-${Date.now()}`, timestamp: new Date().toLocaleTimeString(),
            actor: leaderName, action: 'Request Completed',
            details: `${req.type === 'clearance' ? 'Clearance' : 'Transcript'} request ${req.id} completed. Reference: ${certRef}`,
            level: 4,
          })
        } else {
          const nextLeader = LEADERS[nextLevel - 1]
          updatedReq = {
            ...req, currentLevel: nextLevel, steps: newSteps,
            updates: [...req.updates, {
              id: `u-${Date.now()}`, timestamp: now,
              actor: leaderName, action: 'Approved & Forwarded',
              details: `Level ${req.currentLevel} approved by ${leaderName}. Forwarded to ${nextLeader.title} (${nextLeader.name}).`,
              level: req.currentLevel,
            }],
          }
          addNotif({
            id: `n-${Date.now()}`, timestamp: new Date().toLocaleTimeString(),
            actor: leaderName, action: 'Approved',
            details: `✅ ${req.id} approved at Level ${req.currentLevel}. Forwarded to ${nextLeader.title}.`,
            level: req.currentLevel,
          })
        }
      } else {
        updatedReq = {
          ...req, status: 'rejected', steps: req.steps.map(s =>
            s.level === req.currentLevel ? { ...s, status: 'rejected' as const, comment, date: now, signedBy: leaderName, signature } : s
          ),
          updates: [...req.updates, {
            id: `u-${Date.now()}`, timestamp: now,
            actor: leaderName, action: 'Rejected',
            details: `❌ Rejected at Level ${req.currentLevel} by ${leaderName}: "${comment}"`,
            level: req.currentLevel,
          }],
        }
        addNotif({
          id: `n-${Date.now()}`, timestamp: new Date().toLocaleTimeString(),
          actor: leaderName, action: 'Rejected',
          details: `❌ ${req.id} was rejected at Level ${req.currentLevel}: "${comment}"`,
          level: req.currentLevel,
        })
      }
      return updatedReq
    })
    requestsStore.current[key] = updated
    saveRequestsStore(requestsStore.current)

    forceRender(n => n + 1)
    return updatedReq
  }, [addNotif, getStudentRequests, user])

  const approveRequest = useCallback((studentEmail: string, requestId: string, comment: string, leaderName: string, signature?: string) => {
    advanceStudentRequest(studentEmail.toLowerCase(), requestId, comment, leaderName, true, signature)
  }, [advanceStudentRequest])

  const rejectRequest = useCallback((studentEmail: string, requestId: string, comment: string, leaderName: string, signature?: string) => {
    advanceStudentRequest(studentEmail.toLowerCase(), requestId, comment, leaderName, false, signature)
  }, [advanceStudentRequest])

  const bookMeeting = useCallback((slotId: string, studentId: string, reason: string) => {
    setMeetingSlots(prev => prev.map(s =>
      s.id === slotId ? { ...s, available: false, studentId, reason } : s
    ))
    const student = allStudents.find(s => s.id === studentId)
    addNotif({
      id: `n-${Date.now()}`, timestamp: new Date().toLocaleTimeString(),
      actor: student?.name || 'Student', action: 'Meeting Booked',
      details: `Meeting booked for ${reason}`,
      level: 0,
    })
  }, [addNotif, allStudents])

  const cancelMeeting = useCallback((slotId: string) => {
    setMeetingSlots(prev => prev.map(s =>
      s.id === slotId ? { ...s, available: true, studentId: undefined, reason: undefined } : s
    ))
  }, [])

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const addUpdate = useCallback((_text: string, _type: string) => {
    // updates flow through request.updates
  }, [])

  const requests: StudentRequest[] = user?.role === 'student'
    ? (requestsStore.current[user.profile.email.toLowerCase()] || user.requests)
    : []

  return (
    <AppContext.Provider value={{
      user, sessionToken, sessionReady, allStudents, meetingSlots, notifications, requests,
      setStudentSession, loginLeader, logout,
      createRequest, submitRequest, uploadDoc, verifyDoc, approveRequest, rejectRequest,
      bookMeeting, cancelMeeting,
      getStudentByEmail, getStudentById, getDocumentPreviewUrl, hasDocumentPreviewUrl, dismissNotification, getStudentRequests,
      addUpdate,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export { LEADERS, COLLEGES }
export const UR_HIERARCHY = LEADERS
