# Clinic Booking System — HANA Clinic (concept)

ระบบจองคิวออนไลน์สำหรับคลินิกความงาม ทำเป็นโปรเจกต์ portfolio
ดีไซน์ใน Figma แล้วสร้างจริงด้วย **Angular + NestJS + PostgreSQL**

> HANA Clinic เป็นแบรนด์สมมติที่สร้างขึ้นสำหรับโปรเจกต์นี้ ชื่อแพทย์ ราคา และเวลาทำการเป็นข้อมูลสมมติทั้งหมด

## ฟีเจอร์

- ดูรายการทรีตเมนต์ กรองตามหมวด และค้นหา
- หน้ารายละเอียดทรีตเมนต์ (ขั้นตอน การเตรียมตัว ราคา เวลา)
- จองคิว: เลือกสาขา → แพทย์ (หรือ "แพทย์ที่ว่างคิวแรก") → วัน → เวลาที่ว่างจริง → กรอกข้อมูล
- หน้ายืนยันการจองพร้อมรหัสการจอง และยกเลิกออนไลน์ได้ก่อนนัด 24 ชม.
- **ดูนัดทั้งหมดด้วยเบอร์โทร + OTP** โดยไม่ต้องสมัครสมาชิก (หรือใช้รหัสการจองก็ได้)
- กันจองซ้อน แม้มีคนกดจองเวลาเดียวกันพร้อมกัน
- รองรับมือถือ

### ยืนยันเบอร์ด้วย OTP (`/my-bookings`)

ลูกค้ากรอกเบอร์ → ได้รหัส 6 หลัก → เห็นนัดที่กำลังจะถึงและประวัติของเบอร์นั้น

- รหัสใช้ได้ 5 นาที ครั้งเดียว กรอกผิดได้ 5 ครั้ง แล้วรหัสจะถูกยกเลิก
- ขอรหัสใหม่ได้ทุก 60 วินาที และไม่เกิน 5 ครั้งต่อชั่วโมงต่อเบอร์ (ตอบ 429 พร้อมเวลาที่ต้องรอ)
- เก็บรหัสเป็น HMAC ไม่เก็บตัวเลขจริง และเทียบแบบ constant-time
- ตอบเหมือนกันทุกเบอร์ คนนอกจึงเช็กไม่ได้ว่าเบอร์ไหนเป็นลูกค้า
- token ของลูกค้า (อายุ 30 นาที) เซ็นด้วย secret คนละตัวกับของพนักงาน เอาไปเรียก API แอดมินไม่ได้
- ส่ง SMS ผ่าน `SmsSender` (ตอนนี้เป็น `LogSmsSender` ที่เขียนลง log) เปลี่ยนเป็นผู้ให้บริการจริงได้โดยแก้ที่เดียว
- โหมดเดโมแสดงรหัสบนหน้าจอ เพื่อให้คนที่มาดู portfolio ลองได้ (ตั้ง `OTP_SHOW_CODE`) ห้ามเปิดในระบบที่มีลูกค้าจริง
- ข้อจำกัด: เก็บรหัสในหน่วยความจำ ใช้ได้กับเซิร์ฟเวอร์ตัวเดียว ถ้ามีหลายตัวต้องย้ายไป Redis

### หน้าแอดมิน (`/admin`)

- ล็อกอินพนักงานด้วย JWT (รหัสผ่านเก็บแบบ scrypt hash) ทุก API ใต้ `/api/admin` ป้องกันด้วย Guard
- ภาพรวม: นัดวันนี้ รายได้คาดการณ์ นัด 7 วันข้างหน้า อัตราไม่มาตามนัด 30 วัน และทรีตเมนต์ยอดนิยม
- ตารางนัดรายวันแยกตามแพทย์ เปลี่ยนสถานะ: เช็กอิน → ทำเสร็จ / ไม่มา / ยกเลิก (มีกฎว่าเปลี่ยนจากไหนไปไหนได้)
- บล็อกเวลาแพทย์ (ลา/ประชุม) ช่วงที่บล็อกจะหายจากหน้าจองของลูกค้าทันที และบล็อกทับนัดที่มีอยู่ไม่ได้

บัญชีเดโม: `admin@hana.test` / `hana1234` (โหมดเดโมจะมีนัดตัวอย่างรอบ ๆ วันนี้ให้ดูเลย)

## สถาปัตยกรรม

```
frontend/  Angular 22  ──HTTP /api──▶  backend/  NestJS 12  ──Prisma──▶  PostgreSQL
                                           │
                                           └─ DATA_SOURCE=memory → ข้อมูลตัวอย่างในหน่วยความจำ (ไม่ต้องมี DB)
```

**Backend** แยกชั้นแบบ controller → service → repository
- `CatalogService`, `BookingService` เก็บกฎธุรกิจทั้งหมด (ห้ามจองย้อนหลัง, จองล่วงหน้าไม่เกิน 60 วัน, แพทย์ต้องอยู่สาขาที่เลือก, ยกเลิกได้ก่อน 24 ชม.)
- `SlotCalculator` เป็น class บริสุทธิ์: เวลาเปิด–ปิด + ความยาวทรีตเมนต์ + คิวที่ไม่ว่าง → ช่องเวลา ทดสอบง่าย
- Repository เป็น abstract class มี 2 implementation: Prisma (ของจริง) และ In-memory (เทสต์/เดโม) สลับได้ด้วย dependency injection
- กันจองซ้อน 2 ชั้น: เสนอเฉพาะช่องที่ว่าง และเช็กซ้ำใน transaction ระดับ `SERIALIZABLE`
- `Clock` ถูก inject เข้ามา เทสต์จึงตรึงเวลาได้ เก็บเวลาเป็น UTC แสดงผลเป็นเวลาไทย

