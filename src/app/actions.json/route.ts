import { NextRequest, NextResponse } from "next/server";

// Define CORS headers inside the file, but do not export them
const ACTIONS_CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "X-Action-Version": "1",
    "X-Blockchain-Ids": "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
    "chainId": "devnet",
};

// Handle GET requests
export const GET = () => {
    const payload = {
        rules: [
            { pathPattern: "/*", apiPath: "/api/actions/*" },
            { pathPattern: "/api/actions/**", apiPath: "/api/actions/**" },
        ],
    };

    return new Response(JSON.stringify(payload), {
        headers: {
            ...ACTIONS_CORS_HEADERS,
            "Content-Type": "application/json", // Correct Content-Type for JSON
        },
    });
};

// Handle OPTIONS requests for preflight
export const OPTIONS = () => {
    return new NextResponse(null, {
        status: 204,
        headers: ACTIONS_CORS_HEADERS,
    });
};

// Add a POST handler if needed
export const POST = async (req: NextRequest) => {
    const body = await req.json();
    // Add logic for POST request handling
    return new Response(JSON.stringify({ message: "Post received", body }), {
        headers: ACTIONS_CORS_HEADERS,
    });
};