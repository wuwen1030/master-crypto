import { neon } from '@neondatabase/serverless'

let _sql: ReturnType<typeof neon> | null = null
let _initialized = false

export function getSql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || ''
    if (!url) throw new Error('DATABASE_URL is not set')
    _sql = neon(url)
  }
  return _sql
}

export async function ensureSchema() {
  if (_initialized) return
  const sql = getSql()
  // Users and favorites tables. Run once per cold start.
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS favorites (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      symbol TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (user_id, symbol)
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS collateral_tickers (
      symbol TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
  _initialized = true
}

export type DBUser = {
  id: string
  email: string
  password_hash: string
  created_at: string
}
