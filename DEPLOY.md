# Deploy (ทำจากไอแพดได้ทั้งหมด)

ผลลัพธ์: เว็บบน **Vercel** + API บน **Render** (ฟรีทั้งคู่) API รันโหมดเดโม ไม่ต้องมีฐานข้อมูล
ข้อมูลจะรีเซ็ตเมื่อ Render ปิดเครื่องตอนไม่มีคนใช้ (ประมาณ 15 นาที) และเปิดครั้งแรกจะช้าราว 30–60 วินาที

## 1. เอาโค้ดขึ้น GitHub

สร้าง repo ใหม่ (เช่น `clinic-booking-system`) แล้ว push โฟลเดอร์นี้ขึ้นไปทั้งหมด

## 2. API บน Render

1. เข้า render.com → ล็อกอินด้วย GitHub
2. **New → Blueprint** → เลือก repo นี้ Render จะอ่าน `render.yaml` เอง → **Apply**
3. รอ build เสร็จ แล้วเปิด `https://<ชื่อ>.onrender.com/api/health` ต้องเห็น `{"status":"ok"}`
4. จด URL นี้ไว้

## 3. เว็บบน Vercel

1. แก้ไฟล์ `frontend/vercel.json` บน GitHub (กดรูปดินสอ) เปลี่ยน `https://YOUR-API.onrender.com` เป็น URL จากข้อ 2 แล้ว commit
2. เข้า vercel.com → ล็อกอินด้วย GitHub → **Add New → Project** → เลือก repo
3. ตั้ง **Root Directory = `frontend`** (ค่าอื่นปล่อยไว้ Vercel อ่านจาก `vercel.json`) → **Deploy**
4. เปิดลิงก์ที่ได้ แล้วลอง:
   - จองคิว
   - เข้า `/my-bookings` ด้วยเบอร์ `089-123-1840` (มีนัดตัวอย่าง)
   - เข้า `/admin` ด้วย `admin@hana.test` / `hana1234`

Vercel ส่งต่อคำขอ `/api/*` ไปที่ Render ให้ เว็บกับ API จึงอยู่โดเมนเดียวกัน ไม่ต้องตั้ง CORS

## ใช้ PostgreSQL จริง (ไม่บังคับ)

สร้าง PostgreSQL บน Render (หรือ Neon/Supabase) แล้วใน service ของ API:

- ตั้ง `DATA_SOURCE=postgres` และ `DATABASE_URL=<connection string>`
- เปลี่ยน Build Command เป็น `npm ci && npm run build && npx prisma db push && npm run db:seed`
- ตั้ง `OTP_SHOW_CODE=true` ถ้ายังอยากให้คนลองระบบ OTP ได้โดยไม่มี SMS จริง
