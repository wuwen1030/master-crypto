import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const encoder = new TextEncoder()
const SESSION_COOKIE = 'session'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

function getSecret() {
  const secret = process.env.JWT_SECRET || process.env.AUTH_SECRET
  if (!secret) throw new Error('JWT_SECRET or AUTH_SECRET is not set')
  return secret
}

export async function hashPassword(password: string) {
  const saltRounds = 10
  return bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export type JWTPayload = {
  uid: string
  email: string
}

export async function signToken(payload: JWTPayload) {
  const secret = getSecret()
  const jwt = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(encoder.encode(secret))
  return jwt
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secret = getSecret()
    const { payload } = await jwtVerify(token, encoder.encode(secret))
    return { uid: String(payload.uid), email: String(payload.email) }
  } catch (e) {
    return null
  }
}

export function setSessionCookie(res: import('next/server').NextResponse, token: string) {
  res.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    path: '/',
    secure: true,
    sameSite: 'lax',
    maxAge: MAX_AGE,
  })
}

export function clearSessionCookie(res: import('next/server').NextResponse) {
  res.cookies.set({
    name: SESSION_COOKIE,
    value: '',
    httpOnly: true,
    path: '/',
    secure: true,
    sameSite: 'lax',
    maxAge: 0,
  })
}

export async function getCurrentUserFromCookies() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  return { id: payload.uid, email: payload.email }
}

export const authCookieName = SESSION_COOKIE

