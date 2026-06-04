import type { NextFunction, Request, Response } from "express";

export class AppError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function asyncHandler(handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}

export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, `Route tidak ditemukan: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }

  if (error instanceof Error && "code" in error && error.code === 11000) {
    res.status(409).json({ message: "Data unik sudah digunakan." });
    return;
  }

  const message = error instanceof Error ? error.message : "Terjadi kesalahan server.";
  res.status(500).json({ message });
}
