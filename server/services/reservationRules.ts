import { Types } from "mongoose";
import { Reservation } from "../models/Reservation";
import { Schedule } from "../models/Schedule";
import { Service } from "../models/Service";
import { User } from "../models/User";
import { AppError } from "../utils/http";
import { addMinutes, fromMinutes, getWorkDay, hasOverlap, toMinutes } from "../utils/time";

export async function getAvailableSlots(input: {
  barberId: string;
  serviceId: string;
  reservationDate: string;
}) {
  const [service, barber, schedule] = await Promise.all([
    Service.findOne({ _id: input.serviceId, status: "active" }),
    User.findOne({ _id: input.barberId, role: "barber", status: "active" }),
    Schedule.findOne({ barberId: input.barberId, status: "available" })
  ]);

  if (!service || !barber || !schedule || !schedule.workDays.includes(getWorkDay(input.reservationDate))) {
    return [];
  }

  const reservations = await Reservation.find({
    barberId: input.barberId,
    reservationDate: input.reservationDate,
    status: { $in: ["pending", "confirmed"] }
  });

  const slots: string[] = [];
  const endBoundary = toMinutes(schedule.endTime) - service.duration;
  for (let candidate = toMinutes(schedule.startTime); candidate <= endBoundary; candidate += 30) {
    const startTime = fromMinutes(candidate);
    const endTime = addMinutes(startTime, service.duration);
    const blocked = reservations.some((reservation) =>
      hasOverlap(reservation.startTime, reservation.endTime, startTime, endTime)
    );
    if (!blocked) {
      slots.push(startTime);
    }
  }
  return slots;
}

export async function buildReservation(input: {
  customerId: string;
  barberId: string;
  serviceId: string;
  reservationDate: string;
  startTime: string;
}) {
  if (!Types.ObjectId.isValid(input.barberId) || !Types.ObjectId.isValid(input.serviceId)) {
    throw new AppError(400, "ID barber atau layanan tidak valid.");
  }

  const [customer, barber, service, schedule] = await Promise.all([
    User.findOne({ _id: input.customerId, role: "customer", status: "active" }),
    User.findOne({ _id: input.barberId, role: "barber", status: "active" }),
    Service.findOne({ _id: input.serviceId, status: "active" }),
    Schedule.findOne({ barberId: input.barberId, status: "available" })
  ]);

  if (!customer) throw new AppError(404, "Customer tidak ditemukan.");
  if (!barber) throw new AppError(404, "Barber aktif tidak ditemukan.");
  if (!service) throw new AppError(404, "Layanan aktif tidak ditemukan.");
  if (!schedule) throw new AppError(400, "Jadwal barber tidak tersedia.");
  if (!schedule.workDays.includes(getWorkDay(input.reservationDate))) {
    throw new AppError(400, "Tanggal tidak sesuai hari kerja barber.");
  }
  if (toMinutes(input.startTime) < toMinutes(schedule.startTime)) {
    throw new AppError(400, "Jam mulai di luar jam kerja barber.");
  }

  const endTime = addMinutes(input.startTime, service.duration);
  if (toMinutes(endTime) > toMinutes(schedule.endTime)) {
    throw new AppError(400, "Jam selesai di luar jam kerja barber.");
  }

  const conflict = await Reservation.findOne({
    barberId: input.barberId,
    reservationDate: input.reservationDate,
    status: { $in: ["pending", "confirmed"] },
    startTime: { $lt: endTime },
    endTime: { $gt: input.startTime }
  });

  if (conflict) {
    throw new AppError(409, "Slot sudah terisi. Pilih jam lain.");
  }

  return {
    customerId: input.customerId,
    barberId: input.barberId,
    serviceId: input.serviceId,
    reservationDate: input.reservationDate,
    startTime: input.startTime,
    endTime,
    status: "pending",
    totalPrice: service.price
  };
}
