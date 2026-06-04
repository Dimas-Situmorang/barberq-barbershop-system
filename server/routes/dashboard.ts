import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { Reservation } from "../models/Reservation";
import { Service } from "../models/Service";
import { User } from "../models/User";
import { asyncHandler } from "../utils/http";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/admin",
  authenticate,
  authorize("admin"),
  asyncHandler(async (_req, res) => {
    const [
      totalReservations,
      pendingReservations,
      confirmedReservations,
      completedReservations,
      totalCustomers,
      activeBarbers,
      activeServices
    ] = await Promise.all([
      Reservation.countDocuments(),
      Reservation.countDocuments({ status: "pending" }),
      Reservation.countDocuments({ status: "confirmed" }),
      Reservation.countDocuments({ status: "completed" }),
      User.countDocuments({ role: "customer" }),
      User.countDocuments({ role: "barber", status: "active" }),
      Service.countDocuments({ status: "active" })
    ]);

    res.json({
      totalReservations,
      pendingReservations,
      confirmedReservations,
      completedReservations,
      totalCustomers,
      activeBarbers,
      activeServices
    });
  })
);

dashboardRouter.get(
  "/owner",
  authenticate,
  authorize("owner"),
  asyncHandler(async (req, res) => {
    const selectedDate = typeof req.query.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date)
      ? req.query.date
      : new Date().toISOString().slice(0, 10);
    const [
      totalReservations,
      pendingReservations,
      confirmedReservations,
      completedReservations,
      cancelledReservations,
      noShowReservations,
      totalApprovedPayments,
      totalDpPayments,
      totalFullPayments,
      activeBarbers,
      activeServices,
      dailyCashflowRaw,
      dailyReservationStatsRaw,
      cashflowItemsRaw,
      topServicesRaw,
      barberPerformanceRaw
    ] = await Promise.all([
      Reservation.countDocuments(),
      Reservation.countDocuments({ status: "pending" }),
      Reservation.countDocuments({ status: "confirmed" }),
      Reservation.countDocuments({ status: "completed" }),
      Reservation.countDocuments({ status: "cancelled" }),
      Reservation.countDocuments({ isNoShow: true }),
      Reservation.countDocuments({ paymentStatus: "approved" }),
      Reservation.countDocuments({ paymentStatus: "approved", paymentType: "dp" }),
      Reservation.countDocuments({ paymentStatus: "approved", paymentType: "full" }),
      User.countDocuments({ role: "barber", status: "active" }),
      Service.countDocuments({ status: "active" }),
      Reservation.aggregate([
        { $match: { reservationDate: selectedDate, paymentStatus: "approved" } },
        {
          $group: {
            _id: "$paymentType",
            total: { $sum: { $ifNull: ["$paymentAmount", "$paidAmount"] } },
            count: { $sum: 1 }
          }
        }
      ]),
      Reservation.aggregate([
        { $match: { reservationDate: selectedDate } },
        {
          $group: {
            _id: "$status",
            total: { $sum: 1 }
          }
        }
      ]),
      Reservation.aggregate([
        { $match: { reservationDate: selectedDate, paymentStatus: "approved" } },
        { $sort: { startTime: 1 } },
        { $lookup: { from: "users", localField: "customerId", foreignField: "_id", as: "customer" } },
        { $lookup: { from: "users", localField: "barberId", foreignField: "_id", as: "barber" } },
        { $lookup: { from: "services", localField: "serviceId", foreignField: "_id", as: "service" } },
        { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$barber", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$service", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            reservationId: "$_id",
            customerName: "$customer.name",
            barberName: "$barber.name",
            serviceName: "$service.name",
            startTime: 1,
            paymentType: 1,
            paymentAmount: { $ifNull: ["$paymentAmount", "$paidAmount"] },
            status: 1,
            _id: 0
          }
        }
      ]),
      Reservation.aggregate([
        { $group: { _id: "$serviceId", total: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 5 },
        { $lookup: { from: "services", localField: "_id", foreignField: "_id", as: "service" } },
        { $unwind: "$service" },
        { $project: { serviceId: "$_id", serviceName: "$service.name", total: 1, _id: 0 } }
      ]),
      Reservation.aggregate([
        {
          $group: {
            _id: "$barberId",
            completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
            noShow: { $sum: { $cond: ["$isNoShow", 1, 0] } }
          }
        },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "barber" } },
        { $unwind: "$barber" },
        {
          $project: {
            barberId: "$_id",
            barberName: "$barber.name",
            completed: 1,
            cancelled: 1,
            noShow: 1,
            _id: 0
          }
        }
      ])
    ]);

    const dpCashflow = dailyCashflowRaw.find((item) => item._id === "dp")?.total ?? 0;
    const fullCashflow = dailyCashflowRaw.find((item) => item._id === "full")?.total ?? 0;
    const dailyStats = Object.fromEntries(dailyReservationStatsRaw.map((item) => [item._id, item.total]));

    res.json({
      selectedDate,
      totalReservations,
      pendingReservations,
      confirmedReservations,
      completedReservations,
      cancelledReservations,
      noShowReservations,
      totalApprovedPayments,
      totalDpPayments,
      totalFullPayments,
      dailyCashflow: dpCashflow + fullCashflow,
      dailyDpCashflow: dpCashflow,
      dailyFullCashflow: fullCashflow,
      dailyReservationCount: dailyReservationStatsRaw.reduce((sum, item) => sum + item.total, 0),
      dailyPendingReservations: dailyStats.pending ?? 0,
      dailyConfirmedReservations: dailyStats.confirmed ?? 0,
      dailyCompletedReservations: dailyStats.completed ?? 0,
      dailyCancelledReservations: dailyStats.cancelled ?? 0,
      cashflowItems: cashflowItemsRaw.map((item) => ({
        ...item,
        reservationId: String(item.reservationId)
      })),
      activeBarbers,
      activeServices,
      topServices: topServicesRaw.map((item) => ({
        ...item,
        serviceId: String(item.serviceId)
      })),
      barberPerformance: barberPerformanceRaw.map((item) => ({
        ...item,
        barberId: String(item.barberId)
      }))
    });
  })
);
