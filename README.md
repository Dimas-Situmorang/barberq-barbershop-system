# BarberQ Reservation System

**BarberQ** adalah aplikasi web untuk sistem manajemen dan reservasi barbershop. Aplikasi ini membantu customer melakukan reservasi layanan barbershop secara online, sementara admin dapat mengelola layanan, barber, jadwal, reservasi, serta melakukan approval berdasarkan bukti pembayaran customer.

Project ini dikembangkan sebagai aplikasi fullstack dengan integrasi frontend, backend, dan database MongoDB.

---

## Overview

BarberQ dibuat untuk menyelesaikan masalah reservasi barbershop yang masih dilakukan secara manual melalui chat atau pencatatan langsung. Sistem ini memungkinkan proses booking menjadi lebih terstruktur, mengurangi risiko jadwal bentrok, dan membantu admin dalam memantau operasional barbershop.

Fokus utama aplikasi ini adalah:

* Reservasi layanan barbershop secara online
* Validasi jadwal agar tidak terjadi double booking
* Approval reservasi berdasarkan bukti pembayaran DP atau full payment
* Manajemen layanan, barber, dan jadwal
* Dashboard untuk admin, barber, customer, dan owner

---

## Tech Stack

### Frontend

* Next.js
* React
* Tailwind CSS

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* bcrypt
* dotenv
* cors

### Tools

* MongoDB Compass
* Postman
* Git & GitHub

---

## Main Features

### Customer

* Melihat daftar layanan
* Melihat daftar barber
* Membuat reservasi
* Memilih layanan, barber, tanggal, dan jam
* Memilih pembayaran DP atau full payment
* Mengunggah bukti pembayaran
* Melihat status reservasi
* Melihat riwayat reservasi
* Melihat inbox pesan dari admin

### Barber

* Melihat jadwal reservasi harian
* Melihat detail reservasi customer
* Melihat layanan yang harus dikerjakan
* Mengirim request selesai layanan ke admin
* Melihat riwayat layanan selesai

### Admin

* Mengelola layanan
* Mengelola barber
* Mengelola jadwal barber
* Melihat semua reservasi
* Melihat bukti pembayaran customer
* Approve reservasi jika pembayaran valid
* Reject reservasi jika pembayaran tidak valid
* Membatalkan reservasi
* Menandai no-show
* Mengonfirmasi layanan selesai
* Mengirim pesan ke inbox customer

### Owner

* Melihat dashboard monitoring
* Melihat total reservasi
* Melihat reservasi completed, cancelled, dan no-show
* Melihat performa barber
* Melihat layanan paling banyak dipesan
* Melihat ringkasan pembayaran
* Akses hanya untuk monitoring/read-only

---

## Core Business Rules

* Customer tidak dapat membuat reservasi tanpa memilih pembayaran DP atau full payment.
* Customer wajib mengunggah bukti pembayaran saat membuat reservasi.
* Reservasi baru akan berstatus `pending`.
* Admin melakukan approval reservasi berdasarkan bukti pembayaran.
* Jika pembayaran valid, reservasi menjadi `confirmed`.
* Jika pembayaran tidak valid, reservasi menjadi `cancelled`.
* Reservasi dengan status `pending` dan `confirmed` akan memblokir slot jadwal.
* Reservasi dengan status `cancelled` dan `completed` tidak memblokir slot jadwal.
* Sistem mencegah double booking pada barber yang sama di tanggal dan jam yang sama.
* Barber tidak langsung menyelesaikan reservasi, tetapi mengirim request completed ke admin.
* Admin melakukan final confirmation untuk mengubah status menjadi `completed`.
* No-show dicatat sebagai reservasi `cancelled` dengan flag `isNoShow = true`.
* Owner hanya memiliki akses monitoring dan tidak dapat mengubah data operasional.

---

## Reservation Status

Status reservasi yang digunakan:

```txt
pending
confirmed
completed
cancelled
```

Penjelasan:

* `pending`: reservasi sudah diajukan customer dan menunggu approval admin.
* `confirmed`: reservasi sudah disetujui admin.
* `completed`: layanan sudah selesai dan dikonfirmasi admin.
* `cancelled`: reservasi dibatalkan atau ditolak.

---

## Payment Status

Payment tidak dibuat sebagai menu terpisah. Bukti pembayaran menjadi bagian dari detail reservasi.

Status pembayaran:

```txt
pending
approved
rejected
```

Jenis pembayaran:

```txt
dp
full
```

---

## Database Collections

Database MongoDB menggunakan beberapa collection utama:

```txt
users
services
schedules
reservations
messages
```

### users

Menyimpan data user aplikasi.

Role yang digunakan:

```txt
customer
barber
admin
owner
```

### services

Menyimpan data layanan barbershop seperti nama layanan, harga, durasi, deskripsi, dan status aktif.

### schedules

Menyimpan jadwal kerja barber.

### reservations

Menyimpan data reservasi customer, termasuk layanan, barber, jadwal, status reservasi, bukti pembayaran, dan status pembayaran.

### messages

Menyimpan pesan inbox untuk customer.

---

## Project Structure

Struktur umum project:

```txt
barberq-reservation-system/
├── server/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── seed.ts
│   └── index.ts
│
├── src/
│   ├── app/
│   ├── components/
│   ├── data/
│   ├── lib/
│   └── styles/
│
├── .env.example
├── package.json
└── README.md
```

---

## Environment Variables

Buat file `.env` berdasarkan `.env.example`.

