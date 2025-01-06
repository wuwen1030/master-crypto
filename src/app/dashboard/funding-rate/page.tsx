'use client'

import { useState, useEffect, useMemo } from 'react'
import { DateRange } from 'react-day-picker'
import { addDays } from 'date-fns'
import { getTickers, getFundingRates } from '@/lib/kraken'
import { FundingRateChart } from '@/components/ui/line-chart'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
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
import { Star, StarOff } from 'lucide-react'
import { getFavoriteSymbols, toggleFavoriteSymbol, getShowOnlyFavorites, setShowOnlyFavorites as saveShowOnlyFavorites } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'

interface Ticker {
  symbol: string
  pair: string
  tag: string
}

interface FundingRate {
  timestamp: string
  relativeFundingRate: number
}

export default function FundingDatePage() {
  const [tickers, setTickers] = useState<Ticker[]>([])
  const [selectedPairs, setSelectedPairs] = useState<string[]>([])
  const [rates, setRates] = useState<Record<string, string | number>[]>([])
  const [dateRange, setDateRange] = useState<DateRange>({
    from: addDays(new Date(), -7),
    to: new Date(),
  })
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)
  const [favoriteSymbols, setFavoriteSymbols] = useState<string[]>([])

  useEffect(() => {
    getTickers().then((data) => {
      const perpetuals = data.tickers
        .filter((t: Ticker) => t.tag === 'perpetual')
        .sort((a, b) => a.symbol.localeCompare(b.symbol))
      setTickers(perpetuals)
    })
  }, [])

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
      })
    }
  }, [selectedPairs, dateRange])

  useEffect(() => {
    setFavoriteSymbols(getFavoriteSymbols())
    setShowOnlyFavorites(getShowOnlyFavorites())
  }, [])

  const handleToggleFavorite = (symbol: string) => {
    const updatedFavorites = toggleFavoriteSymbol(symbol)
    setFavoriteSymbols(updatedFavorites)
  }

  const formatChartData = (
    results: { symbol: string; rates: FundingRate[] }[],
    dateRange: DateRange
  ) => {
    const dailySums = new Map<string, Record<string, string | number>>()

    results.forEach(({ symbol, rates }) => {
      rates.forEach((rate) => {
        const date = new Date(rate.timestamp).toISOString().split('T')[0]
        
        if (!dailySums.has(date)) {
          dailySums.set(date, { date })
        }
        
        const dayData = dailySums.get(date)!
        if (!(symbol in dayData)) {
          dayData[symbol] = 0
        }
        
        dayData[symbol] = (dayData[symbol] as number) + rate.relativeFundingRate
      })
    })

    return Array.from(dailySums.values())
      .filter((d) => {
        const date = new Date(d.date as string)
        return date >= dateRange.from! && date <= dateRange.to!
      })
      .sort((a, b) => new Date(a.date as string).getTime() - new Date(b.date as string).getTime())
  }

  const filteredSymbols = useMemo(() => {
    if (!showOnlyFavorites) return tickers
    return tickers.filter(symbol => favoriteSymbols.includes(symbol.symbol))
  }, [tickers, showOnlyFavorites, favoriteSymbols])

  const handleShowOnlyFavoritesChange = (checked: boolean) => {
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
              只显示收藏
            </label>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <Star className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-2">
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {tickers.map((ticker) => (
                  <button
                    key={ticker.symbol}
                    onClick={() => handleToggleFavorite(ticker.symbol)}
                    className="flex items-center gap-2 w-full hover:bg-gray-100 p-1 rounded text-left"
                  >
                    {favoriteSymbols.includes(ticker.symbol) ? (
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ) : (
                      <StarOff className="h-4 w-4" />
                    )}
                    <span className="text-sm">{ticker.symbol}</span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
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

      <div className="mt-6">
        {rates.length > 0 && (
          <FundingRateChart
            data={rates}
            lines={selectedPairs}
          />
        )}
      </div>
    </div>
  )
}
