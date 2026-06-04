import type { WorkDay } from "../domain";

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
  const hours = Math.floor(value / 60).toString().padStart(2, "0");
  const minutes = (value % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function addMinutes(time: string, duration: number) {
  return fromMinutes(toMinutes(time) + duration);
}

export function getWorkDay(date: string): WorkDay {
  return workDayOrder[new Date(`${date}T00:00:00`).getDay()];
}

export function hasOverlap(existingStart: string, existingEnd: string, nextStart: string, nextEnd: string) {
  return toMinutes(existingStart) < toMinutes(nextEnd) && toMinutes(existingEnd) > toMinutes(nextStart);
}
