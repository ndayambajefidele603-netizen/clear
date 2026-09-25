import express from 'express'
import cors from 'cors'
import { openDb } from './sqlite.ts'
import fs from 'fs'
import PDFDocument from 'pdfkit'
import path from 'path'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => res.json({ ok: true }))

// Students
app.get('/api/students', async (req, res) => {
  const db = await openDb()
  const rows = await db.all('SELECT * FROM students LIMIT 100')
  res.json(rows)
})

app.get('/api/students/:id', async (req, res) => {
  const db = await openDb()
  const row = await db.get('SELECT * FROM students WHERE id = ?', req.params.id)
  if (!row) return res.status(404).json({ error: 'not found' })
  res.json(row)
})

// Requests
app.get('/api/requests/:studentEmail', async (req, res) => {
  const db = await openDb()
  const rows = await db.all('SELECT * FROM requests WHERE studentEmail = ?', req.params.studentEmail)
  res.json(rows)
})

// Announcements
app.get('/api/announcements', async (req, res) => {
  const db = await openDb()
  const rows = await db.all('SELECT * FROM announcements ORDER BY createdAt DESC LIMIT 50')
  res.json(rows)
})

// Generate certificate PDF for a completed request
app.get('/api/requests/:id/certificate', async (req, res) => {
  const db = await openDb()
  const id = req.params.id
  const reqRow = await db.get('SELECT * FROM requests WHERE id = ?', id)
  if (!reqRow) return res.status(404).json({ error: 'request not found' })
  if (reqRow.status !== 'completed') return res.status(400).json({ error: 'request not completed' })

  const student = await db.get('SELECT * FROM students WHERE email = ?', reqRow.studentEmail)
  if (!student) return res.status(404).json({ error: 'student not found' })

  const doc = new PDFDocument({ size: 'A4', margin: 48 })
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${student.id}-certificate.pdf"")`)
  doc.pipe(res)

  doc.fontSize(18).text('UNIVERSITY OF RWANDA', { align: 'left' })
  doc.moveDown(0.2)
  doc.fontSize(14).text('OFFICIAL CERTIFICATE', { align: 'left' })
  doc.moveDown(1)

  doc.fontSize(12).text(`Student Name: ${student.name}`)
  doc.text(`Registration No: ${student.id}`)
  doc.text(`Program: ${student.program} — ${student.college}`)
  doc.moveDown(0.5)

  doc.text(reqRow.type === 'clearance' ? 'This certificate confirms that the student has been cleared.' : 'This certificate confirms that the academic transcript is official.')
  doc.moveDown(1)

  doc.text(`Reference: ${reqRow.id}    Issued: ${reqRow.updatedAt || new Date().toISOString()}`)
  doc.end()
})

const port = process.env.PORT || 4000
app.listen(port, () => console.log(`Backend listening on ${port}`))
