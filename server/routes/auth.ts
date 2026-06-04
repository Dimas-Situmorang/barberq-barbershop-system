import bcrypt from "bcrypt";
import { Router } from "express";
import { authenticate, signToken } from "../middleware/auth";
import { User } from "../models/User";
import { userDto } from "../utils/dto";
import { AppError, asyncHandler } from "../utils/http";

export const authRouter = Router();

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      throw new AppError(400, "Nama, email, dan password wajib diisi.");
    }

    const existing = await User.findOne({ email });
    if (existing) {
      throw new AppError(409, "Email sudah digunakan.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: "customer",
      status: "active"
    });

    res.status(201).json({ token: signToken(user), user: userDto(user) });
  })
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new AppError(400, "Email dan password wajib diisi.");
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AppError(401, "Email atau password tidak sesuai.");
    }
    if (user.status !== "active") {
      throw new AppError(403, "Akun sedang tidak aktif.");
    }

    res.json({ token: signToken(user), user: userDto(user) });
  })
);

authRouter.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?.id);
    if (!user) {
      throw new AppError(404, "User tidak ditemukan.");
    }
    res.json({ user: userDto(user) });
  })
);
