import express, { type Request, type Response } from 'express'
import cors from 'cors'
import { createHash, randomBytes, randomInt, scrypt, timingSafeEqual } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import { initDb, openDb } from './sqlite.js'
import path from 'node:path'

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') })

const app = express()
app.use(cors())
app.use(express.json({ limit: '14mb' }))

const databaseReady = initDb()
if (process.env.VERCEL) {
  void databaseReady.catch(error => console.error('Failed to initialize backend database', error))
}
app.use((_req: Request, _res: Response, next) => {
  void databaseReady.then(() => next(), next)
})

app.get(['/health', '/api/health'], (_req: Request, res: Response) => res.json({ ok: true }))

function hashVerificationCode(code: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(code, salt, 64, (error, key) => {
      if (error) reject(error)
      else resolve(key)
    })
  })
}

function hashSecret(value: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(value, salt, 64, (error, key) => {
      if (error) reject(error)
      else resolve(key)
    })
  })
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

type StudentProfile = {
  id: string
  name: string
  email: string
  phone: string
  dob: string
  college: string
  program: string
  year: string
}

async function authenticatedStudent(req: Request): Promise<{ email: string; profile: StudentProfile } | undefined> {
  const token = req.headers.authorization?.match(/^Bearer ([\da-f]{64})$/i)?.[1]
  if (!token) return undefined
  const db = await openDb()
  const session = await db.get<{ email: string; expiresAt: number }>(
    'SELECT email, expiresAt FROM student_sessions WHERE tokenHash = ?',
    hashToken(token),
  )
  if (!session || session.expiresAt <= Date.now()) {
    if (session) await db.run('DELETE FROM student_sessions WHERE tokenHash = ?', hashToken(token))
    return undefined
  }
  const account = await db.get<{ profile: string }>(
    'SELECT profile FROM student_accounts WHERE email = ?',
    session.email,
  )
  if (!account) return undefined
  return { email: session.email, profile: JSON.parse(account.profile) as StudentProfile }
}

async function loadStudentRequests(email: string) {
  const db = await openDb()
  const rows: Array<{ payload: string }> = await db.all(
    'SELECT payload FROM student_requests WHERE email = ? ORDER BY createdAt',
    email,
  )
  return rows.map(row => JSON.parse(row.payload) as Record<string, unknown>)
}

app.post('/api/auth/signup/send-code', async (req: Request, res: Response) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' })
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    return res.status(503).json({
      error: 'Email delivery is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM in the backend environment, then restart or redeploy.',
    })
  }
  const smtpPort = Number(SMTP_PORT)
  if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
    return res.status(503).json({
      error: 'Email delivery is not configured correctly. Check SMTP_PORT in the backend environment and restart or redeploy.',
    })
  }

  const db = await openDb()
  try {
    const existing = await db.get<{ createdAt: number }>(
      'SELECT createdAt FROM email_verifications WHERE email = ?',
      email,
    )
    if (existing && Date.now() - existing.createdAt < 60_000) {
      return res.status(429).json({ error: 'Please wait one minute before requesting another confirmation code.' })
    }

    const code = String(randomInt(100000, 1_000_000))
    const salt = randomBytes(16).toString('hex')
    const codeHash = (await hashVerificationCode(code, salt)).toString('hex')
    const now = Date.now()
    await db.run(
      `INSERT OR REPLACE INTO email_verifications (email, codeHash, salt, expiresAt, attempts, createdAt)
       VALUES (?, ?, ?, ?, 0, ?)`,
      email,
      codeHash,
      salt,
      now + 15 * 60_000,
      now,
    )

    try {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      })
      await transporter.sendMail({
        from: SMTP_FROM,
        to: email,
        subject: 'Confirm your CLEAR&TRANS portal email',
        text: `Your portal email confirmation code is ${code}. It expires in 15 minutes. This confirms access to the email address only; it does not verify University enrollment.`,
        html: `<p>Your CLEAR&amp;TRANS portal email confirmation code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:6px">${code}</p><p>This code expires in 15 minutes. Email confirmation does not verify University enrollment. If you did not request an account, you can ignore this email.</p>`,
      })
    } catch (error) {
      await db.run('DELETE FROM email_verifications WHERE email = ?', email)
      console.error('Failed to send signup confirmation email', error)
      return res.status(502).json({ error: 'Could not send the confirmation email. Check the address or try again later.' })
    }

    return res.json({ message: 'Confirmation code sent. Check your email.' })
  } catch (error) {
    console.error('Failed to create signup confirmation code', error)
    return res.status(500).json({ error: 'Could not start email confirmation. Please try again.' })
  }
})

