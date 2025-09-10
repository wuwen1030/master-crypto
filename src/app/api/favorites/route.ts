import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ensureSchema, getSql } from '@/lib/db'
import { getCurrentUserFromCookies } from '@/lib/auth'

const symbolRe = /^PF_[A-Z0-9]+USD$/

const addSchema = z.object({
  symbol: z.string().min(1),
})

export async function GET() {
  await ensureSchema()
  const user = await getCurrentUserFromCookies()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sql = getSql()
  const rows = await sql`SELECT symbol FROM favorites WHERE user_id = ${user.id}`
  const list = (rows as any[]).map((r: any) => r.symbol)
  return NextResponse.json({ favorites: list })
}

export async function POST(req: Request) {
  await ensureSchema()
  const user = await getCurrentUserFromCookies()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { symbol } = addSchema.parse(body)
  const s = String(symbol).toUpperCase()
  if (!symbolRe.test(s)) return NextResponse.json({ error: 'Invalid symbol' }, { status: 400 })
  const sql = getSql()
  await sql`INSERT INTO favorites (user_id, symbol) VALUES (${user.id}, ${s}) ON CONFLICT DO NOTHING`
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  await ensureSchema()
  const user = await getCurrentUserFromCookies()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const symbol = (searchParams.get('symbol') || '').toUpperCase()
  if (!symbolRe.test(symbol)) return NextResponse.json({ error: 'Invalid symbol' }, { status: 400 })
  const sql = getSql()
  await sql`DELETE FROM favorites WHERE user_id = ${user.id} AND symbol = ${symbol}`
  return NextResponse.json({ success: true })
}
