export interface WalletResponse {
  type: "balance" | "address" | "network" | "error" | "general";
  content: string;
}

export interface WalletMessage {
  content: string;
  isUser: boolean;
  walletData?: WalletResponse;
}