app.post('/api/auth/signup/verify-code', async (req: Request, res: Response) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  const code = typeof req.body?.code === 'string' ? req.body.code.trim() : ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: 'Enter the six-digit code sent to your email.' })
  }

  const db = await openDb()
  try {
    const verification = await db.get<{
      codeHash: string
      salt: string
      expiresAt: number
      attempts: number
    }>(
      'SELECT codeHash, salt, expiresAt, attempts FROM email_verifications WHERE email = ?',
      email,
    )
    if (!verification || verification.expiresAt <= Date.now() || verification.attempts >= 5) {
      await db.run('DELETE FROM email_verifications WHERE email = ?', email)
      return res.status(400).json({ error: 'The code is invalid or expired. Request a new code and try again.' })
    }

    const submittedHash = await hashVerificationCode(code, verification.salt)
    const expectedHash = Buffer.from(verification.codeHash, 'hex')
    if (!timingSafeEqual(submittedHash, expectedHash)) {
      const attempts = verification.attempts + 1
      if (attempts >= 5) {
        await db.run('DELETE FROM email_verifications WHERE email = ?', email)
      } else {
        await db.run('UPDATE email_verifications SET attempts = ? WHERE email = ?', attempts, email)
      }
      return res.status(400).json({ error: 'The code is invalid or expired. Request a new code and try again.' })
    }

    const signupToken = randomBytes(32).toString('hex')
    const tokenSalt = randomBytes(16).toString('hex')
    const tokenHash = (await hashSecret(signupToken, tokenSalt)).toString('hex')
    await db.run(
      `INSERT OR REPLACE INTO signup_verifications (email, tokenHash, salt, expiresAt)
       VALUES (?, ?, ?, ?)`,
      email,
      tokenHash,
      tokenSalt,
      Date.now() + 15 * 60_000,
    )
    await db.run('DELETE FROM email_verifications WHERE email = ?', email)
    return res.json({ verified: true, signupToken })
  } catch (error) {
    console.error('Failed to verify signup email code', error)
    return res.status(500).json({ error: 'Could not verify the code. Please try again.' })
  }
})

app.post('/api/auth/signup/register', async (req: Request, res: Response) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : ''
  const dob = typeof req.body?.dob === 'string' ? req.body.dob : ''
  const studentId = typeof req.body?.studentId === 'string' ? req.body.studentId.trim() : ''
  const college = typeof req.body?.college === 'string' ? req.body.college.trim() : ''
  const program = typeof req.body?.program === 'string' ? req.body.program.trim() : ''
  const year = typeof req.body?.year === 'string' ? req.body.year.trim() : ''
  const password = typeof req.body?.password === 'string' ? req.body.password : ''
  const signupToken = typeof req.body?.signupToken === 'string' ? req.body.signupToken : ''

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    || !name || name.length > 120
    || !phone || phone.length > 40
    || !dob || !studentId || studentId.length > 80
    || !college || college.length > 120
    || !program || program.length > 120
    || !year || year.length > 30
    || password.length < 6 || password.length > 256
    || !/^[\da-f]{64}$/i.test(signupToken)) {
    return res.status(400).json({ error: 'Complete all required details and confirm your email before creating an account.' })
  }

  const db = await openDb()
  try {
    const verification = await db.get<{ tokenHash: string; salt: string; expiresAt: number }>(
      'SELECT tokenHash, salt, expiresAt FROM signup_verifications WHERE email = ?',
      email,
    )
    if (!verification || verification.expiresAt <= Date.now()) {
      await db.run('DELETE FROM signup_verifications WHERE email = ?', email)
      return res.status(400).json({ error: 'Email confirmation expired. Request a new code and try again.' })
    }
    const submittedToken = await hashSecret(signupToken, verification.salt)
    const expectedToken = Buffer.from(verification.tokenHash, 'hex')
    if (!timingSafeEqual(submittedToken, expectedToken)) {
      return res.status(400).json({ error: 'Email confirmation could not be verified. Request a new code and try again.' })
    }
    if (await db.get('SELECT email FROM student_accounts WHERE email = ?', email)) {
      return res.status(409).json({ error: 'An account with this email already exists. Please sign in.' })
    }
    if (await db.get('SELECT email FROM student_accounts WHERE lower(studentId) = lower(?)', studentId)) {
      return res.status(409).json({ error: 'This student ID is already associated with an account.' })
    }
    if (await db.get('SELECT id FROM students WHERE lower(id) = lower(?)', studentId)) {
      return res.status(409).json({ error: 'This student ID is already present in the portal.' })
    }

    const profile: StudentProfile = { id: studentId, name, email, phone, dob, college, program, year }
    const salt = randomBytes(16).toString('hex')
    const passwordHash = (await hashSecret(password, salt)).toString('hex')
    await db.run('BEGIN IMMEDIATE')
    try {
      await db.run(
        `INSERT INTO student_accounts (email, studentId, profile, passwordHash, salt, createdAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        email, studentId, JSON.stringify(profile), passwordHash, salt, new Date().toISOString(),
      )
      await db.run(
        `INSERT INTO students (id, name, email, phone, dob, college, program, year, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
        studentId, name, email, phone, dob, college, program, year,
      )
      await db.run('DELETE FROM signup_verifications WHERE email = ?', email)
      await db.run('COMMIT')
    } catch (error) {
      await db.run('ROLLBACK')
      throw error
    }
    return res.status(201).json({ created: true })
  } catch (error) {
    console.error('Failed to register student account', error)
    return res.status(500).json({ error: 'Could not create your account. Please try again.' })
  }
})

