import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { Schedule } from "../models/Schedule";
import { User } from "../models/User";
import { scheduleDto } from "../utils/dto";
import { AppError, asyncHandler } from "../utils/http";
import { toMinutes } from "../utils/time";

export const schedulesRouter = Router();

schedulesRouter.get(
  "/",
  authenticate,
  authorize("admin"),
  asyncHandler(async (_req, res) => {
    const schedules = await Schedule.find().sort({ createdAt: -1 });
    res.json(schedules.map(scheduleDto));
  })
);

schedulesRouter.put(
  "/",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const { barberId, workDays, startTime, endTime, status } = req.body;
    const barber = await User.findOne({ _id: barberId, role: "barber" });
    if (!barber) throw new AppError(404, "Barber tidak ditemukan.");
    if (!Array.isArray(workDays) || workDays.length === 0) {
      throw new AppError(400, "Pilih minimal satu hari kerja.");
    }
    if (toMinutes(startTime) >= toMinutes(endTime)) {
      throw new AppError(400, "Jam mulai harus lebih awal dari jam selesai.");
    }

    const schedule = await Schedule.findOneAndUpdate(
      { barberId },
      { barberId, workDays, startTime, endTime, status },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json(scheduleDto(schedule));
  })
);
