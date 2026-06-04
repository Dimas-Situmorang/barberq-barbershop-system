"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { ReservationStatus, Role } from "@/data";

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const variants = {
    primary: "bg-ink text-white hover:bg-black",
    secondary: "border border-ink/15 bg-white text-ink hover:bg-paper",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-ink hover:bg-white"
  };

  return (
    <button
      className={`focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
  className = ""
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  const variants = {
    primary: "bg-ink text-white hover:bg-black",
    secondary: "border border-ink/15 bg-white text-ink hover:bg-paper",
    ghost: "text-ink hover:bg-white"
  };
  return (
    <Link
      className={`focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition ${variants[variant]} ${className}`}
      href={href}
    >
      {children}
    </Link>
  );
}

export function Field({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-ink">
      {label}
      {children}
    </label>
  );
}

export const inputClass =
  "focus-ring min-h-11 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink shadow-sm";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-ink/10 bg-white p-5 shadow-sm ${className}`}>{children}</section>;
}

export function PageTitle({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? <p className="text-sm font-bold uppercase text-mint">{eyebrow}</p> : null}
        <h1 className="mt-1 text-3xl font-bold text-ink md:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/65">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

const statusStyles: Record<ReservationStatus, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  confirmed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  completed: "bg-sky-100 text-sky-800 border-sky-200",
  cancelled: "bg-rose-100 text-rose-800 border-rose-200"
};

export function StatusBadge({ status }: { status: ReservationStatus | "active" | "inactive" | "available" | "unavailable" }) {
  if (status === "active" || status === "available") {
    return <span className="rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">{status}</span>;
  }
  if (status === "inactive" || status === "unavailable") {
    return <span className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700">{status}</span>;
  }
  return <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusStyles[status]}`}>{status}</span>;
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Card>
      <p className="text-sm text-ink/60">{label}</p>
      <p className="mt-2 text-3xl font-bold text-ink">{value}</p>
    </Card>
  );
}

export function roleHome(role: Role) {
  if (role === "owner") return "/owner";
  if (role === "admin") return "/admin/reservations";
  if (role === "barber") return "/barber/schedule";
  return "/customer/booking";
}
