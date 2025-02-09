# Sui Portfolio Analysis Agent

**[Live Demo](https://sui-portfolio-analysis-agent.vercel.app/)**

This project is a Next.js application designed to analyze cryptocurrency portfolios using real-time market data from CoinGecko and Sui blockchain data. The application integrates with Sui technology to manage wallet data and provides insights into the current market conditions.

## Getting Started

To start the development server, use one of the following commands:

bash
npm run dev
or
yarn dev
or
pnpm dev
or
bun dev

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## How the Agent Works

The Sui Portfolio Analysis Agent operates by integrating with the Sui blockchain and CoinGecko API to provide real-time analysis of cryptocurrency portfolios. Here's a breakdown of its functionality:

1. **Sui Blockchain Integration**:

   - The application uses the `@mysten/sui.js/client` library to interact with the Sui blockchain.
   - It fetches wallet data, including Sui objects and coins, to analyze the user's portfolio.
   - Relevant code can be found in the `WalletData` interface:
     ```typescript:src/types/chat.ts
     startLine: 9
     endLine: 15
     ```

2. **Fetching Real-Time Market Data**:

   - The application fetches real-time market data from the CoinGecko API.
   - It retrieves information such as current prices, 24-hour price changes, and market capitalization for various cryptocurrencies.
   - The function responsible for fetching this data is:
     ```typescript:src/app/api/chat/route.ts
     startLine: 1
     endLine: 20
     ```

3. **Data Processing and Analysis**:
   - The application processes the fetched data to provide insights into the user's portfolio.
   - It calculates metrics such as total balance, market value changes, and more.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
