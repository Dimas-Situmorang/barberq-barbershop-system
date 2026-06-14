"use client";

import {
  Activity,
  Banknote,
  BarChart3,
  CalendarDays,
  CalendarCheck,
  Check,
  Clock,
  Eye,
  Inbox,
  Save,
  Scissors,
  Send,
  TrendingUp,
  UserRound,
  WalletCards,
  UsersRound,
  X
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  formatDate,
  formatRupiah,
  todayIso,
  workDayLabels,
  type BarberPayload,
  type CancelAction,
  type Message,
  type MessageType,
  type OwnerDashboardSummary,
  type PaymentType,
  type Reservation,
  type ReservationStatus,
  type RefundStatus,
  type Schedule,
  type Service,
  type ServicePayload,
  type User,
  type WorkDay
} from "@/data";
import { useData } from "@/data/DataProvider";
import {
  ShadBadge,
  ShadCard,
  ShadCardContent,
  ShadCardDescription,
  ShadCardHeader,
  ShadCardTitle,
  ShadInput
} from "./shadcn";
import { PublicLayout, RequireRole } from "./layouts";
import { Button, Card, Field, LinkButton, PageTitle, StatusBadge, inputClass, roleHome } from "./ui";

const heroImage =
  "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1600&q=80";

function ErrorText({ message }: { message: string }) {
  return message ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{message}</p> : null;
}

function LoadingText() {
  return <p className="text-sm text-ink/60">Memuat data...</p>;
}

function ApiState({ message }: { message: string }) {
  return (
    <Card>
      <p className="text-sm font-semibold text-ink">Data belum tersedia</p>
      <p className="mt-2 text-sm leading-6 text-ink/60">{message}</p>
    </Card>
  );
}

function paymentLabel(type?: PaymentType) {
  if (type === "dp") return "DP";
  if (type === "full") return "Full Payment";
  return "-";
}

