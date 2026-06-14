import type { DataAdapter } from "./contracts";
import type {
  AuthSession,
  BarberPayload,
  ReservationFilters,
  ReservationPayload,
  ReservationStatus,
  SchedulePayload,
  ServicePayload
} from "./models";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";
const SESSION_KEY = "barberq-api-session";

function readSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  return raw ? (JSON.parse(raw) as AuthSession) : null;
}

function writeSession(session: AuthSession | null) {
  if (typeof window === "undefined") return;
  if (!session) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function query(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const value = search.toString();
  return value ? `?${value}` : "";
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const session = readSession();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (session?.token) headers.set("Authorization", `Bearer ${session.token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    let message = "";
    try {
      const body = JSON.parse(text) as { message?: string; detail?: string };
      message = body.detail ? `${body.message ?? "Request API gagal."} ${body.detail}` : body.message || "";
    } catch {
      message = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    }
    throw new Error(message || `Request API gagal. Status ${response.status}.`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const apiAdapter: DataAdapter = {
  async getSession() {
    const session = readSession();
    if (!session?.token) return null;
    try {
      const result = await request<{ user: AuthSession["user"] }>("/auth/me");
      const nextSession = { token: session.token, user: result.user };
      writeSession(nextSession);
      return nextSession;
    } catch {
      writeSession(null);
      return null;
    }
  },
  async login(payload) {
    const session = await request<AuthSession>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    writeSession(session);
    return session;
  },
  async register(payload) {
    const session = await request<AuthSession>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    writeSession(session);
    return session;
  },
  async logout() {
    writeSession(null);
  },

  async listServices(options) {
    return request(`/services${query({ activeOnly: options?.activeOnly })}`);
  },
  async createService(payload: ServicePayload) {
    return request("/services", { method: "POST", body: JSON.stringify(payload) });
  },
  async updateService(id, payload: ServicePayload) {
    return request(`/services/${id}`, { method: "PUT", body: JSON.stringify(payload) });
  },
  async deactivateService(id) {
    return request(`/services/${id}/deactivate`, { method: "PATCH" });
  },

  async listBarbers(options) {
    return request(`/barbers${query({ activeOnly: options?.activeOnly })}`);
  },
  async listCustomers() {
    return request("/users/customers");
  },
  async createBarber(payload: BarberPayload) {
    return request("/barbers", { method: "POST", body: JSON.stringify(payload) });
  },
  async updateBarber(id, payload: BarberPayload) {
    return request(`/barbers/${id}`, { method: "PUT", body: JSON.stringify(payload) });
  },
  async deactivateBarber(id) {
    return request(`/barbers/${id}/deactivate`, { method: "PATCH" });
  },

  async listSchedules() {
    return request("/schedules");
  },
  async upsertSchedule(payload: SchedulePayload) {
    return request("/schedules", { method: "PUT", body: JSON.stringify(payload) });
  },

  async listReservations(filters?: ReservationFilters) {
    return request(`/reservations${query({ ...(filters || {}) })}`);
  },
  async createReservation(payload: ReservationPayload) {
    return request("/reservations", { method: "POST", body: JSON.stringify(payload) });
  },
  async cancelReservation(id, _by, reason) {
    return request(`/reservations/${id}/cancel`, {
      method: "PATCH",
      body: JSON.stringify({ reason })
    });
  },
  async updateReservationStatus(id, status: ReservationStatus) {
    if (status === "cancelled") {
      return request(`/reservations/${id}/cancel`, { method: "PATCH", body: JSON.stringify({}) });
    }
    return request(`/reservations/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
  },
  async approveReservation(id) {
    return request(`/reservations/${id}/approve`, { method: "PATCH" });
  },
  async rejectReservation(id, reason) {
    return request(`/reservations/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ reason })
    });
  },
  async getAvailableSlots(input) {
    return request(`/reservations/slots${query(input)}`);
  },

  async listMyMessages() {
    return request("/messages/my");
  },
  async getMessage(id) {
    return request(`/messages/${id}`);
  },
  async markMessageRead(id) {
    return request(`/messages/${id}/read`, { method: "PATCH" });
  },
  async sendMessage(payload) {
    return request("/messages", { method: "POST", body: JSON.stringify(payload) });
  },
  async adminCancelReservation(id, payload) {
    return request(`/reservations/${id}/admin-cancel`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  },
  async markNoShow(id) {
    return request(`/reservations/${id}/no-show`, { method: "PATCH" });
  },
  async requestCompletion(id, payload) {
    return request(`/reservations/${id}/request-completion`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  },
  async confirmCompleted(id) {
    return request(`/reservations/${id}/confirm-completed`, { method: "PATCH" });
  },
  async getOwnerDashboardSummary(options) {
    return request(`/dashboard/owner${query({ date: options?.date })}`);
  }
};
