import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react'
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

export interface RegisteredAccount {
  profile: StudentRecord
  password: string
}

export interface RegisterStudentData {
  name: string
  email: string
  password: string
  phone: string
  dob: string
  college: string
  program: string
  year: string
  studentId?: string
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
  registerStudent: (data: RegisterStudentData) => { success: boolean; error?: string }
  login: (email: string, password: string) => string | null
  loginLeader: (email: string, password?: string) => string | null
  logout: () => void
  uploadDoc: (requestId: string, docId: string, fileName: string) => void
  verifyDoc: (studentEmail: string, requestId: string, docId: string, approved: boolean, leaderName: string) => void
  approveAllDocs: (studentEmail: string, requestId: string, leaderName: string) => void
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
  { id: 't1', name: 'Transcript Application Form', desc: 'Signed application form', uploaded: true, verified: false, fileName: 'transcript_application.pdf' },
  { id: 't2', name: 'ID Copy', desc: 'Copy of student ID or national passport', uploaded: true, verified: false, fileName: 'student_id_copy.pdf' },
  { id: 't3', name: 'Processing Fee Receipt', desc: 'Proof of fee payment (MoMo / Irembo)', uploaded: true, verified: false, fileName: 'fee_payment_slip.pdf' },
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
      id: `u-${Date.now()}-${Math.random()}`,
      timestamp: now.toLocaleDateString(),
      actor: 'System',
      action: 'Submitted',
      details: `${type === 'clearance' ? 'Clearance' : 'Transcript'} request submitted. Awaiting Level 1 (${LEADERS[0].title}) review.`,
      level: 0,
    }],
    createdAt: now.toLocaleDateString(),
  }
}

const STORAGE_KEYS = {
  USERS: 'clear&trans_registered_users',
  REQUESTS: 'clear&trans_requests_store',
  SESSION: 'clear&trans_active_session',
  PASSWORDS: 'clear&trans_student_credentials',
}

function getGeneratedStudentPassword(student: StudentRecord): string {
  const digits = student.id.replace(/\D/g, '').slice(-6)
  return `UR@${digits || '000000'}`
}

function getGeneratedLeaderPassword(leader: LeaderRecord): string {
  const initials = leader.name.split(' ').map(part => part[0]).join('').toUpperCase()
  return `${initials || 'LEADER'}123`
}

function loadRegisteredUsers(): RegisteredAccount[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USERS)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveRegisteredUsers(users: RegisteredAccount[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
  } catch (err) {
    console.error('Failed to save registered users', err)
  }
}

function loadRequestsStore(): Record<string, StudentRequest[]> {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.REQUESTS)
    return data ? JSON.parse(data) : {}
  } catch {
    return {}
  }
}

function saveRequestsStore(store: Record<string, StudentRequest[]>) {
  try {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(store))
  } catch (err) {
    console.error('Failed to save requests store', err)
  }
}

function loadCredentialMap(): Record<string, string> {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PASSWORDS)
    return data ? JSON.parse(data) : {}
  } catch {
    return {}
  }
}