function readProofImage(file?: File | null) {
  return new Promise<{ dataUrl: string; name: string }>((resolve, reject) => {
    if (!file) {
      resolve({ dataUrl: "", name: "" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve({ dataUrl: String(reader.result || ""), name: file.name });
    reader.onerror = () => reject(new Error("Bukti pembayaran gagal dibaca."));
    reader.readAsDataURL(file);
  });
}

function canPreviewProof(value?: string) {
  return Boolean(value && (/^data:image\//.test(value) || /^https?:\/\//.test(value)));
}

function useLookups() {
  const data = useData();
  const { currentUser } = data;
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<User[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!currentUser) {
      setServices([]);
      setBarbers([]);
      setCustomers([]);
      setSchedules([]);
      setReservations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const isAdmin = currentUser?.role === "admin";
      const [nextServices, nextBarbers, nextCustomers, nextSchedules, nextReservations] = await Promise.all([
        data.listServices(isAdmin ? undefined : { activeOnly: true }),
        data.listBarbers(isAdmin ? undefined : { activeOnly: true }),
        currentUser?.role === "admin" ? data.listCustomers() : Promise.resolve(currentUser ? [currentUser] : []),
        isAdmin ? data.listSchedules() : Promise.resolve([]),
        data.listReservations()
      ]);
      setServices(nextServices);
      setBarbers(nextBarbers);
      setCustomers(nextCustomers);
      setSchedules(nextSchedules);
      setReservations(nextReservations);
    } catch (error) {
      console.error(error);
      setServices([]);
      setBarbers([]);
      setCustomers(currentUser ? [currentUser] : []);
      setSchedules([]);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser, data]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { services, barbers, customers, schedules, reservations, loading, refresh };
}

function ReservationRow({
  reservation,
  services,
  barbers,
  customers,
  href
}: {
  reservation: Reservation;
  services: Service[];
  barbers: User[];
  customers: User[];
  href: string;
}) {
  const service = services.find((item) => item.id === reservation.serviceId);
  const barber = barbers.find((item) => item.id === reservation.barberId);
  const customer = customers.find((item) => item.id === reservation.customerId);
  const displayName = customer?.name ?? reservation.customerName ?? barber?.name ?? reservation.barberName ?? "-";
  return (
    <tr className="border-b border-ink/10">
      <td className="px-3 py-3 font-semibold">{formatDate(reservation.reservationDate)}</td>
      <td className="px-3 py-3">{reservation.startTime} - {reservation.endTime}</td>
      <td className="px-3 py-3">{service?.name ?? reservation.serviceName ?? "-"}</td>
      <td className="px-3 py-3">{displayName}</td>
      <td className="px-3 py-3">{paymentLabel(reservation.paymentType)}</td>
      <td className="px-3 py-3">{reservation.paymentStatus ?? "-"}</td>
      <td className="px-3 py-3"><StatusBadge status={reservation.status} /></td>
      <td className="px-3 py-3 text-right">
        <LinkButton href={href} variant="secondary"><Eye size={16} />Detail</LinkButton>
      </td>
    </tr>
  );
}

function ReservationTable({
  reservations,
  services,
  barbers,
  customers,
  hrefFor
}: {
  reservations: Reservation[];
  services: Service[];
  barbers: User[];
  customers: User[];
  hrefFor: (reservation: Reservation) => string;
}) {
  if (!reservations.length) {
    return <Card><p className="text-sm text-ink/60">Belum ada reservasi.</p></Card>;
  }

  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full min-w-[920px] text-left text-sm">
        <thead className="bg-paper text-ink/70">
          <tr>
            <th className="px-3 py-3">Tanggal</th>
            <th className="px-3 py-3">Jam</th>
            <th className="px-3 py-3">Layanan</th>
            <th className="px-3 py-3">Nama</th>
            <th className="px-3 py-3">Payment</th>
            <th className="px-3 py-3">Status Bayar</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((reservation) => (
            <ReservationRow
              barbers={barbers}
              customers={customers}
              href={hrefFor(reservation)}
              key={reservation.id}
              reservation={reservation}
              services={services}
            />
          ))}
        </tbody>
      </table>
    </Card>
  );
}

export function HomePage() {
  const data = useData();
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<User[]>([]);

  useEffect(() => {
    void Promise.all([data.listServices({ activeOnly: true }), data.listBarbers({ activeOnly: true })]).then(
      ([nextServices, nextBarbers]) => {
        setServices(nextServices);
        setBarbers(nextBarbers);
      }
    );
  }, [data]);

  return (
    <PublicLayout>
      <section className="relative min-h-[82vh] overflow-hidden">
        <img alt="Interior barbershop" className="absolute inset-0 h-full w-full object-cover" src={heroImage} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent" />
        <div className="relative mx-auto flex min-h-[82vh] max-w-7xl items-center px-4 py-16">
          <div className="max-w-2xl text-white">
            <p className="text-sm font-bold uppercase text-amber-200">Reservasi barbershop digital</p>
            <h1 className="mt-4 text-5xl font-black leading-tight md:text-7xl">BarberQ</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/82">
              Pilih layanan, barber, tanggal, dan slot jam yang tersedia tanpa antrean manual.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/customer/booking">Buat Reservasi</LinkButton>
              <LinkButton href="/services" variant="secondary">Lihat Layanan</LinkButton>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-12 md:grid-cols-3">
        <Card>
          <Scissors className="text-clay" />
          <h2 className="mt-4 text-xl font-bold">Layanan Aktif</h2>
          <p className="mt-2 text-sm text-ink/65">{services.length} pilihan layanan siap dipesan.</p>
        </Card>
        <Card>
          <UsersRound className="text-mint" />
          <h2 className="mt-4 text-xl font-bold">Barber Pilihan</h2>
          <p className="mt-2 text-sm text-ink/65">{barbers.length} barber aktif dengan spesialisasi berbeda.</p>
        </Card>
        <Card>
          <CalendarCheck className="text-brass" />
          <h2 className="mt-4 text-xl font-bold">Slot Terkontrol</h2>
          <p className="mt-2 text-sm text-ink/65">Slot bentrok otomatis ditolak oleh layer reservasi demo.</p>
        </Card>
      </section>
    </PublicLayout>
  );
}

export function ServicesPage() {
  const data = useData();
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    void data.listServices({ activeOnly: true }).then(setServices);
  }, [data]);

  return (
    <PublicLayout>
      <section className="mx-auto max-w-7xl px-4 py-10">
        <PageTitle title="Daftar Layanan" description="Layanan aktif yang dapat dipilih saat membuat reservasi." />
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id}>
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl font-bold">{service.name}</h2>
                <StatusBadge status={service.status} />
              </div>
              <p className="mt-3 min-h-12 text-sm text-ink/65">{service.description}</p>
              <div className="mt-5 flex items-center justify-between text-sm">
                <span className="font-bold text-clay">{formatRupiah(service.price)}</span>
                <span className="flex items-center gap-1 text-ink/65"><Clock size={16} />{service.duration} menit</span>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}

export function BarbersPage() {
  const data = useData();
  const [barbers, setBarbers] = useState<User[]>([]);

  useEffect(() => {
    void data.listBarbers({ activeOnly: true }).then(setBarbers);
  }, [data]);

  return (
    <PublicLayout>
      <section className="mx-auto max-w-7xl px-4 py-10">
        <PageTitle title="Daftar Barber" description="Pilih barber aktif sesuai spesialisasi layanan yang dibutuhkan." />
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {barbers.map((barber) => (
            <Card key={barber.id}>
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-md bg-mint text-white">
                  <UserRound />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{barber.name}</h2>
                  <p className="text-sm text-ink/60">{barber.specialization}</p>
                </div>
              </div>
              <p className="mt-5 text-sm text-ink/65">{barber.phone}</p>
            </Card>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}

export function LoginPage() {
  const data = useData();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const session = await data.login({ email, password });
      router.push(roleHome(session.user.role));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Login gagal.");
    }
  }

  return (
    <PublicLayout>
      <section className="mx-auto grid min-h-[76vh] max-w-md place-items-center px-4 py-10">
        <Card className="w-full">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-black text-ink">Masuk ke BarberQ</h1>
            <p className="mt-2 text-sm leading-6 text-ink/60">Gunakan akun yang sudah terdaftar untuk mengakses sistem.</p>
          </div>
          <form className="grid gap-4" onSubmit={submit}>
            <Field label="Email">
              <input className={inputClass} onChange={(event) => setEmail(event.target.value)} placeholder="nama@email.com" required type="email" value={email} />
            </Field>
            <Field label="Password">
              <input className={inputClass} onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan password" required type="password" value={password} />
            </Field>
            <ErrorText message={error} />
            <Button className="w-full" type="submit">Login</Button>
            <Link className="text-center text-sm font-semibold text-mint" href="/register">
              Buat akun customer
            </Link>
          </form>
        </Card>
      </section>
    </PublicLayout>
  );
}

export function RegisterPage() {
  const data = useData();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await data.register(form);
      router.push("/customer");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Register gagal.");
    }
  }

  return (
    <PublicLayout>
      <section className="mx-auto grid min-h-[76vh] max-w-lg place-items-center px-4 py-10">
        <Card className="w-full">
          <h1 className="text-3xl font-bold">Register Customer</h1>
          <form className="mt-6 grid gap-4" onSubmit={submit}>
            <Field label="Nama">
              <input className={inputClass} onChange={(event) => setForm({ ...form, name: event.target.value })} required value={form.name} />
            </Field>
            <Field label="Email">
              <input className={inputClass} onChange={(event) => setForm({ ...form, email: event.target.value })} required type="email" value={form.email} />
            </Field>
            <Field label="Nomor telepon">
              <input className={inputClass} onChange={(event) => setForm({ ...form, phone: event.target.value })} required value={form.phone} />
            </Field>
            <Field label="Password">
              <input className={inputClass} onChange={(event) => setForm({ ...form, password: event.target.value })} required type="password" value={form.password} />
            </Field>
            <ErrorText message={error} />
            <Button type="submit">Register</Button>
          </form>
        </Card>
      </section>
    </PublicLayout>
  );
}

export function CustomerBookingPage() {
  const data = useData();
  const router = useRouter();
  const { currentUser } = data;
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<User[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [barberId, setBarberId] = useState("");
  const [reservationDate, setReservationDate] = useState(todayIso());
  const [startTime, setStartTime] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType | "">("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [proofImage, setProofImage] = useState("");
  const [proofFileName, setProofFileName] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    void Promise.all([data.listServices({ activeOnly: true }), data.listBarbers({ activeOnly: true })]).then(([nextServices, nextBarbers]) => {
      setServices(nextServices);
      setBarbers(nextBarbers);
      setServiceId(nextServices[0]?.id ?? "");
      setBarberId(nextBarbers[0]?.id ?? "");
    });
  }, [data]);

  useEffect(() => {
    setStartTime("");
    if (!serviceId || !barberId || !reservationDate) return;
    void data.getAvailableSlots({ serviceId, barberId, reservationDate }).then(setSlots);
  }, [barberId, data, reservationDate, serviceId]);

  const selectedService = services.find((service) => service.id === serviceId);
  const suggestedPaymentAmount =
    paymentType === "dp" ? Math.round((selectedService?.price ?? 0) * 0.5) : paymentType === "full" ? selectedService?.price ?? 0 : 0;
  const paymentAmountValue = Number(paymentAmount);

  function choosePaymentType(nextType: PaymentType | "") {
    setPaymentType(nextType);
    const total = selectedService?.price ?? 0;
    if (nextType === "dp") setPaymentAmount(String(Math.round(total * 0.5)));
    else if (nextType === "full") setPaymentAmount(String(total));
    else setPaymentAmount("");
  }

  function chooseService(nextServiceId: string) {
    setServiceId(nextServiceId);
    const nextService = services.find((service) => service.id === nextServiceId);
    const total = nextService?.price ?? 0;
    if (paymentType === "dp") setPaymentAmount(String(Math.round(total * 0.5)));
    if (paymentType === "full") setPaymentAmount(String(total));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    if (!currentUser) return;
    if (!paymentType || !paymentAmountValue || !proofImage) {
      setMessage("Pilih tipe pembayaran, isi nominal, dan upload bukti pembayaran terlebih dahulu.");
      return;
    }
    try {
      const reservation = await data.createReservation({
        customerId: currentUser.id,
        barberId,
        serviceId,
        reservationDate,
        startTime,
        paymentType,
        amount: paymentAmountValue,
        paymentAmount: paymentAmountValue,
        proofImage,
        paymentProof: proofImage
      });
      router.push(`/customer/reservations/${reservation.id}`);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Reservasi gagal dibuat.");
    }
  }

  async function handleProofFile(file?: File | null) {
    setMessage("");
    try {
      const proof = await readProofImage(file);
      setProofImage(proof.dataUrl);
      setProofFileName(proof.name);
    } catch (caught) {
      setProofImage("");
      setProofFileName("");
      setMessage(caught instanceof Error ? caught.message : "Bukti pembayaran gagal dibaca.");
    }
  }

  return (
    <RequireRole role="customer">
      <PageTitle title="Buat Reservasi" description="Pilih layanan, barber, tanggal, lalu jam yang tersedia." />
      <form className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]" onSubmit={submit}>
        <Card className="grid gap-4">
          <Field label="Layanan">
            <select className={inputClass} onChange={(event) => chooseService(event.target.value)} value={serviceId}>
              {services.map((service) => <option key={service.id} value={service.id}>{service.name} - {formatRupiah(service.price)}</option>)}
            </select>
          </Field>
          <Field label="Barber">
            <select className={inputClass} onChange={(event) => setBarberId(event.target.value)} value={barberId}>
              {barbers.map((barber) => <option key={barber.id} value={barber.id}>{barber.name} - {barber.specialization}</option>)}
            </select>
          </Field>
          <Field label="Tanggal">
            <input className={inputClass} min={todayIso()} onChange={(event) => setReservationDate(event.target.value)} type="date" value={reservationDate} />
          </Field>
          <Field label="Jam tersedia">
            <select className={inputClass} onChange={(event) => setStartTime(event.target.value)} required value={startTime}>
              <option value="">Pilih jam</option>
              {slots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
            </select>
          </Field>
          <Field label="Tipe pembayaran">
            <select className={inputClass} onChange={(event) => choosePaymentType(event.target.value as PaymentType | "")} required value={paymentType}>
              <option value="">Pilih pembayaran</option>
              <option value="dp">DP 50%</option>
              <option value="full">Full Payment</option>
            </select>
          </Field>
          <Field label="Nominal pembayaran">
            <input
              className={inputClass}
              min={1}
              onChange={(event) => setPaymentAmount(event.target.value)}
              placeholder={suggestedPaymentAmount ? String(suggestedPaymentAmount) : "Masukkan nominal"}
              required
              type="number"
              value={paymentAmount}
            />
          </Field>
          <Field label="Upload bukti pembayaran">
            <input
              accept="image/*"
              className={inputClass}
              onChange={(event) => void handleProofFile(event.target.files?.[0])}
              required
              type="file"
            />
          </Field>
          <ErrorText message={message} />
          <Button disabled={!startTime || !paymentType || !paymentAmountValue || !proofImage} type="submit"><CalendarCheck size={17} />Buat Reservasi</Button>
        </Card>
        <Card>
          <h2 className="text-xl font-bold">Ringkasan</h2>
          <dl className="mt-5 grid gap-4 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-ink/60">Durasi</dt><dd className="font-bold">{selectedService?.duration ?? 0} menit</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-ink/60">Total</dt><dd className="font-bold text-clay">{formatRupiah(selectedService?.price ?? 0)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-ink/60">Dibayar sekarang</dt><dd className="font-bold text-mint">{formatRupiah(paymentAmountValue || 0)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-ink/60">Tipe payment</dt><dd className="font-bold">{paymentLabel(paymentType || undefined)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-ink/60">Slot tersedia</dt><dd className="font-bold">{slots.length}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-ink/60">Bukti</dt><dd className="max-w-40 truncate font-bold">{proofFileName || "-"}</dd></div>
            {canPreviewProof(proofImage) ? (
              <img alt="Preview bukti pembayaran" className="mt-2 max-h-52 w-full rounded-md border border-ink/10 object-contain" src={proofImage} />
            ) : null}
          </dl>
        </Card>
      </form>
    </RequireRole>
  );
}

export function CustomerReservationsPage() {
  const { currentUser } = useData();
  const { services, barbers, customers, reservations, loading } = useLookups();
  const mine = reservations.filter((reservation) => reservation.customerId === currentUser?.id);
  return (
    <RequireRole role="customer">
      <PageTitle title="Riwayat Reservasi" description="Daftar reservasi yang pernah dibuat oleh akun customer ini." />
      <div className="mt-8">
        {loading ? <LoadingText /> : <ReservationTable barbers={barbers} customers={customers} hrefFor={(item) => `/customer/reservations/${item.id}`} reservations={mine} services={services} />}
      </div>
    </RequireRole>
  );
}

function ReservationDetail({
  mode,
  reservation,
  services,
  barbers,
  customers,
  onCancel,
  onStatus
}: {
  mode: "customer" | "barber" | "admin";
  reservation: Reservation;
  services: Service[];
  barbers: User[];
  customers: User[];
  onCancel?: () => Promise<void>;
  onStatus?: (status: ReservationStatus) => Promise<void>;
}) {
  const service = services.find((item) => item.id === reservation.serviceId);
  const barber = barbers.find((item) => item.id === reservation.barberId);
  const customer = customers.find((item) => item.id === reservation.customerId);
  const paymentAmount = reservation.paymentAmount ?? reservation.paidAmount ?? 0;
  return (
    <Card>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">{service?.name ?? reservation.serviceName}</h2>
          <p className="mt-2 text-sm text-ink/65">{formatDate(reservation.reservationDate)}, {reservation.startTime} - {reservation.endTime}</p>
        </div>
        <StatusBadge status={reservation.status} />
      </div>
      <dl className="mt-6 grid gap-4 text-sm md:grid-cols-2">
        <div><dt className="text-ink/55">Customer</dt><dd className="font-bold">{customer?.name ?? reservation.customerName ?? "-"}</dd></div>
        <div><dt className="text-ink/55">Barber</dt><dd className="font-bold">{barber?.name ?? reservation.barberName ?? "-"}</dd></div>
        <div><dt className="text-ink/55">Telepon Customer</dt><dd className="font-bold">{customer?.phone ?? reservation.customerPhone ?? "-"}</dd></div>
        <div><dt className="text-ink/55">Harga Booking</dt><dd className="font-bold text-clay">{formatRupiah(reservation.totalPrice)}</dd></div>
        <div><dt className="text-ink/55">Tipe Pembayaran</dt><dd className="font-bold">{paymentLabel(reservation.paymentType)}</dd></div>
        <div><dt className="text-ink/55">Status Pembayaran</dt><dd className="font-bold">{reservation.paymentStatus ?? "-"}</dd></div>
        <div><dt className="text-ink/55">Nominal Dibayar</dt><dd className="font-bold">{formatRupiah(paymentAmount)}</dd></div>
        <div><dt className="text-ink/55">Bukti Pembayaran</dt><dd className="max-w-full truncate font-bold">{reservation.paymentProof ?? "-"}</dd></div>
        {canPreviewProof(reservation.paymentProof) ? (
          <div className="md:col-span-2">
            <dt className="text-ink/55">Preview Bukti Pembayaran</dt>
            <dd className="mt-2 rounded-md border border-ink/10 bg-paper p-3">
              <img alt="Bukti pembayaran customer" className="max-h-[520px] w-full rounded-md object-contain" src={reservation.paymentProof} />
            </dd>
          </div>
        ) : null}
        <div><dt className="text-ink/55">Alasan Reject Pembayaran</dt><dd className="font-bold">{reservation.paymentRejectedReason ?? "-"}</dd></div>
        <div><dt className="text-ink/55">Direview Pada</dt><dd className="font-bold">{reservation.paymentReviewedAt ? formatDate(reservation.paymentReviewedAt.slice(0, 10)) : "-"}</dd></div>
        <div><dt className="text-ink/55">No-Show</dt><dd className="font-bold">{reservation.isNoShow ? "Ya" : "Tidak"}</dd></div>
        <div><dt className="text-ink/55">Request Selesai Barber</dt><dd className="font-bold">{reservation.barberCompletionRequested ? "Menunggu admin" : "-"}</dd></div>
        <div><dt className="text-ink/55">Catatan Barber</dt><dd className="font-bold">{reservation.barberCompletionNote ?? "-"}</dd></div>
        <div><dt className="text-ink/55">ID Reservasi</dt><dd className="font-mono text-xs">{reservation.id}</dd></div>
      </dl>
      {mode === "customer" && reservation.status !== "completed" && reservation.status !== "cancelled" ? (
        <Button className="mt-6" onClick={onCancel} variant="danger"><X size={17} />Batalkan Reservasi</Button>
      ) : null}
      {mode === "admin" ? (
        <div className="mt-6 flex flex-wrap gap-3">
          {reservation.status === "confirmed" ? <Button onClick={() => onStatus?.("completed")}><Check size={17} />Selesai</Button> : null}
          {reservation.status !== "completed" && reservation.status !== "cancelled" ? <Button onClick={() => onStatus?.("cancelled")} variant="danger"><X size={17} />Cancel</Button> : null}
        </div>
      ) : null}
    </Card>
  );
}

export function CustomerReservationDetailPage() {
  const params = useParams<{ id: string }>();
  const data = useData();
  const { currentUser } = data;
  const router = useRouter();
  const { services, barbers, customers, reservations, loading, refresh } = useLookups();
  const routeId = typeof params?.id === "string" ? params.id : "";
  const reservation = reservations.find((item) => item.id === routeId && item.customerId === currentUser?.id);

  return (
    <RequireRole role="customer">
      <PageTitle title="Detail Reservasi" />
      <div className="mt-8">
        {loading ? <LoadingText /> : reservation ? (
          <ReservationDetail
            barbers={barbers}
            customers={customers}
            mode="customer"
            onCancel={async () => {
              await data.cancelReservation(reservation.id, "customer");
              await refresh();
              router.refresh();
            }}
            reservation={reservation}
            services={services}
          />
        ) : <Card><p className="text-sm text-ink/60">Reservasi tidak ditemukan.</p></Card>}
      </div>
    </RequireRole>
  );
}

export function CustomerInboxPage() {
  const data = useData();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    void data
      .listMyMessages()
      .then(setMessages)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Inbox belum tersedia."))
      .finally(() => setLoading(false));
  }, [data]);

  return (
    <RequireRole role="customer">
      <PageTitle title="Inbox Customer" description="Pesan dari admin terkait reservasi dan pembayaran." />
      <div className="mt-8 grid gap-4">
        {loading ? <LoadingText /> : error ? <ApiState message={error} /> : messages.length ? (
          messages.map((item) => (
            <Card key={item.id}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Inbox size={18} className={item.isRead ? "text-ink/35" : "text-mint"} />
                    <h2 className="text-lg font-bold">{item.title}</h2>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-ink/60">{item.message}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-paper px-3 py-1 text-xs font-bold">{item.messageType}</span>
                  <LinkButton href={`/customer/inbox/${item.id}`} variant="secondary">Buka</LinkButton>
                </div>
              </div>
            </Card>
          ))
        ) : <Card><p className="text-sm text-ink/60">Belum ada pesan.</p></Card>}
      </div>
    </RequireRole>
  );
}

