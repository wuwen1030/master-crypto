import { startOfHour, isSameHour } from 'date-fns'
import { FundingRateResponse } from '@/types/kraken'

const cache = new Map<string, { data: FundingRateResponse; timestamp: Date }>()
const MAX_CACHE_ENTRIES = 500

export interface FundingRatesBatchFetchResult {
  ratesBySymbol: Record<string, FundingRateResponse['rates']>
  errors: Record<string, string>
}

export async function fetchFundingRatesForSymbol(symbol: string): Promise<FundingRateResponse> {
  const trimmedSymbol = symbol.trim()
  if (!trimmedSymbol) {
    throw new Error('Symbol is required')
  }

  const now = new Date()
  const cached = cache.get(trimmedSymbol)
  if (cached && isSameHour(cached.timestamp, now)) {
    return cached.data
  }

  const response = await fetch(
    `https://futures.kraken.com/derivatives/api/v4/historicalfundingrates?symbol=${encodeURIComponent(trimmedSymbol)}`
  )

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = (await response.json()) as FundingRateResponse

  cache.set(trimmedSymbol, {
    data,
    timestamp: startOfHour(now),
  })

  if (cache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value
    if (oldestKey) {
      cache.delete(oldestKey)
    }
  }

  return data
}

export async function fetchFundingRatesBatch(
  symbols: string[],
  concurrency = 10
): Promise<FundingRatesBatchFetchResult> {
  const uniqueSymbols = Array.from(new Set(symbols.map((symbol) => symbol.trim()).filter(Boolean)))
  const ratesBySymbol: Record<string, FundingRateResponse['rates']> = {}
  const errors: Record<string, string> = {}

  let index = 0
  const workerCount = Math.min(concurrency, uniqueSymbols.length)

  const workers = new Array(workerCount).fill(0).map(async () => {
    while (index < uniqueSymbols.length) {
      const currentIndex = index
      index += 1
      const symbol = uniqueSymbols[currentIndex]

      try {
        const data = await fetchFundingRatesForSymbol(symbol)
        ratesBySymbol[symbol] = data.rates
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        errors[symbol] = message
      }
    }
  })

  await Promise.all(workers)

  return { ratesBySymbol, errors }
}
