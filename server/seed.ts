import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { connectDB } from "./config/db";
import { Message } from "./models/Message";
import { Reservation } from "./models/Reservation";
import { Schedule } from "./models/Schedule";
import { Service } from "./models/Service";
import { User } from "./models/User";

async function upsertUser(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "customer" | "barber" | "admin" | "owner";
  specialization?: string;
}) {
  const hashedPassword = await bcrypt.hash(input.password, 10);
  return User.findOneAndUpdate(
    { email: input.email },
    {
      name: input.name,
      email: input.email,
      phone: input.phone,
      password: hashedPassword,
      role: input.role,
      status: "active",
      specialization: input.specialization
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
}

async function upsertService(input: {
  name: string;
  description: string;
  price: number;
  duration: number;
}) {
  return Service.findOneAndUpdate(
    { name: input.name },
    { ...input, status: "active" },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
}

async function main() {
  await connectDB();

  const [admin, owner, customer, rio, bima] = await Promise.all([
    upsertUser({
      name: "Admin BarberQ",
      email: "admin@barberq.com",
      phone: "081111222333",
      password: "admin123",
      role: "admin"
    }),
    upsertUser({
      name: "Owner BarberQ",
      email: "owner@barberq.com",
      phone: "081111222444",
      password: "owner123",
      role: "owner"
    }),
    upsertUser({
      name: "Customer BarberQ",
      email: "customer@barberq.com",
      phone: "081234567890",
      password: "customer123",
      role: "customer"
    }),
    upsertUser({
      name: "Rio Pratama",
      email: "rio@barberq.com",
      phone: "081298765432",
      password: "barber123",
      role: "barber",
      specialization: "Haircut & Styling"
    }),
    upsertUser({
      name: "Bima Santoso",
      email: "bima@barberq.com",
      phone: "081288899900",
      password: "barber123",
      role: "barber",
      specialization: "Shaving & Coloring"
    })
  ]);

  const [haircut, wash, shaving, coloring] = await Promise.all([
    upsertService({
      name: "Haircut",
      description: "Potong rambut standar dengan finishing rapi.",
      price: 35000,
      duration: 30
    }),
    upsertService({
      name: "Haircut + Wash",
      description: "Potong rambut, cuci, dan blow ringan.",
      price: 50000,
      duration: 45
    }),
    upsertService({
      name: "Shaving",
      description: "Rapikan kumis dan janggut dengan handuk hangat.",
      price: 30000,
      duration: 30
    }),
    upsertService({
      name: "Hair Coloring",
      description: "Pewarnaan rambut dasar untuk tampilan baru.",
      price: 150000,
      duration: 90
    })
  ]);

  await Promise.all([
    Schedule.findOneAndUpdate(
      { barberId: rio._id },
      {
        barberId: rio._id,
        workDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
        startTime: "10:00",
        endTime: "21:00",
        status: "available"
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ),
    Schedule.findOneAndUpdate(
      { barberId: bima._id },
      {
        barberId: bima._id,
        workDays: ["tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
        startTime: "11:00",
        endTime: "20:00",
        status: "available"
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    )
  ]);

  await Promise.all([Reservation.deleteMany({}), Message.deleteMany({})]);
  const [confirmedReservation, , , noShowReservation] = await Reservation.create([
    {
      customerId: customer._id,
      barberId: rio._id,
      serviceId: haircut._id,
      reservationDate: "2026-06-04",
      startTime: "14:00",
      endTime: "14:30",
      status: "confirmed",
      totalPrice: haircut.price,
      paymentType: "full",
      paymentStatus: "approved",
      paymentAmount: haircut.price,
      paymentProof: "proof-full-confirmed.jpg",
      paymentReviewedBy: admin._id,
      paymentReviewedAt: new Date(),
      paidAmount: haircut.price
    },
    {
      customerId: customer._id,
      barberId: bima._id,
      serviceId: wash._id,
      reservationDate: "2026-06-06",
      startTime: "13:00",
      endTime: "13:45",
      status: "pending",
      totalPrice: wash.price,
      paymentType: "dp",
      paymentStatus: "pending",
      paymentAmount: Math.round(wash.price * 0.5),
      paymentProof: "proof-dp-pending.jpg",
      paidAmount: Math.round(wash.price * 0.5)
    },
    {
      customerId: customer._id,
      barberId: rio._id,
      serviceId: shaving._id,
      reservationDate: "2026-06-07",
      startTime: "16:00",
      endTime: "16:30",
      status: "completed",
      totalPrice: shaving.price,
      paymentType: "full",
      paymentStatus: "approved",
      paymentAmount: shaving.price,
      paymentProof: "proof-full-completed.jpg",
      paymentReviewedBy: admin._id,
      paymentReviewedAt: new Date(),
      paidAmount: shaving.price,
      barberCompletionRequested: true,
      barberCompletedAt: new Date("2026-06-07T09:35:00.000Z"),
      barberCompletionNote: "Layanan sudah selesai.",
      adminCompletedAt: new Date("2026-06-07T09:40:00.000Z")
    },
    {
      customerId: customer._id,
      barberId: bima._id,
      serviceId: coloring._id,
      reservationDate: "2026-06-03",
      startTime: "15:00",
      endTime: "16:30",
      status: "cancelled",
      totalPrice: coloring.price,
      paymentType: "dp",
      paymentStatus: "approved",
      paymentAmount: Math.round(coloring.price * 0.5),
      paymentProof: "proof-dp-noshow.jpg",
      paymentReviewedBy: admin._id,
      paymentReviewedAt: new Date(),
      paidAmount: Math.round(coloring.price * 0.5),
      isNoShow: true,
      cancelledBy: "admin",
      cancellationReason: "Customer tidak hadir lebih dari 10 menit setelah jadwal",
      cancelAction: "cancel_only"
    }
  ]);

  await Message.create([
    {
      customerId: customer._id,
      reservationId: confirmedReservation._id,
      senderId: admin._id,
      title: "Pembayaran disetujui",
      message: "Pembayaran full Anda telah disetujui. Reservasi sudah dikonfirmasi.",
      messageType: "payment",
      isRead: false
    },
    {
      customerId: customer._id,
      reservationId: noShowReservation._id,
      senderId: admin._id,
      title: "Reservasi no-show",
      message: "Reservasi Anda dibatalkan karena Anda tidak hadir 10 menit setelah jadwal.",
      messageType: "no_show",
      isRead: false
    }
  ]);

  console.log(
    `Seed complete. Admin: ${admin.email}, Owner: ${owner.email}, Customer: ${customer.email}. Services: ${
      [haircut, wash, shaving, coloring].length
    }`
  );
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
