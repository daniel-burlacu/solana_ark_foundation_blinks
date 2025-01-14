import {  ActionsJson } from "@solana/actions";
import { NextRequest, NextResponse } from "next/server";

const ACTIONS_CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "X-Action-Version": "1",
    "X-Blockchain-Ids":"solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1", //mainnet - solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp 
    "chainId":"devnet"
   // "X-Blockchain-Ids": `solana:${CLUSTER}`, // Dynamically set based on the cluster
  };

export const GET = async () => {
  const payload: ActionsJson = {
    rules: [
      // map all root level routes to an action
      {
        pathPattern: "/*",
        apiPath: "/api/actions/*",
      },
      // idempotent rule as the fallback
      {
        pathPattern: "/api/actions/**",
        apiPath: "/api/actions/**",
      },
    ],
  };

  return Response.json(payload, {
    headers: ACTIONS_CORS_HEADERS,
  });
};

// DO NOT FORGET TO INCLUDE THE `OPTIONS` HTTP METHOD
// THIS WILL ENSURE CORS WORKS FOR BLINKS
export const OPTIONS = GET;

export const POST = async (req: NextRequest) => {
  try {
    // Your POST logic here
    const body = await req.json();
    return new NextResponse(JSON.stringify({ message: "Success", body }), {
      headers: ACTIONS_CORS_HEADERS,
    });
  } catch (error) {
    console.error("Error in POST handler:", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: ACTIONS_CORS_HEADERS,
    });
  }
};