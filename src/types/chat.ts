import { SuiObjectResponse } from "@mysten/sui.js/client";
import { CoinStruct } from "@mysten/sui.js/client";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface WalletData {
  suiBalance: number;
  objects: SuiObjectResponse[];
  coins: CoinStruct[];
  totalObjects: number;
  totalCoins: number;
}

export interface CoinData {
  price: number;
  change24h: number;
  marketCap: number;
  symbol: string;
}

export interface CoinGeckoCoin {
  id: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  symbol: string;
}

export interface MarketData {
  [coinId: string]: CoinData;
}
