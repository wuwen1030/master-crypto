"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, Heart, Shield } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";

interface SymbolData {
  id: number;
  symbol: string;
  displayName: string;
  isFavorite: boolean;
  isCollateral: boolean;
}

const ITEMS_PER_PAGE = 50;

export default function SymbolsPage() {
  const [symbols, setSymbols] = useState<SymbolData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 使用统一的收藏管理 Hook
  const { favorites, isFavorite, toggleFavorite } = useFavorites();



  // 获取数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 并行获取两个 API 的数据
        const [tickersResponse, collateralResponse] = await Promise.all([
          fetch('/api/tickers'),
          fetch('/api/collateral-tickers')
        ]);

        if (!tickersResponse.ok || !collateralResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const tickersData = await tickersResponse.json();
        const collateralData = await collateralResponse.json();

        // 创建 collateral set 用于快速查找
        const collateralSet = new Set(collateralData.tickers || []);

        // 处理 tickers 数据
        const processedSymbols: SymbolData[] = tickersData.tickers?.map((ticker: any, index: number) => {
          const symbol = ticker.symbol;
          // 将 PF_BTCUSD 转换为 BTC
          const displayName = ticker.pair.split(':')[0];
          
          return {
            id: index + 1,
            symbol,
            displayName,
            isFavorite: false, // 稍后会根据 favorites 更新
            isCollateral: collateralSet.has(symbol)
          };
        }) || [];

        setSymbols(processedSymbols);
      } catch (error) {
        console.error('Error fetching symbols:', error);
        setError('Failed to load symbols. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 更新 symbols 的收藏状态
  useEffect(() => {
    setSymbols(prevSymbols => 
      prevSymbols.map(symbol => ({
        ...symbol,
        isFavorite: isFavorite(symbol.symbol)
      }))
    );
  }, [favorites, isFavorite]);

  // 过滤和分页逻辑
  const filteredSymbols = useMemo(() => {
    if (!searchTerm) return symbols;
    
    const term = searchTerm.toLowerCase();
    return symbols.filter(symbol => 
      symbol.symbol.toLowerCase().includes(term) ||
      symbol.displayName.toLowerCase().includes(term)
    );
  }, [symbols, searchTerm]);

  // 重置页码当搜索条件改变时
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // 分页数据
  const paginatedSymbols = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSymbols.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSymbols, currentPage]);

  const totalPages = Math.ceil(filteredSymbols.length / ITEMS_PER_PAGE);

  // 重试加载
  const handleRetry = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          <div className="h-9 w-80 bg-muted animate-pulse rounded-md" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Symbols</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded-md" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleRetry}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* 搜索框 */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search symbols..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchTerm('')}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Symbol 表格 */}
      <Card>
        <CardHeader>
          <CardTitle>Symbols</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSymbols.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No symbols found matching your search.' : 'No symbols available.'}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">No.</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-24 text-center">Favorite</TableHead>
                    <TableHead className="w-24 text-center">Collateral</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSymbols.map((symbol) => (
                    <TableRow key={symbol.symbol}>
                      <TableCell className="font-mono text-sm">
                        {symbol.id}
                      </TableCell>
                      <TableCell className="font-mono">
                        {symbol.symbol}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {symbol.displayName}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(symbol.symbol)}
                          className="h-8 w-8 p-0"
                        >
                          <Heart
                            className={`h-4 w-4 ${
                              symbol.isFavorite
                                ? 'fill-red-500 text-red-500'
                                : 'text-muted-foreground hover:text-red-500'
                            }`}
                          />
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        {symbol.isCollateral && (
                          <Badge variant="secondary" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            Collateral
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) {
                              setCurrentPage(currentPage - 1);
                            }
                          }}
                          className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                      
                      {/* 页码显示逻辑 */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNumber;
                        if (totalPages <= 5) {
                          pageNumber = i + 1;
                        } else if (currentPage <= 3) {
                          pageNumber = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + i;
                        } else {
                          pageNumber = currentPage - 2 + i;
                        }

                        return (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(pageNumber);
                              }}
                              isActive={pageNumber === currentPage}
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) {
                              setCurrentPage(currentPage + 1);
                            }
                          }}
                          className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
