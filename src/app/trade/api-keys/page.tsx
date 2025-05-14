'use client';

import { useEffect, useState } from 'react';
import { ApiKeyConfig } from '@/components/api-key-config';
import { Exchange, ApiKey } from '@/types/api-key';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const exchanges: Exchange[] = ['binance', 'gateio', 'kraken', 'kraken_future'];

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/api-keys');
      if (!response.ok) {
        throw new Error('Failed to fetch API keys');
      }
      const data = await response.json();
      setApiKeys(data);
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigure = async (exchange: Exchange, key: string, secret: string) => {
    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ exchange, key, secret }),
      });

      if (!response.ok) {
        throw new Error('Failed to configure API key');
      }

      await fetchApiKeys();
    } catch (error) {
      console.error('Error configuring API key:', error);
      throw error;
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center py-8">
      <Card>
        <CardHeader>
          <CardTitle>API Key 配置</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {isLoading
              ? exchanges.map((exchange) => (
                  <div key={exchange} className="w-full max-w-sm">
                    <Skeleton className="h-20 w-full rounded-xl" />
                  </div>
                ))
              : exchanges.map((exchange) => (
                  <ApiKeyConfig
                    key={exchange}
                    exchange={exchange}
                    isConfigured={apiKeys.some((key) => key.exchange === exchange)}
                    onConfigure={handleConfigure}
                  />
                ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 