"use client";

import { TradingForm } from "@/components/trading/trading-form";
import { TradingLogs } from "@/components/trading/trading-logs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TradingPage() {
  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">交易</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>交易设置</CardTitle>
          </CardHeader>
          <CardContent>
            <TradingForm />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>交易日志</CardTitle>
          </CardHeader>
          <CardContent>
            <TradingLogs />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 