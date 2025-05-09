import { NextResponse } from 'next/server'

// List of tickers that can be used as collateral according to Kraken documentation
const collateralTickers = [
  'TIA',
  'ADA',
  'LINK',
  'ATOM',
  'DAI',
  'MANA',
  'DOGE',
  'WIF',
  'ETH',
  'FIL',
  'INJ',
  'KAS',
  'KSM',
  'LTC',
  'MINA',
  'NEAR',
  'PAXG',
  'PEPE',
  'DOT',
  'RENDER',
  'SEI',
  'SHIB',
  'SOL',
  'XLM',
  'STX',
  'SUI',
  'XTZ',
  'GRT',
  'RUNE',
  'TRX',
  'XRP',
]

export async function GET() {
  try {
    return NextResponse.json({ tickers: collateralTickers.map(ticker =>  `PF_${ticker}USD`)})
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch collateral tickers, error: ' + error }, { status: 500 })
  }
} 