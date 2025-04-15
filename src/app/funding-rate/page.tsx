'use client'

import { useState, useEffect } from 'react'
import { getTickers, getFundingRates } from '@/lib/kraken'
import { Ticker } from '@/types/kraken'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FundingRateChart } from '@/components/ui/line-chart'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

const timeOptions = [
  { value: '1h', label: '1小时' },
  { value: '2h', label: '2小时' },
  { value: '4h', label: '4小时' },
  { value: '8h', label: '8小时' },
  { value: '12h', label: '12小时' },
  { value: '24h', label: '24小时' },
]

const timeRangeToHours = {
  '1h': 1,
  '2h': 2,
  '4h': 4,
  '8h': 8,
  '12h': 12,
  '24h': 24,
}

const formatVolume = (volume: number) => {
  if (volume >= 1000000000) {
    return `${(volume / 1000000000).toFixed(1)}B`
  }
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M`
  }
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K`
  }
  return volume.toFixed(1).toString()
}

interface TickerWithFunding extends Ticker {
  fundingRates: {
    [key: string]: number // key 为时间范围，value 为累积资金费率
  }
}

type SortField = 'symbol' | 'fundingRate' | 'volume'
type SortOrder = 'asc' | 'desc'

export default function FundingRatePage() {
  const [timeRange, setTimeRange] = useState('24h')
  const [tickers, setTickers] = useState<TickerWithFunding[]>([])
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>('symbol')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const [historicalRates, setHistoricalRates] = useState<[]>([])
  const [showModal, setShowModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const sortedTickers = [...tickers].sort((a, b) => {
    let comparison = 0
    switch (sortField) {
      case 'symbol':
        comparison = a.symbol.localeCompare(b.symbol)
        break
      case 'fundingRate':
        comparison = a.fundingRates[timeRange] - b.fundingRates[timeRange]
        break
      case 'volume':
        comparison = a.volumeQuote - b.volumeQuote
        break
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const totalPages = Math.ceil(sortedTickers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentTickers = sortedTickers.slice(startIndex, endIndex)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await getTickers()
        const perpetualTickers = response.tickers
          .filter(ticker => ticker.tag === 'perpetual')
          .filter(ticker => ticker.volumeQuote >= 1000) // 过滤掉交易量小于 1K 的交易对

        // 获取每个交易对的资金费率历史并计算所有时间周期的累积值
        const tickersWithFunding = await Promise.all(
          perpetualTickers.map(async (ticker) => {
            try {
              const fundingResponse = await getFundingRates(ticker.symbol)
              const now = Date.now()

              // 计算所有时间周期的累积资金费率
              const fundingRates = Object.entries(timeRangeToHours).reduce((acc, [range, hours]) => {
                const startTime = now - hours * 60 * 60 * 1000

                // 过滤出指定时间范围内的费率数据
                const relevantRates = fundingResponse.rates.filter(
                  rate => new Date(rate.timestamp).getTime() >= startTime
                )

                // 计算累积资金费率
                const cumulativeRate = relevantRates.reduce(
                  (sum, rate) => sum + rate.relativeFundingRate,
                  0
                )

                return {
                  ...acc,
                  [range]: cumulativeRate
                }
              }, {} as { [key: string]: number })

              return {
                ...ticker,
                fundingRates
              }
            } catch (error) {
              console.error(`Error fetching funding rates for ${ticker.symbol}:`, error)
              return {
                ...ticker,
                fundingRates: Object.keys(timeRangeToHours).reduce((acc, range) => ({
                  ...acc,
                  [range]: 0
                }), {})
              }
            }
          })
        )

        setTickers(tickersWithFunding)
      } catch (error) {
        console.error('Error fetching tickers:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, []) // 只在组件挂载时获取一次数据

  const handleRowClick = async (symbol: string) => {
    try {
      const response = await getFundingRates(symbol)
      const now = Date.now()
      const hours = timeRangeToHours[timeRange as keyof typeof timeRangeToHours]
      const startTime = now - hours * 60 * 60 * 1000

      const rates = response.rates
        .filter(rate => new Date(rate.timestamp).getTime() >= startTime)
        .map(rate => {
          const chartData = {
            date: new Date(rate.timestamp).toLocaleTimeString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            }),
            fundingRate: rate.relativeFundingRate
          }
          return chartData
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      setHistoricalRates(rates as [])
      setSelectedSymbol(symbol.replace('PF_', '').replace('USD', ''))
      setShowModal(true)
    } catch (error) {
      console.error('Error fetching historical rates:', error)
    }
  }

  return (
    <div className="px-4">
      <div className="flex flex-row items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-bold">资金费率总览</h1>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[120px] md:w-[180px]">
            <SelectValue placeholder="选择时间范围" />
          </SelectTrigger>
          <SelectContent>
            {timeOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>序号</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('symbol')}
                  className="h-auto px-0 font-medium hover:bg-transparent"
                >
                  <div className="flex items-center gap-2">
                    {`交易对 (${tickers.length})`}
                    {sortField === 'symbol' ? (
                      sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                    ) : <ArrowUpDown className="h-4 w-4" />}
                  </div>
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('fundingRate')}
                  className="h-auto px-0 font-medium hover:bg-transparent"
                >
                  <div className="flex items-center gap-2">
                    累计资金费率
                    {sortField === 'fundingRate' ? (
                      sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                    ) : <ArrowUpDown className="h-4 w-4" />}
                  </div>
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('volume')}
                  className="h-auto px-0 font-medium hover:bg-transparent"
                >
                  <div className="flex items-center gap-2">
                    24小时交易量
                    {sortField === 'volume' ? (
                      sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                    ) : <ArrowUpDown className="h-4 w-4" />}
                  </div>
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">加载中...（数据量大，请耐心等待）</TableCell>
              </TableRow>
            ) : sortedTickers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">暂无数据</TableCell>
              </TableRow>
            ) : (
              currentTickers.map((ticker, index) => (
                <TableRow
                  key={ticker.symbol}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(ticker.symbol)}
                >
                  <TableCell>{startIndex + index + 1}</TableCell>
                  <TableCell className="font-medium">{ticker.symbol.replace('PF_', '').replace('USD', '')}</TableCell>
                  <TableCell>
                    <span className={ticker.fundingRates[timeRange] >= 0 ? 'text-red-500' : 'text-green-500'}>
                      {(ticker.fundingRates[timeRange] * 100).toFixed(4)}%
                    </span>
                  </TableCell>
                  <TableCell>{formatVolume(ticker.volumeQuote)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && sortedTickers.length > 0 && (
        <div className="flex justify-center mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedSymbol} 资金费率历史</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <FundingRateChart
              data={historicalRates as []}
              lines={['fundingRate']}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 