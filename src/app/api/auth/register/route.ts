import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ensureSchema, getSql } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(64),
})

export async function POST(req: Request) {
  try {
    await ensureSchema()
    const body = await req.json().catch(() => ({}))
    const { email, password } = schema.parse(body)

    const sql = getSql()
    const existing = (await sql`SELECT id FROM users WHERE email = ${email}`) as unknown as Array<{ id: string }>
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const password_hash = await hashPassword(password)
    const id = crypto.randomUUID()
    await sql`INSERT INTO users (id, email, password_hash) VALUES (${id}, ${email}, ${password_hash})`

    // Do not auto-login per requirement
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
