import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import type { ReservationStatus } from "../domain";
import { paymentTypes, reservationStatuses } from "../domain";
import { Reservation } from "../models/Reservation";
import { createCustomerMessage } from "../services/messages";
import { buildReservation, getAvailableSlots } from "../services/reservationRules";
import { reservationDto } from "../utils/dto";
import { AppError, asyncHandler } from "../utils/http";

export const reservationsRouter = Router();

const reservationPopulate = [
  { path: "customerId", select: "name phone email" },
  { path: "barberId", select: "name specialization" },
  { path: "serviceId", select: "name price duration" }
];

reservationsRouter.get(
  "/slots",
  asyncHandler(async (req, res) => {
    const { barberId, serviceId, reservationDate } = req.query;
    if (!barberId || !serviceId || !reservationDate) {
      throw new AppError(400, "barberId, serviceId, dan reservationDate wajib diisi.");
    }
    const slots = await getAvailableSlots({
      barberId: String(barberId),
      serviceId: String(serviceId),
      reservationDate: String(reservationDate)
    });
    res.json(slots);
  })
);

reservationsRouter.get(
  "/barber/today",
  authenticate,
  authorize("barber"),
  asyncHandler(async (req, res) => {
    const today = new Date().toISOString().slice(0, 10);
    const reservations = await Reservation.find({ barberId: req.user!.id, reservationDate: today })
      .populate(reservationPopulate)
      .sort({ startTime: 1 });
    res.json(reservations.map(reservationDto));
  })
);

reservationsRouter.get(
  "/barber",
  authenticate,
  authorize("barber"),
  asyncHandler(async (req, res) => {
    const query: Record<string, unknown> = { barberId: req.user!.id };
    if (req.query.date) query.reservationDate = req.query.date;
    const reservations = await Reservation.find(query).populate(reservationPopulate).sort({ reservationDate: -1, startTime: -1 });
    res.json(reservations.map(reservationDto));
  })
);

reservationsRouter.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const query: Record<string, unknown> = {};
    if (req.user?.role === "customer") query.customerId = req.user.id;
    if (req.user?.role === "barber") query.barberId = req.user.id;
    if (req.user?.role === "admin") {
      if (req.query.customerId) query.customerId = req.query.customerId;
      if (req.query.barberId) query.barberId = req.query.barberId;
    }
    if (req.user?.role === "owner") {
      throw new AppError(403, "Owner hanya dapat mengakses dashboard monitoring.");
    }
    if (req.query.status) query.status = req.query.status;

    const reservations = await Reservation.find(query).populate(reservationPopulate).sort({ reservationDate: -1, startTime: -1 });
    res.json(reservations.map(reservationDto));
  })
);

reservationsRouter.post(
  "/",
  authenticate,
  authorize("customer"),
  asyncHandler(async (req, res) => {
    const { paymentType, amount, proofImage } = req.body;
    const paymentAmount = Number(req.body.paymentAmount ?? amount);
    const paymentProof = String(req.body.paymentProof ?? proofImage ?? "").trim();
    if (!paymentType || !paymentTypes.includes(paymentType)) {
      throw new AppError(400, "paymentType wajib dipilih: dp atau full.");
    }
    if (!paymentProof) {
      throw new AppError(400, "Bukti pembayaran wajib diupload.");
    }
    if (!paymentAmount || paymentAmount <= 0) {
      throw new AppError(400, "Nominal pembayaran tidak valid.");
    }

    const reservationInput = await buildReservation({
      customerId: req.user!.id,
      barberId: req.body.barberId,
      serviceId: req.body.serviceId,
      reservationDate: req.body.reservationDate,
      startTime: req.body.startTime
    });

    if (paymentType === "full" && paymentAmount !== reservationInput.totalPrice) {
      throw new AppError(400, `Nominal full harus ${reservationInput.totalPrice}.`);
    }
    if (paymentType === "dp" && paymentAmount >= reservationInput.totalPrice) {
      throw new AppError(400, "Nominal DP harus lebih kecil dari total harga layanan.");
    }

    const reservation = await Reservation.create({
      ...reservationInput,
      paymentType,
      paymentStatus: "pending",
      paymentAmount,
      paymentProof,
      paidAmount: paymentAmount
    });

    res.status(201).json(reservationDto(reservation));
  })
);

