import { initDb, openDb } from './sqlite.js'

async function seed() {
  await initDb()
  const db = await openDb()
  try {
    await db.run('DELETE FROM announcements')
    await db.run('DELETE FROM requests')
    console.log('Initialized the database without demo students or requests')
  } finally {
    await db.close()
  }
}

seed().catch(err => { console.error(err); process.exitCode = 1 })
