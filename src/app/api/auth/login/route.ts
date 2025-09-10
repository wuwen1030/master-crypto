import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ensureSchema, getSql } from '@/lib/db'
import { signToken, verifyPassword, setSessionCookie } from '@/lib/auth'

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
    const rows = await sql`SELECT id, email, password_hash FROM users WHERE email = ${email}`
    if ((rows as any[]).length === 0) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }
    const user = (rows as any[])[0] as { id: string; email: string; password_hash: string }
    const ok = await verifyPassword(password, user.password_hash)
    if (!ok) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const jwt = await signToken({ uid: user.id, email: user.email })
    const res = NextResponse.json({ success: true, user: { id: user.id, email: user.email } })
    setSessionCookie(res, jwt)
    return res
  } catch (err: any) {
    const message = err?.message || 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