export function CustomerMessageDetailPage() {
  const params = useParams<{ id: string }>();
  const data = useData();
  const routeId = typeof params?.id === "string" ? params.id : "";
  const [message, setMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!routeId) {
      setError("Pesan tidak ditemukan.");
      setLoading(false);
      return;
    }
    setLoading(true);
    void data
      .getMessage(routeId)
      .then(async (item) => {
        setMessage(item);
        if (!item.isRead) setMessage(await data.markMessageRead(item.id));
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Pesan belum tersedia."))
      .finally(() => setLoading(false));
  }, [data, routeId]);

  return (
    <RequireRole role="customer">
      <PageTitle title="Detail Pesan" />
      <div className="mt-8">
        {loading ? <LoadingText /> : error ? <ApiState message={error} /> : message ? (
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">{message.title}</h2>
                <p className="mt-1 text-sm text-ink/55">{message.messageType}</p>
              </div>
              <span className="rounded-full bg-paper px-3 py-1 text-xs font-bold">{message.isRead ? "read" : "unread"}</span>
            </div>
            <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-ink/75">{message.message}</p>
            {message.reservationId ? <p className="mt-6 font-mono text-xs text-ink/45">Reservasi: {message.reservationId}</p> : null}
          </Card>
        ) : <Card><p className="text-sm text-ink/60">Pesan tidak ditemukan.</p></Card>}
      </div>
    </RequireRole>
  );
}

