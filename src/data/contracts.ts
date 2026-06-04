import type {
  AuthSession,
  AdminCancelPayload,
  BarberPayload,
  CompletionPayload,
  LoginPayload,
  Message,
  MessagePayload,
  OwnerDashboardSummary,
  RegisterPayload,
  Reservation,
  ReservationFilters,
  ReservationPayload,
  ReservationStatus,
  Schedule,
  SchedulePayload,
  Service,
  ServicePayload,
  User
} from "./models";

export interface DataAdapter {
  getSession(): Promise<AuthSession | null>;
  login(payload: LoginPayload): Promise<AuthSession>;
  register(payload: RegisterPayload): Promise<AuthSession>;
  logout(): Promise<void>;

  listServices(options?: { activeOnly?: boolean }): Promise<Service[]>;
  createService(payload: ServicePayload): Promise<Service>;
  updateService(id: string, payload: ServicePayload): Promise<Service>;
  deactivateService(id: string): Promise<Service>;

  listBarbers(options?: { activeOnly?: boolean }): Promise<User[]>;
  listCustomers(): Promise<User[]>;
  createBarber(payload: BarberPayload): Promise<User>;
  updateBarber(id: string, payload: BarberPayload): Promise<User>;
  deactivateBarber(id: string): Promise<User>;

  listSchedules(): Promise<Schedule[]>;
  upsertSchedule(payload: SchedulePayload): Promise<Schedule>;

  listReservations(filters?: ReservationFilters): Promise<Reservation[]>;
  createReservation(payload: ReservationPayload): Promise<Reservation>;
  cancelReservation(id: string, by: "customer" | "admin", reason?: string): Promise<Reservation>;
  updateReservationStatus(id: string, status: ReservationStatus): Promise<Reservation>;
  approveReservation(id: string): Promise<Reservation>;
  rejectReservation(id: string, reason: string): Promise<Reservation>;
  getAvailableSlots(input: {
    barberId: string;
    serviceId: string;
    reservationDate: string;
  }): Promise<string[]>;

  listMyMessages(): Promise<Message[]>;
  getMessage(id: string): Promise<Message>;
  markMessageRead(id: string): Promise<Message>;
  sendMessage(payload: MessagePayload): Promise<Message>;
  adminCancelReservation(id: string, payload: AdminCancelPayload): Promise<Reservation>;
  markNoShow(id: string): Promise<Reservation>;
  requestCompletion(id: string, payload: CompletionPayload): Promise<Reservation>;
  confirmCompleted(id: string): Promise<Reservation>;
  getOwnerDashboardSummary(options?: { date?: string }): Promise<OwnerDashboardSummary>;
}
