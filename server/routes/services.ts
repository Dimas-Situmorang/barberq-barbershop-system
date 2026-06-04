import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { Service } from "../models/Service";
import { serviceDto } from "../utils/dto";
import { AppError, asyncHandler } from "../utils/http";

export const servicesRouter = Router();

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

servicesRouter.get(
  "/",
  requireAdminForFullList,
  asyncHandler(async (req, res) => {
    const activeOnly = req.query.activeOnly === "true";
    const query = activeOnly ? { status: "active" } : {};
    const services = await Service.find(query).sort({ createdAt: -1 });
    res.json(services.map(serviceDto));
  })
);

servicesRouter.post(
  "/",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const { name, description, price, duration, status } = req.body;
    if (!name || price <= 0 || duration <= 0) {
      throw new AppError(400, "Nama, harga, dan durasi layanan tidak valid.");
    }
    const service = await Service.create({ name, description, price, duration, status });
    res.status(201).json(serviceDto(service));
  })
);

servicesRouter.put(
  "/:id",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!service) throw new AppError(404, "Layanan tidak ditemukan.");
    res.json(serviceDto(service));
  })
);

servicesRouter.patch(
  "/:id/deactivate",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const service = await Service.findByIdAndUpdate(req.params.id, { status: "inactive" }, { new: true });
    if (!service) throw new AppError(404, "Layanan tidak ditemukan.");
    res.json(serviceDto(service));
  })
);
