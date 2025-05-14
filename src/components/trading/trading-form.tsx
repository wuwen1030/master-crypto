"use client";

import { useState } from "react";
import { useWebSocket } from "@/hooks/use-websocket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const EXCHANGES = ["binance", "kraken", "gateio", "kraken_future"] as const;

const EXCHANGE_MAP = {
  "binance": "Binance",
  "kraken": "Kraken",
  "gateio": "Gate.io",
  "kraken_future": "Kraken",
} as const;

const TRADING_PAIRS = ["BTC", "ETH", "SOL"] as const;

export function TradingForm() {
  const [formData, setFormData] = useState({
    tradingPair: "BTC",
    amount: "0.01",
    times: "1",
    direction: "open",
    spotExchange: "binance",
    futuresExchange: "kraken_future",
    basisThreshold: "0.001",
  });

  const { sendMessage, isConnected } = useWebSocket();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      alert("WebSocket 未连接");
      return;
    }
    sendMessage(JSON.stringify({
      type: "trading",
      data: formData,
    }));
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tradingPair">交易对</Label>
        <Select
          value={formData.tradingPair}
          onValueChange={(value) => handleChange("tradingPair", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="选择交易对" />
          </SelectTrigger>
          <SelectContent>
            {TRADING_PAIRS.map((pair) => (
              <SelectItem key={pair} value={pair}>
                {pair}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">单次交易额</Label>
        <Input
          id="amount"
          type="number"
          step="0.0001"
          value={formData.amount}
          onChange={(e) => handleChange("amount", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="times">交易次数</Label>
        <Input
          id="times"
          type="number"
          min="1"
          value={formData.times}
          onChange={(e) => handleChange("times", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>交易方向</Label>
        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.direction === "open"}
            onCheckedChange={(checked) =>
              handleChange("direction", checked ? "open" : "close")
            }
          />
          <span>{formData.direction === "open" ? "开仓" : "平仓"}</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="spotExchange">现货交易所</Label>
        <Select
          value={formData.spotExchange}
          onValueChange={(value) => handleChange("spotExchange", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="选择现货交易所" />
          </SelectTrigger>
          <SelectContent>
            {EXCHANGES.map((exchange) => (
              <SelectItem key={exchange} value={exchange}>
                {EXCHANGE_MAP[exchange]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="futuresExchange">合约交易所</Label>
        <Select
          value={formData.futuresExchange}
          onValueChange={(value) => handleChange("futuresExchange", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="选择合约交易所" />
          </SelectTrigger>
          <SelectContent>
            {EXCHANGES.map((exchange) => (
              <SelectItem key={exchange} value={exchange}>
                {EXCHANGE_MAP[exchange]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="basisThreshold">基差阈值</Label>
        <Input
          id="basisThreshold"
          type="number"
          step="0.001"
          value={formData.basisThreshold}
          onChange={(e) => handleChange("basisThreshold", e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={!isConnected}>
        开始交易
      </Button>
    </form>
  );
} 