import { getRedis } from '@/server/redis'

// Default seed list (from previous static array)
const DEFAULT_COLLATERAL = [
  'AAVE','ALGO','ARB','FET','AVAX','BTC','TAO','TIA','ADA','LINK','ATOM','CRV','DAI','MANA','DOGE','WIF','ENA','ETH','FARTCOIN','FIL','INJ','KAS','KSM','LTC','MINA','NEAR','ONDO','PAXG','PEPE','DOT','RENDER','SEI','SHIB','SOL','SPX','XLM','STX','SUI','USDT','XTZ','GRT','RUNE','TRX','UNI','USDC','XRP'
]

const REDIS_KEY = 'collateral:tickers'
// Bump version to force a one-time reset to default-only
const SEED_KEY = 'collateral:seeded'
const SYMBOL_RE = /^PF_[A-Z0-9]+USD$/

function normalizeSymbol(symbol: string) {
  return symbol.toUpperCase()
}

async function ensureSeed() {
  const redis = await getRedis()
  // Only seed once globally. If key already exists, do nothing.
  // On first run with v2, force reset to exactly the default list.
  const res = await redis.set(SEED_KEY, '1', { NX: true })
  if (res === 'OK') {
    const defaults = Array.from(new Set(DEFAULT_COLLATERAL.filter(Boolean).map((t) => `PF_${t}USD`)))
    const m = redis.multi()
    m.del(REDIS_KEY)
    if (defaults.length) m.sAdd(REDIS_KEY, defaults)
    await m.exec()
  }
}

export async function getCollateralTickers(): Promise<string[]> {
  const redis = await getRedis()
  await ensureSeed()
  const list = await redis.sMembers(REDIS_KEY)
  if (list.length) return Array.from(new Set(list)).sort()
  // If still empty (rare), return defaults without writing
  const defaults = Array.from(new Set(DEFAULT_COLLATERAL.filter(Boolean).map((t) => `PF_${t}USD`)))
  return defaults.sort()
}

export async function addCollateral(symbol: string): Promise<string[]> {
  const redis = await getRedis()
  await ensureSeed()
  const s = normalizeSymbol(symbol)
  if (!SYMBOL_RE.test(s)) throw new Error(`Invalid symbol format: ${symbol}. Expected format: PF_XXXUSD`)
  await redis.sAdd(REDIS_KEY, s)
  const list = await redis.sMembers(REDIS_KEY)
  return Array.from(new Set(list)).sort()
}

export async function removeCollateral(symbol: string): Promise<string[]> {
  const redis = await getRedis()
  await ensureSeed()
  const s = normalizeSymbol(symbol)
  if (!SYMBOL_RE.test(s)) throw new Error(`Invalid symbol format: ${symbol}. Expected format: PF_XXXUSD`)
  await redis.sRem(REDIS_KEY, s)
  const list = await redis.sMembers(REDIS_KEY)
  return Array.from(new Set(list)).sort()
}

export async function replaceCollateral(tickers: string[]): Promise<string[]> {
  const redis = await getRedis()
  await ensureSeed()
  const normalized = Array.from(
    new Set(
      (tickers || [])
        .filter(Boolean)
        .map((s) => normalizeSymbol(s))
        .filter((s) => SYMBOL_RE.test(s))
    )
  )
  const pipeline = redis.multi()
  pipeline.del(REDIS_KEY)
  if (normalized.length) pipeline.sAdd(REDIS_KEY, normalized)
  await pipeline.exec()
  const list = await redis.sMembers(REDIS_KEY)
  return Array.from(new Set(list)).sort()
}
