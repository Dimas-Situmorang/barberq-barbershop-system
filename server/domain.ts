export const roles = ["customer", "barber", "admin", "owner"] as const;
export const accountStatuses = ["active", "inactive"] as const;
export const serviceStatuses = ["active", "inactive"] as const;
export const scheduleStatuses = ["available", "unavailable"] as const;
export const reservationStatuses = ["pending", "confirmed", "completed", "cancelled"] as const;
export const paymentTypes = ["dp", "full"] as const;
export const paymentStatuses = ["pending", "approved", "rejected"] as const;
export const cancelActions = [
  "none",
  "cancel_only",
  "reschedule_suggestion",
  "change_barber_suggestion",
  "refund_dummy"
] as const;
export const refundStatuses = ["none", "pending", "processed"] as const;
export const messageTypes = [
  "reservation",
  "payment",
  "cancel",
  "reschedule_suggestion",
  "change_barber_suggestion",
  "refund",
  "no_show",
  "general"
] as const;
export const workDays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
] as const;

export type Role = (typeof roles)[number];
export type ReservationStatus = (typeof reservationStatuses)[number];
export type PaymentType = (typeof paymentTypes)[number];
export type PaymentStatus = (typeof paymentStatuses)[number];
export type CancelAction = (typeof cancelActions)[number];
export type RefundStatus = (typeof refundStatuses)[number];
export type MessageType = (typeof messageTypes)[number];
export type WorkDay = (typeof workDays)[number];
