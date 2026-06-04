import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { User } from "../models/User";
import { userDto } from "../utils/dto";
import { asyncHandler } from "../utils/http";

export const usersRouter = Router();

usersRouter.get(
  "/customers",
  authenticate,
  authorize("admin"),
  asyncHandler(async (_req, res) => {
    const customers = await User.find({ role: "customer" }).sort({ createdAt: -1 });
    res.json(customers.map(userDto));
  })
);
