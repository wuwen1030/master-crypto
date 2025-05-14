"use client";

import { useEffect, useState } from "react";
import { useWebSocket } from "@/hooks/use-websocket";
import { ScrollArea } from "@/components/ui/scroll-area";

export function TradingLogs() {
  const [logs, setLogs] = useState<string[]>([]);
  const { lastMessage } = useWebSocket();

  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage);
        if (data.type === "trading_log") {
          setLogs(prev => [...prev, data.message]);
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    }
  }, [lastMessage]);

  return (
    <ScrollArea className="h-[400px] w-full rounded-md border p-4">
      <div className="space-y-2">
        {logs.map((log, index) => (
          <div
            key={index}
            className="text-sm font-mono whitespace-pre-wrap break-words"
          >
            {log}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
} 