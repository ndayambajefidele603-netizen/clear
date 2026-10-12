import { createClient, type Client, type InValue, type Row, type Transaction } from '@libsql/client'
import sqlite3 from 'sqlite3'
import { open, type Database as SqliteDatabase } from 'sqlite'
import { fileURLToPath } from 'node:url'
import path from 'path'

const DB_FILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../data.sqlite')
let tursoClient: Client | undefined

function getTursoClient(): Client | undefined {
  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim()
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN?.trim()
  if (Boolean(tursoUrl) !== Boolean(tursoAuthToken)) {
    throw new Error('Set both TURSO_DATABASE_URL and TURSO_AUTH_TOKEN to use the hosted database.')
  }
  if (process.env.VERCEL && (!tursoUrl || !tursoAuthToken)) {
    throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required on Vercel; its filesystem cannot persist SQLite accounts.')
  }
  if (tursoUrl && tursoAuthToken && !tursoClient) {
    tursoClient = createClient({ url: tursoUrl, authToken: tursoAuthToken })
  }
  return tursoClient
}

export interface PortalDatabase {
  exec(sql: string): Promise<void>
  run(sql: string, ...params: unknown[]): Promise<void>
  get<T extends object = Record<string, unknown>>(sql: string, ...params: unknown[]): Promise<T | undefined>
  all<T extends object = Record<string, unknown>>(sql: string, ...params: unknown[]): Promise<T[]>
  close(): Promise<void>
}

class SqlitePortalDatabase implements PortalDatabase {
  constructor(private readonly db: SqliteDatabase) {}

  async exec(sql: string): Promise<void> {
    await this.db.exec(sql)
  }

  async run(sql: string, ...params: unknown[]): Promise<void> {
    await this.db.run(sql, ...params)
  }

  async get<T extends object>(sql: string, ...params: unknown[]): Promise<T | undefined> {
    return this.db.get<T>(sql, ...params)
  }

  async all<T extends object>(sql: string, ...params: unknown[]): Promise<T[]> {
    return this.db.all<T[]>(sql, ...params)
  }

  async close(): Promise<void> {
    await this.db.close()
  }
}

function toInValue(value: unknown): InValue {
  if (value === null || typeof value === 'string' || typeof value === 'number'
    || typeof value === 'bigint' || typeof value === 'boolean'
    || value instanceof Uint8Array || value instanceof ArrayBuffer || value instanceof Date) {
    return value
  }
  throw new TypeError('Unsupported value supplied to the hosted database.')
}

function plainRow(row: Row, columns: string[]): Record<string, unknown> {
  return Object.fromEntries(columns.map((column, index) => {
    const value = row[index]
    return [column, value instanceof ArrayBuffer ? Buffer.from(value) : value]
  }))
}

class TursoPortalDatabase implements PortalDatabase {
  private transaction: Transaction | undefined

  constructor(private readonly client: Client) {}

  async exec(sql: string): Promise<void> {
    await this.client.executeMultiple(sql)
  }

  async run(sql: string, ...params: unknown[]): Promise<void> {
    const command = sql.trim().toUpperCase()
    if (command === 'BEGIN' || command === 'BEGIN IMMEDIATE') {
      if (this.transaction) throw new Error('A database transaction is already active.')
      this.transaction = await this.client.transaction('write')
      return
    }
    if (command === 'COMMIT') {
      if (!this.transaction) throw new Error('There is no database transaction to commit.')
      await this.transaction.commit()
      this.transaction = undefined
      return
    }
    if (command === 'ROLLBACK') {
      if (!this.transaction) throw new Error('There is no database transaction to roll back.')
      await this.transaction.rollback()
      this.transaction = undefined
      return
    }

    const statement = { sql, args: params.map(toInValue) }
    if (this.transaction) await this.transaction.execute(statement)
    else await this.client.execute(statement)
  }

  async get<T extends object>(sql: string, ...params: unknown[]): Promise<T | undefined> {
    const result = await this.client.execute({ sql, args: params.map(toInValue) })
    const row = result.rows[0]
    return row ? plainRow(row, result.columns) as T : undefined
  }

  async all<T extends object>(sql: string, ...params: unknown[]): Promise<T[]> {
    const result = await this.client.execute({ sql, args: params.map(toInValue) })
    return result.rows.map(row => plainRow(row, result.columns) as T)
  }

  async close(): Promise<void> {
    if (this.transaction) {
      await this.transaction.rollback()
      this.transaction = undefined
    }
  }
}

export async function openDb(): Promise<PortalDatabase> {
  const client = getTursoClient()
  if (client) return new TursoPortalDatabase(client)
  return openLocalDb()
}

export async function openLocalDb(): Promise<PortalDatabase> {
  const db = await open({ filename: DB_FILE, driver: sqlite3.Database })
  return new SqlitePortalDatabase(db)
}

export async function initDb(): Promise<void> {
  const db = await openDb()
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT,
        phone TEXT,
        gender TEXT,
        dob TEXT,
        college TEXT,
        program TEXT,
        year TEXT,
        enrollmentYear INTEGER,
        status TEXT
      );
      CREATE TABLE IF NOT EXISTS requests (
        id TEXT PRIMARY KEY,
        studentEmail TEXT,
        type TEXT,
        status TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        currentLevel INTEGER
      );
      CREATE TABLE IF NOT EXISTS announcements (
        id TEXT PRIMARY KEY,
        title TEXT,
        body TEXT,
        createdAt TEXT
      );
      CREATE TABLE IF NOT EXISTS email_verifications (
        email TEXT PRIMARY KEY,
        codeHash TEXT NOT NULL,
        salt TEXT NOT NULL,
        expiresAt INTEGER NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        createdAt INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS signup_verifications (
        email TEXT PRIMARY KEY,
        tokenHash TEXT NOT NULL,
        salt TEXT NOT NULL,
        expiresAt INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS student_accounts (
        email TEXT PRIMARY KEY,
        studentId TEXT NOT NULL UNIQUE,
        profile TEXT NOT NULL,
        passwordHash TEXT NOT NULL,
        salt TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS student_sessions (
        tokenHash TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        expiresAt INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS student_requests (
        email TEXT NOT NULL,
        requestId TEXT NOT NULL,
        type TEXT NOT NULL,
        payload TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        PRIMARY KEY (email, requestId)
      );
      CREATE TABLE IF NOT EXISTS student_attachments (
        email TEXT NOT NULL,
        requestId TEXT NOT NULL,
        docId TEXT NOT NULL,
        fileName TEXT NOT NULL,
        mimeType TEXT NOT NULL,
        content BLOB NOT NULL,
        createdAt TEXT NOT NULL,
        PRIMARY KEY (email, requestId, docId)
      );
      CREATE TABLE IF NOT EXISTS final_approval_emails (
        studentEmail TEXT NOT NULL,
        requestId TEXT NOT NULL,
        sentAt TEXT NOT NULL,
        PRIMARY KEY (studentEmail, requestId)
      );
      CREATE TABLE IF NOT EXISTS final_documents (
        studentEmail TEXT NOT NULL,
        requestId TEXT NOT NULL,
        requestType TEXT NOT NULL,
        fileName TEXT NOT NULL,
        content BLOB NOT NULL,
        uploadedAt TEXT NOT NULL,
        PRIMARY KEY (studentEmail, requestId)
      );
    `)
  } finally {
    await db.close()
  }
}