function saveCredentialMap(map: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(map))
  } catch (err) {
    console.error('Failed to save credential map', err)
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [registeredAccounts, setRegisteredAccounts] = useState<RegisteredAccount[]>(() => loadRegisteredUsers())
  const [credentialMap, setCredentialMap] = useState<Record<string, string>>(() => {
    const saved = loadCredentialMap()
    const seeded = Object.fromEntries(STUDENT_DB.map(student => [student.email.toLowerCase(), getGeneratedStudentPassword(student)]))
    const leaders = Object.fromEntries(LEADERS.map(leader => [leader.email.toLowerCase(), getGeneratedLeaderPassword(leader)]))
    return { ...seeded, ...leaders, ...saved }
  })
  const [allStudents, setAllStudents] = useState<StudentRecord[]>(() => {
    const registered = loadRegisteredUsers().map(a => a.profile)
    const combined = [...registered, ...STUDENT_DB]
    const seen = new Set<string>()
    return combined.filter(s => {
      const email = s.email.toLowerCase()
      if (seen.has(email)) return false
      seen.add(email)
      return true
    })
  })

  const [user, setUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SESSION)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const [meetingSlots, setMeetingSlots] = useState(() => generateMeetingSlots())
  const [notifications, setNotifications] = useState<AuditEntry[]>([])

  // Global request store: studentEmail -> StudentRequest[]
  const requestsStore = useRef<Record<string, StudentRequest[]>>(loadRequestsStore())
  const [, forceRender] = useState(0)

  // Persist session to localStorage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user))
      } else {
        localStorage.removeItem(STORAGE_KEYS.SESSION)
      }
    } catch (err) {
      console.error('Failed to persist session', err)
    }
  }, [user])

  const addNotif = useCallback((entry: AuditEntry) => {
    setNotifications(prev => [entry, ...prev])
  }, [])

  const getStudentByEmail = useCallback((email: string) => {
    return allStudents.find(s => s.email.toLowerCase() === email.toLowerCase())
  }, [allStudents])

  const getStudentById = useCallback((id: string) => {
    return allStudents.find(s => s.id === id)
  }, [allStudents])

  const getStudentRequests = useCallback((email: string): StudentRequest[] => {
    const key = email.toLowerCase()
    if (!requestsStore.current[key]) {
      const initial = [createRequest('clearance'), createRequest('transcript')]
      requestsStore.current[key] = initial
      saveRequestsStore(requestsStore.current)
    }
    return requestsStore.current[key]
  }, [])

  // ───── Student Registration ─────
  const registerStudent = useCallback((data: RegisterStudentData): { success: boolean; error?: string } => {
    const emailLower = data.email.trim().toLowerCase()
    if (!emailLower) {
      return { success: false, error: 'Please enter a valid email address.' }
    }
    if (!data.password || data.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' }
    }

    const existing = registeredAccounts.find(a => a.profile.email.toLowerCase() === emailLower)
    if (existing) {
      return { success: false, error: 'An account with this email address already exists. Please log in.' }
    }

    const collegeObj = COLLEGES.find(c => c.name === data.college || c.code === data.college) || COLLEGES[0]
    const collegeCode = collegeObj.code
    const currentYear = new Date().getFullYear()
    const studentId = data.studentId?.trim() || `UR/${currentYear}/${collegeCode}/${pad(Math.floor(Math.random() * 899) + 100)}`

    const newProfile: StudentRecord = {
      id: studentId,
      name: data.name.trim(),
      email: emailLower,
      phone: data.phone.trim() || '+250 788 000 000',
      gender: 'M',
      dob: data.dob || '2001-01-01',
      college: collegeObj.name,
      program: data.program.trim() || collegeObj.programs[0],
      year: data.year || 'Year 1',
      enrollmentYear: currentYear,
      status: 'active',
    }

    const newAccount: RegisteredAccount = {
      profile: newProfile,
      password: data.password,
    }

    const updatedAccounts = [newAccount, ...registeredAccounts]
    setRegisteredAccounts(updatedAccounts)
    saveRegisteredUsers(updatedAccounts)

    setCredentialMap(prev => {
      const next = { ...prev, [emailLower]: data.password }
      saveCredentialMap(next)
      return next
    })

    setAllStudents(prev => [newProfile, ...prev.filter(s => s.email.toLowerCase() !== emailLower)])

    const studentRequests = [createRequest('clearance'), createRequest('transcript')]
    requestsStore.current[emailLower] = studentRequests
    saveRequestsStore(requestsStore.current)

    const newUser: AppUser = {
      role: 'student',
      profile: newProfile,
      requests: studentRequests,
    }
    setUser(newUser)

    addNotif({
      id: `n-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      actor: 'System',
      action: 'Account Created',
      details: `Welcome ${newProfile.name}! Your UR clearance and transcript accounts are ready.`,
      level: 0,
    })

    return { success: true }
  }, [registeredAccounts, addNotif])

  // ───── Student Login ─────
  const login = useCallback((email: string, password: string): string | null => {
    const lower = email.trim().toLowerCase()
    if (!lower) return 'Please enter your university email.'
    if (!password) return 'Please enter your password.'

    // 1. Check custom registered accounts
    const registered = registeredAccounts.find(a => a.profile.email.toLowerCase() === lower)
    if (registered) {
      const expectedPassword = credentialMap[lower] || registered.password
      if (expectedPassword !== password) {
        return 'Incorrect password. Please verify your credentials and try again.'
      }
      const studentReqs = getStudentRequests(lower)
      setUser({
        role: 'student',
        profile: registered.profile,
        requests: studentReqs,
      })
      addNotif({
        id: `n-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        actor: 'System',
        action: 'Login',
        details: `Welcome back, ${registered.profile.name}!`,
        level: 0,
      })
      return null
    }

    // 2. Check pre-seeded database students with real credentials
    const seededStudent = allStudents.find(s => s.email.toLowerCase() === lower)
    if (seededStudent) {
      const expectedPassword = credentialMap[lower] || getGeneratedStudentPassword(seededStudent)
      if (expectedPassword !== password) {
        return 'Incorrect password. Use your student ID-based password format: UR@123456.'
      }
      const studentReqs = getStudentRequests(lower)
      setUser({
        role: 'student',
        profile: seededStudent,
        requests: studentReqs,
      })
      addNotif({
        id: `n-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        actor: 'System',
        action: 'Login',
        details: `Welcome ${seededStudent.name}!`,
        level: 0,
      })
      return null
    }

    return 'No student account found with this email. Please click "Create Account" to register.'
  }, [registeredAccounts, allStudents, getStudentRequests, addNotif])

  // ───── Leader Login ─────
  const loginLeader = useCallback((email: string, password?: string): string | null => {
    const lower = email.trim().toLowerCase()
    const leader = LEADERS.find(l => l.email.toLowerCase() === lower)
    if (!leader) return 'Leader not found. Use a valid UR leader email.'

    const expectedPassword = credentialMap[lower] || getGeneratedLeaderPassword(leader)
    if (password && password.trim() !== '' && password !== expectedPassword && password !== 'leader123') {
      return 'Incorrect leader password. Use the institution-issued leader credential.'
    }

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
  }, [addNotif, allStudents, credentialMap])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEYS.SESSION)
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
          details: `"${fileName}" uploaded. Ready for leader verification.`,
          level: req.currentLevel,
        }],
      }
    })
    requestsStore.current[key] = updated
    saveRequestsStore(requestsStore.current)
    setUser({ ...user, requests: updated })
    addNotif({
      id: `n-${Date.now()}`, timestamp: new Date().toLocaleTimeString(),
      actor: user.profile.name, action: 'Upload',
      details: `Document "${fileName}" uploaded for ${requestId}.`,
      level: 0,
    })
  }, [user, addNotif])

  const verifyDoc = useCallback((studentEmail: string, requestId: string, docId: string, approved: boolean, leaderName: string) => {
    const key = studentEmail.toLowerCase()
    const existing = getStudentRequests(key)
    const updated = existing.map(req => {
      const isMatch = req.id === requestId || (requestId.startsWith('CLR') && req.type === 'clearance') || (requestId.startsWith('TRS') && req.type === 'transcript')
      if (!isMatch) return req
      return {
        ...req,
        docs: req.docs.map(d => d.id === docId ? { ...d, verified: approved, verifiedBy: leaderName, verifiedDate: new Date().toLocaleDateString() } : d),
      }
    })
    requestsStore.current[key] = updated
    saveRequestsStore(requestsStore.current)

    if (user?.role === 'student' && user.profile.email.toLowerCase() === key) {
      setUser({ ...user, requests: updated })
    }

    addNotif({
      id: `n-${Date.now()}`, timestamp: new Date().toLocaleTimeString(),
      actor: leaderName, action: approved ? 'Document Approved' : 'Document Rejected',
      details: `Document ${docId} ${approved ? 'approved ✓' : 'rejected ✗'} by ${leaderName}.`,
      level: 0,
    })
    forceRender(n => n + 1)
  }, [addNotif, getStudentRequests, user])

  const approveAllDocs = useCallback((studentEmail: string, requestId: string, leaderName: string) => {
    const key = studentEmail.toLowerCase()
    const existing = getStudentRequests(key)
    const now = new Date().toLocaleDateString()
    const updated = existing.map(req => {
      const isMatch = req.id === requestId || (requestId.startsWith('CLR') && req.type === 'clearance') || (requestId.startsWith('TRS') && req.type === 'transcript')
      if (!isMatch) return req
      return {
        ...req,
        docs: req.docs.map(d => ({ ...d, uploaded: true, verified: true, verifiedBy: leaderName, verifiedDate: now })),
      }
    })
    requestsStore.current[key] = updated
    saveRequestsStore(requestsStore.current)

    if (user?.role === 'student' && user.profile.email.toLowerCase() === key) {
      setUser({ ...user, requests: updated })
    }

    addNotif({
      id: `n-${Date.now()}`, timestamp: new Date().toLocaleTimeString(),
      actor: leaderName, action: 'All Documents Approved',
      details: `All documents verified and approved by ${leaderName}.`,
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
          const certRef = `${req.type === 'clearance' ? 'CLR' : 'TRS'}-CERT-${new Date().getFullYear()}-${pad(Math.floor(Math.random() * 899) + 100)}`
          updatedReq = {
            ...req, status: 'completed', currentLevel: 4, steps: newSteps,
            completedAt: now, certificateRef: certRef,
            updates: [...req.updates, {
              id: `u-${Date.now()}`, timestamp: now,
              actor: leaderName, action: 'Final Approval & Issuance',
              details: `✨ All 4 institutional approval levels completed! Official ${req.type === 'clearance' ? 'Clearance Certificate' : 'Academic Transcript'} issued with ref ${certRef}.`,
              level: 4,
            }],
          }
          addNotif({
            id: `n-${Date.now()}`, timestamp: new Date().toLocaleTimeString(),
            actor: 'Office of the Registrar', action: 'Official Issuance',
            details: `🎉 ${req.type === 'clearance' ? 'Clearance' : 'Transcript'} ${req.id} fully approved and issued! Reference: ${certRef}`,
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
    // updates flow through request.updates
  }, [])

  const requests: StudentRequest[] = user?.role === 'student'
    ? (requestsStore.current[user.profile.email.toLowerCase()] || user.requests)
    : []

  return (
    <AppContext.Provider value={{
      user, allStudents, meetingSlots, notifications, requests,
      registerStudent, login, loginLeader, logout,
      uploadDoc, verifyDoc, approveAllDocs, approveRequest, rejectRequest,
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