export function ProfilePage({ role }: { role: "customer" | "barber" }) {
  const { currentUser } = useData();
  return (
    <RequireRole role={role}>
      <PageTitle title="Profil" />
      <Card className="mt-8 max-w-xl">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-md bg-ink text-white"><UserRound /></div>
          <div>
            <h2 className="text-2xl font-bold">{currentUser?.name}</h2>
            <p className="text-sm text-ink/60">{currentUser?.email}</p>
          </div>
        </div>
        <dl className="mt-6 grid gap-4 text-sm">
          <div className="flex justify-between gap-4"><dt className="text-ink/60">Role</dt><dd className="font-bold">{currentUser?.role}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-ink/60">Telepon</dt><dd className="font-bold">{currentUser?.phone}</dd></div>
          {currentUser?.specialization ? <div className="flex justify-between gap-4"><dt className="text-ink/60">Spesialisasi</dt><dd className="font-bold">{currentUser.specialization}</dd></div> : null}
        </dl>
      </Card>
    </RequireRole>
  );
}

export function BarberSchedulePage() {
  const data = useData();
  const { currentUser } = data;
  const { services, barbers, customers, reservations, loading } = useLookups();
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [noteByReservation, setNoteByReservation] = useState<Record<string, string>>({});
  const [actionMessage, setActionMessage] = useState("");
  const mine = reservations.filter((reservation) => reservation.barberId === currentUser?.id);
  const today = mine.filter((reservation) => reservation.reservationDate === selectedDate);

  async function requestDone(reservation: Reservation) {
    setActionMessage("");
    try {
      await data.requestCompletion(reservation.id, { note: noteByReservation[reservation.id] });
      setActionMessage("Request completed berhasil dikirim ke admin.");
    } catch (caught) {
      setActionMessage(caught instanceof Error ? caught.message : "Request completed gagal.");
    }
  }

  return (
    <RequireRole role="barber">
      <PageTitle title="Jadwal Reservasi" description="Daftar reservasi per tanggal dan request completed untuk admin." />
      {loading ? <LoadingText /> : (
        <>
          <Card className="mt-8">
            <Field label="Filter tanggal">
              <input className={inputClass} onChange={(event) => setSelectedDate(event.target.value)} type="date" value={selectedDate} />
            </Field>
          </Card>
          <ErrorText message={actionMessage} />
          <div className="mt-8 grid gap-4">
            {today.length ? today.map((reservation) => {
              const service = services.find((item) => item.id === reservation.serviceId);
              const customer = customers.find((item) => item.id === reservation.customerId);
              const customerName = customer?.name ?? reservation.customerName ?? "Customer";
              return (
                <Card key={reservation.id}>
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h2 className="text-xl font-bold">{service?.name ?? reservation.serviceName ?? "Layanan"}</h2>
                      <p className="mt-1 text-sm text-ink/60">{customerName} / {reservation.startTime}-{reservation.endTime}</p>
                      <p className="mt-1 text-xs text-ink/45">Telepon: {customer?.phone ?? reservation.customerPhone ?? "-"}</p>
                      <p className="mt-2 text-sm text-ink/60">Payment: {paymentLabel(reservation.paymentType)} / {reservation.paymentStatus ?? "-"}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={reservation.status} />
                      <LinkButton href={`/barber/reservations/${reservation.id}`} variant="secondary">Detail</LinkButton>
                    </div>
                  </div>
                  {reservation.status === "confirmed" ? (
                    <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
                      <input
                        className={inputClass}
                        onChange={(event) => setNoteByReservation((current) => ({ ...current, [reservation.id]: event.target.value }))}
                        placeholder="Catatan selesai opsional"
                        value={noteByReservation[reservation.id] ?? ""}
                      />
                      <Button onClick={() => requestDone(reservation)}><Check size={17} />Request Completed</Button>
                    </div>
                  ) : null}
                </Card>
              );
            }) : <Card><p className="text-sm text-ink/60">Tidak ada reservasi pada tanggal ini.</p></Card>}
          </div>
        </>
      )}
    </RequireRole>
  );
}

