import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'
import { STUDENT_DB } from '../database/studentDb'
import {
  LEADERS, COLLEGES, type LeaderRecord, type StudentRecord,
  type MeetingSlot, type AuditEntry, generateMeetingSlots,
} from '../database/schema'

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
  allStudents: StudentRecord[]
  meetingSlots: MeetingSlot[]
  notifications: AuditEntry[]
  login: (email: string, password: string) => string | null
  loginLeader: (email: string, password: string) => string | null
  logout: () => void
  uploadDoc: (requestId: string, docId: string, fileName: string) => void
  verifyDoc: (studentEmail: string, requestId: string, docId: string, approved: boolean, leaderName: string) => void
  approveRequest: (studentEmail: string, requestId: string, comment: string, leaderName: string, signature?: string) => void
  rejectRequest: (studentEmail: string, requestId: string, comment: string, leaderName: string, signature?: string) => void
  bookMeeting: (slotId: string, studentId: string, reason: string) => void
  cancelMeeting: (slotId: string) => void
  getStudentByEmail: (email: string) => StudentRecord | undefined
  getStudentById: (id: string) => StudentRecord | undefined
  dismissNotification: (id: string) => void
  requests: StudentRequest[]
  getStudentRequests: (email: string) => StudentRequest[]
  addUpdate: (text: string, type: string) => void
}

const AppContext = createContext<AppState | null>(null)

function pad(n: number) { return String(n).padStart(3, '0') }

const DOCS_CLEARANCE: RequestDocument[] = [
  { id: 'd1', name: 'Student ID Card', desc: 'Clear copy of your student ID', uploaded: true, verified: false, fileName: 'student_id_card.pdf' },
  { id: 'd2', name: 'Fee Clearance Statement', desc: 'Proof of paid tuition from Finance', uploaded: true, verified: false, fileName: 'fee_statement_2026.pdf' },
  { id: 'd3', name: 'Library Clearance Slip', desc: 'Library return confirmation', uploaded: true, verified: false, fileName: 'library_clearance.pdf' },
  { id: 'd4', name: 'Final Year Project Report', desc: 'Approved project/dissertation', uploaded: true, verified: false, fileName: 'final_project_report.pdf' },
  { id: 'd5', name: 'Hostel Clearance Form', desc: 'Hostel vacate confirmation', uploaded: true, verified: false, fileName: 'hostel_form.pdf' },
]

const DOCS_TRANSCRIPT: RequestDocument[] = [
  { id: 't1', name: 'Transcript Application Form', desc: 'Signed application form', uploaded: false, verified: false },
  { id: 't2', name: 'ID Copy', desc: 'Copy of student ID or passport', uploaded: false, verified: false },
  { id: 't3', name: 'Processing Fee Receipt', desc: 'Proof of fee payment', uploaded: false, verified: false },
]

