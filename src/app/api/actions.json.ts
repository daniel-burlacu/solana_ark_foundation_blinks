// /pages/api/actions.json.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "https://dial.to");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle OPTIONS preflight request
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Return actions JSON
  res.status(200).json({
    actions: [
      { type: "mint", url: "/api/actions?action=mint" },
      { type: "send", url: "/api/actions?action=send" },
    ],
  });
}
