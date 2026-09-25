import { initDb, openDb } from './sqlite.ts'
import fs from 'fs'
import path from 'path'

async function loadSeedData() {
  // Re-use frontend generator by reading exported JSON if available
  const fp = path.join(process.cwd(), '..', 'src', 'database', 'studentDb.json')
  if (fs.existsSync(fp)) {
    const raw = fs.readFileSync(fp, 'utf-8')
    return JSON.parse(raw)
  }
  // fallback small sample
  return [
    { id: 'UR/2022/CST/001', name: 'Sample Student', email: 'sample.student@ur.ac.rw', phone: '+250 788 000 000', gender: 'F', dob: '2002-05-01', college: 'College of Science and Technology', program: 'Computer Science', year: 'Year 3', enrollmentYear: 2022, status: 'active' }
  ]
}

async function seed() {
  const db = await initDb()
  const students = await loadSeedData()
  const insert = await db.prepare(`INSERT OR REPLACE INTO students (id,name,email,phone,gender,dob,college,program,year,enrollmentYear,status) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
  for (const s of students) {
    await insert.run(s.id, s.name, s.email, s.phone, s.gender, s.dob, s.college, s.program, s.year, s.enrollmentYear, s.status)
  }
  await insert.finalize()

  // sample announcement
  await db.run(`INSERT OR REPLACE INTO announcements (id,title,body,createdAt) VALUES (?,?,?,?)`, ['ann-1', 'Welcome to CLEAR&TRANS', 'System seeded with sample data', new Date().toISOString()])

  // insert a sample completed request for the seeded student
  const reqId = 'CLR-2026-101'
  await db.run(`INSERT OR REPLACE INTO requests (id, studentEmail, type, status, createdAt, updatedAt, currentLevel) VALUES (?,?,?,?,?,?,?)`,
    [reqId, 'sample.student@ur.ac.rw', 'clearance', 'completed', new Date().toISOString(), new Date().toISOString(), 4]
  )

  console.log(`Seeded ${students.length} students`)
  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })
