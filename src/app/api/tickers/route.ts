import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch('https://futures.kraken.com/derivatives/api/v4/tickers')
    const data = await response.json()
    
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tickers:' + error }, { status: 500 })
  }
} 