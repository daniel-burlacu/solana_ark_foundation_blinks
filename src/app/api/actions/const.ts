import { PublicKey } from "@solana/web3.js";

export const DEFAULT_SOL_ADDRESS: PublicKey = new PublicKey(
  "BN8LeCtMenajmBbzRKqkPFcP2hAJjrtCFfd4XmUqxJ9G", // devnet wallet
);

// export const ACTIONS_CORS_HEADERS = {
//   "Access-Control-Allow-Origin": "https://dial.to", // Replace with your actual frontend origin
//   "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
//   "Access-Control-Allow-Headers": "Content-Type, Authorization",
// };

export const ACTIONS_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*", // Use "*" or the specific allowed origin
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS", // Allow HTTP methods
  "Access-Control-Allow-Headers": "Content-Type, Authorization", // Allow these headers
};


export const DEFAULT_SOL_AMOUNT: number = 1.0;