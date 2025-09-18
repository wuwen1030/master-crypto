import { TickerResponse, FundingRateResponse, FundingRatesBatchResponse } from '../types/kraken'

export async function getTickers(): Promise<TickerResponse> {
  try {
    const response = await fetch('/api/tickers')
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching tickers:', error.message)
      throw new Error(`Failed to fetch tickers: ${error.message}`)
    }
    throw new Error('Failed to fetch tickers: Unknown error')
  }
}

export async function getFundingRates(symbol: string): Promise<FundingRateResponse> {
  try {
    const response = await fetch(`/api/funding-rates?symbol=${symbol}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error fetching funding rates for ${symbol}:`, error.message)
      throw new Error(`Failed to fetch funding rates for ${symbol}: ${error.message}`)
    }
    throw new Error(`Failed to fetch funding rates for ${symbol}: Unknown error`)
  }
}

export async function getFundingRatesBatch(symbols: string[]): Promise<FundingRatesBatchResponse> {
  try {
    const response = await fetch('/api/funding-rates/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symbols }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching funding rates batch:', error.message)
      throw new Error(`Failed to fetch funding rates batch: ${error.message}`)
    }
    throw new Error('Failed to fetch funding rates batch: Unknown error')
  }
}

export async function getCollateralTickers(): Promise<{ tickers: string[] }> {
  try {
    const response = await fetch('/api/collateral-tickers')
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching collateral tickers:', error.message)
      throw new Error(`Failed to fetch collateral tickers: ${error.message}`)
    }
    throw new Error('Failed to fetch collateral tickers: Unknown error')
  }
}
