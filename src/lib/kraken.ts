import { TickerResponse, FundingRateResponse } from '../types/kraken'

export async function getTickers(): Promise<TickerResponse> {
  const response = await fetch('/api/tickers')
  return response.json()
}

export async function getFundingRates(symbol: string): Promise<FundingRateResponse> {
  const response = await fetch(`/api/funding-rates?symbol=${symbol}`)
  return response.json()
}
