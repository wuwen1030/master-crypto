import { NextResponse } from 'next/server'
import { startOfHour, isSameHour } from 'date-fns'

// 创建一个缓存 Map，key 是 symbol，value 是 { data: any, timestamp: number }
const cache = new Map<string, { data: any, timestamp: number }>()

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    
    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
    }

    // 检查缓存
    const cachedData = cache.get(symbol)
    const now = new Date()
    
    // 如果缓存存在且在同一个整点内，直接返回缓存数据
    if (cachedData && isSameHour(cachedData.timestamp, now)) {
      return NextResponse.json(cachedData.data)
    }

    // 如果没有缓存或不在同一个整点，则从 Kraken API 获取数据
    const response = await fetch(
      `https://futures.kraken.com/derivatives/api/v4/historicalfundingrates?symbol=${symbol}`
    )
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    // 更新缓存，使用当前整点的时间戳
    cache.set(symbol, {
      data,
      timestamp: startOfHour(now).getTime()
    })
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Funding rates fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch funding rates' }, 
      { status: 500 }
    )
  }
}