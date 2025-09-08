import { promises as fs } from 'fs'
import path from 'path'

// Default seed list (from previous static array)
const DEFAULT_COLLATERAL = [
  'AAVE','ALGO','ARB','FET','AVAX','BTC','TAO','TIA','ADA','LINK','ATOM','CRV','DAI','MANA','DOGE','WIF','ENA','ETH','FARTCOIN','FIL','INJ','KAS','KSM','LTC','MINA','NEAR','ONDO','PAXG','PEPE','DOT','RENDER','SEI','SHIB','SOL','SPX','XLM','STX','SUI','USDT','XTZ','GRT','RUNE','TRX','UNI','USDC','XRP'
]

const DATA_DIR = path.join(process.cwd(), 'log')
const DATA_FILE = path.join(DATA_DIR, 'collateral.json')

const SYMBOL_RE = /^PF_[A-Z0-9]+USD$/

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch {}
}

async function readFile(): Promise<string[] | null> {
  try {
    const buf = await fs.readFile(DATA_FILE, 'utf8')
    const parsed = JSON.parse(buf)
    if (Array.isArray(parsed)) return parsed as string[]
    return null
  } catch {
    return null
  }
}

async function writeFileAtomic(list: string[]) {
  await ensureDir()
  const tmp = DATA_FILE + '.tmp'
  await fs.writeFile(tmp, JSON.stringify(list, null, 2), 'utf8')
  await fs.rename(tmp, DATA_FILE)
}

function normalizeSymbol(symbol: string) {
  return symbol.toUpperCase()
}

export async function getCollateralTickers(): Promise<string[]> {
  const existing = await readFile()
  if (existing && Array.isArray(existing)) return existing
  // Seed from default on first run
  const seeded = Array.from(new Set(DEFAULT_COLLATERAL.filter(Boolean).map((t) => `PF_${t}USD`)))
  await writeFileAtomic(seeded)
  return seeded
}

export async function addCollateral(symbol: string): Promise<string[]> {
  const s = normalizeSymbol(symbol)
  if (!SYMBOL_RE.test(s)) throw new Error('Invalid symbol')
  const list = await getCollateralTickers()
  if (!list.includes(s)) {
    list.push(s)
    await writeFileAtomic(list)
  }
  return list
}

export async function removeCollateral(symbol: string): Promise<string[]> {
  const s = normalizeSymbol(symbol)
  if (!SYMBOL_RE.test(s)) throw new Error('Invalid symbol')
  const list = await getCollateralTickers()
  const next = list.filter((x) => x !== s)
  if (next.length !== list.length) {
    await writeFileAtomic(next)
  }
  return next
}

export async function replaceCollateral(tickers: string[]): Promise<string[]> {
  const normalized = Array.from(
    new Set(
      (tickers || [])
        .filter(Boolean)
        .map((s) => normalizeSymbol(s))
        .filter((s) => SYMBOL_RE.test(s))
    )
  )
  await writeFileAtomic(normalized)
  return normalized
}

