'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { DateRange } from 'react-day-picker'
import { addDays } from 'date-fns'
import { getTickers, getFundingRates } from '@/lib/kraken'
import { FundingRateChart, type TimeSeriesPoint } from '@/components/ui/line-chart'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CalendarIcon } from '@radix-ui/react-icons'
import { format } from 'date-fns'
import { ExternalLink } from 'lucide-react'
import { getShowOnlyFavorites, setShowOnlyFavorites as saveShowOnlyFavorites } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Ticker, FundingRate } from '@/types/kraken'
import { useSession } from '@/hooks/useSession'
import { useFavorites } from '@/hooks/useFavorites'
import { useRouter } from 'next/navigation'

interface Stats {
  symbol: string
  total: number
  average: number
  positiveDays: number
  negativeDays: number
  maxValue: number
  minValue: number
}

export default function FundingDatePage() {
  const [tickers, setTickers] = useState<Ticker[]>([])
  const [selectedPairs, setSelectedPairs] = useState<string[]>([])
  const [rates, setRates] = useState<TimeSeriesPoint[]>([])
  const [dateRange, setDateRange] = useState<DateRange>({
    from: addDays(new Date(), -7),
    to: new Date(),
  })
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)
  const [favoriteSymbols, setFavoriteSymbols] = useState<string[]>([])
  const [stats, setStats] = useState<Stats[]>([])
  const { user } = useSession()
  const { favoritesList } = useFavorites()
  const router = useRouter()

  useEffect(() => {
    getTickers().then((data) => {
      const perpetuals = data.tickers
        .filter((t: Ticker) => t.tag === 'perpetual')
        .sort((a, b) => a.symbol.localeCompare(b.symbol))
      setTickers(perpetuals)
    })
  }, [])

  const calculateStats = useCallback((data: TimeSeriesPoint[]) => {
    return selectedPairs.map(symbol => {
      let total = 0
      let count = 0
      let positiveDays = 0
      let negativeDays = 0
      let maxValue = -Infinity
      let minValue = Infinity
      
      data.forEach(item => {
        if (symbol in item) {
          const dailyValue = item[symbol] // 这已经是按日聚合的值
          total += dailyValue
          count++
          
          if (dailyValue > 0) {
            positiveDays++
          } else if (dailyValue < 0) {
            negativeDays++
          }
          
          // 按日统计的最大最小值
          maxValue = Math.max(maxValue, dailyValue)
          minValue = Math.min(minValue, dailyValue)
        }
      })

      return {
        symbol,
        total: parseFloat(total.toFixed(4)),
        average: parseFloat((total / (count || 1)).toFixed(4)),
        positiveDays,
        negativeDays,
        maxValue: count > 0 ? parseFloat(maxValue.toFixed(4)) : 0,
        minValue: count > 0 ? parseFloat(minValue.toFixed(4)) : 0
      }
    })
  }, [selectedPairs])

  useEffect(() => {
    if (selectedPairs.length > 0) {
      Promise.all(
        selectedPairs.map((symbol) =>
          getFundingRates(symbol).then((data) => ({
            symbol,
            rates: data.rates,
          }))
        )
      ).then((results) => {
        const formattedData = formatChartData(results, dateRange)
        setRates(formattedData)
        setStats(calculateStats(formattedData))
      })
    }
  }, [selectedPairs, dateRange, calculateStats])

  useEffect(() => {
    setFavoriteSymbols(favoritesList)
  }, [favoritesList])

  useEffect(() => {
    setShowOnlyFavorites(getShowOnlyFavorites())
  }, [])



  const formatChartData = (
    results: { symbol: string; rates: FundingRate[] }[],
    dateRange: DateRange
  ) => {
    const dailySums = new Map<number, Record<'dateTs', number> & Record<string, number>>()

    results.forEach(({ symbol, rates }) => {
      rates.forEach((rate) => {
        const ts = new Date(rate.timestamp).getTime()
        const dayStart = new Date(ts)
        dayStart.setHours(0, 0, 0, 0)
        const dayTs = dayStart.getTime()

        if (!dailySums.has(dayTs)) {
          dailySums.set(dayTs, { dateTs: dayTs } as Record<'dateTs', number> & Record<string, number>)
        }

        const dayData = dailySums.get(dayTs)!
        if (!(symbol in dayData)) {
          dayData[symbol] = 0
        }

        dayData[symbol] = dayData[symbol] + rate.relativeFundingRate
      })
    })

    const from = dateRange.from ? new Date(dateRange.from).setHours(0, 0, 0, 0) : -Infinity
    const to = dateRange.to ? new Date(dateRange.to).setHours(23, 59, 59, 999) : Infinity

    return Array.from(dailySums.values())
      .filter((d) => d.dateTs >= from && d.dateTs <= to)
      .sort((a, b) => a.dateTs - b.dateTs)
  }

  const filteredSymbols = useMemo(() => {
    if (!showOnlyFavorites) return tickers
    return tickers.filter(symbol => favoriteSymbols.includes(symbol.symbol))
  }, [tickers, showOnlyFavorites, favoriteSymbols])

  const handleShowOnlyFavoritesChange = (checked: boolean) => {
    if (checked && !user) {
      router.push(`/login?redirect=${encodeURIComponent('/funding-rate/trend')}`)
      return
    }
    setShowOnlyFavorites(checked)
    saveShowOnlyFavorites(checked)
  }

  return (
    <div className="p-4">
      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <Select
            value={selectedPairs.join(',')}
            onValueChange={(value) => setSelectedPairs(value ? value.split(',') : [])}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select pairs" />
            </SelectTrigger>
            <SelectContent>
              {filteredSymbols.map((symbol) => (
                <SelectItem key={symbol.symbol} value={symbol.symbol}>
                  {symbol.symbol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Checkbox
              id="showFavorites"
              checked={showOnlyFavorites}
              onCheckedChange={(checked) => handleShowOnlyFavoritesChange(checked as boolean)}
            />
            <label htmlFor="showFavorites" className="text-sm whitespace-nowrap">
              Show Favorites Only
            </label>
          </div>

          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('/symbols', '_blank')}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Manage Favorites
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Open symbols page to manage favorites</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'LLL dd, y')} -{' '}
                    {format(dateRange.to, 'LLL dd, y')}
                  </>
                ) : (
                  format(dateRange.from, 'LLL dd, y')
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      {stats.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-6">Statistics Overview</h3>
          <div className="space-y-6">
            {stats.map((stat) => (
              <Card key={stat.symbol} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold text-center text-primary">
                    {stat.symbol}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* 响应式网格：小屏幕2列3行，超宽屏6列1行 */}
                  <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 lg:gap-4">
                    <div className="text-center p-2 lg:p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1 leading-tight">
                        Total
                      </div>
                      <div className="text-sm lg:text-lg font-bold text-blue-800 leading-tight">
                        {(stat.total * 100).toFixed(4)}%
                      </div>
                    </div>
                    <div className="text-center p-2 lg:p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                      <div className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-1 leading-tight">
                        Average
                      </div>
                      <div className="text-sm lg:text-lg font-bold text-indigo-800 leading-tight">
                        {(stat.average * 100).toFixed(4)}%
                      </div>
                    </div>
                    <div className="text-center p-2 lg:p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-xs font-medium text-green-600 uppercase tracking-wide mb-1 leading-tight">
                        Positive<br className="lg:hidden" /> Days
                      </div>
                      <div className="text-sm lg:text-lg font-bold text-green-800 leading-tight">
                        {stat.positiveDays}
                      </div>
                    </div>
                    <div className="text-center p-2 lg:p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-xs font-medium text-red-600 uppercase tracking-wide mb-1 leading-tight">
                        Negative<br className="lg:hidden" /> Days
                      </div>
                      <div className="text-sm lg:text-lg font-bold text-red-800 leading-tight">
                        {stat.negativeDays}
                      </div>
                    </div>
                    <div className="text-center p-2 lg:p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="text-xs font-medium text-emerald-600 uppercase tracking-wide mb-1 leading-tight">
                        Daily<br className="lg:hidden" /> Max
                      </div>
                      <div className="text-sm lg:text-lg font-bold text-emerald-800 leading-tight">
                        {(stat.maxValue * 100).toFixed(4)}%
                      </div>
                    </div>
                    <div className="text-center p-2 lg:p-3 bg-rose-50 rounded-lg border border-rose-200">
                      <div className="text-xs font-medium text-rose-600 uppercase tracking-wide mb-1 leading-tight">
                        Daily<br className="lg:hidden" /> Min
                      </div>
                      <div className="text-sm lg:text-lg font-bold text-rose-800 leading-tight">
                        {(stat.minValue * 100).toFixed(4)}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        {rates.length > 0 && (
          <FundingRateChart data={rates} lines={selectedPairs} />
        )}
      </div>
    </div>
  )
}