export function BarberHistoryPage() {
  const { currentUser } = useData();
  const { services, barbers, customers, reservations, loading } = useLookups();
  const completed = reservations.filter((reservation) => reservation.barberId === currentUser?.id && reservation.status === "completed");
  return (
    <RequireRole role="barber">
      <PageTitle title="Riwayat Layanan" description="Reservasi completed yang terkait dengan barber ini." />
      <div className="mt-8">
        {loading ? <LoadingText /> : <ReservationTable barbers={barbers} customers={customers} hrefFor={(item) => `/barber/reservations/${item.id}`} reservations={completed} services={services} />}
      </div>
    </RequireRole>
  );
}

export function BarberReservationDetailPage() {
  const params = useParams<{ id: string }>();
  const { currentUser } = useData();
  const { services, barbers, customers, reservations, loading } = useLookups();
  const routeId = typeof params?.id === "string" ? params.id : "";
  const reservation = reservations.find((item) => item.id === routeId && item.barberId === currentUser?.id);
  return (
    <RequireRole role="barber">
      <PageTitle title="Detail Reservasi" />
      <div className="mt-8">
        {loading ? <LoadingText /> : reservation ? <ReservationDetail barbers={barbers} customers={customers} mode="barber" reservation={reservation} services={services} /> : <Card><p className="text-sm text-ink/60">Reservasi tidak ditemukan.</p></Card>}
      </div>
    </RequireRole>
  );
}

