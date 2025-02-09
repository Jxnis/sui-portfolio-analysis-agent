import { WalletResponse } from "@/types/wallet";
import { formatAddress } from "@mysten/sui.js/utils";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBalance(balance: bigint): string {
  return (Number(balance) / 1e9).toFixed(4);
}

export function getWalletResponse(
  message: string,
  address?: string,
  balance?: bigint
): WalletResponse {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("balance")) {
    if (!balance) {
      return {
        type: "error",
        content: "Please connect your wallet first to check the balance.",
      };
    }
    return {
      type: "balance",
      content: `Your SUI balance is ${formatBalance(balance)} SUI`,
    };
  }

  if (lowerMessage.includes("address")) {
    if (!address) {
      return {
        type: "error",
        content: "Please connect your wallet first to see your address.",
      };
    }
    return {
      type: "address",
      content: `Your wallet address is ${formatAddress(address)}`,
    };
  }

  if (!address) {
    return {
      type: "general",
      content:
        'Please connect your wallet first. Click the "Connect Wallet" button above.',
    };
  }

  return {
    type: "general",
    content:
      "I can help you check your balance, address, or assist with other wallet-related questions. What would you like to know?",
  };
}
