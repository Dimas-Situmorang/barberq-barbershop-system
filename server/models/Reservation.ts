import { Schema, model, models, type InferSchemaType } from "mongoose";
import { cancelActions, paymentStatuses, paymentTypes, refundStatuses, reservationStatuses } from "../domain";

const reservationSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    barberId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    serviceId: { type: Schema.Types.ObjectId, required: true, ref: "Service" },
    reservationDate: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: { type: String, required: true, enum: reservationStatuses, default: "pending" },
    totalPrice: { type: Number, required: true },
    paymentType: { type: String, enum: paymentTypes },
    paymentStatus: { type: String, enum: paymentStatuses },
    paymentAmount: { type: Number },
    paymentProof: { type: String, trim: true },
    paymentRejectedReason: { type: String },
    paymentReviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    paymentReviewedAt: { type: Date },
    paidAmount: { type: Number },
    isNoShow: { type: Boolean, default: false },
    cancelledBy: { type: String, enum: ["customer", "admin"] },
    cancellationReason: { type: String },
    cancelAction: { type: String, enum: cancelActions, default: "none" },
    suggestedDate: { type: String },
    suggestedTime: { type: String },
    suggestedBarberId: { type: Schema.Types.ObjectId, ref: "User" },
    refundStatus: { type: String, enum: refundStatuses, default: "none" },
    barberCompletionRequested: { type: Boolean, default: false },
    barberCompletedAt: { type: Date },
    barberCompletionNote: { type: String },
    adminCompletedAt: { type: Date }
  },
  { timestamps: true }
);

reservationSchema.index({ customerId: 1 });
reservationSchema.index({ barberId: 1 });
reservationSchema.index({ barberId: 1, reservationDate: 1, startTime: 1 });
reservationSchema.index({ status: 1 });
reservationSchema.index({ reservationDate: 1 });

export type ReservationDocument = InferSchemaType<typeof reservationSchema> & { _id: unknown };
export const Reservation = models.Reservation || model("Reservation", reservationSchema);