app.post('/api/auth/login', async (req: Request, res: Response) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  const password = typeof req.body?.password === 'string' ? req.body.password : ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length > 256) {
    return res.status(400).json({ error: 'Enter your registered email address and password.' })
  }
  try {
    const db = await openDb()
    const account = await db.get<{ profile: string; passwordHash: string; salt: string }>(
      'SELECT profile, passwordHash, salt FROM student_accounts WHERE email = ?',
      email,
    )
    if (!account) return res.status(401).json({ error: 'No account found for that email. Create an account first.' })
    const submittedHash = await hashSecret(password, account.salt)
    const expectedHash = Buffer.from(account.passwordHash, 'hex')
    if (!timingSafeEqual(submittedHash, expectedHash)) {
      return res.status(401).json({ error: 'Incorrect email or password.' })
    }
    const token = randomBytes(32).toString('hex')
    await db.run(
      'INSERT INTO student_sessions (tokenHash, email, expiresAt) VALUES (?, ?, ?)',
      hashToken(token), email, Date.now() + 30 * 24 * 60 * 60_000,
    )
    return res.json({
      token,
      profile: JSON.parse(account.profile) as StudentProfile,
      requests: await loadStudentRequests(email),
    })
  } catch (error) {
    console.error('Failed to sign in student', error)
    return res.status(500).json({ error: 'Could not sign in right now. Please try again.' })
  }
})

app.get('/api/auth/session', async (req: Request, res: Response) => {
  try {
    const student = await authenticatedStudent(req)
    if (!student) return res.status(401).json({ error: 'Your session has expired. Sign in again.' })
    return res.json({ profile: student.profile, requests: await loadStudentRequests(student.email) })
  } catch (error) {
    console.error('Failed to restore student session', error)
    return res.status(500).json({ error: 'Could not restore your session.' })
  }
})

app.post('/api/auth/logout', async (req: Request, res: Response) => {
  const token = req.headers.authorization?.match(/^Bearer ([\da-f]{64})$/i)?.[1]
  if (token) {
    try {
      const db = await openDb()
      await db.run('DELETE FROM student_sessions WHERE tokenHash = ?', hashToken(token))
    } catch (error) {
      console.error('Failed to end student session', error)
      return res.status(500).json({ error: 'Could not end your session. Please try again.' })
    }
  }
  return res.json({ loggedOut: true })
})

