export type Role = "customer" | "barber" | "admin" | "owner";
export type AccountStatus = "active" | "inactive";
export type ServiceStatus = "active" | "inactive";
export type ScheduleStatus = "available" | "unavailable";
export type ReservationStatus = "pending" | "confirmed" | "completed" | "cancelled";
export type CancelledBy = "customer" | "admin";
export type PaymentType = "dp" | "full";
export type PaymentStatus = "pending" | "approved" | "rejected";
export type CancelAction =
  | "none"
  | "cancel_only"
  | "reschedule_suggestion"
  | "change_barber_suggestion"
  | "refund_dummy";
export type RefundStatus = "none" | "pending" | "processed";
export type MessageType =
  | "reservation"
  | "payment"
  | "cancel"
  | "reschedule_suggestion"
  | "change_barber_suggestion"
  | "refund"
  | "no_show"
  | "general";
export type WorkDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  status: AccountStatus;
  specialization?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  status: ServiceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  id: string;
  barberId: string;
  workDays: WorkDay[];
  startTime: string;
  endTime: string;
  status: ScheduleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Reservation {
  id: string;
  customerId: string;
  barberId: string;
  serviceId: string;
  customerName?: string;
  customerPhone?: string;
  barberName?: string;
  serviceName?: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  totalPrice: number;
  paymentType?: PaymentType;
  paymentStatus?: PaymentStatus;
  paymentAmount?: number;
  paymentProof?: string;
  paymentRejectedReason?: string;
  paymentReviewedBy?: string;
  paymentReviewedAt?: string;
  paidAmount?: number;
  isNoShow?: boolean;
  cancelledBy?: CancelledBy;
  cancellationReason?: string;
  cancelAction?: CancelAction;
  suggestedDate?: string;
  suggestedTime?: string;
  suggestedBarberId?: string;
  refundStatus?: RefundStatus;
  barberCompletionRequested?: boolean;
  barberCompletedAt?: string;
  barberCompletionNote?: string;
  adminCompletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  customerId: string;
  reservationId?: string;
  senderId?: string;
  title: string;
  message: string;
  messageType: MessageType;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  token: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface ServicePayload {
  name: string;
  description?: string;
  price: number;
  duration: number;
  status: ServiceStatus;
}

export interface BarberPayload {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  specialization?: string;
  status: AccountStatus;
}

export interface SchedulePayload {
  barberId: string;
  workDays: WorkDay[];
  startTime: string;
  endTime: string;
  status: ScheduleStatus;
}

export interface ReservationPayload {
  customerId: string;
  barberId: string;
  serviceId: string;
  reservationDate: string;
  startTime: string;
  paymentType?: PaymentType;
  amount?: number;
  proofImage?: string;
  paymentAmount?: number;
  paymentProof?: string;
}

export interface AdminCancelPayload {
  reason: string;
  cancelAction: CancelAction;
  suggestedDate?: string;
  suggestedTime?: string;
  suggestedBarberId?: string;
  refundStatus?: RefundStatus;
}

export interface CompletionPayload {
  note?: string;
}

export interface MessagePayload {
  customerId: string;
  reservationId?: string;
  title: string;
  message: string;
  messageType: MessageType;
}

export interface ReservationFilters {
  customerId?: string;
  barberId?: string;
  status?: ReservationStatus;
}

export interface OwnerDashboardSummary {
  selectedDate: string;
  totalReservations: number;
  pendingReservations: number;
  confirmedReservations: number;
  completedReservations: number;
  cancelledReservations: number;
  noShowReservations: number;
  totalApprovedPayments: number;
  totalDpPayments: number;
  totalFullPayments: number;
  dailyCashflow: number;
  dailyDpCashflow: number;
  dailyFullCashflow: number;
  dailyReservationCount: number;
  dailyPendingReservations: number;
  dailyConfirmedReservations: number;
  dailyCompletedReservations: number;
  dailyCancelledReservations: number;
  activeBarbers: number;
  activeServices: number;
  cashflowItems: Array<{
    reservationId: string;
    customerName?: string;
    barberName?: string;
    serviceName?: string;
    startTime: string;
    paymentType: PaymentType;
    paymentAmount: number;
    status: ReservationStatus;
  }>;
  topServices: Array<{ serviceId: string; serviceName: string; total: number }>;
  barberPerformance: Array<{ barberId: string; barberName: string; completed: number; cancelled: number; noShow: number }>;
}
