import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    
    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
    }

    const response = await fetch(
      `https://futures.kraken.com/derivatives/api/v4/historicalfundingrates?symbol=${symbol}`
    )
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Funding rates fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch funding rates' }, 
      { status: 500 }
    )
  }
}