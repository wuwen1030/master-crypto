import { NextResponse } from 'next/server'

// 短期再验证缓存，减轻上游压力
export async function GET() {
  try {
    const response = await fetch(
      'https://futures.kraken.com/derivatives/api/v4/tickers',
      { next: { revalidate: 60 } }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tickers: ' + error }, { status: 500 })
  }
} 
