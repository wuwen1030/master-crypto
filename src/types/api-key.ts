export type Exchange = 'binance' | 'gateio' | 'kraken' | 'kraken_future';

export type ApiKey = {
  id: number;
  userId: string;
  exchange: Exchange;
  key: string;
  secret: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ApiKeyInput = {
  exchange: Exchange;
  key: string;
  secret: string;
}; 