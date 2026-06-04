import type { DataAdapter } from "./contracts";
import type {
  AuthSession,
  BarberPayload,
  Reservation,
  ReservationPayload,
  ReservationStatus,
  Schedule,
  SchedulePayload,
  Service,
  ServicePayload,
  User
} from "./models";
import { addDaysIso, addMinutes, getWorkDay, hasOverlap, toMinutes, todayIso } from "./time";

const STORE_KEY = "barberq-demo-store";
const SESSION_KEY = "barberq-demo-session";

interface MockStore {
  users: User[];
  passwords: Record<string, string>;
  services: Service[];
  schedules: Schedule[];
  reservations: Reservation[];
}

function stamp() {
  return new Date().toISOString();
}

function id(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function initialStore(): MockStore {
  const now = stamp();
  const today = todayIso();
  const tomorrow = addDaysIso(1);
  const soon = addDaysIso(3);

  const users: User[] = [
    {
      id: "cust_dimas",
      name: "Dimas Setiawan",
      email: "dimas@example.com",
      phone: "081234567890",
      role: "customer",
      status: "active",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "cust_naya",
      name: "Naya Putri",
      email: "naya@example.com",
      phone: "081222333444",
      role: "customer",
      status: "active",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "barber_rio",
      name: "Rio Pratama",
      email: "rio@barberq.com",
      phone: "081298765432",
      role: "barber",
      status: "active",
      specialization: "Haircut & Styling",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "barber_bima",
      name: "Bima Santoso",
      email: "bima@barberq.com",
      phone: "081288899900",
      role: "barber",
      status: "active",
      specialization: "Shaving & Coloring",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "admin_owner",
      name: "Admin BarberQ",
      email: "admin@barberq.com",
      phone: "081111222333",
      role: "admin",
      status: "active",
      createdAt: now,
      updatedAt: now
    }
  ];

  const services: Service[] = [
    {
      id: "srv_haircut",
      name: "Haircut",
      description: "Potong rambut standar dengan finishing rapi.",
      price: 35000,
      duration: 30,
      status: "active",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "srv_wash",
      name: "Haircut + Wash",
      description: "Potong rambut, cuci, dan blow ringan.",
      price: 50000,
      duration: 45,
      status: "active",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "srv_shaving",
      name: "Shaving",
      description: "Rapikan kumis dan janggut dengan handuk hangat.",
      price: 30000,
      duration: 30,
      status: "active",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "srv_coloring",
      name: "Hair Coloring",
      description: "Pewarnaan rambut dasar untuk tampilan baru.",
      price: 150000,
      duration: 90,
      status: "active",
      createdAt: now,
      updatedAt: now
    }
  ];

  const schedules: Schedule[] = [
    {
      id: "sch_rio",
      barberId: "barber_rio",
      workDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
      startTime: "10:00",
      endTime: "21:00",
      status: "available",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "sch_bima",
      barberId: "barber_bima",
      workDays: ["tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      startTime: "11:00",
      endTime: "20:00",
      status: "available",
      createdAt: now,
      updatedAt: now
    }
  ];

  const reservations: Reservation[] = [
    {
      id: "res_today_rio",
      customerId: "cust_dimas",
      barberId: "barber_rio",
      serviceId: "srv_haircut",
      reservationDate: today,
      startTime: "14:00",
      endTime: "14:30",
      status: "confirmed",
      totalPrice: 35000,
      createdAt: now,
      updatedAt: now
    },
    {
      id: "res_pending_bima",
      customerId: "cust_naya",
      barberId: "barber_bima",
      serviceId: "srv_wash",
      reservationDate: tomorrow,
      startTime: "13:00",
      endTime: "13:45",
      status: "pending",
      totalPrice: 50000,
      createdAt: now,
      updatedAt: now
    },
    {
      id: "res_done_rio",
      customerId: "cust_naya",
      barberId: "barber_rio",
      serviceId: "srv_shaving",
      reservationDate: soon,
      startTime: "16:00",
      endTime: "16:30",
      status: "completed",
      totalPrice: 30000,
      createdAt: now,
      updatedAt: now
    }
  ];

  return {
    users,
    passwords: Object.fromEntries(users.map((user) => [user.email, "password123"])),
    services,
    schedules,
    reservations
  };
}

function readStore(): MockStore {
  if (typeof window === "undefined") {
    return initialStore();
  }

  const existing = window.localStorage.getItem(STORE_KEY);
  if (existing) {
    return JSON.parse(existing) as MockStore;
  }

  const seeded = initialStore();
  window.localStorage.setItem(STORE_KEY, JSON.stringify(seeded));
  return seeded;
}

function writeStore(store: MockStore) {
  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

function readSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(SESSION_KEY);
  return raw ? (JSON.parse(raw) as AuthSession) : null;
}

function writeSession(session: AuthSession | null) {
  if (!session) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function ensure(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function findActiveBlockingOverlap(store: MockStore, input: ReservationPayload, endTime: string) {
  return store.reservations.find(
    (reservation) =>
      reservation.barberId === input.barberId &&
      reservation.reservationDate === input.reservationDate &&
      ["pending", "confirmed"].includes(reservation.status) &&
      hasOverlap(reservation.startTime, reservation.endTime, input.startTime, endTime)
  );
}

export const mockAdapter: DataAdapter = {
  async getSession() {
    return readSession();
  },
  async login(payload) {
    const store = readStore();
    const user = store.users.find((candidate) => candidate.email === payload.email);
    ensure(Boolean(user), "Email tidak ditemukan.");
    ensure(user?.status === "active", "Akun sedang tidak aktif.");
    ensure(store.passwords[payload.email] === payload.password, "Password tidak sesuai.");

    const session = {
      token: `mock-jwt-${user!.id}-${Date.now()}`,
      user: user!
    };
    writeSession(session);
    return session;
  },
  async register(payload) {
    const store = readStore();
    ensure(!store.users.some((user) => user.email === payload.email), "Email sudah digunakan.");
    const now = stamp();
    const user: User = {
      id: id("cust"),
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      role: "customer",
      status: "active",
      createdAt: now,
      updatedAt: now
    };
    store.users.push(user);
    store.passwords[payload.email] = payload.password;
    writeStore(store);
    const session = { token: `mock-jwt-${user.id}-${Date.now()}`, user };
    writeSession(session);
    return session;
  },
  async logout() {
    writeSession(null);
  },

  async listServices(options) {
    const services = readStore().services;
    return options?.activeOnly ? services.filter((service) => service.status === "active") : services;
  },
  async createService(payload) {
    ensure(payload.price > 0, "Harga layanan harus lebih dari 0.");
    ensure(payload.duration > 0, "Durasi layanan harus lebih dari 0.");
    const store = readStore();
    const now = stamp();
    const service: Service = { id: id("srv"), ...payload, createdAt: now, updatedAt: now };
    store.services.push(service);
    writeStore(store);
    return service;
  },
  async updateService(idValue, payload) {
    ensure(payload.price > 0, "Harga layanan harus lebih dari 0.");
    ensure(payload.duration > 0, "Durasi layanan harus lebih dari 0.");
    const store = readStore();
    const index = store.services.findIndex((service) => service.id === idValue);
    ensure(index >= 0, "Layanan tidak ditemukan.");
    store.services[index] = { ...store.services[index], ...payload, updatedAt: stamp() };
    writeStore(store);
    return store.services[index];
  },
  async deactivateService(idValue) {
    const store = readStore();
    const service = store.services.find((candidate) => candidate.id === idValue);
    ensure(Boolean(service), "Layanan tidak ditemukan.");
    service!.status = "inactive";
    service!.updatedAt = stamp();
    writeStore(store);
    return service!;
  },

  async listBarbers(options) {
    const barbers = readStore().users.filter((user) => user.role === "barber");
    return options?.activeOnly ? barbers.filter((barber) => barber.status === "active") : barbers;
  },
  async listCustomers() {
    return readStore().users.filter((user) => user.role === "customer");
  },
  async createBarber(payload: BarberPayload) {
    const store = readStore();
    ensure(!store.users.some((user) => user.email === payload.email), "Email sudah digunakan.");
    const now = stamp();
    const barber: User = {
      id: id("barber"),
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      role: "barber",
      status: payload.status,
      specialization: payload.specialization,
      createdAt: now,
      updatedAt: now
    };
    store.users.push(barber);
    store.passwords[payload.email] = payload.password || "password123";
    writeStore(store);
    return barber;
  },
  async updateBarber(idValue, payload) {
    const store = readStore();
    const barber = store.users.find((candidate) => candidate.id === idValue && candidate.role === "barber");
    ensure(Boolean(barber), "Barber tidak ditemukan.");
    Object.assign(barber!, {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      status: payload.status,
      specialization: payload.specialization,
      updatedAt: stamp()
    });
    if (payload.password) {
      store.passwords[payload.email] = payload.password;
    }
    writeStore(store);
    return barber!;
  },
  async deactivateBarber(idValue) {
    const store = readStore();
    const barber = store.users.find((candidate) => candidate.id === idValue && candidate.role === "barber");
    ensure(Boolean(barber), "Barber tidak ditemukan.");
    barber!.status = "inactive";
    barber!.updatedAt = stamp();
    writeStore(store);
    return barber!;
  },

  async listSchedules() {
    return readStore().schedules;
  },
  async upsertSchedule(payload: SchedulePayload) {
    ensure(payload.workDays.length > 0, "Pilih minimal satu hari kerja.");
    ensure(toMinutes(payload.startTime) < toMinutes(payload.endTime), "Jam mulai harus lebih awal dari jam selesai.");
    const store = readStore();
    const existing = store.schedules.find((schedule) => schedule.barberId === payload.barberId);
    if (existing) {
      Object.assign(existing, payload, { updatedAt: stamp() });
      writeStore(store);
      return existing;
    }
    const now = stamp();
    const schedule: Schedule = { id: id("sch"), ...payload, createdAt: now, updatedAt: now };
    store.schedules.push(schedule);
    writeStore(store);
    return schedule;
  },

  async listReservations(filters) {
    let reservations = readStore().reservations;
    if (filters?.customerId) {
      reservations = reservations.filter((reservation) => reservation.customerId === filters.customerId);
    }
    if (filters?.barberId) {
      reservations = reservations.filter((reservation) => reservation.barberId === filters.barberId);
    }
    if (filters?.status) {
      reservations = reservations.filter((reservation) => reservation.status === filters.status);
    }
    return reservations.sort(
      (a, b) => `${b.reservationDate} ${b.startTime}`.localeCompare(`${a.reservationDate} ${a.startTime}`)
    );
  },
  async getAvailableSlots(input) {
    const store = readStore();
    const service = store.services.find((candidate) => candidate.id === input.serviceId && candidate.status === "active");
    const barber = store.users.find(
      (candidate) => candidate.id === input.barberId && candidate.role === "barber" && candidate.status === "active"
    );
    const schedule = store.schedules.find(
      (candidate) => candidate.barberId === input.barberId && candidate.status === "available"
    );

    if (!service || !barber || !schedule || !schedule.workDays.includes(getWorkDay(input.reservationDate))) {
      return [];
    }

    const slots: string[] = [];
    const endBoundary = toMinutes(schedule.endTime) - service.duration;
    for (let candidate = toMinutes(schedule.startTime); candidate <= endBoundary; candidate += 30) {
      const startTime = `${Math.floor(candidate / 60).toString().padStart(2, "0")}:${(candidate % 60)
        .toString()
        .padStart(2, "0")}`;
      const endTime = addMinutes(startTime, service.duration);
      const blocked = findActiveBlockingOverlap(
        store,
        {
          barberId: input.barberId,
          serviceId: input.serviceId,
          customerId: "",
          reservationDate: input.reservationDate,
          startTime
        },
        endTime
      );
      if (!blocked) {
        slots.push(startTime);
      }
    }
    return slots;
  },
  async createReservation(payload: ReservationPayload) {
    const store = readStore();
    const service = store.services.find((candidate) => candidate.id === payload.serviceId);
    const barber = store.users.find((candidate) => candidate.id === payload.barberId && candidate.role === "barber");
    const customer = store.users.find((candidate) => candidate.id === payload.customerId && candidate.role === "customer");
    const schedule = store.schedules.find((candidate) => candidate.barberId === payload.barberId);

    ensure(Boolean(customer), "Customer tidak ditemukan.");
    ensure(service?.status === "active", "Layanan tidak aktif.");
    ensure(barber?.status === "active", "Barber tidak aktif.");
    ensure(schedule?.status === "available", "Jadwal barber tidak tersedia.");
    ensure(schedule!.workDays.includes(getWorkDay(payload.reservationDate)), "Tanggal tidak sesuai hari kerja barber.");
    ensure(toMinutes(payload.startTime) >= toMinutes(schedule!.startTime), "Jam mulai di luar jam kerja barber.");

    const endTime = addMinutes(payload.startTime, service!.duration);
    ensure(toMinutes(endTime) <= toMinutes(schedule!.endTime), "Jam selesai di luar jam kerja barber.");
    ensure(!findActiveBlockingOverlap(store, payload, endTime), "Slot sudah terisi. Pilih jam lain.");

    const now = stamp();
    const reservation: Reservation = {
      id: id("res"),
      ...payload,
      endTime,
      status: "pending",
      totalPrice: service!.price,
      createdAt: now,
      updatedAt: now
    };
    store.reservations.push(reservation);
    writeStore(store);
    return reservation;
  },
  async cancelReservation(idValue, by, reason) {
    const store = readStore();
    const reservation = store.reservations.find((candidate) => candidate.id === idValue);
    ensure(Boolean(reservation), "Reservasi tidak ditemukan.");
    ensure(reservation!.status !== "completed", "Reservasi selesai tidak dapat dibatalkan.");
    reservation!.status = "cancelled";
    reservation!.cancelledBy = by;
    reservation!.cancellationReason = reason;
    reservation!.updatedAt = stamp();
    writeStore(store);
    return reservation!;
  },
  async updateReservationStatus(idValue, status: ReservationStatus) {
    const store = readStore();
    const reservation = store.reservations.find((candidate) => candidate.id === idValue);
    ensure(Boolean(reservation), "Reservasi tidak ditemukan.");
    reservation!.status = status;
    reservation!.updatedAt = stamp();
    writeStore(store);
    return reservation!;
  },
  async approveReservation(idValue) {
    const reservation = await this.updateReservationStatus(idValue, "confirmed");
    reservation.paymentStatus = "approved";
    reservation.updatedAt = stamp();
    return reservation;
  },
  async rejectReservation(idValue, reason) {
    const reservation = await this.cancelReservation(idValue, "admin", reason);
    reservation.paymentStatus = "rejected";
    reservation.paymentRejectedReason = reason;
    reservation.updatedAt = stamp();
    return reservation;
  },
  async listMyMessages() {
    return [];
  },
  async getMessage() {
    throw new Error("Inbox tidak tersedia di mock mode.");
  },
  async markMessageRead() {
    throw new Error("Inbox tidak tersedia di mock mode.");
  },
  async sendMessage() {
    throw new Error("Inbox tidak tersedia di mock mode.");
  },
  async adminCancelReservation(idValue, payload) {
    return this.cancelReservation(idValue, "admin", payload.reason);
  },
  async markNoShow(idValue) {
    const reservation = await this.cancelReservation(
      idValue,
      "admin",
      "Customer tidak hadir lebih dari 10 menit setelah jadwal"
    );
    return { ...reservation, isNoShow: true };
  },
  async requestCompletion(idValue, payload) {
    const store = readStore();
    const reservation = store.reservations.find((candidate) => candidate.id === idValue);
    ensure(Boolean(reservation), "Reservasi tidak ditemukan.");
    reservation!.barberCompletionRequested = true;
    reservation!.barberCompletionNote = payload.note;
    reservation!.barberCompletedAt = stamp();
    writeStore(store);
    return reservation!;
  },
  async confirmCompleted(idValue) {
    return this.updateReservationStatus(idValue, "completed");
  },
  async getOwnerDashboardSummary() {
    const store = readStore();
    return {
      totalReservations: store.reservations.length,
      pendingReservations: store.reservations.filter((reservation) => reservation.status === "pending").length,
      confirmedReservations: store.reservations.filter((reservation) => reservation.status === "confirmed").length,
      completedReservations: store.reservations.filter((reservation) => reservation.status === "completed").length,
      cancelledReservations: store.reservations.filter((reservation) => reservation.status === "cancelled").length,
      noShowReservations: 0,
      totalApprovedPayments: 0,
      totalDpPayments: 0,
      totalFullPayments: 0,
      activeBarbers: store.users.filter((user) => user.role === "barber" && user.status === "active").length,
      activeServices: store.services.filter((service) => service.status === "active").length,
      selectedDate: todayIso(),
      dailyCashflow: 0,
      dailyDpCashflow: 0,
      dailyFullCashflow: 0,
      dailyReservationCount: 0,
      dailyPendingReservations: 0,
      dailyConfirmedReservations: 0,
      dailyCompletedReservations: 0,
      dailyCancelledReservations: 0,
      cashflowItems: [],
      topServices: [],
      barberPerformance: []
    };
  }
};
