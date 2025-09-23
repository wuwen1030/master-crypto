'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getTickers, getFundingRates, getCollateralTickers } from '@/lib/kraken'
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
import { ArrowUpDown, ArrowUp, ArrowDown, Heart } from "lucide-react"
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
import { useFavorites } from '@/hooks/useFavorites'
import { useSession } from '@/hooks/useSession'

const timeOptions = [
  { value: '1h', label: '1 Hour' },
  { value: '2h', label: '2 Hours' },
  { value: '4h', label: '4 Hours' },
  { value: '8h', label: '8 Hours' },
  { value: '12h', label: '12 Hours' },
  { value: '1d', label: '1 Day' },
  { value: '7d', label: '7 Days' },
  { value: '14d', label: '14 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '180d', label: '180 Days' },
  { value: '360d', label: '360 Days' },
]

const timeRangeToHours = {
  '1h': 1,
  '2h': 2,
  '4h': 4,
  '8h': 8,
  '12h': 12,
  '1d': 24,
  '7d': 24 * 7,
  '14d': 24 * 14,
  '30d': 24 * 30,
  '90d': 24 * 90,
  '180d': 24 * 180,
  '360d': 24 * 360,
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
type FavoriteFilter = 'all' | 'favorite' | 'nonFavorite'
type CollateralFilter = 'all' | 'collateral' | 'nonCollateral'

export default function FundingRatePage() {
  const [timeRange, setTimeRange] = useState('1d')
  const [tickers, setTickers] = useState<TickerWithFunding[]>([])
  const [loading, setLoading] = useState(true)
  const [completedTickers, setCompletedTickers] = useState(0)
  const [totalTickers, setTotalTickers] = useState(0)
  const [sortField, setSortField] = useState<SortField>('fundingRate')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const [historicalRates, setHistoricalRates] = useState<{ dateTs: number; fundingRate: number }[]>([])
  const [showModal, setShowModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [favoriteFilter, setFavoriteFilter] = useState<FavoriteFilter>('all')
  const [collateralFilter, setCollateralFilter] = useState<CollateralFilter>('all')
  const [collateralTickers, setCollateralTickers] = useState<string[]>([])
  const itemsPerPage = 50
  const { favorites, toggleFavorite } = useFavorites()
  const { user } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const filteredTickers = useMemo(() => {
    const collateralSet = new Set(collateralTickers)

    let result = tickers

    if (collateralFilter === 'collateral') {
      result = result.filter(ticker => collateralSet.has(ticker.symbol))
    } else if (collateralFilter === 'nonCollateral') {
      result = result.filter(ticker => !collateralSet.has(ticker.symbol))
    }

    if (favoriteFilter === 'favorite') {
      result = result.filter(ticker => favorites.has(ticker.symbol))
    } else if (favoriteFilter === 'nonFavorite') {
      result = result.filter(ticker => !favorites.has(ticker.symbol))
    }

    return result
  }, [tickers, collateralTickers, collateralFilter, favoriteFilter, favorites])

  const sortedTickers = [...filteredTickers].sort((a, b) => {
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

  const handleFavoriteToggle = useCallback((symbol: string) => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname || '/funding-rate')}`)
      return
    }

    toggleFavorite(symbol)
  }, [pathname, router, toggleFavorite, user])

  useEffect(() => {
    setCurrentPage(1)
  }, [favoriteFilter, collateralFilter])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [tickersResponse, collateralResponse] = await Promise.all([
          getTickers(),
          getCollateralTickers()
        ])

        setCollateralTickers(collateralResponse.tickers)
        const perpetualTickers = tickersResponse.tickers
          .filter(ticker => ticker.tag === 'perpetual')
          //.filter(ticker => ticker.volumeQuote >= 1000) // 过滤掉交易量小于 1K 的交易对

        setCompletedTickers(0)
        setTotalTickers(perpetualTickers.length)

        // 并发受限地获取每个交易对的资金费率历史并计算所有时间周期的累积值
        const limit = 10
        const tasks = perpetualTickers.map((ticker) => async () => {
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
        const runWithLimit = async <T,>(fns: (() => Promise<T>)[], concurrency: number) => {
          const results: T[] = new Array(fns.length)
          let index = 0
          const workers = new Array(Math.min(concurrency, fns.length)).fill(0).map(async () => {
            while (true) {
              const current = index++
              if (current >= fns.length) break
              results[current] = await fns[current]()
              setCompletedTickers(prev => prev + 1)
            }
          })
          await Promise.all(workers)
          return results
        }
        const tickersWithFunding = await runWithLimit(tasks, limit)

        setTickers(tickersWithFunding)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleRowClick = async (symbol: string) => {
    try {
      const response = await getFundingRates(symbol)
      const now = Date.now()
      const hours = timeRangeToHours[timeRange as keyof typeof timeRangeToHours]
      const startTime = now - hours * 60 * 60 * 1000

      const rates = response.rates
        .filter(rate => new Date(rate.timestamp).getTime() >= startTime)
        .map(rate => ({
          dateTs: new Date(rate.timestamp).getTime(),
          fundingRate: rate.relativeFundingRate
        }))
        .sort((a, b) => a.dateTs - b.dateTs)

      setHistoricalRates(rates)
      setSelectedSymbol(symbol.replace('PF_', '').replace('USD', ''))
      setShowModal(true)
    } catch (error) {
      console.error('Error fetching historical rates:', error)
    }
  }

  return (
    <div className="px-4">
      <div className="flex flex-row items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-bold">Funding Rate Overview</h1>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <Select value={favoriteFilter} onValueChange={(value) => setFavoriteFilter(value as FavoriteFilter)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Favorite filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Favorites: All</SelectItem>
              <SelectItem value="favorite">Favorites: Only</SelectItem>
              <SelectItem value="nonFavorite">Favorites: None</SelectItem>
            </SelectContent>
          </Select>

          <Select value={collateralFilter} onValueChange={(value) => setCollateralFilter(value as CollateralFilter)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Collateral filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Collateral: All</SelectItem>
              <SelectItem value="collateral">Collateral: Only</SelectItem>
              <SelectItem value="nonCollateral">Collateral: None</SelectItem>
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px] md:w-[180px]">
              <SelectValue placeholder="Select Time Range" />
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
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No.</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('symbol')}
                  className="h-auto px-0 font-medium hover:bg-transparent"
                >
                  <div className="flex items-center gap-2">
                    {`Symbol (${filteredTickers.length})`}
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
                    Cumulative Value
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
                    24h Volume
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
                <TableCell colSpan={4} className="text-center">
                  {`Loading... (Processing data, completed ${completedTickers}/${totalTickers || 0} tickers)`}
                </TableCell>
              </TableRow>
            ) : sortedTickers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">No data available</TableCell>
              </TableRow>
            ) : (
              currentTickers.map((ticker, index) => (
                <TableRow
                  key={ticker.symbol}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(ticker.symbol)}
                >
                  <TableCell>{startIndex + index + 1}</TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(event) => {
                          event.stopPropagation()
                          handleFavoriteToggle(ticker.symbol)
                        }}
                      >
                        <Heart
                          className={`h-4 w-4 ${favorites.has(ticker.symbol)
                            ? 'fill-red-500 text-red-500'
                            : 'text-muted-foreground hover:text-red-500'
                          }`}
                        />
                      </Button>
                      {ticker.symbol.replace('PF_', '').replace('USD', '')}
                    </div>
                  </TableCell>
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
            <DialogTitle>{selectedSymbol} Funding Rate History</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <FundingRateChart data={historicalRates} lines={['fundingRate']} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
