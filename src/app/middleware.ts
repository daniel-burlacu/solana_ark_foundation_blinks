import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*", // Change "*" to specific origins if needed
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS", // Add other HTTP methods as necessary
    "Access-Control-Allow-Headers": "Content-Type, Authorization", // Add headers as needed
};

export function middleware(req: NextRequest) {
    // Handle preflight requests (OPTIONS)
    if (req.method === "OPTIONS") {
        return new NextResponse(null, { headers: corsHeaders });
    }

    // Add CORS headers to all other requests
    const response = NextResponse.next();
    Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
    });

    return response;
}

// Apply middleware only for API routes (or the entire app if needed)
export const config = {
    matcher: "/api/:path*", // Adjust if you want to restrict to specific routes
};