Contoh konfigurasi:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/barberq
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
PORT=4000
CLIENT_ORIGIN=http://localhost:3000

NEXT_PUBLIC_DATA_SOURCE=api
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

Pastikan `NEXT_PUBLIC_DATA_SOURCE` menggunakan:

```env
NEXT_PUBLIC_DATA_SOURCE=api
```

Jika masih `mock`, frontend tidak akan mengambil data dari backend.

---

## Installation

Clone repository:

```bash
git clone https://github.com/username/barberq-reservation-system.git
cd barberq-reservation-system
```

Install dependencies:

```bash
npm install
```

---

## Run MongoDB

Project ini menggunakan MongoDB lokal.

Pastikan MongoDB Server sudah berjalan.

Jika menggunakan Windows, jalankan MongoDB melalui Services atau terminal:

```bash
net start MongoDB
```

Connection string default:

```txt
mongodb://127.0.0.1:27017/barberq
```

---

## Seed Database

Jalankan seed untuk membuat data awal seperti admin, owner, barber, customer, layanan, dan jadwal.

```bash
npm run seed
```

Contoh akun yang dapat digunakan:

### Admin

```txt
Email: admin@barberq.com
Password: admin123
```

### Owner

```txt
Email: owner@barberq.com
Password: owner123
```

### Barber

```txt
Email: rio@barberq.com
Password: barber123
```

### Customer

```txt
Email: customer@barberq.com
Password: customer123
```

---

## Run Project

Menjalankan backend API:

```bash
npm run dev:api
```

Menjalankan frontend dan backend sekaligus:

```bash
npm run dev:full
```

Frontend berjalan di:

```txt
http://localhost:3000
```

Backend API berjalan di:

```txt
http://localhost:4000/api
```

---

## API Testing

Gunakan Postman untuk melakukan testing API.

Contoh endpoint public:

```txt
GET /api/services
GET /api/users/barbers
```

Contoh endpoint auth:

```txt
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
```

Contoh endpoint reservasi:

```txt
POST /api/reservations
GET /api/reservations/my
GET /api/reservations/barber
GET /api/reservations
PATCH /api/reservations/:id/status
PATCH /api/reservations/:id/admin-cancel
PATCH /api/reservations/:id/no-show
PATCH /api/reservations/:id/request-completion
PATCH /api/reservations/:id/confirm-completed
```

Contoh endpoint inbox:

```txt
GET /api/messages/my
GET /api/messages/:id
PATCH /api/messages/:id/read
POST /api/messages
```

Contoh endpoint dashboard:

```txt
GET /api/dashboard/admin
GET /api/dashboard/owner
```

---

## Testing Flow

### Customer Reservation Flow

1. Customer login.
2. Customer memilih layanan.
3. Customer memilih barber.
4. Customer memilih tanggal dan jam.
5. Customer memilih payment type: DP atau full.
6. Customer mengisi nominal pembayaran.
7. Customer mengunggah bukti pembayaran.
8. Customer submit reservasi.
9. Reservasi masuk dengan status `pending`.

### Admin Approval Flow

1. Admin login.
2. Admin membuka detail reservasi.
3. Admin melihat bukti pembayaran.
4. Admin klik approve jika pembayaran valid.
5. Reservasi berubah menjadi `confirmed`.
6. Jika bukti pembayaran tidak valid, admin dapat reject reservasi.
7. Reservasi berubah menjadi `cancelled`.

### Barber Completion Flow

1. Barber login.
2. Barber melihat jadwal hari ini.
3. Barber membuka detail reservasi.
4. Barber klik request completed setelah layanan selesai.
5. Admin menerima request.
6. Admin mengonfirmasi reservasi sebagai `completed`.

### Owner Monitoring Flow

1. Owner login.
2. Owner membuka dashboard monitoring.
3. Owner melihat statistik reservasi, pembayaran, layanan, dan performa barber.
4. Owner tidak dapat mengubah data.

---

## MongoDB Compass

Untuk melihat isi database:

1. Buka MongoDB Compass.
2. Connect ke:

```txt
mongodb://127.0.0.1:27017/barberq
```

3. Buka database:

```txt
barberq
```

4. Cek collection:

```txt
users
services
schedules
reservations
messages
```

---

## Build

Menjalankan typecheck:

```bash
npm run typecheck
```

Menjalankan lint:

```bash
npm run lint
```

Build frontend:

```bash
npm run build
```

Build backend API:

```bash
npm run build:api
```

---

## Out of Scope

Fitur berikut tidak termasuk dalam versi ini:

* Payment gateway
* Integrasi bank
* WhatsApp API
* Email notification
* Real-time chat
* Socket.io
* Loyalty point
* Promo/voucher
* Multi-branch
* Cron job otomatis untuk no-show
* Refund otomatis ke rekening/e-wallet

---

## Project Goal

Tujuan utama project ini adalah membangun sistem reservasi barbershop yang sederhana, terstruktur, dan realistis dengan fitur utama:

* Customer dapat melakukan reservasi dengan pembayaran DP/full.
* Admin dapat memvalidasi bukti pembayaran melalui detail reservasi.
* Barber dapat melihat jadwal dan meminta konfirmasi selesai.
* Owner dapat memonitor performa bisnis.
* Sistem dapat mencegah double booking.

---

## Author

Dimas Setiawan Situmorang

GitHub: [Dimas-Situmorang](https://github.com/Dimas-Situmorang)
