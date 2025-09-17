import { ensureSchema, getSql } from '@/lib/db'

const DEFAULT_COLLATERAL = [
  'AAVE','ALGO','ARB','FET','AVAX','BTC','TAO','TIA','ADA','LINK','ATOM','CRV','DAI','MANA','DOGE','WIF','ENA','ETH','FARTCOIN','FIL','INJ','KAS','KSM','LTC','MINA','NEAR','ONDO','PAXG','PEPE','DOT','RENDER','SEI','SHIB','SOL','SPX','XLM','STX','SUI','USDT','XTZ','GRT','RUNE','TRX','UNI','USDC','XRP'
]

const SYMBOL_RE = /^PF_[A-Z0-9]+USD$/
const DEFAULT_SYMBOLS = Array.from(new Set(DEFAULT_COLLATERAL.filter(Boolean).map((t) => `PF_${t}USD`)))

let collateralSeeded = false

function normalizeSymbol(symbol: string) {
  return symbol.toUpperCase()
}

async function ensureCollateralSeed() {
  await ensureSchema()
  const sql = getSql()
  if (collateralSeeded) return sql

  for (const symbol of DEFAULT_SYMBOLS) {
    await sql`
      INSERT INTO collateral_tickers (symbol)
      VALUES (${symbol})
      ON CONFLICT (symbol) DO NOTHING
    `
  }

  collateralSeeded = true
  return sql
}

async function fetchCollateralTickers(sql: ReturnType<typeof getSql>) {
  const rows = await sql<{ symbol: string }>`
    SELECT symbol
    FROM collateral_tickers
    ORDER BY symbol
  `
  return rows.map((row) => row.symbol)
}

export async function getCollateralTickers(): Promise<string[]> {
  const sql = await ensureCollateralSeed()
  return fetchCollateralTickers(sql)
}

export async function addCollateral(symbol: string): Promise<string[]> {
  const sql = await ensureCollateralSeed()
  const normalized = normalizeSymbol(symbol)
  if (!SYMBOL_RE.test(normalized)) throw new Error(`Invalid symbol format: ${symbol}. Expected format: PF_XXXUSD`)

  await sql`
    INSERT INTO collateral_tickers (symbol)
    VALUES (${normalized})
    ON CONFLICT (symbol) DO NOTHING
  `

  return fetchCollateralTickers(sql)
}

export async function removeCollateral(symbol: string): Promise<string[]> {
  const sql = await ensureCollateralSeed()
  const normalized = normalizeSymbol(symbol)
  if (!SYMBOL_RE.test(normalized)) throw new Error(`Invalid symbol format: ${symbol}. Expected format: PF_XXXUSD`)

  await sql`
    DELETE FROM collateral_tickers
    WHERE symbol = ${normalized}
  `

  return fetchCollateralTickers(sql)
}

export async function replaceCollateral(tickers: string[]): Promise<string[]> {
  const sql = await ensureCollateralSeed()
  const normalized = Array.from(
    new Set(
      (tickers || [])
        .filter(Boolean)
        .map((s) => normalizeSymbol(s))
        .filter((s) => SYMBOL_RE.test(s))
    )
  )

  await sql`DELETE FROM collateral_tickers`

  for (const symbol of normalized) {
    await sql`
      INSERT INTO collateral_tickers (symbol)
      VALUES (${symbol})
      ON CONFLICT (symbol) DO NOTHING
    `
  }

  return fetchCollateralTickers(sql)
}