reservationsRouter.patch(
  "/:id/cancel",
  authenticate,
  asyncHandler(async (req, res) => {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) throw new AppError(404, "Reservasi tidak ditemukan.");
    if (req.user?.role === "barber") throw new AppError(403, "Barber tidak dapat membatalkan reservasi.");
    if (req.user?.role === "customer" && String(reservation.customerId) !== req.user.id) {
      throw new AppError(403, "Customer hanya dapat membatalkan reservasi sendiri.");
    }
    if (reservation.status === "completed") {
      throw new AppError(400, "Reservasi completed tidak dapat dibatalkan.");
    }

    reservation.status = "cancelled";
    reservation.cancelledBy = req.user!.role === "admin" ? "admin" : "customer";
    reservation.cancellationReason = req.body.reason;
    reservation.cancelAction = req.user!.role === "admin" ? "cancel_only" : "none";
    await reservation.save();
    if (req.user!.role === "admin") {
      await createCustomerMessage({
        customerId: reservation.customerId,
        reservationId: reservation._id,
        senderId: req.user!.id,
        title: "Reservasi dibatalkan",
        message: req.body.reason || "Reservasi Anda dibatalkan oleh admin.",
        messageType: "cancel"
      });
    }
    res.json(reservationDto(reservation));
  })
);

reservationsRouter.patch(
  "/:id/status",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const status = req.body.status as ReservationStatus;
    if (!reservationStatuses.includes(status)) throw new AppError(400, "Status reservasi tidak valid.");

    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) throw new AppError(404, "Reservasi tidak ditemukan.");

    const current = reservation.status;
    const allowed =
      (current === "pending" && status === "confirmed") ||
      (current === "confirmed" && status === "completed" && reservation.barberCompletionRequested) ||
      ((current === "pending" || current === "confirmed") && status === "cancelled");

    if (!allowed) throw new AppError(400, "Transisi status tidak diizinkan.");

    reservation.status = status;
    if (status === "confirmed") {
      reservation.paymentStatus = "approved";
      reservation.paymentReviewedBy = req.user!.id as any;
      reservation.paymentReviewedAt = new Date();
    }
    if (status === "completed") reservation.adminCompletedAt = new Date();
    if (status === "cancelled") {
      reservation.cancelledBy = "admin";
      reservation.cancellationReason = req.body.reason;
      if (reservation.paymentStatus === "pending") {
        reservation.paymentStatus = "rejected";
        reservation.paymentRejectedReason = req.body.reason;
        reservation.paymentReviewedBy = req.user!.id as any;
        reservation.paymentReviewedAt = new Date();
      }
    }
    await reservation.save();
    res.json(reservationDto(reservation));
  })
);

reservationsRouter.patch(
  "/:id/approve",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) throw new AppError(404, "Reservasi tidak ditemukan.");
    if (reservation.status !== "pending" || reservation.paymentStatus !== "pending") {
      throw new AppError(400, "Reservasi hanya bisa di-approve saat status dan pembayaran masih pending.");
    }

    reservation.status = "confirmed";
    reservation.paymentStatus = "approved";
    reservation.paymentReviewedBy = req.user!.id as any;
    reservation.paymentReviewedAt = new Date();
    await reservation.save();

    await createCustomerMessage({
      customerId: reservation.customerId,
      reservationId: reservation._id,
      senderId: req.user!.id,
      title: "Reservasi disetujui",
      message:
        "Bukti pembayaran Anda telah disetujui. Reservasi sudah dikonfirmasi. Catatan: toleransi keterlambatan maksimal 15 menit dari jadwal reservasi.",
      messageType: "payment"
    });

    res.json(reservationDto(reservation));
  })
);

reservationsRouter.patch(
  "/:id/reject",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const reason = String(req.body.reason || "").trim();
    if (!reason) throw new AppError(400, "Alasan reject wajib diisi.");

    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) throw new AppError(404, "Reservasi tidak ditemukan.");
    if (reservation.status !== "pending" || reservation.paymentStatus !== "pending") {
      throw new AppError(400, "Reservasi hanya bisa di-reject saat status dan pembayaran masih pending.");
    }

    reservation.status = "cancelled";
    reservation.paymentStatus = "rejected";
    reservation.paymentRejectedReason = reason;
    reservation.paymentReviewedBy = req.user!.id as any;
    reservation.paymentReviewedAt = new Date();
    reservation.cancelledBy = "admin";
    reservation.cancellationReason = reason;
    reservation.cancelAction = "cancel_only";
    await reservation.save();

    await createCustomerMessage({
      customerId: reservation.customerId,
      reservationId: reservation._id,
      senderId: req.user!.id,
      title: "Reservasi ditolak",
      message: `Bukti pembayaran ditolak. Alasan: ${reason}`,
      messageType: "payment"
    });

    res.json(reservationDto(reservation));
  })
);

