// https://docs.kraken.com/api/docs/futures-api/trading/get-tickers
export interface Ticker {
  symbol: string;              // 交易对符号
  last: number;                // 最新成交价
  lastTime: string;            // 最新成交时间 (ISO 8601 格式字符串)
  tag: string;                 // 标签，例如 "perpetual" 表示永续合约
  pair: string;                // 交易对，例如 "AUCTION:USD"
  markPrice: number;           // 标记价格
  bid: number;                 // 当前最佳买价
  bidSize: number;             // 当前最佳买价的挂单量
  ask: number;                 // 当前最佳卖价
  askSize: number;             // 当前最佳卖价的挂单量
  vol24h: number;              // 24小时成交量 (以基础货币计)
  volumeQuote: number;         // 24小时成交额 (以计价货币计)
  openInterest: number;        // 当前持仓量
  open24h: number;             // 24小时开盘价
  high24h: number;             // 24小时最高价
  low24h: number;              // 24小时最低价
  lastSize: number;            // 最新成交量
  fundingRate: number;         // 当前资金费率
  fundingRatePrediction: number; // 预测的下一个资金费率
  suspended: boolean;          // 是否暂停交易
  indexPrice: number;          // 指数价格
  postOnly: boolean;           // 是否为 Post-Only 模式
  change24h: number;           // 24小时价格变化百分比或绝对值 (根据具体API定义，这里看起来是绝对值变化)
}

// https://docs.kraken.com/api/docs/futures-api/trading/historical-funding-rates
export interface FundingRate {
  symbol: string
  timestamp: string
  fundingRate: number
  relativeFundingRate: number
}

export interface TickerResponse {
  result: string
  serverTime: string
  tickers: Ticker[]
}

export interface FundingRateResponse {
  result: string
  serverTime: string
  rates: FundingRate[]
} 