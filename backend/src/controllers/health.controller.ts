import type { Request, Response } from "express";
import { env } from "../config/env";

export function getHealth(_req: Request, res: Response) {
  res.status(200).json({
    status: "ok",
    app: "CLZLY",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}