export function AdminServicesPage() {
  const data = useData();
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState<ServicePayload>({ name: "", description: "", price: 35000, duration: 30, status: "active" });
  const [editing, setEditing] = useState<string | null>(null);
  const refresh = useCallback(async () => setServices(await data.listServices()), [data]);
  useEffect(() => { void refresh(); }, [refresh]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (editing) await data.updateService(editing, form);
    else await data.createService(form);
    setForm({ name: "", description: "", price: 35000, duration: 30, status: "active" });
    setEditing(null);
    await refresh();
  }

  return (
    <RequireRole role="admin">
      <PageTitle title="Manajemen Layanan" />
      <div className="mt-8 grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card>
          <form className="grid gap-4" onSubmit={submit}>
            <Field label="Nama layanan"><input className={inputClass} onChange={(event) => setForm({ ...form, name: event.target.value })} required value={form.name} /></Field>
            <Field label="Deskripsi"><textarea className={inputClass} onChange={(event) => setForm({ ...form, description: event.target.value })} value={form.description} /></Field>
            <Field label="Harga"><input className={inputClass} min={1} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} type="number" value={form.price} /></Field>
            <Field label="Durasi menit"><input className={inputClass} min={1} onChange={(event) => setForm({ ...form, duration: Number(event.target.value) })} type="number" value={form.duration} /></Field>
            <Field label="Status"><select className={inputClass} onChange={(event) => setForm({ ...form, status: event.target.value as ServicePayload["status"] })} value={form.status}><option value="active">active</option><option value="inactive">inactive</option></select></Field>
            <Button type="submit"><Save size={17} />{editing ? "Simpan" : "Tambah"}</Button>
          </form>
        </Card>
        <div className="grid gap-4">
          {services.map((service) => (
            <Card key={service.id}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div><h2 className="text-xl font-bold">{service.name}</h2><p className="text-sm text-ink/60">{formatRupiah(service.price)} / {service.duration} menit</p></div>
                <div className="flex gap-2"><StatusBadge status={service.status} /><Button onClick={() => { setEditing(service.id); setForm(service); }} variant="secondary">Edit</Button><Button onClick={async () => { await data.deactivateService(service.id); await refresh(); }} variant="secondary">Nonaktifkan</Button></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </RequireRole>
  );
}

export function AdminBarbersPage() {
  const data = useData();
  const [barbers, setBarbers] = useState<User[]>([]);
  const [form, setForm] = useState<BarberPayload>({ name: "", email: "", phone: "", password: "password123", specialization: "", status: "active" });
  const [editing, setEditing] = useState<string | null>(null);
  const refresh = useCallback(async () => setBarbers(await data.listBarbers()), [data]);
  useEffect(() => { void refresh(); }, [refresh]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (editing) await data.updateBarber(editing, form);
    else await data.createBarber(form);
    setForm({ name: "", email: "", phone: "", password: "password123", specialization: "", status: "active" });
    setEditing(null);
    await refresh();
  }

  return (
    <RequireRole role="admin">
      <PageTitle title="Manajemen Barber" />
      <div className="mt-8 grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card>
          <form className="grid gap-4" onSubmit={submit}>
            <Field label="Nama"><input className={inputClass} onChange={(event) => setForm({ ...form, name: event.target.value })} required value={form.name} /></Field>
            <Field label="Email"><input className={inputClass} onChange={(event) => setForm({ ...form, email: event.target.value })} required type="email" value={form.email} /></Field>
            <Field label="Telepon"><input className={inputClass} onChange={(event) => setForm({ ...form, phone: event.target.value })} value={form.phone} /></Field>
            <Field label="Spesialisasi"><input className={inputClass} onChange={(event) => setForm({ ...form, specialization: event.target.value })} value={form.specialization} /></Field>
            <Field label="Password"><input className={inputClass} onChange={(event) => setForm({ ...form, password: event.target.value })} value={form.password} /></Field>
            <Field label="Status"><select className={inputClass} onChange={(event) => setForm({ ...form, status: event.target.value as BarberPayload["status"] })} value={form.status}><option value="active">active</option><option value="inactive">inactive</option></select></Field>
            <Button type="submit"><Save size={17} />{editing ? "Simpan" : "Tambah"}</Button>
          </form>
        </Card>
        <div className="grid gap-4">
          {barbers.map((barber) => (
            <Card key={barber.id}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div><h2 className="text-xl font-bold">{barber.name}</h2><p className="text-sm text-ink/60">{barber.email} / {barber.specialization}</p></div>
                <div className="flex gap-2"><StatusBadge status={barber.status} /><Button onClick={() => { setEditing(barber.id); setForm({ ...barber, password: "" }); }} variant="secondary">Edit</Button><Button onClick={async () => { await data.deactivateBarber(barber.id); await refresh(); }} variant="secondary">Nonaktifkan</Button></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </RequireRole>
  );
}

export function AdminSchedulesPage() {
  const data = useData();
  const { barbers, schedules, loading, refresh } = useLookups();
  const activeBarbers = barbers.filter((barber) => barber.status === "active");
  const [barberId, setBarberId] = useState("");
  const [workDays, setWorkDays] = useState<WorkDay[]>(["monday", "tuesday", "wednesday", "thursday", "friday"]);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("21:00");
  const [status, setStatus] = useState<Schedule["status"]>("available");

  useEffect(() => {
    if (!barberId && activeBarbers[0]) setBarberId(activeBarbers[0].id);
  }, [activeBarbers, barberId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    await data.upsertSchedule({ barberId, workDays, startTime, endTime, status });
    await refresh();
  }

  return (
    <RequireRole role="admin">
      <PageTitle title="Manajemen Jadwal Barber" />
      <div className="mt-8 grid gap-6 lg:grid-cols-[420px_1fr]">
        <Card>
          <form className="grid gap-4" onSubmit={submit}>
            <Field label="Barber"><select className={inputClass} onChange={(event) => setBarberId(event.target.value)} value={barberId}>{activeBarbers.map((barber) => <option key={barber.id} value={barber.id}>{barber.name}</option>)}</select></Field>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(workDayLabels) as WorkDay[]).map((day) => (
                <label className="flex items-center gap-2 rounded-md border border-ink/10 bg-white px-3 py-2 text-sm" key={day}>
                  <input checked={workDays.includes(day)} onChange={(event) => setWorkDays((current) => event.target.checked ? [...current, day] : current.filter((item) => item !== day))} type="checkbox" />
                  {workDayLabels[day]}
                </label>
              ))}
            </div>
            <Field label="Jam mulai"><input className={inputClass} onChange={(event) => setStartTime(event.target.value)} type="time" value={startTime} /></Field>
            <Field label="Jam selesai"><input className={inputClass} onChange={(event) => setEndTime(event.target.value)} type="time" value={endTime} /></Field>
            <Field label="Status"><select className={inputClass} onChange={(event) => setStatus(event.target.value as Schedule["status"])} value={status}><option value="available">available</option><option value="unavailable">unavailable</option></select></Field>
            <Button disabled={!barberId} type="submit"><Save size={17} />Simpan Jadwal</Button>
          </form>
        </Card>
        <div className="grid gap-4">
          {loading ? <LoadingText /> : schedules.map((schedule) => {
            const barber = barbers.find((item) => item.id === schedule.barberId);
            return (
              <Card key={schedule.id}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div><h2 className="text-xl font-bold">{barber?.name}</h2><p className="text-sm text-ink/60">{schedule.workDays.map((day) => workDayLabels[day]).join(", ")} / {schedule.startTime}-{schedule.endTime}</p></div>
                  <StatusBadge status={schedule.status} />
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </RequireRole>
  );
}

export function AdminReservationsPage() {
  const lookups = useLookups();
  return (
    <RequireRole role="admin">
      <PageTitle title="Manajemen Reservasi" />
      <div className="mt-8">
        {lookups.loading ? <LoadingText /> : (
          <ReservationTable
            barbers={lookups.barbers}
            customers={lookups.customers}
            hrefFor={(item) => `/admin/reservations/${item.id}`}
            reservations={lookups.reservations}
            services={lookups.services}
          />
        )}
      </div>
    </RequireRole>
  );
}

export function AdminReservationDetailPage() {
  const params = useParams<{ id: string }>();
  const data = useData();
  const { services, barbers, customers, reservations, loading, refresh } = useLookups();
  const routeId = typeof params?.id === "string" ? params.id : "";
  const reservation = reservations.find((item) => item.id === routeId);
  const [adminMessage, setAdminMessage] = useState("");
  const [paymentRejectedReason, setPaymentRejectedReason] = useState("");
  const [cancelForm, setCancelForm] = useState<{
    reason: string;
    cancelAction: CancelAction;
    suggestedDate: string;
    suggestedTime: string;
    suggestedBarberId: string;
    refundStatus: RefundStatus;
  }>({
    reason: "",
    cancelAction: "cancel_only",
    suggestedDate: "",
    suggestedTime: "",
    suggestedBarberId: "",
    refundStatus: "none"
  });
  const [messageForm, setMessageForm] = useState<{ title: string; message: string; messageType: MessageType }>({
    title: "",
    message: "",
    messageType: "general"
  });

  async function runAction(action: () => Promise<unknown>, success: string) {
    setAdminMessage("");
    try {
      await action();
      await refresh();
      setAdminMessage(success);
    } catch (caught) {
      setAdminMessage(caught instanceof Error ? caught.message : "Aksi admin gagal.");
    }
  }

  return (
    <RequireRole role="admin">
      <PageTitle title="Detail Reservasi" />
      <div className="mt-8 grid gap-6">
        {loading ? <LoadingText /> : reservation ? (
          <>
            <ReservationDetail
              barbers={barbers}
              customers={customers}
              mode="admin"
              onStatus={async (status) => {
                if (status === "cancelled") await data.cancelReservation(reservation.id, "admin");
                else await data.updateReservationStatus(reservation.id, status);
                await refresh();
              }}
              reservation={reservation}
              services={services}
            />
            <ErrorText message={adminMessage} />
            <Card>
              <h2 className="text-xl font-bold">Review Bukti Pembayaran</h2>
              <p className="mt-2 text-sm text-ink/60">
                Approve reservasi jika bukti pembayaran valid. Reject akan membatalkan reservasi.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-[auto_1fr_auto]">
                <Button
                  disabled={reservation.status !== "pending" || reservation.paymentStatus !== "pending"}
                  onClick={() => runAction(() => data.approveReservation(reservation.id), "Reservasi dan pembayaran berhasil di-approve.")}
                >
                  <Check size={17} />Approve Reservation
                </Button>
                <input
                  className={inputClass}
                  onChange={(event) => setPaymentRejectedReason(event.target.value)}
                  placeholder="Alasan reject bukti pembayaran"
                  value={paymentRejectedReason}
                />
                <Button
                  disabled={reservation.status !== "pending" || reservation.paymentStatus !== "pending"}
                  onClick={() => runAction(() => data.rejectReservation(reservation.id, paymentRejectedReason), "Reservasi ditolak dan dibatalkan.")}
                  variant="danger"
                >
                  <X size={17} />Reject Reservation
                </Button>
              </div>
            </Card>
            <Card>
              <h2 className="text-xl font-bold">Admin Cancel</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Cancel action">
                  <select className={inputClass} onChange={(event) => setCancelForm({ ...cancelForm, cancelAction: event.target.value as CancelAction })} value={cancelForm.cancelAction}>
                    <option value="cancel_only">Cancel biasa</option>
                    <option value="reschedule_suggestion">Sarankan jadwal lain</option>
                    <option value="change_barber_suggestion">Sarankan barber lain</option>
                    <option value="refund_dummy">Refund dummy</option>
                  </select>
                </Field>
                <Field label="Refund status">
                  <select className={inputClass} onChange={(event) => setCancelForm({ ...cancelForm, refundStatus: event.target.value as RefundStatus })} value={cancelForm.refundStatus}>
                    <option value="none">none</option>
                    <option value="pending">pending</option>
                    <option value="processed">processed</option>
                  </select>
                </Field>
                <Field label="Alasan cancel">
                  <input className={inputClass} onChange={(event) => setCancelForm({ ...cancelForm, reason: event.target.value })} value={cancelForm.reason} />
                </Field>
                <Field label="Suggested date">
                  <input className={inputClass} onChange={(event) => setCancelForm({ ...cancelForm, suggestedDate: event.target.value })} type="date" value={cancelForm.suggestedDate} />
                </Field>
                <Field label="Suggested time">
                  <input className={inputClass} onChange={(event) => setCancelForm({ ...cancelForm, suggestedTime: event.target.value })} type="time" value={cancelForm.suggestedTime} />
                </Field>
                <Field label="Suggested barber">
                  <select className={inputClass} onChange={(event) => setCancelForm({ ...cancelForm, suggestedBarberId: event.target.value })} value={cancelForm.suggestedBarberId}>
                    <option value="">Tidak ada</option>
                    {barbers.map((barber) => <option key={barber.id} value={barber.id}>{barber.name}</option>)}
                  </select>
                </Field>
              </div>
              <Button className="mt-5" onClick={() => runAction(() => data.adminCancelReservation(reservation.id, cancelForm), "Reservasi berhasil dicancel.")} variant="danger">
                <X size={17} />Cancel dengan Opsi
              </Button>
            </Card>
            <Card>
              <h2 className="text-xl font-bold">Aksi Cepat Admin</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button onClick={() => runAction(() => data.markNoShow(reservation.id), "Reservasi ditandai no-show.")} variant="danger">Mark No-Show</Button>
                <Button onClick={() => runAction(() => data.confirmCompleted(reservation.id), "Reservasi dikonfirmasi completed.")}>Confirm Completed</Button>
              </div>
            </Card>
            <Card>
              <h2 className="text-xl font-bold">Kirim Pesan Customer</h2>
              <div className="mt-4 grid gap-4">
                <Field label="Judul">
                  <input className={inputClass} onChange={(event) => setMessageForm({ ...messageForm, title: event.target.value })} value={messageForm.title} />
                </Field>
                <Field label="Tipe pesan">
                  <select className={inputClass} onChange={(event) => setMessageForm({ ...messageForm, messageType: event.target.value as MessageType })} value={messageForm.messageType}>
                    <option value="general">general</option>
                    <option value="payment">payment</option>
                    <option value="cancel">cancel</option>
                    <option value="reschedule_suggestion">reschedule_suggestion</option>
                    <option value="change_barber_suggestion">change_barber_suggestion</option>
                    <option value="refund">refund</option>
                    <option value="no_show">no_show</option>
                  </select>
                </Field>
                <Field label="Pesan">
                  <textarea className={inputClass} onChange={(event) => setMessageForm({ ...messageForm, message: event.target.value })} value={messageForm.message} />
                </Field>
                <Button
                  onClick={() => runAction(
                    () => data.sendMessage({ ...messageForm, customerId: reservation.customerId, reservationId: reservation.id }),
                    "Pesan berhasil dikirim."
                  )}
                >
                  <Send size={17} />Kirim Pesan
                </Button>
              </div>
            </Card>
          </>
        ) : <Card><p className="text-sm text-ink/60">Reservasi tidak ditemukan.</p></Card>}
      </div>
    </RequireRole>
  );
}

export function OwnerDashboardPage() {
  const data = useData();
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [summary, setSummary] = useState<OwnerDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    void data
      .getOwnerDashboardSummary({ date: selectedDate })
      .then(setSummary)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Owner dashboard belum tersedia."))
      .finally(() => setLoading(false));
  }, [data, selectedDate]);

  const dailyCashflowTotal = Math.max(summary?.dailyCashflow ?? 0, 1);
  const dpShare = summary ? Math.round((summary.dailyDpCashflow / dailyCashflowTotal) * 100) : 0;
  const fullShare = summary ? Math.round((summary.dailyFullCashflow / dailyCashflowTotal) * 100) : 0;
  const dailyStatusTotal = Math.max(summary?.dailyReservationCount ?? 0, 1);
  const topServiceMax = Math.max(...(summary?.topServices.map((item) => item.total) ?? [1]), 1);
  const barberPerformanceMax = Math.max(
    ...(summary?.barberPerformance.map((item) => item.completed + item.cancelled + item.noShow) ?? [1]),
    1
  );

  return (
    <RequireRole role="owner">
      <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <ShadBadge variant="outline">Owner board</ShadBadge>
            <h1 className="mt-4 text-3xl font-bold tracking-normal text-zinc-950 md:text-4xl">Cashflow Monitoring</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Pantau pemasukan harian dari reservasi approved, lihat komposisi DP/full, dan cek performa operasional tanpa akses edit.
            </p>
          </div>
          <div className="grid min-w-56 gap-2">
            <label className="text-xs font-semibold uppercase text-zinc-500">Tanggal laporan</label>
            <ShadInput onChange={(event) => setSelectedDate(event.target.value)} type="date" value={selectedDate} />
          </div>
        </div>
      </div>

      <div className="mt-6">
        {loading ? <LoadingText /> : error ? <ApiState message={error} /> : summary ? (
          <div className="grid gap-6">
            <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
              <ShadCard className="overflow-hidden border-emerald-200 bg-emerald-50 text-zinc-950">
                <ShadCardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <ShadCardDescription className="font-medium text-emerald-700">Total cashflow approved</ShadCardDescription>
                      <ShadCardTitle className="mt-3 text-4xl font-black leading-tight text-zinc-950 md:text-5xl">
                        {formatRupiah(summary.dailyCashflow)}
                      </ShadCardTitle>
                      <p className="mt-3 text-sm text-zinc-600">{formatDate(summary.selectedDate)} - {summary.cashflowItems.length} transaksi masuk</p>
                    </div>
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-md bg-emerald-600 text-white shadow-sm">
                      <WalletCards size={27} />
                    </span>
                  </div>
                </ShadCardHeader>
                <ShadCardContent>
                  <div className="rounded-md border border-emerald-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase text-zinc-500">
                      <span>Split pembayaran</span>
                      <span className="text-zinc-700">{dpShare}% DP / {fullShare}% Full</span>
                    </div>
                    <div className="flex h-3 overflow-hidden rounded-full bg-emerald-100">
                      <div className="bg-amber-400" style={{ width: `${dpShare}%` }} />
                      <div className="bg-emerald-500" style={{ width: `${fullShare}%` }} />
                    </div>
                    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      <div className="rounded-md border border-amber-100 bg-amber-50 p-3">
                        <p className="text-zinc-600">DP masuk</p>
                        <p className="mt-1 text-xl font-bold text-zinc-950">{formatRupiah(summary.dailyDpCashflow)}</p>
                      </div>
                      <div className="rounded-md border border-emerald-100 bg-emerald-50 p-3">
                        <p className="text-zinc-600">Full payment masuk</p>
                        <p className="mt-1 text-xl font-bold text-zinc-950">{formatRupiah(summary.dailyFullCashflow)}</p>
                      </div>
                    </div>
                  </div>
                </ShadCardContent>
              </ShadCard>

              <ShadCard>
                <ShadCardHeader className="pb-3">
                  <ShadCardDescription>Reservasi pada tanggal ini</ShadCardDescription>
                  <ShadCardTitle className="flex items-center gap-2 text-4xl">
                    <CalendarDays size={28} />{summary.dailyReservationCount}
                  </ShadCardTitle>
                </ShadCardHeader>
                <ShadCardContent className="grid gap-4">
                  {[
                    ["Pending", summary.dailyPendingReservations, "bg-amber-400"],
                    ["Confirmed", summary.dailyConfirmedReservations, "bg-emerald-500"],
                    ["Completed", summary.dailyCompletedReservations, "bg-sky-500"],
                    ["Cancelled", summary.dailyCancelledReservations, "bg-rose-500"]
                  ].map(([label, value, color]) => (
                    <div key={label} className="grid gap-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-500">{label}</span>
                        <strong>{value}</strong>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                        <div className={`${color} h-full rounded-full`} style={{ width: `${(Number(value) / dailyStatusTotal) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </ShadCardContent>
              </ShadCard>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              {[
                ["Total Reservasi", summary.totalReservations, <BarChart3 size={18} key="icon" />, "Semua data"],
                ["Approved Payment", summary.totalApprovedPayments, <Banknote size={18} key="icon" />, "Total approved"],
                ["Barber Aktif", summary.activeBarbers, <UsersRound size={18} key="icon" />, "Siap melayani"],
                ["Layanan Aktif", summary.activeServices, <Scissors size={18} key="icon" />, "Bisa dipesan"]
              ].map(([label, value, icon, note]) => (
                <ShadCard key={String(label)}>
                  <ShadCardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-zinc-500">{label}</p>
                        <p className="mt-2 text-2xl font-bold">{value}</p>
                        <p className="mt-1 text-xs text-zinc-400">{note}</p>
                      </div>
                      <span className="grid h-10 w-10 place-items-center rounded-md bg-zinc-100 text-zinc-700">{icon}</span>
                    </div>
                  </ShadCardContent>
                </ShadCard>
              ))}
            </div>

            <ShadCard>
              <ShadCardHeader className="flex-col gap-3 md:flex-row md:items-center md:justify-between md:space-y-0">
                <div>
                  <ShadCardTitle>Cashflow Harian</ShadCardTitle>
                  <ShadCardDescription>Transaksi approved pada tanggal {formatDate(summary.selectedDate)}.</ShadCardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ShadBadge variant="success">{formatRupiah(summary.dailyCashflow)}</ShadBadge>
                  <ShadBadge variant="outline">{summary.cashflowItems.length} transaksi</ShadBadge>
                </div>
              </ShadCardHeader>
              <ShadCardContent>
                {summary.cashflowItems.length ? (
                  <div className="overflow-x-auto rounded-md border border-zinc-200">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead className="bg-zinc-50 text-zinc-500">
                        <tr>
                          <th className="px-4 py-3 font-medium">Jam</th>
                          <th className="px-4 py-3 font-medium">Customer</th>
                          <th className="px-4 py-3 font-medium">Layanan</th>
                          <th className="px-4 py-3 font-medium">Barber</th>
                          <th className="px-4 py-3 font-medium">Tipe</th>
                          <th className="px-4 py-3 text-right font-medium">Masuk</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.cashflowItems.map((item, index) => (
                          <tr className="border-t border-zinc-200 hover:bg-zinc-50" key={item.reservationId}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <span className="grid h-8 w-8 place-items-center rounded-md bg-zinc-100 text-xs font-bold text-zinc-600">{index + 1}</span>
                                <span className="font-semibold">{item.startTime}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-medium">{item.customerName ?? "-"}</td>
                            <td className="px-4 py-3 text-zinc-600">{item.serviceName ?? "-"}</td>
                            <td className="px-4 py-3 text-zinc-600">{item.barberName ?? "-"}</td>
                            <td className="px-4 py-3"><ShadBadge variant="outline">{paymentLabel(item.paymentType)}</ShadBadge></td>
                            <td className="px-4 py-3 text-right text-base font-bold text-emerald-700">{formatRupiah(item.paymentAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="rounded-md border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
                    Belum ada cashflow approved pada tanggal ini.
                  </p>
                )}
              </ShadCardContent>
            </ShadCard>

            <div className="grid gap-6 lg:grid-cols-2">
              <ShadCard>
                <ShadCardHeader>
                  <ShadCardTitle className="flex items-center gap-2"><TrendingUp size={19} />Layanan Terpopuler</ShadCardTitle>
                  <ShadCardDescription>Urutan layanan berdasarkan total booking.</ShadCardDescription>
                </ShadCardHeader>
                <ShadCardContent className="grid gap-3">
                  {summary.topServices?.length ? summary.topServices.map((item) => (
                    <div className="grid gap-2 rounded-md border border-zinc-100 bg-zinc-50 px-3 py-3 text-sm" key={item.serviceId}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold">{item.serviceName}</span>
                        <ShadBadge variant="secondary">{item.total} booking</ShadBadge>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white">
                        <div className="h-full rounded-full bg-zinc-900" style={{ width: `${(item.total / topServiceMax) * 100}%` }} />
                      </div>
                    </div>
                  )) : <p className="text-sm text-zinc-500">Belum ada data layanan.</p>}
                </ShadCardContent>
              </ShadCard>
              <ShadCard>
                <ShadCardHeader>
                  <ShadCardTitle className="flex items-center gap-2"><Activity size={19} />Performa Barber</ShadCardTitle>
                  <ShadCardDescription>Ringkasan completed, cancelled, dan no-show.</ShadCardDescription>
                </ShadCardHeader>
                <ShadCardContent className="grid gap-3">
                  {summary.barberPerformance?.length ? summary.barberPerformance.map((item) => {
                    const total = item.completed + item.cancelled + item.noShow;
                    return (
                    <div className="grid gap-2 rounded-md border border-zinc-100 bg-zinc-50 px-3 py-3 text-sm" key={item.barberId}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold">{item.barberName}</p>
                        <ShadBadge variant="outline">{total} booking</ShadBadge>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(item.completed / barberPerformanceMax) * 100}%` }} />
                      </div>
                      <p className="text-zinc-500">Completed {item.completed} / Cancelled {item.cancelled} / No-show {item.noShow}</p>
                    </div>
                    );
                  }) : <p className="text-sm text-zinc-500">Belum ada data barber.</p>}
                </ShadCardContent>
              </ShadCard>
            </div>
          </div>
        ) : <Card><p className="text-sm text-ink/60">Monitoring belum tersedia.</p></Card>}
      </div>
    </RequireRole>
  );
}
