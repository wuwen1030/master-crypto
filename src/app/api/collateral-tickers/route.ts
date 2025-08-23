import { NextResponse } from 'next/server'

// List of tickers that can be used as collateral according to Kraken documentation
const collateralTickers = [
  'AAVE',
  'ALGO',
  'ARB',
  'FET',
  'AVAX',
  'BTC',
  'TAO',
  'TIA',
  'ADA',
  'LINK',
  'ATOM',
  'CRV',
  'DAI',
  'MANA',
  'DOGE',
  'WIF',
  'ENA',
  'ETH',
  'FARTCOIN',
  'FIL',
  'INJ',
  'KAS',
  'KSM',
  'LTC',
  'MINA',
  'NEAR',
  'ONDO',
  'PAXG',
  'PEPE',
  'DOT',
  'RENDER',
  'SEI',
  'SHIB',
  'SOL',
  'SPX',
  'XLM',
  'STX',
  'SUI',
  'USDT',
  'XTZ',
  'GRT',
  'RUNE',
  'TRX',
  'UNI',,
  'USDC',
  'XRP',
]

export async function GET() {
  try {
    return NextResponse.json({ tickers: collateralTickers.map(ticker =>  `PF_${ticker}USD`)})
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch collateral tickers, error: ' + error }, { status: 500 })
  }
} 