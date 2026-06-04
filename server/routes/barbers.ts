import bcrypt from "bcrypt";
import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { User } from "../models/User";
import { userDto } from "../utils/dto";
import { AppError, asyncHandler } from "../utils/http";

export const barbersRouter = Router();

function requireAdminForFullList(req: Request, res: Response, next: NextFunction) {
  if (req.query.activeOnly === "true") {
    next();
    return;
  }
  void authenticate(req, res, (authError) => {
    if (authError) {
      next(authError);
      return;
    }
    authorize("admin")(req, res, next);
  });
}

barbersRouter.get(
  "/",
  requireAdminForFullList,
  asyncHandler(async (req, res) => {
    const activeOnly = req.query.activeOnly === "true";
    const query = activeOnly ? { role: "barber", status: "active" } : { role: "barber" };
    const barbers = await User.find(query).sort({ createdAt: -1 });
    res.json(barbers.map(userDto));
  })
);

barbersRouter.post(
  "/",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const { name, email, phone, password, specialization, status } = req.body;
    if (!name || !email) throw new AppError(400, "Nama dan email barber wajib diisi.");
    const hashedPassword = await bcrypt.hash(password || "password123", 10);
    const barber = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      specialization,
      status,
      role: "barber"
    });
    res.status(201).json(userDto(barber));
  })
);

barbersRouter.put(
  "/:id",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const { name, email, phone, password, specialization, status } = req.body;
    const update: Record<string, unknown> = { name, email, phone, specialization, status };
    if (password) update.password = await bcrypt.hash(password, 10);

    const barber = await User.findOneAndUpdate({ _id: req.params.id, role: "barber" }, update, {
      new: true,
      runValidators: true
    });
    if (!barber) throw new AppError(404, "Barber tidak ditemukan.");
    res.json(userDto(barber));
  })
);

barbersRouter.patch(
  "/:id/deactivate",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const barber = await User.findOneAndUpdate(
      { _id: req.params.id, role: "barber" },
      { status: "inactive" },
      { new: true }
    );
    if (!barber) throw new AppError(404, "Barber tidak ditemukan.");
    res.json(userDto(barber));
  })
);
