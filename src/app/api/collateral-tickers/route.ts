import { NextResponse } from 'next/server'
import { getCollateralTickers, addCollateral, removeCollateral, replaceCollateral } from '@/server/collateralStore'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const tickers = await getCollateralTickers()
    return NextResponse.json({ tickers })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch collateral tickers, error: ' + error }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const symbol = typeof body?.symbol === 'string' ? body.symbol : ''
    if (!symbol) return NextResponse.json({ error: 'symbol is required' }, { status: 400 })

    const tickers = await addCollateral(symbol)
    return NextResponse.json({ tickers })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add collateral, error: ' + error }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol') || ''
    if (!symbol) return NextResponse.json({ error: 'symbol is required' }, { status: 400 })

    const tickers = await removeCollateral(symbol)
    return NextResponse.json({ tickers })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove collateral, error: ' + error }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const list = Array.isArray(body?.tickers) ? body.tickers : []
    const tickers = await replaceCollateral(list)
    return NextResponse.json({ tickers })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to replace collateral, error: ' + error }, { status: 500 })
  }
}
