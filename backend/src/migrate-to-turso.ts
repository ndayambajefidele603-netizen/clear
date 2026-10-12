import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { initDb, openDb, openLocalDb } from './sqlite.js'

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') })

const TABLES = [
  'students',
  'requests',
  'announcements',
  'email_verifications',
  'signup_verifications',
  'student_accounts',
  'student_sessions',
  'student_requests',
  'student_attachments',
  'final_approval_emails',
  'final_documents',
]

async function migrateToTurso() {
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    throw new Error('Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN before migrating local accounts.')
  }

  await initDb()
  const source = await openLocalDb()
  const target = await openDb()
  try {
    await target.run('BEGIN IMMEDIATE')
    try {
      for (const table of TABLES) {
        const rows = await source.all<Record<string, unknown>>(`SELECT * FROM "${table}"`)
        for (const row of rows) {
          const columns = Object.keys(row)
          const names = columns.map(column => `"${column.replace(/"/g, '""')}"`).join(', ')
          const placeholders = columns.map(() => '?').join(', ')
          await target.run(
            `INSERT OR IGNORE INTO "${table}" (${names}) VALUES (${placeholders})`,
            ...columns.map(column => row[column]),
          )
        }
        console.log(`Copied ${rows.length} ${table} row(s) where no cloud row already existed.`)
      }
      await target.run('COMMIT')
    } catch (error) {
      await target.run('ROLLBACK')
      throw error
    }
  } finally {
    await Promise.all([source.close(), target.close()])
  }
}

migrateToTurso().catch(error => {
  console.error('Failed to migrate local data to Turso', error)
  process.exitCode = 1
})
