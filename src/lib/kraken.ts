export interface Ticker {
  symbol: string
  pair: string
  tag: string
  fundingRate: number
}

export interface FundingRate {
  timestamp: string
  relativeFundingRate: number
}

export interface TickerResponse {
  result: string
  serverTime: string
  tickers: Ticker[]
}

export interface FundingRateResponse {
  result: string
  serverTime: string
  rates: FundingRate[]
}

export async function getTickers(): Promise<TickerResponse> {
  const response = await fetch('/api/tickers')
  return response.json()
}

export async function getFundingRates(symbol: string): Promise<FundingRateResponse> {
  const response = await fetch(`/api/funding-rates?symbol=${symbol}`)
  return response.json()
}