app.put('/api/student/requests', async (req: Request, res: Response) => {
  try {
    const student = await authenticatedStudent(req)
    if (!student) return res.status(401).json({ error: 'Sign in again to save your requests.' })
    const requests = req.body?.requests
    if (!Array.isArray(requests) || requests.length > 20
      || requests.some(request => !request || typeof request.id !== 'string'
        || !['clearance', 'transcript'].includes(request.type)
        || !['draft', 'in_progress', 'completed', 'rejected'].includes(request.status))) {
      return res.status(400).json({ error: 'The request data is invalid.' })
    }
    const db = await openDb()
    await db.run('BEGIN IMMEDIATE')
    try {
      const keepIds = requests.map(request => request.id as string)
      if (keepIds.length) {
        const placeholders = keepIds.map(() => '?').join(', ')
        await db.run(`DELETE FROM student_requests WHERE email = ? AND requestId NOT IN (${placeholders})`, student.email, ...keepIds)
      } else {
        await db.run('DELETE FROM student_requests WHERE email = ?', student.email)
      }
      for (const request of requests as Array<Record<string, unknown>>) {
        const payload = JSON.stringify(request)
        await db.run(
          `INSERT INTO student_requests (email, requestId, type, payload, createdAt)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(email, requestId) DO UPDATE SET type = excluded.type, payload = excluded.payload`,
          student.email, request.id, request.type, payload,
          typeof request.createdAt === 'string' ? request.createdAt : new Date().toISOString(),
        )
        await db.run(
          `INSERT INTO requests (id, studentEmail, type, status, createdAt, updatedAt, currentLevel)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET status = excluded.status, updatedAt = excluded.updatedAt, currentLevel = excluded.currentLevel`,
          request.id, student.email, request.type, request.status,
          typeof request.createdAt === 'string' ? request.createdAt : new Date().toISOString(),
          new Date().toISOString(),
          typeof request.currentLevel === 'number' ? request.currentLevel : 1,
        )
      }
      await db.run('COMMIT')
    } catch (error) {
      await db.run('ROLLBACK')
      throw error
    }
    return res.json({ saved: true })
  } catch (error) {
    console.error('Failed to save student requests', error)
    return res.status(500).json({ error: 'Could not save request progress.' })
  }
})

app.put('/api/student/requests/:requestId/documents/:docId', async (req: Request, res: Response) => {
  try {
    const student = await authenticatedStudent(req)
    if (!student) return res.status(401).json({ error: 'Sign in again to upload a document.' })
    const requestId = Array.isArray(req.params.requestId) ? req.params.requestId[0] : req.params.requestId
    const docId = Array.isArray(req.params.docId) ? req.params.docId[0] : req.params.docId
    const fileName = typeof req.body?.fileName === 'string' ? req.body.fileName.trim().slice(0, 255) : ''
    const mimeType = typeof req.body?.mimeType === 'string' ? req.body.mimeType : ''
    const data = typeof req.body?.data === 'string' ? req.body.data : ''
    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(requestId) || !/^[a-zA-Z0-9_-]{1,80}$/.test(docId)
      || !fileName || !/^application\/pdf$|^image\/(jpeg|png|webp|gif)$/.test(mimeType)
      || !/^[A-Za-z0-9+/]*={0,2}$/.test(data) || !data.length || data.length > 14_000_000) {
      return res.status(400).json({ error: 'Choose a PDF or image file up to 10 MB.' })
    }
    const content = Buffer.from(data, 'base64')
    if (!content.length || content.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'The selected file exceeds the 10 MB limit.' })
    }
    const db = await openDb()
    const request = await db.get<{ payload: string }>(
      'SELECT payload FROM student_requests WHERE email = ? AND requestId = ?',
      student.email, requestId,
    )
    if (!request) return res.status(404).json({ error: 'Request not found.' })
    const payload = JSON.parse(request.payload) as { docs?: Array<{ id?: string }> }
    if (!payload.docs?.some(doc => doc.id === docId)) {
      return res.status(400).json({ error: 'This document is not required for the selected request.' })
    }
    await db.run(
      `INSERT INTO student_attachments (email, requestId, docId, fileName, mimeType, content, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(email, requestId, docId) DO UPDATE SET
         fileName = excluded.fileName, mimeType = excluded.mimeType,
         content = excluded.content, createdAt = excluded.createdAt`,
      student.email, requestId, docId, fileName, mimeType, content, new Date().toISOString(),
    )
    return res.json({ uploaded: true, fileName })
  } catch (error) {
    console.error('Failed to store student attachment', error)
    return res.status(500).json({ error: 'Could not upload the document. Please try again.' })
  }
})

