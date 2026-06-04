"use client";

import {
  CalendarDays,
  ClipboardList,
  Inbox,
  LogOut,
  Menu,
  Monitor,
  Scissors,
  UserRound,
  UsersRound
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import type { Role } from "@/data";
import { useData } from "@/data/DataProvider";
import { Button, LinkButton, roleHome } from "./ui";

const navByRole: Record<Role, { href: string; label: string; icon: ReactNode }[]> = {
  customer: [
    { href: "/customer/booking", label: "Reservasi", icon: <CalendarDays size={18} /> },
    { href: "/customer/reservations", label: "Riwayat", icon: <ClipboardList size={18} /> },
    { href: "/customer/inbox", label: "Inbox", icon: <Inbox size={18} /> },
    { href: "/customer/profile", label: "Profil", icon: <UserRound size={18} /> }
  ],
  barber: [
    { href: "/barber/schedule", label: "Jadwal", icon: <CalendarDays size={18} /> },
    { href: "/barber/history", label: "Riwayat", icon: <ClipboardList size={18} /> },
    { href: "/barber/profile", label: "Profil", icon: <UserRound size={18} /> }
  ],
  admin: [
    { href: "/admin/services", label: "Layanan", icon: <Scissors size={18} /> },
    { href: "/admin/barbers", label: "Barber", icon: <UsersRound size={18} /> },
    { href: "/admin/schedules", label: "Jadwal", icon: <CalendarDays size={18} /> },
    { href: "/admin/reservations", label: "Reservasi", icon: <ClipboardList size={18} /> }
  ],
  owner: [
    { href: "/owner", label: "Monitoring", icon: <Monitor size={18} /> }
  ]
};

export function PublicLayout({ children }: { children: ReactNode }) {
  const { currentUser, logout } = useData();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-ink/10 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link className="flex items-center gap-2 text-xl font-black text-ink" href="/">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-ink text-white">
              <Scissors size={20} />
            </span>
            BarberQ
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            <LinkButton href="/services" variant="ghost">Layanan</LinkButton>
            <LinkButton href="/barbers" variant="ghost">Barber</LinkButton>
            {currentUser ? (
              <>
                <LinkButton href={roleHome(currentUser.role)} variant="secondary">Masuk Area</LinkButton>
                <Button onClick={handleLogout} variant="ghost"><LogOut size={17} />Keluar</Button>
              </>
            ) : (
              <>
                <LinkButton href="/login" variant="secondary">Login</LinkButton>
                <LinkButton href="/register">Register</LinkButton>
              </>
            )}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

export function AppLayout({ role, children }: { role: Role; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useData();
  const [open, setOpen] = useState(false);
  const nav = navByRole[role];

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-white md:grid md:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-ink/10 bg-white/80 p-4 md:block">
        <Link className="flex items-center gap-2 text-xl font-black text-ink" href="/">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-ink text-white">
            <Scissors size={20} />
          </span>
          BarberQ
        </Link>
        <p className="mt-4 rounded-md bg-paper p-3 text-sm text-ink/70">{currentUser?.name}</p>
        <nav className="mt-6 grid gap-2">
          {nav.map((item) => (
            <Link
              className={`focus-ring flex items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold transition ${
                pathname === item.href ? "bg-ink text-white" : "text-ink hover:bg-paper"
              }`}
              href={item.href}
              key={item.href}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
        <Button className="mt-6 w-full" onClick={handleLogout} variant="secondary">
          <LogOut size={17} /> Keluar
        </Button>
      </aside>

      <div>
        <header className="sticky top-0 z-20 border-b border-ink/10 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex items-center justify-between">
            <Link className="font-black text-ink" href="/">BarberQ</Link>
            <Button onClick={() => setOpen((value) => !value)} variant="secondary">
              <Menu size={18} />
            </Button>
          </div>
          {open ? (
            <nav className="mt-3 grid gap-2">
              {nav.map((item) => (
                <Link className="rounded-md bg-white px-3 py-3 text-sm font-semibold text-ink" href={item.href} key={item.href}>
                  {item.label}
                </Link>
              ))}
              <Button onClick={handleLogout} variant="secondary">Keluar</Button>
            </nav>
          ) : null}
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}

export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { currentUser, loadingSession } = useData();

  if (loadingSession) {
    return <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-ink/60">Memuat sesi...</div>;
  }

  if (!currentUser) {
    return (
      <PublicLayout>
        <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4">
          <div className="rounded-lg border border-ink/10 bg-white p-6 text-center shadow-soft">
            <h1 className="text-2xl font-bold">Login diperlukan</h1>
            <p className="mt-2 text-sm text-ink/65">Masuk terlebih dahulu untuk membuka halaman ini.</p>
            <LinkButton className="mt-5" href="/login">Login</LinkButton>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (currentUser.role !== role) {
    return (
      <AppLayout role={currentUser.role}>
        <div className="rounded-lg border border-red-100 bg-white p-6">
          <h1 className="text-2xl font-bold text-ink">Akses ditolak</h1>
          <p className="mt-2 text-sm text-ink/65">Role akun ini tidak sesuai untuk halaman yang dipilih.</p>
          <LinkButton className="mt-5" href={roleHome(currentUser.role)}>Kembali</LinkButton>
        </div>
      </AppLayout>
    );
  }

  return <AppLayout role={role}>{children}</AppLayout>;
}