- หน้าแอดมินเป็นโมดูลแยก (`AdminModule`) ใช้ repository ชุดเดิม เช่น `TimeBlockRepository` ถูกใช้ทั้งตอนคำนวณคิวว่างของลูกค้าและตอนแอดมินบล็อกเวลา
- กฎเปลี่ยนสถานะนัดอยู่ใน `status-rules.ts` เป็นตารางเดียว อ่านง่ายและเทสต์ง่าย

**Frontend** ใช้ standalone components, signals, `rxResource`, `linkedSignal` และ Reactive Forms
แยก logic ที่ไม่ผูกกับ UI (ปฏิทิน, จัดรูปแบบวันที่/ราคา) เป็นฟังก์ชันที่มีเทสต์
ฝั่งแอดมินมี `authInterceptor` แนบ token ให้อัตโนมัติ และพากลับหน้าล็อกอินเมื่อ token หมดอายุ, `adminGuard` กันหน้าแอดมิน
สีและฟอนต์ใช้ token ชุดเดียวกับ Figma (`frontend/src/styles.css`)

## วิธีรัน

ต้องมี Node.js 22 ขึ้นไป

### แบบเร็ว (ไม่ต้องมีฐานข้อมูล)

```bash
cd backend && npm install && npm run start:demo     # API ที่ http://localhost:3000/api
cd frontend && npm install && npm start             # เว็บที่ http://localhost:4200
```

### แบบเต็มกับ PostgreSQL

```bash
docker compose up -d                 # เปิด PostgreSQL
cd backend
cp .env.example .env
npm install
npm run db:migrate                   # สร้างตาราง (ครั้งแรกจะถามชื่อ migration เช่น init)
npm run db:seed                      # ใส่ข้อมูลตัวอย่าง + บัญชีแอดมินเดโม
npm run start:dev
```

แล้วรัน frontend ด้วย `npm start` เหมือนเดิม

## Deploy

มีไฟล์ตั้งค่าพร้อมแล้ว (`render.yaml` สำหรับ API, `frontend/vercel.json` สำหรับเว็บ) ดูขั้นตอนใน [DEPLOY.md](DEPLOY.md)

## เทสต์

```bash
cd backend  && npm test && npm run test:e2e   # unit + HTTP e2e (ไม่ต้องมี DB)
cd frontend && npm test
```

GitHub Actions (`.github/workflows/ci.yml`) รันเทสต์และ build ทุก push/PR และรันเฉพาะฝั่งที่มีการแก้ไข

## API

| Method | Path | ใช้ทำอะไร |
| --- | --- | --- |
| GET | `/api/treatments?category=&q=` | รายการทรีตเมนต์ |
| GET | `/api/treatments/:slug` | รายละเอียด |
| GET | `/api/branches` | สาขา |
| GET | `/api/doctors?branch=` | แพทย์ |
| GET | `/api/availability?treatment=&branch=&date=&doctor=` | ช่องเวลาของวัน |
| POST | `/api/bookings` | สร้างการจอง |
| GET | `/api/bookings/:reference` | ดูการจอง |
| PATCH | `/api/bookings/:reference/cancel` | ยกเลิก |
| POST | `/api/customer/otp/request` | ขอรหัส OTP `{ phone }` |
| POST | `/api/customer/otp/verify` | ยืนยันรหัส `{ phone, code }` → token ลูกค้า |
| GET | `/api/customer/bookings` | นัดทั้งหมดของเบอร์ที่ยืนยันแล้ว 🔑 |
| POST | `/api/admin/login` | ล็อกอินพนักงาน → JWT |
| GET | `/api/admin/stats?branch=` | ตัวเลขภาพรวม 🔒 |
| GET | `/api/admin/schedule?date=&branch=` | ตารางนัดรายวัน 🔒 |
| PATCH | `/api/admin/bookings/:reference/status` | เปลี่ยนสถานะนัด 🔒 |
| POST / DELETE | `/api/admin/blocks` | บล็อก/ปลดบล็อกเวลาแพทย์ 🔒 |

🔑 = ต้องส่ง token ลูกค้า · 🔒 = ต้องส่ง token พนักงาน (`Authorization: Bearer <token>`)

## สิ่งที่อยากทำต่อ

- ส่ง SMS จริง / แจ้งเตือนผ่าน LINE
- แจ้งเตือนผ่าน LINE Messaging API / อีเมล
- แยกสิทธิ์ ADMIN / RECEPTION และจัดการบัญชีพนักงาน
- ตั้งเวลาทำงานประจำสัปดาห์ของแพทย์

## Tech stack

Angular 22 · TypeScript · NestJS 12 · Prisma 6 · PostgreSQL 16 · Vitest · Supertest · Docker Compose · GitHub Actions

## Screenshots
### ฝั่งลูกค้า
<img width="1880" height="927" alt="Screenshot 2026-11-03 135655" src="https://github.com/user-attachments/assets/3e0fa6ab-95d2-41e7-9f50-f7b6ada6349f" />
<img width="1878" height="927" alt="Screenshot 2026-11-03 135648" src="https://github.com/user-attachments/assets/0b1183c3-c7cc-480d-91ed-90ceed36742a" />
<img width="1878" height="932" alt="Screenshot 2026-11-03 135634" src="https://github.com/user-attachments/assets/e843fc68-95a2-4740-ac93-f7154b12a20e" />

### ฝั่งแอดมิน
<img width="1860" height="927" alt="Screenshot 2026-11-03 135746" src="https://github.com/user-attachments/assets/d897955b-5786-42b6-a554-ef4aae0a6fd7" />
<img width="1887" height="922" alt="Screenshot 2026-11-03 135736" src="https://github.com/user-attachments/assets/9d267063-3a9b-4cb7-97d4-c657d683352e" />


