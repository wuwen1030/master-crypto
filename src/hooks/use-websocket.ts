import { useEffect, useRef, useState } from "react";

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // 连接到 WebSocket 服务器
    ws.current = new WebSocket("ws://localhost:3001"); // 根据实际后端地址修改

    ws.current.onopen = () => {
      setIsConnected(true);
    };

    ws.current.onclose = () => {
      setIsConnected(false);
    };

    ws.current.onmessage = (event) => {
      setLastMessage(event.data);
    };

    return () => {
      ws.current?.close();
    };
  }, []);

  const sendMessage = (message: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(message);
    }
  };

  return {
    isConnected,
    lastMessage,
    sendMessage,
  };
} 