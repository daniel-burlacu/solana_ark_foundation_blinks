import { NextRequest, NextResponse } from "next/server";

export const ACTIONS_CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "X-Action-Version": "1",
    "X-Blockchain-Ids":"solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1", //mainnet - solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp 
    "chainId":"devnet"
   // "X-Blockchain-Ids": `solana:${CLUSTER}`, // Dynamically set based on the cluster
  };

  export const GET = () => {
    const payload = {
      "rules": [
      {
        "pathPattern": "/*",
        "apiPath": "/api/actions/*"
      },
      {
        "pathPattern": "/api/actions/**",
        "apiPath": "/api/actions/**"
      }
    ]
    };

    return new Response(JSON.stringify(payload), {
        headers: {
            ...ACTIONS_CORS_HEADERS,
            "Content-Type": "application/json", // Correct Content-Type
        },
    });
};

// DO NOT FORGET TO INCLUDE THE `OPTIONS` HTTP METHOD
// THIS WILL ENSURE CORS WORKS FOR BLINKS
// Handle OPTIONS requests for preflight
export const OPTIONS = () => {
  return new NextResponse(null, {
    status: 204,
    headers: ACTIONS_CORS_HEADERS,
  });
};