function createRequest(type: 'clearance' | 'transcript'): StudentRequest {
  const now = new Date()
  const prefix = type === 'clearance' ? 'CLR' : 'TRS'
  return {
    id: `${prefix}-${now.getFullYear()}-${pad(Math.floor(Math.random() * 900) + 100)}`,
    type,
    status: 'in_progress',
    currentLevel: 1,
    steps: LEADERS.map(l => ({ level: l.level, status: 'pending' as const })),
    docs: type === 'clearance' ? DOCS_CLEARANCE.map(d => ({ ...d })) : DOCS_TRANSCRIPT.map(d => ({ ...d })),
    updates: [{
      id: `u-${Date.now()}`,
      timestamp: now.toLocaleDateString(),
      actor: 'System',
      action: 'Submitted',
      details: `${type === 'clearance' ? 'Clearance' : 'Transcript'} request created. Waiting for Class Representative.`,
      level: 0,
    }],
    createdAt: now.toLocaleDateString(),
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [allStudents] = useState(() => STUDENT_DB)
  const [meetingSlots, setMeetingSlots] = useState(() => generateMeetingSlots())
  const [notifications, setNotifications] = useState<AuditEntry[]>([])
  // Global request store: studentEmail -> StudentRequest[]
  const requestsStore = useRef<Record<string, StudentRequest[]>>({})
  const [, forceRender] = useState(0)

  const addNotif = useCallback((entry: AuditEntry) => {
    setNotifications(prev => [entry, ...prev])
  }, [])

  const getStudentByEmail = useCallback((email: string) => {
    return allStudents.find(s => s.email.toLowerCase() === email.toLowerCase())
  }, [allStudents])

  const getStudentById = useCallback((id: string) => {
    return allStudents.find(s => s.id === id)
  }, [allStudents])

  const login = useCallback((email: string, _password: string): string | null => {
    const lower = email.toLowerCase()
    // Find existing student or create synthetic one from email
    let student = allStudents.find(s => s.email.toLowerCase() === lower)
    if (!student) {
      if (!lower.endsWith('@ur.ac.rw')) return 'Use a valid @ur.ac.rw email address.'
      // Derive a name from the email prefix
      const prefix = lower.replace('@ur.ac.rw', '')
      const parts = prefix.split(/[.\-_]/).map((p: string) => p.charAt(0).toUpperCase() + p.slice(1))
      const name = parts.length > 1 ? `${parts[0]} ${parts.slice(1).join(' ')}` : parts[0] || 'Student'
      const college = COLLEGES[Math.floor(Math.random() * COLLEGES.length)]
      student = {
        id: `UR/${new Date().getFullYear()}/${college.code}/${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`,
        name,
        email: lower,
        phone: '+250 788 XXX XXX',
        gender: Math.random() > 0.5 ? 'M' as const : 'F' as const,
        dob: '2000-01-01',
        college: college.name,
        program: college.programs[0],
        year: 'Year 3',
        enrollmentYear: new Date().getFullYear() - 2,
        status: 'active' as const,
      }
    }
    // Create fresh requests if not in store
    const key = student.email.toLowerCase()
    if (!requestsStore.current[key]) {
      requestsStore.current[key] = [createRequest('clearance'), createRequest('transcript')]
    }
    setUser({
      role: 'student',
      profile: student,
      requests: requestsStore.current[key],
    })
    addNotif({
      id: `n-${Date.now()}`, timestamp: new Date().toLocaleTimeString(),
      actor: 'System', action: 'Login',
      details: `Welcome ${student.name}. You have pending clearance tasks.`,
      level: 0,
    })
    return null
  }, [addNotif, allStudents])

  const loginLeader = useCallback((email: string, _password: string): string | null => {
    const leader = LEADERS.find(l => l.email.toLowerCase() === email.toLowerCase())
    if (!leader) return 'Leader not found. Use a valid UR leader email.'
    setUser({
      role: 'leader',
      profile: leader,
      pendingRequests: [],
      students: allStudents,
    })
    addNotif({
      id: `n-${Date.now()}`, timestamp: new Date().toLocaleTimeString(),
      actor: 'System', action: 'Login',
      details: `Signed in as ${leader.name} (${leader.title})`,
      level: leader.level,
    })
    return null
  }, [addNotif, allStudents])

  const logout = useCallback(() => {
    setUser(null)
    setNotifications([])
  }, [])

  const uploadDoc = useCallback((requestId: string, docId: string, fileName: string) => {
    if (!user || user.role !== 'student') return
    const key = user.profile.email.toLowerCase()
    const updated = (requestsStore.current[key] || user.requests).map(req => {
      if (req.id !== requestId) return req
      return {
        ...req,
        docs: req.docs.map(d => d.id === docId ? { ...d, uploaded: true, fileName } : d),
        updates: [...req.updates, {
          id: `u-${Date.now()}`, timestamp: new Date().toLocaleDateString(),
          actor: user.profile.name, action: 'Uploaded Document',
          details: `"${fileName}" uploaded. Awaiting verification.`,
          level: req.currentLevel,
        }],
      }
    })
    requestsStore.current[key] = updated
    setUser({ ...user, requests: updated })
    addNotif({
      id: `n-${Date.now()}`, timestamp: new Date().toLocaleTimeString(),
      actor: user.profile.name, action: 'Upload',
      details: `Document "${fileName}" uploaded for ${requestId}.`,
      level: 0,
    })
  }, [user, addNotif])

  const getStudentRequests = useCallback((email: string): StudentRequest[] => {
    const key = email.toLowerCase()
    if (!requestsStore.current[key]) {
      requestsStore.current[key] = [createRequest('clearance'), createRequest('transcript')]
    }
    return requestsStore.current[key]
  }, [])

  const verifyDoc = useCallback((studentEmail: string, requestId: string, docId: string, approved: boolean, leaderName: string) => {
    const key = studentEmail.toLowerCase()
    const existing = getStudentRequests(key)
    const updated = existing.map(req => {
      // Match by exact ID or by type if generic CLR/TRS prefix passed
      const isMatch = req.id === requestId || (requestId.startsWith('CLR') && req.type === 'clearance') || (requestId.startsWith('TRS') && req.type === 'transcript')
      if (!isMatch) return req
      return {
        ...req,
        docs: req.docs.map(d => d.id === docId ? { ...d, verified: approved, verifiedBy: leaderName, verifiedDate: new Date().toLocaleDateString() } : d),
      }
    })
    requestsStore.current[key] = updated

    if (user?.role === 'student' && user.profile.email.toLowerCase() === key) {
      setUser({ ...user, requests: updated })
    }

    addNotif({
      id: `n-${Date.now()}`, timestamp: new Date().toLocaleTimeString(),
      actor: leaderName, action: approved ? 'Verified' : 'Rejected',
      details: `Document ${docId} ${approved ? 'verified ✓' : 'rejected ✗'} by ${leaderName}.`,
      level: 0,
    })
    forceRender(n => n + 1)
  }, [addNotif, getStudentRequests, user])

  function advanceStudentRequest(key: string, requestId: string, comment: string, leaderName: string, approved: boolean, signature?: string): StudentRequest | null {
    const existing = getStudentRequests(key)
    let updatedReq: StudentRequest | null = null
    const updated = existing.map(req => {
      const isMatch = req.id === requestId || (requestId.startsWith('CLR') && req.type === 'clearance') || (requestId.startsWith('TRS') && req.type === 'transcript')
      if (!isMatch) return req

      const now = new Date().toLocaleDateString()
      if (approved) {
        const newSteps = req.steps.map(s =>
          s.level === req.currentLevel ? { ...s, status: 'approved' as const, comment, date: now, signedBy: leaderName, signature } : s
        )
        const nextLevel = req.currentLevel + 1
        if (nextLevel > 4) {
          const certRef = `${req.type === 'clearance' ? 'CLR' : 'TRS'}-CERT-${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0')}`
          updatedReq = {
            ...req, status: 'completed', currentLevel: 4, steps: newSteps,
            completedAt: now, certificateRef: certRef,
            updates: [...req.updates, {
              id: `u-${Date.now()}`, timestamp: now,
              actor: leaderName, action: 'Final Approval',
              details: `✨ All ${LEADERS.length} levels approved. Certificate: ${certRef}`,
              level: 4,
            }],
          }
          addNotif({
            id: `n-${Date.now()}`, timestamp: new Date().toLocaleTimeString(),
            actor: 'System', action: 'Completed',
            details: `🎉 ${req.type === 'clearance' ? 'Clearance' : 'Transcript'} ${req.id} fully approved! Certificate: ${certRef}`,
            level: 0,
          })
        } else {
          updatedReq = {
            ...req, currentLevel: nextLevel, steps: newSteps,
            updates: [...req.updates, {
              id: `u-${Date.now()}`, timestamp: now,
              actor: leaderName, action: 'Approved',
              details: `Level ${req.currentLevel} approved by ${leaderName}: "${comment}". Moving to ${LEADERS[nextLevel - 1].title}.`,
              level: req.currentLevel,
            }],
          }
          addNotif({
            id: `n-${Date.now()}`, timestamp: new Date().toLocaleTimeString(),
            actor: leaderName, action: 'Approved',
            details: `✅ ${req.id} approved at Level ${req.currentLevel}. Moving to ${LEADERS[nextLevel - 1].title}.`,
            level: 0,
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
          level: 0,
        })
      }
      return updatedReq
    })
    requestsStore.current[key] = updated
    // Sync with current user if they are the student being updated
    if (user?.role === 'student' && user.profile.email.toLowerCase() === key) {
      setUser({ ...user, requests: updated })
    }
    forceRender(n => n + 1)
    return updatedReq
  }

  const approveRequest = useCallback((studentEmail: string, requestId: string, comment: string, leaderName: string, signature?: string) => {
    advanceStudentRequest(studentEmail.toLowerCase(), requestId, comment, leaderName, true, signature)
  }, [])

  const rejectRequest = useCallback((studentEmail: string, requestId: string, comment: string, leaderName: string, signature?: string) => {
    advanceStudentRequest(studentEmail.toLowerCase(), requestId, comment, leaderName, false, signature)
  }, [])

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
    // placeholder — updates flow through request.updates
  }, [])

  const requests: StudentRequest[] = user?.role === 'student'
    ? (requestsStore.current[user.profile.email.toLowerCase()] || user.requests)
    : []

  return (
    <AppContext.Provider value={{
      user, allStudents, meetingSlots, notifications, requests,
      login, loginLeader, logout,
      uploadDoc, verifyDoc, approveRequest, rejectRequest,
      bookMeeting, cancelMeeting,
      getStudentByEmail, getStudentById, dismissNotification, getStudentRequests,
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
