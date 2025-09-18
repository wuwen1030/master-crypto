import { NextResponse } from 'next/server'
import { fetchFundingRatesBatch } from '@/server/fundingRates'
import { FundingRatesBatchResponse } from '@/types/kraken'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const symbols = Array.isArray(body?.symbols) ? body.symbols : []

    if (symbols.length === 0) {
      return NextResponse.json({ error: 'symbols array is required' }, { status: 400 })
    }

    if (!symbols.every((symbol) => typeof symbol === 'string')) {
      return NextResponse.json({ error: 'symbols must be strings' }, { status: 400 })
    }

    const { ratesBySymbol, errors } = await fetchFundingRatesBatch(symbols)
    const hasErrors = Object.keys(errors).length > 0

    const response: FundingRatesBatchResponse = {
      result: hasErrors ? 'partial' : 'success',
      serverTime: new Date().toISOString(),
      ratesBySymbol,
      errors: hasErrors ? errors : undefined,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Batch funding rates fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch funding rates batch' },
      { status: 500 }
    )
  }
}
