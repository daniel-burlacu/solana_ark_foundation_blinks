import { PublicKey } from "@solana/web3.js";

export const DEFAULT_SOL_ADDRESS: PublicKey = new PublicKey(
  "BN8LeCtMenajmBbzRKqkPFcP2hAJjrtCFfd4XmUqxJ9G", // devnet wallet
);

// export const ACTIONS_CORS_HEADERS = {
//   "Access-Control-Allow-Origin": "https://dial.to", // Replace with your actual frontend origin
//   "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
//   "Access-Control-Allow-Headers": "Content-Type, Authorization",
// };

const CLUSTER = process.env.NEXT_PUBLIC_CLUSTER || "devnet"; // Use "mainnet" for production
export const ACTIONS_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "X-Action-Version": "1",
  "X-Blockchain-Ids": `solana:${CLUSTER}`, // Dynamically set based on the cluster
};



export const DEFAULT_SOL_AMOUNT: number = 1.0;