app.get('/api/student/requests/:requestId/documents/:docId', async (req: Request, res: Response) => {
  try {
    const student = await authenticatedStudent(req)
    if (!student) return res.status(401).json({ error: 'Sign in again to view this document.' })
    const db = await openDb()
    const attachment = await db.get<{ fileName: string; mimeType: string; content: Buffer }>(
      `SELECT fileName, mimeType, content FROM student_attachments
       WHERE email = ? AND requestId = ? AND docId = ?`,
      student.email,
      Array.isArray(req.params.requestId) ? req.params.requestId[0] : req.params.requestId,
      Array.isArray(req.params.docId) ? req.params.docId[0] : req.params.docId,
    )
    if (!attachment) return res.status(404).json({ error: 'No uploaded document was found.' })
    res.setHeader('Content-Type', attachment.mimeType)
    res.setHeader('Content-Disposition', `inline; filename="${attachment.fileName.replace(/["\\\r\n]/g, '_')}"`)
    return res.send(attachment.content)
  } catch (error) {
    console.error('Failed to load student attachment', error)
    return res.status(500).json({ error: 'Could not open the document.' })
  }
})

app.get('/api/student/final-documents', async (req: Request, res: Response) => {
  try {
    const student = await authenticatedStudent(req)
    if (!student) return res.status(401).json({ error: 'Sign in again to view your issued documents.' })
    const db = await openDb()
    const documents = await db.all<{
      requestId: string
      requestType: string
      fileName: string
      uploadedAt: string
      sentAt: string
    }>(
      `SELECT document.requestId, document.requestType, document.fileName, document.uploadedAt, delivery.sentAt
       FROM final_documents AS document
       JOIN final_approval_emails AS delivery
         ON delivery.studentEmail = document.studentEmail AND delivery.requestId = document.requestId
       WHERE document.studentEmail = ?
       ORDER BY delivery.sentAt DESC`,
      student.email,
    )
    return res.json({ documents })
  } catch (error) {
    console.error('Failed to list issued student documents', error)
    return res.status(500).json({ error: 'Could not load issued documents.' })
  }
})

