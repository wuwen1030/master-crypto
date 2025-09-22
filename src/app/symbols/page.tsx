"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, Heart, Shield } from "lucide-react";
import {
  ColumnDef,
  PaginationState,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { useFavorites } from "@/hooks/useFavorites";
import { useSession } from "@/hooks/useSession";
import { Ticker } from "@/types/kraken";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SymbolData {
  id: number;
  symbol: string;
  displayName: string;
  isFavorite: boolean;
  isCollateral: boolean;
}

const ITEMS_PER_PAGE = 50;

type FavoriteFilter = "all" | "favorite" | "nonFavorite";
type CollateralFilter = "all" | "collateral" | "nonCollateral";

export default function SymbolsPage() {
  const [symbols, setSymbols] = useState<SymbolData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [favoriteFilter, setFavoriteFilter] = useState<FavoriteFilter>("all");
  const [collateralFilter, setCollateralFilter] =
    useState<CollateralFilter>("all");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: ITEMS_PER_PAGE,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const { user } = useSession();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [tickersResponse, collateralResponse] = await Promise.all([
          fetch("/api/tickers"),
          fetch("/api/collateral-tickers"),
        ]);

        if (!tickersResponse.ok || !collateralResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const tickersData = await tickersResponse.json();
        const collateralData = await collateralResponse.json();
        const collateralSet = new Set(collateralData.tickers || []);

        const unsortedSymbols: Omit<SymbolData, "id">[] = (
          tickersData.tickers ?? []
        ).map((ticker: Ticker) => {
          const symbol = ticker.symbol;
          const displayName = ticker.pair.split(":")[0];

          return {
            symbol,
            displayName,
            isFavorite: false,
            isCollateral: collateralSet.has(symbol),
          };
        });

        const processedSymbols: SymbolData[] = unsortedSymbols
          .sort((a, b) => a.displayName.localeCompare(b.displayName))
          .map((item, index) => ({ ...item, id: index + 1 }));

        setSymbols(processedSymbols);
      } catch (caughtError) {
        console.error("Error fetching symbols:", caughtError);
        setError("Failed to load symbols. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    setSymbols((previous) =>
      previous.map((symbol) => ({
        ...symbol,
        isFavorite: isFavorite(symbol.symbol),
      }))
    );
  }, [favorites, isFavorite]);

  const handleFavoriteToggle = useCallback(
    (symbol: string) => {
      if (!user) {
        router.push(
          `/login?redirect=${encodeURIComponent(pathname || "/symbols")}`
        );
        return;
      }

      toggleFavorite(symbol);
    },
    [pathname, router, toggleFavorite, user]
  );

  const handleCollateralToggle = useCallback(
    async (symbol: string, currentState: boolean) => {
      setSymbols((previous) =>
        previous.map((item) =>
          item.symbol === symbol
            ? { ...item, isCollateral: !currentState }
            : item
        )
      );

      try {
        if (currentState) {
          const response = await fetch(
            `/api/collateral-tickers?symbol=${encodeURIComponent(symbol)}`,
            { method: "DELETE" }
          );
          if (!response.ok) {
            throw new Error("Failed to remove collateral");
          }
        } else {
          const response = await fetch("/api/collateral-tickers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ symbol }),
          });
          if (!response.ok) {
            throw new Error("Failed to add collateral");
          }
        }
      } catch (caughtError) {
        setSymbols((previous) =>
          previous.map((item) =>
            item.symbol === symbol
              ? { ...item, isCollateral: currentState }
              : item
          )
        );
        console.error(caughtError);
      }
    },
    []
  );

  const filteredSymbols = useMemo(() => {
    let current = symbols;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      current = current.filter(
        (item) =>
          item.symbol.toLowerCase().includes(term) ||
          item.displayName.toLowerCase().includes(term)
      );
    }

    if (favoriteFilter === "favorite") {
      current = current.filter((item) => item.isFavorite);
    } else if (favoriteFilter === "nonFavorite") {
      current = current.filter((item) => !item.isFavorite);
    }

    if (collateralFilter === "collateral") {
      current = current.filter((item) => item.isCollateral);
    } else if (collateralFilter === "nonCollateral") {
      current = current.filter((item) => !item.isCollateral);
    }

    return current;
  }, [symbols, searchTerm, favoriteFilter, collateralFilter]);

  useEffect(() => {
    setPagination((previous) => ({ ...previous, pageIndex: 0 }));
  }, [searchTerm, favoriteFilter, collateralFilter, filteredSymbols.length]);

  const columns = useMemo<ColumnDef<SymbolData>[]>(
    () => [
      {
        accessorKey: "id",
        header: "No.",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.id}</span>
        ),
      },
      {
        accessorKey: "symbol",
        header: "Symbol",
        cell: ({ row }) => (
          <span className="font-mono">{row.original.symbol}</span>
        ),
      },
      {
        accessorKey: "displayName",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-semibold">{row.original.displayName}</span>
        ),
      },
      {
        id: "favorite",
        header: "Favorite",
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFavoriteToggle(row.original.symbol)}
              className="h-8 w-8 p-0"
            >
              <Heart
                className={`h-4 w-4 ${
                  row.original.isFavorite
                    ? "fill-red-500 text-red-500"
                    : "text-muted-foreground hover:text-red-500"
                }`}
              />
            </Button>
          </div>
        ),
        enableSorting: false,
      },
      {
        id: "collateral",
        header: "Collateral",
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                handleCollateralToggle(
                  row.original.symbol,
                  row.original.isCollateral
                )
              }
              className="h-8 w-8 p-0"
              title={
                row.original.isCollateral
                  ? "Remove from collateral"
                  : "Add to collateral"
              }
            >
              <Shield
                className={`h-4 w-4 ${
                  row.original.isCollateral
                    ? "fill-emerald-500 text-emerald-500"
                    : "text-muted-foreground hover:text-emerald-500"
                }`}
              />
            </Button>
          </div>
        ),
        enableSorting: false,
      },
    ],
    [handleCollateralToggle, handleFavoriteToggle]
  );

  const table = useReactTable<SymbolData>({
    data: filteredSymbols,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const emptyMessage = useMemo(() => {
    if (!symbols.length) {
      return "No symbols available.";
    }

    if (searchTerm || favoriteFilter !== "all" || collateralFilter !== "all") {
      return "No symbols found with the current filters.";
    }

    return "No results.";
  }, [
    collateralFilter,
    favoriteFilter,
    searchTerm,
    symbols.length,
  ]);

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
              {[...Array(10)].map((_, index) => (
                <div key={index} className="h-12 bg-muted animate-pulse rounded-md" />
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
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search symbols..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-8"
            />
          </div>
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm("")}
            >
              Clear
            </Button>
          )}
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
          <Select
            value={favoriteFilter}
            onValueChange={(value) =>
              setFavoriteFilter(value as FavoriteFilter)
            }
          >
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="Favorite filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Favorites</SelectItem>
              <SelectItem value="favorite">Favorites only</SelectItem>
              <SelectItem value="nonFavorite">Non-favorites</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={collateralFilter}
            onValueChange={(value) =>
              setCollateralFilter(value as CollateralFilter)
            }
          >
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="Collateral filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Collateral</SelectItem>
              <SelectItem value="collateral">Collateral only</SelectItem>
              <SelectItem value="nonCollateral">Non-collateral</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Symbols</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable table={table} emptyMessage={emptyMessage} />
        </CardContent>
      </Card>
    </div>
  );
}
