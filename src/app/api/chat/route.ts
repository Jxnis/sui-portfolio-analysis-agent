import { SuiClient } from "@mysten/sui.js/client";
import { isValidSuiAddress } from "@mysten/sui.js/utils";
import { NextResponse } from "next/server";
import { WalletData, MarketData, CoinGeckoCoin } from "@/types/chat";

// Initialize Sui Client
const suiClient = new SuiClient({
  url: "https://fullnode.mainnet.sui.io",
});

async function fetchWalletData(address: string): Promise<WalletData | null> {
  if (!isValidSuiAddress(address)) {
    console.error("Invalid Sui address:", address);
    return null;
  }

  try {
    const [balance, objects, coins] = await Promise.all([
      suiClient.getBalance({
        owner: address,
        coinType: "0x2::sui::SUI",
      }),
      suiClient.getOwnedObjects({
        owner: address,
        options: { showContent: true, showDisplay: true },
      }),
      suiClient.getAllCoins({
        owner: address,
      }),
    ]);

    return {
      suiBalance: Number(balance.totalBalance) / 1e9,
      objects: objects.data,
      coins: coins.data,
      totalObjects: objects.data.length,
      totalCoins: coins.data.length,
    };
  } catch (error) {
    console.error("Error fetching wallet data:", error);
    return null;
  }
}

async function fetchCryptoMarketData(): Promise<MarketData | null> {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=30&page=1&sparkline=false&price_change_percentage=24h"
    );
    const data = await response.json();
    return data.reduce((acc: MarketData, coin: CoinGeckoCoin) => {
      acc[coin.id] = {
        price: coin.current_price,
        change24h: coin.price_change_percentage_24h,
        marketCap: coin.market_cap,
        symbol: coin.symbol.toUpperCase(),
      };
      return acc;
    }, {});
  } catch (error) {
    console.error("Error fetching crypto market data:", error);
    return null;
  }
}

function createSystemPrompt(
  walletData: WalletData | null,
  marketData: MarketData | null
): string {
  let prompt = `You are an advanced token portfolio analyzer for SUI wallets. You provide in-depth analysis, market estimations, and trading tips based on wallet contents and current market data. `;

  if (marketData) {
    prompt += `
Current Market Data (Top 30 by Market Cap):
${Object.entries(marketData)
  .map(
    ([id, data]) =>
      `- ${data.symbol} (${id}): $${data.price.toFixed(
        2
      )} (24h change: ${data.change24h.toFixed(2)}%)`
  )
  .join("\n")}
`;
  }

  if (!walletData) {
    prompt += `When no wallet is connected, offer general advice on portfolio management, SUI ecosystem and crypto market situation in general.`;
    return prompt;
  }

  const { suiBalance, totalObjects, totalCoins, objects, coins } = walletData;

  const nfts = objects.filter((obj) => obj.data?.display?.data?.name);
  const tokens = coins.filter((coin) => coin.coinType !== "0x2::sui::SUI");

  prompt += `
Wallet Overview:
- SUI Balance: ${suiBalance.toFixed(4)} SUI (Current value: $${(
    suiBalance * (marketData?.sui?.price || 0)
  ).toFixed(2)})
- Total Objects: ${totalObjects}
- Total Coins: ${totalCoins}

${
  nfts.length > 0
    ? `
NFTs (${nfts.length}):
${nfts.map((nft) => `- ${nft.data?.display?.data?.name}`).join("\n")}
`
    : ""
}

${
  tokens.length > 0
    ? `
Other Tokens:
${tokens.map((token) => `- ${token.coinType}`).join("\n")}
`
    : ""
}

Provide comprehensive analysis including:
1. Market Structure Analysis: Identify key swing highs/lows, trend structures, and potential reversals for SUI and major tokens in the wallet.
2. Volume and Order Flow Analysis: Analyze volume distribution, market depth, and whale activity for relevant tokens.
3. Technical Indicator Analysis: Use indicators like RSI, Bollinger Bands, and Ichimoku Cloud for insights on major holdings.
4. Market Psychology and Sentiment: Evaluate momentum, sentiment, and institutional activity in the SUI ecosystem.
5. Risk Management: Calculate appropriate position sizes, suggest stop losses, and plan trade management strategies.
6. Trading Plan Development: Provide clear entry/exit strategies and alternative scenarios for major holdings.
7. Broader Market Context: Provide insights on how the overall crypto market trends might affect the wallet's holdings.

Offer actionable insights and recommendations based on the wallet composition and current market conditions. Be concise yet thorough in your analysis.

When using technical terms, provide brief explanations or definitions to educate the user.`;

  return prompt;
}

export async function POST(req: Request) {
  try {
    const { messages, walletAddress } = await req.json();

    // Fetch wallet data if address is provided and valid
    const walletData =
      walletAddress && isValidSuiAddress(walletAddress)
        ? await fetchWalletData(walletAddress)
        : null;

    console.log("WALLET DATA", walletData);

    // Fetch real-time crypto market data
    const marketData = await fetchCryptoMarketData();

    //models: deepseek/deepseek-r1:free, meta-llama/llama-3.3-70b-instruct:free, deepseek/deepseek-r1-distill-llama-70b:free
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": `${process.env.NEXT_PUBLIC_APP_URL}`,
          "X-Title": "Token Portfolio Analyzer",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.3-70b-instruct:free",
          messages: [
            {
              role: "system",
              content: createSystemPrompt(walletData, marketData),
            },
            ...messages,
          ],
          temperature: 0.7,
          stream: true,
        }),
      }
    );

    console.log("OpenRouter response status:", response.status); // Log response status

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter error:", errorText);
      throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
    }

    // Create a new ReadableStream that will receive the streamed response
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.trim() === "") continue;
            if (line.trim() === "data: [DONE]") {
              controller.close();
              return;
            }
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (
                  data.choices &&
                  data.choices[0] &&
                  data.choices[0].delta &&
                  data.choices[0].delta.content
                ) {
                  const content = data.choices[0].delta.content;
                  const formattedChunk = encoder.encode(
                    `data: ${JSON.stringify({ content })}\n\n`
                  );
                  controller.enqueue(formattedChunk);
                }
              } catch (error) {
                console.error("Error parsing JSON:", error);
              }
            }
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in chat route:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
