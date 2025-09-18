import { NextResponse } from 'next/server'
import { fetchFundingRatesForSymbol } from '@/server/fundingRates'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    
    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
    }

    const data = await fetchFundingRatesForSymbol(symbol)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Funding rates fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch funding rates' }, 
      { status: 500 }
    )
  }
}
