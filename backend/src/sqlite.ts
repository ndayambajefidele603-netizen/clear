import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import path from 'path'

const DB_FILE = path.join(process.cwd(), 'data.sqlite')

export async function openDb() {
  const db = await open({ filename: DB_FILE, driver: sqlite3.Database })
  return db
}

export async function initDb() {
  const db = await openDb()
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
  `)
  return db
}