reservationsRouter.patch(
  "/:id/admin-cancel",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) throw new AppError(404, "Reservasi tidak ditemukan.");
    if (reservation.status === "completed") throw new AppError(400, "Reservasi completed tidak dapat dibatalkan.");

    const reason = req.body.reason || "Reservasi dibatalkan oleh admin.";
    reservation.status = "cancelled";
    reservation.cancelledBy = "admin";
    reservation.cancellationReason = reason;
    reservation.cancelAction = req.body.cancelAction || "cancel_only";
    reservation.suggestedDate = req.body.suggestedDate;
    reservation.suggestedTime = req.body.suggestedTime;
    reservation.suggestedBarberId = req.body.suggestedBarberId || undefined;
    reservation.refundStatus = req.body.refundStatus || (reservation.cancelAction === "refund_dummy" ? "pending" : "none");
    await reservation.save();

    const title = reservation.cancelAction === "refund_dummy" ? "Reservasi dibatalkan dan refund diproses" : "Reservasi dibatalkan";
    const details = [
      reason,
      reservation.suggestedDate && reservation.suggestedTime
        ? `Saran jadwal baru: ${reservation.suggestedDate} ${reservation.suggestedTime}.`
        : "",
      reservation.suggestedBarberId ? "Admin menyarankan barber pengganti." : "",
      reservation.refundStatus !== "none" ? `Status refund dummy: ${reservation.refundStatus}.` : ""
    ]
      .filter(Boolean)
      .join(" ");

    await createCustomerMessage({
      customerId: reservation.customerId,
      reservationId: reservation._id,
      senderId: req.user!.id,
      title,
      message: details,
      messageType:
        reservation.cancelAction === "reschedule_suggestion"
          ? "reschedule_suggestion"
          : reservation.cancelAction === "change_barber_suggestion"
            ? "change_barber_suggestion"
            : reservation.cancelAction === "refund_dummy"
              ? "refund"
              : "cancel"
    });

    res.json(reservationDto(reservation));
  })
);

reservationsRouter.patch(
  "/:id/no-show",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) throw new AppError(404, "Reservasi tidak ditemukan.");
    if (reservation.status !== "confirmed") throw new AppError(400, "No-show hanya untuk reservasi confirmed.");
    const scheduledAt = new Date(`${reservation.reservationDate}T${reservation.startTime}:00`);
    if (Date.now() < scheduledAt.getTime() + 10 * 60 * 1000) {
      throw new AppError(400, "No-show hanya bisa ditandai setelah 10 menit dari jadwal mulai.");
    }

    reservation.status = "cancelled";
    reservation.isNoShow = true;
    reservation.cancelledBy = "admin";
    reservation.cancellationReason = "Customer tidak hadir lebih dari 10 menit setelah jadwal";
    reservation.cancelAction = "cancel_only";
    await reservation.save();

    await createCustomerMessage({
      customerId: reservation.customerId,
      reservationId: reservation._id,
      senderId: req.user!.id,
      title: "Reservasi ditandai no-show",
      message: reservation.cancellationReason,
      messageType: "no_show"
    });

    res.json(reservationDto(reservation));
  })
);

reservationsRouter.patch(
  "/:id/request-completion",
  authenticate,
  authorize("barber"),
  asyncHandler(async (req, res) => {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) throw new AppError(404, "Reservasi tidak ditemukan.");
    if (String(reservation.barberId) !== req.user!.id) {
      throw new AppError(403, "Barber hanya dapat request reservasi miliknya.");
    }
    if (reservation.status !== "confirmed") {
      throw new AppError(400, "Request completed hanya untuk reservasi confirmed.");
    }

    reservation.barberCompletionRequested = true;
    reservation.barberCompletedAt = new Date();
    reservation.barberCompletionNote = req.body.note;
    await reservation.save();
    res.json(reservationDto(reservation));
  })
);

reservationsRouter.patch(
  "/:id/confirm-completed",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) throw new AppError(404, "Reservasi tidak ditemukan.");
    if (reservation.status !== "confirmed" || !reservation.barberCompletionRequested) {
      throw new AppError(400, "Reservasi belum memiliki request completed dari barber.");
    }

    reservation.status = "completed";
    reservation.adminCompletedAt = new Date();
    await reservation.save();
    res.json(reservationDto(reservation));
  })
);
