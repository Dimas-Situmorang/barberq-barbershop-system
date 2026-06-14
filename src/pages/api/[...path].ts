import type { NextApiRequest, NextApiResponse } from "next";
import { createApp } from "../../../server/app";
import { connectDB } from "../../../server/config/db";

const app = createApp();
let connectionPromise: Promise<void> | null = null;

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  connectionPromise ??= connectDB();
  await connectionPromise;

  return app(req, res);
}
