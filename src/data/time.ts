import type { WorkDay } from "./models";

export const workDayLabels: Record<WorkDay, string> = {
  monday: "Senin",
  tuesday: "Selasa",
  wednesday: "Rabu",
  thursday: "Kamis",
  friday: "Jumat",
  saturday: "Sabtu",
  sunday: "Minggu"
};

const workDayOrder: WorkDay[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday"
];

export function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function fromMinutes(value: number) {
  const hours = Math.floor(value / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (value % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function addMinutes(time: string, duration: number) {
  return fromMinutes(toMinutes(time) + duration);
}

export function hasOverlap(
  existingStart: string,
  existingEnd: string,
  candidateStart: string,
  candidateEnd: string
) {
  return toMinutes(existingStart) < toMinutes(candidateEnd) && toMinutes(existingEnd) > toMinutes(candidateStart);
}

export function getWorkDay(date: string): WorkDay {
  const parsed = new Date(`${date}T00:00:00`);
  return workDayOrder[parsed.getDay()];
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(`${date}T00:00:00`));
}

export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value);
}
