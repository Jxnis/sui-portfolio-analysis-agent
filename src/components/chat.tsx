"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { isValidSuiAddress } from "@mysten/sui.js/utils";
import { useChat } from "ai/react";
import { Loader2, Send } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

function parseMessageContent(content: string): string {
  try {
    const parts = content.split("\n\n").map((part) => {
      const jsonString = part.replace(/^data:\s*/, ""); // Remove "data: " prefix
      if (jsonString.trim() === "") return ""; // Skip empty parts
      try {
        return JSON.parse(jsonString).content || "";
      } catch {
        // If JSON parsing fails, return the original string
        return jsonString;
      }
    });
    return parts.join("");
  } catch (error) {
    console.error("Failed to parse message content:", error);
    return content; // Return the original content if parsing fails
  }
}

export default function Chat() {
  const account = useCurrentAccount();
  const [error, setError] = useState<string | null>(null);
  const [validWalletAddress, setValidWalletAddress] = useState<string | null>(
    null
  );
  const [suiPrice, setSuiPrice] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      streamProtocol: "text",
      api: "/api/chat",
      body: {
        walletAddress: validWalletAddress,
      },
      initialMessages: [
        {
          id: "1",
          role: "assistant",
          content:
            "Hello! I'm your SUI Portfolio Analysis Agent. I can analyze your wallet assets and answer any questions about them. Connect your wallet or provide a wallet address to get started.",
        },
      ],
      onError: (error: Error) => {
        console.error("Chat error:", error);
        setError("Failed to send message. Please try again.");
        setTimeout(() => setError(null), 10000);
      },
    });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messagesEndRef, messages]);

  useEffect(() => {
    if (account?.address && isValidSuiAddress(account.address)) {
      setValidWalletAddress(account.address);
      localStorage.setItem("walletAddress", account.address);
    } else {
      setValidWalletAddress(null);
      localStorage.removeItem("walletAddress");
    }
  }, [account]);

  useEffect(() => {
    const savedWalletAddress = localStorage.getItem("walletAddress");
    if (savedWalletAddress && isValidSuiAddress(savedWalletAddress)) {
      setValidWalletAddress(savedWalletAddress);
    }
  }, []);

  useEffect(() => {
    const fetchSuiPrice = async () => {
      try {
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=sui&vs_currencies=usd"
        );
        const data: { sui: { usd: number } } = await response.json();
        setSuiPrice(data.sui.usd);
      } catch (error) {
        console.error("Error fetching SUI price:", error);
      }
    };

    fetchSuiPrice();
    const interval = setInterval(fetchSuiPrice, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#C0E6FF] p-4">
      <Card className="w-full max-w-2xl h-[600px] flex flex-col">
        <CardHeader className="space-x-4">
          <div className="flex flex-col items-center space-y-2">
            <Link href="https://sui.io/" target="_blank" className="w-fit">
              <Image
                src="/sui.svg"
                alt="Sui Logo"
                width={24}
                height={24}
              ></Image>
            </Link>
            <CardTitle className="text-center text-primary">
              SUI Portfolio Analysis Agent
            </CardTitle>
          </div>

          <div className="flex justify-center items-center space-x-4">
            <ConnectButton />

            {account && !validWalletAddress && (
              <div className="text-center text-sm text-red-500">
                Connected wallet address is invalid
              </div>
            )}
            {suiPrice && (
              <div className="text-sm text-muted-foreground text-center">
                SUI Price: ${suiPrice.toFixed(2)}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <ReactMarkdown className="break-all">
                  {message.content.includes("data:")
                    ? parseMessageContent(message.content)
                    : message.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>
        <CardFooter>
          <form onSubmit={handleSubmit} className="flex w-full gap-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask about your wallet assets..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
