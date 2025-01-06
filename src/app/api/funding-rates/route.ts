import { NextResponse } from 'next/server'

// 设置缓存配置
export const revalidate = 300 // 5分钟缓存

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    
    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
    }

    const response = await fetch(
      `https://futures.kraken.com/derivatives/api/v4/historicalfundingrates?symbol=${symbol}`,
      {
        // 添加缓存配置
        next: {
          revalidate: 300 // 5分钟缓存
        }
      }
    )
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    // 设置缓存控制头
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Funding rates fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch funding rates' }, 
      { status: 500 }
    )
  }
} 