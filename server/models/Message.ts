import { Schema, model, models, type InferSchemaType } from "mongoose";
import { messageTypes } from "../domain";

const messageSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    reservationId: { type: Schema.Types.ObjectId, ref: "Reservation" },
    senderId: { type: Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    messageType: { type: String, required: true, enum: messageTypes, default: "general" },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

messageSchema.index({ customerId: 1 });
messageSchema.index({ reservationId: 1 });
messageSchema.index({ isRead: 1 });
messageSchema.index({ createdAt: -1 });

export type MessageDocument = InferSchemaType<typeof messageSchema> & { _id: unknown };
export const Message = models.Message || model("Message", messageSchema);
