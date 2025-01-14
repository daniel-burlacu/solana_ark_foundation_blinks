import {  ActionsJson } from "@solana/actions";
import { NextRequest, NextResponse } from "next/server";
 import { ACTIONS_CORS_HEADERS } from "../api/actions/const";
//import {  ACTIONS_CORS_HEADERS } from "@solana/actions";
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

  return new NextResponse(JSON.stringify({ message: "Success", payload }), {
    headers: ACTIONS_CORS_HEADERS,
  });
};

// Handle OPTIONS requests for preflight
export const OPTIONS = () => {
  return new NextResponse(null, {
      status: 204,
      headers: ACTIONS_CORS_HEADERS,
  });
};

export const POST = async (req: NextRequest) => {
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

  return new NextResponse(JSON.stringify({ message: "Success", payload }), {
    headers: ACTIONS_CORS_HEADERS,
  });
};