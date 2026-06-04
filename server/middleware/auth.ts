import type { NextFunction, Request, Response } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { Role } from "../domain";
import { env } from "../config/env";
import { User } from "../models/User";
import { AppError } from "../utils/http";

interface JwtPayload {
  sub: string;
  role: Role;
}

export function signToken(user: { _id: unknown; role: Role }) {
  const options: SignOptions = { expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"] };
  return jwt.sign({ sub: String(user._id), role: user.role }, env.jwtSecret, {
    ...options
  });
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new AppError(401, "Token tidak ditemukan.");
    }

    const token = header.slice("Bearer ".length);
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    const user = await User.findById(payload.sub);
    if (!user || user.status !== "active") {
      throw new AppError(401, "Akun tidak aktif atau tidak ditemukan.");
    }

    req.user = { id: String(user._id), role: user.role };
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError(401, "Token tidak valid."));
  }
}

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new AppError(401, "Login diperlukan."));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new AppError(403, "Akses role tidak diizinkan."));
      return;
    }
    next();
  };
}