app.get('/api/student/final-documents/:requestId', async (req: Request, res: Response) => {
  try {
    const student = await authenticatedStudent(req)
    if (!student) return res.status(401).json({ error: 'Sign in again to open your issued document.' })
    const requestId = Array.isArray(req.params.requestId) ? req.params.requestId[0] : req.params.requestId
    const db = await openDb()
    const document = await db.get<{ fileName: string; content: Buffer }>(
      `SELECT document.fileName, document.content
       FROM final_documents AS document
       JOIN final_approval_emails AS delivery
         ON delivery.studentEmail = document.studentEmail AND delivery.requestId = document.requestId
       WHERE document.studentEmail = ? AND document.requestId = ?`,
      student.email,
      requestId,
    )
    if (!document) return res.status(404).json({ error: 'This issued document is not available.' })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${document.fileName.replace(/["\\\r\n]/g, '_')}"`)
    return res.send(document.content)
  } catch (error) {
    console.error('Failed to load issued student document', error)
    return res.status(500).json({ error: 'Could not open the issued document.' })
  }
})

const finalApprovalEmailAttempts = new Map<string, number[]>()

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]!)
}

app.post('/api/notifications/final-approval', async (req: Request, res: Response) => {
  if (process.env.VERCEL) {
    return res.status(503).json({
      error: 'Final approval email delivery is disabled until University-approved reviewer SSO is configured.',
    })
  }

  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  const studentName = typeof req.body?.studentName === 'string' ? req.body.studentName.trim() : ''
  const requestId = typeof req.body?.requestId === 'string' ? req.body.requestId.trim() : ''
  const requestType = req.body?.requestType
  const leaderName = typeof req.body?.leaderName === 'string' ? req.body.leaderName.trim() : ''
  const signature = typeof req.body?.signature === 'string' ? req.body.signature.trim() : ''
  const comment = typeof req.body?.comment === 'string' ? req.body.comment.trim() : ''

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    || !studentName || studentName.length > 120
    || !/^[a-zA-Z0-9_-]{1,80}$/.test(requestId)
    || (requestType !== 'clearance' && requestType !== 'transcript')
    || !leaderName || leaderName.length > 120
    || !signature || signature.length > 120
    || comment.length > 1000) {
    return res.status(400).json({ error: 'Final approval email details are missing or invalid.' })
  }

  const db = await openDb()
  try {
    const existing = await db.get(
      'SELECT sentAt FROM final_approval_emails WHERE studentEmail = ? AND requestId = ?',
      email,
      requestId,
    )
    if (existing) {
      return res.json({ sent: true, alreadySent: true, message: 'The final approval email was already sent.' })
    }

    const now = Date.now()
    const clientKey = req.ip || req.socket.remoteAddress || 'unknown'
    const recentAttempts = (finalApprovalEmailAttempts.get(clientKey) || []).filter(time => now - time < 15 * 60_000)
    if (recentAttempts.length >= 5) {
      return res.status(429).json({ error: 'Too many final approval emails were requested. Please try again in 15 minutes.' })
    }
    recentAttempts.push(now)
    finalApprovalEmailAttempts.set(clientKey, recentAttempts)

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env
    const smtpPort = Number(SMTP_PORT)
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM
      || !Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
      return res.status(503).json({
        error: 'Email delivery is not configured. Set valid SMTP settings in the backend environment and restart or redeploy.',
      })
    }

    const requestLabel = requestType === 'clearance' ? 'Clearance' : 'Transcript'
    const sentAt = new Date().toISOString()
    const safeName = escapeHtml(studentName)
    const safeRequestId = escapeHtml(requestId)
    const safeLeader = escapeHtml(leaderName)
    const safeSignature = escapeHtml(signature)
    const safeComment = escapeHtml(comment || 'No additional comments.')

    try {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      })
      await transporter.sendMail({
        from: SMTP_FROM,
        to: email,
        subject: `Final ${requestLabel.toLowerCase()} approval — ${requestId}`,
        text: [
          `Hello ${studentName},`,
          '',
          `Your ${requestLabel.toLowerCase()} request (${requestId}) has received its final signed approval from ${leaderName}.`,
          `Signed by: ${signature}`,
          `Review note: ${comment || 'No additional comments.'}`,
          `Approved at: ${sentAt}`,
          '',
          'This is an automated notification from the CLEAR&TRANS portal preview. It is not an official University of Rwanda document or confirmation of an official University record.',
        ].join('\n'),
        html: `<p>Hello ${safeName},</p><p>Your ${requestLabel.toLowerCase()} request (<strong>${safeRequestId}</strong>) has received its final signed approval from ${safeLeader}.</p><p><strong>Signed by:</strong> ${safeSignature}<br><strong>Review note:</strong> ${safeComment}<br><strong>Approved at:</strong> ${escapeHtml(sentAt)}</p><p>This is an automated notification from the CLEAR&amp;TRANS portal preview. It is not an official University of Rwanda document or confirmation of an official University record.</p>`,
      })
    } catch (error) {
      console.error('Failed to send final approval email', error)
      return res.status(502).json({ error: 'The final approval email could not be sent. Check the student email address or try again later.' })
    }

    await db.run(
      'INSERT OR IGNORE INTO final_approval_emails (studentEmail, requestId, sentAt) VALUES (?, ?, ?)',
      email,
      requestId,
      sentAt,
    )
    return res.json({ sent: true, alreadySent: false, message: `Final approval email sent to ${email}.` })
  } catch (error) {
    console.error('Failed to record final approval email', error)
    return res.status(500).json({ error: 'The email may have been sent, but its delivery could not be recorded. Please contact portal support before retrying.' })
  }
})

// Students
app.get('/api/students', async (_req: Request, res: Response) => {
  const db = await openDb()
  const rows = await db.all('SELECT * FROM students LIMIT 100')
  res.json(rows)
})

app.get('/api/students/:id', async (req: Request, res: Response) => {
  const db = await openDb()
  const row = await db.get('SELECT * FROM students WHERE id = ?', req.params.id)
  if (!row) return res.status(404).json({ error: 'not found' })
  res.json(row)
})

// Requests
app.get('/api/requests/:studentEmail', async (req: Request, res: Response) => {
  const db = await openDb()
  const rows = await db.all('SELECT * FROM requests WHERE studentEmail = ?', req.params.studentEmail)
  res.json(rows)
})

// Announcements
app.get('/api/announcements', async (_req: Request, res: Response) => {
  const db = await openDb()
  const rows = await db.all('SELECT * FROM announcements ORDER BY createdAt DESC LIMIT 50')
  res.json(rows)
})

const port = process.env.PORT || 4000
app.use((error: unknown, _req: Request, res: Response, next: (error?: unknown) => void) => {
  if (res.headersSent) return next(error)
  console.error('Unhandled portal API error', error)
  return res.status(500).json({ error: 'The portal service is temporarily unavailable. Please try again later.' })
})

if (!process.env.VERCEL) {
  databaseReady
    .then(() => app.listen(port, () => console.log(`Backend listening on ${port}`)))
    .catch(error => {
      console.error('Failed to initialize backend database', error)
      process.exitCode = 1
    })
}

export default app
