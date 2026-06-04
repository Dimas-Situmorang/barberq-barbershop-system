import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { Message } from "../models/Message";
import { User } from "../models/User";
import { messageDto } from "../utils/dto";
import { AppError, asyncHandler } from "../utils/http";

export const messagesRouter = Router();

messagesRouter.get(
  "/my",
  authenticate,
  authorize("customer"),
  asyncHandler(async (req, res) => {
    const messages = await Message.find({ customerId: req.user!.id }).sort({ createdAt: -1 });
    res.json(messages.map(messageDto));
  })
);

messagesRouter.get(
  "/:id",
  authenticate,
  authorize("customer"),
  asyncHandler(async (req, res) => {
    const message = await Message.findById(req.params.id);
    if (!message || String(message.customerId) !== req.user!.id) {
      throw new AppError(404, "Pesan tidak ditemukan.");
    }
    res.json(messageDto(message));
  })
);

messagesRouter.patch(
  "/:id/read",
  authenticate,
  authorize("customer"),
  asyncHandler(async (req, res) => {
    const message = await Message.findById(req.params.id);
    if (!message || String(message.customerId) !== req.user!.id) {
      throw new AppError(404, "Pesan tidak ditemukan.");
    }
    message.isRead = true;
    await message.save();
    res.json(messageDto(message));
  })
);

messagesRouter.post(
  "/",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const { customerId, reservationId, title, message, messageType } = req.body;
    const customer = await User.findOne({ _id: customerId, role: "customer" });
    if (!customer) throw new AppError(404, "Customer tidak ditemukan.");
    if (!title || !message) throw new AppError(400, "Judul dan isi pesan wajib diisi.");

    const created = await Message.create({
      customerId,
      reservationId,
      senderId: req.user!.id,
      title,
      message,
      messageType: messageType || "general",
      isRead: false
    });

    res.status(201).json(messageDto(created));
  })
);
