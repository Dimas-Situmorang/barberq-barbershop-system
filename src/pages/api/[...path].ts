import type { NextApiRequest, NextApiResponse } from "next";
import { createApp } from "../../../server/app";
import { connectDB } from "../../../server/config/db";

const app = createApp();

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.url?.startsWith("/api/health")) {
    return app(req, res);
  }

  try {
    await connectDB();
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown database error";
    res.status(500).json({
      message: "Koneksi database gagal. Periksa MONGODB_URI dan Network Access MongoDB Atlas.",
      detail
    });
    return;
  }

  return app(req, res);
}
