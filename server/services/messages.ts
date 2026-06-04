import type { MessageType } from "../domain";
import { Message } from "../models/Message";

export async function createCustomerMessage(input: {
  customerId: unknown;
  reservationId?: unknown;
  senderId?: unknown;
  title: string;
  message: string;
  messageType: MessageType;
}) {
  return Message.create({
    customerId: input.customerId,
    reservationId: input.reservationId,
    senderId: input.senderId,
    title: input.title,
    message: input.message,
    messageType: input.messageType,
    isRead: false
  });
}
