import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Exchange } from '@/types/api-key';
import { CircleCheck, CircleX } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ApiKeyConfigProps {
  exchange: Exchange;
  isConfigured: boolean;
  onConfigure: (exchange: Exchange, key: string, secret: string) => Promise<void>;
}

export function ApiKeyConfig({ exchange, isConfigured, onConfigure }: ApiKeyConfigProps) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState('');
  const [secret, setSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onConfigure(exchange, key, secret);
      setOpen(false);
      setKey('');
      setSecret('');
    } catch (error) {
      console.error('Failed to configure API key:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="flex items-center justify-between h-20 px-6 py-4">
        <div className="flex items-center">
          {isConfigured ? (
            <CircleCheck className="text-green-500 mr-2" />
          ) : (
            <CircleX className="text-destructive mr-2" />
          )}
          <span className="text-lg font-semibold capitalize">{exchange}</span>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="ml-8" variant="default" size="sm">
              {isConfigured ? '去更新' : '去配置'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>配置 {exchange} API Key</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key">API Key</Label>
                <Input
                  id="key"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="请输入 API key"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secret">API Secret</Label>
                <Input
                  id="secret"
                  type="password"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="请输入 API secret"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? '保存中...' : '保存'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
} 