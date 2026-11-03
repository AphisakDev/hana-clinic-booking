import type { Branch, Doctor, Treatment } from './catalog.types.js';

/**
 * Sample catalog used by the database seed and by the in-memory repository
 * in tests. HANA Clinic is a fictional brand: branches, buildings, doctors,
 * prices and opening hours are all made up for this portfolio project.
 */
export const BRANCHES: Branch[] = [
  {
    id: 'branch-siam',
    slug: 'siam',
    name: 'สาขาสยาม',
    address: 'ชั้น 3 อาคารฮานะ เพลส ถ.พระราม 1 เขตปทุมวัน กรุงเทพฯ',
    transit: 'BTS สยาม (ทางออก 4)',
    openTime: '11:00',
    closeTime: '20:00',
  },
  {
    id: 'branch-ari',
    slug: 'ari',
    name: 'สาขาอารีย์',
    address: 'ชั้น 2 อาคารฮานะ อารีย์ ซ.อารีย์ 1 เขตพญาไท กรุงเทพฯ',
    transit: 'BTS อารีย์ (ทางออก 3)',
    openTime: '10:00',
    closeTime: '19:00',
  },
];

export const DOCTORS: Doctor[] = [
  {
    id: 'doctor-napatsorn',
    slug: 'napatsorn',
    name: 'พญ. นภัสสร ใจดี',
    title: 'แพทย์ผิวหนัง',
    experienceYears: 8,
    bio: 'เชี่ยวชาญการดูแลผิวและปรับรูปหน้าแบบธรรมชาติ ให้คำปรึกษาตรงไปตรงมา ไม่แนะนำเกินจำเป็น',
    branchId: 'branch-siam',
  },
  {
    id: 'doctor-thanakorn',
    slug: 'thanakorn',
    name: 'นพ. ธนกร สุขสันต์',
    title: 'แพทย์เวชศาสตร์ความงาม',
    experienceYears: 6,
    bio: 'ถนัดงานฟิลเลอร์และร้อยไหมสไตล์เกาหลี เน้นผลลัพธ์ที่เป็นธรรมชาติ',
    branchId: 'branch-siam',
  },
  {
    id: 'doctor-pimchanok',
    slug: 'pimchanok',
    name: 'พญ. พิมพ์ชนก แสงทอง',
    title: 'แพทย์ผิวหนัง',
    experienceYears: 5,
    bio: 'ดูแลปัญหาสิว ผิวหมองคล้ำ และเลเซอร์ ด้วยแผนการรักษาที่เหมาะกับแต่ละคน',
    branchId: 'branch-ari',
  },
  {
    id: 'doctor-kittipat',
    slug: 'kittipat',
    name: 'นพ. กิตติพัฒน์ วงศ์ดี',
    title: 'แพทย์เวชศาสตร์ความงาม',
    experienceYears: 7,
    bio: 'เชี่ยวชาญการปรับรูปหน้าและยกกระชับ อธิบายทุกขั้นตอนอย่างเข้าใจง่าย',
    branchId: 'branch-ari',
  },
];

export const TREATMENTS: Treatment[] = [
  {
    id: 'treatment-hydrafacial',
    slug: 'hydrafacial',
    name: 'HydraFacial ผิวฉ่ำใส',
    category: 'SKIN',
    badge: 'ยอดนิยม',
    summary:
      'ทำความสะอาดล้ำลึก ผลัดเซลล์ผิว และเติมความชุ่มชื้น ให้ผิวโกลว์สุขภาพดี',
    description:
      'เหมาะกับผิวหมองคล้ำ ขาดน้ำ หรือรูขุมขนอุดตัน HydraFacial ผสานการผลัดเซลล์อย่างอ่อนโยนกับเซรั่มบำรุง แพทย์ปรับแต่ละขั้นตอนตามสภาพผิวของคุณ ผิวมักนุ่มและดูสดใสขึ้นหลังทำครั้งแรก ผลลัพธ์อาจแตกต่างกันในแต่ละบุคคล',
    highlight: 'รวมตรวจสภาพผิวและคำแนะนำหลังทำโดยแพทย์',
    priceThb: 1990,
    durationMin: 60,
    imageUrl: '/images/hydrafacial.jpg',
    popular: true,
    steps: [
      {
        title: 'ทำความสะอาด',
        description: 'ผลัดเซลล์ผิวอย่างอ่อนโยน ขจัดสิ่งสกปรก',
      },
      {
        title: 'ดูดสิ่งอุดตัน',
        description: 'ระบบสุญญากาศดูดสิ่งอุดตัน ไม่เจ็บ',
      },
      {
        title: 'เติมเซรั่ม',
        description: 'เติมเซรั่มบำรุงตรงจุด ให้ผิวชุ่มชื้น',
      },
    ],
    prepTips: [
      'งดเรตินอยด์และกรดผลัดเซลล์ 48 ชม. ก่อนทำ',
      'หลีกเลี่ยงแดดแรง การแว็กซ์ และทรีตเมนต์หน้าอื่น 7 วัน',
      'แจ้งแพทย์หากตั้งครรภ์ ใช้ยา หรือมีปัญหาผิวอักเสบ',
    ],
    aftercare:
      'ใช้สกินแคร์อ่อนโยน ทากันแดด SPF 30+ และเลี่ยงความร้อนหรือออกกำลังหนัก 24 ชม.',
    sortOrder: 1,
  },
  {
    id: 'treatment-filler',
    slug: 'filler-contour',
    name: 'ฟิลเลอร์ปรับรูปหน้า',
    category: 'CONTOUR',
    badge: 'หน้าเรียว V-shape',
    summary:
      'เติมคาง ขมับ ร่องแก้ม ด้วยเทคนิคเกาหลี ผลลัพธ์เป็นธรรมชาติ ผลิตภัณฑ์แท้ตรวจสอบได้',
    description:
      'แพทย์ประเมินโครงหน้าก่อนออกแบบจุดฉีดเฉพาะบุคคล ใช้ผลิตภัณฑ์แท้ที่มี Lot/Serial ตรวจสอบได้ทุกกล่อง เน้นสัดส่วนที่สมดุลและดูเป็นธรรมชาติ',
    highlight: 'เปิดกล่องผลิตภัณฑ์ต่อหน้าและตรวจสอบ Lot ได้',
    priceThb: 7900,
    durationMin: 45,
    imageUrl: '/images/filler-contour.jpg',
    popular: false,
    steps: [
      {
        title: 'ประเมินโครงหน้า',
        description: 'วิเคราะห์สัดส่วนและออกแบบจุดฉีด',
      },
      { title: 'ทายาชา', description: 'ลดความรู้สึกเจ็บก่อนทำ' },
      {
        title: 'ฉีดและปั้นรูป',
        description: 'ปรับรูปทรงอย่างพอดี ดูเป็นธรรมชาติ',
      },
    ],
    prepTips: [
      'งดยาละลายลิ่มเลือดและวิตามินอี 7 วัน (ปรึกษาแพทย์ก่อนหยุดยา)',
      'งดแอลกอฮอล์ 24 ชม. ก่อนทำ',
      'แจ้งประวัติแพ้ยาหรือเคยฉีดฟิลเลอร์มาก่อน',
    ],
    aftercare: 'หลีกเลี่ยงการกดนวดบริเวณที่ฉีด ซาวน่า และออกกำลังหนัก 48 ชม.',
    sortOrder: 2,
  },
  {
    id: 'treatment-laser-hair',
    slug: 'laser-hair-removal',
    name: 'เลเซอร์กำจัดขน',
    category: 'LASER',
    badge: 'เจ็บน้อย',
    summary: 'เลเซอร์รุ่นใหม่ เจ็บน้อย ลดขนรักแร้ ขา และหนวด ให้ผิวเรียบเนียน',
    description:
      'เลเซอร์ที่มีระบบความเย็นช่วยลดความรู้สึกเจ็บ เหมาะกับผิวคนไทย โดยทั่วไปแนะนำ 4–6 ครั้งเพื่อผลลัพธ์ที่ดี ราคานี้เป็นราคาต่อครั้งสำหรับรักแร้',
    highlight: 'ราคาต่อครั้ง ไม่บังคับซื้อคอร์ส',
    priceThb: 590,
    durationMin: 30,
    imageUrl: '/images/laser-hair-removal.jpg',
    popular: false,
    steps: [
      { title: 'เตรียมผิว', description: 'โกนขนและทำความสะอาดบริเวณที่ทำ' },
      { title: 'ยิงเลเซอร์', description: 'ระบบความเย็นช่วยลดความรู้สึกร้อน' },
      { title: 'บำรุงผิว', description: 'ทาเจลลดการระคายเคืองหลังทำ' },
    ],
    prepTips: [
      'โกนขนก่อนมา 1 วัน งดแว็กซ์และถอนขน 4 สัปดาห์',
      'หลีกเลี่ยงแดดแรงก่อนทำ 2 สัปดาห์',
    ],
    aftercare: 'ทากันแดดและงดขัดผิวบริเวณที่ทำ 3 วัน',
    sortOrder: 3,
  },
  {
    id: 'treatment-thread-lift',
    slug: 'thread-lift',
    name: 'ร้อยไหมยกกระชับ',
    category: 'CONTOUR',
    badge: 'ยกกระชับ',
    summary: 'ยกกรอบหน้า ลดความหย่อนคล้อย ให้หน้าดูเรียวและอ่อนกว่าวัย',
    description:
      'ใช้ไหมละลายเกรดการแพทย์ช่วยยกกระชับกรอบหน้าและกระตุ้นคอลลาเจน ผลลัพธ์ค่อย ๆ ดีขึ้นใน 2–4 สัปดาห์',
    highlight: 'รวมยาชาและนัดติดตามผลหลังทำ',
    priceThb: 9900,
    durationMin: 60,
    imageUrl: '/images/thread-lift.jpg',
    popular: false,
    steps: [
      { title: 'วางแผนแนวไหม', description: 'ออกแบบแนวยกตามโครงหน้า' },
      { title: 'ฉีดยาชา', description: 'ลดความรู้สึกเจ็บระหว่างทำ' },
      { title: 'ร้อยไหม', description: 'ยกกระชับและปรับความสมมาตร' },
    ],
    prepTips: [
      'งดยาละลายลิ่มเลือดและอาหารเสริมบางชนิด 7 วัน (ปรึกษาแพทย์)',
      'งดแอลกอฮอล์และบุหรี่ 3 วันก่อนทำ',
    ],
    aftercare: 'งดอ้าปากกว้าง นวดหน้า และนอนคว่ำ 1–2 สัปดาห์',
    sortOrder: 4,
  },
  {
    id: 'treatment-meso',
    slug: 'meso-brightening',
    name: 'เมโสหน้าใส',
    category: 'SKIN',
    badge: 'ผิวกระจ่างใส',
    summary:
      'วิตามินบำรุงผิวชั้นตื้น ช่วยให้ผิวกระจ่างใส ชุ่มชื้น และเรียบเนียนขึ้น',
    description:
      'นำวิตามินและสารบำรุงเข้าสู่ผิวชั้นตื้น ช่วยให้ผิวดูกระจ่างใสและชุ่มชื้น เหมาะกับคนที่ต้องการผิวสดใสโดยไม่มีพักฟื้น',
    highlight: 'ไม่มีพักฟื้น กลับไปทำงานได้ทันที',
    priceThb: 990,
    durationMin: 60,
    imageUrl: '/images/meso-brightening.jpg',
    popular: false,
    steps: [
      { title: 'ล้างหน้า', description: 'ทำความสะอาดและทายาชา' },
      { title: 'เติมวิตามิน', description: 'ฉีดสารบำรุงในผิวชั้นตื้น' },
      { title: 'มาสก์ผิว', description: 'ปลอบประโลมผิวหลังทำ' },
    ],
    prepTips: [
      'งดเรตินอยด์ 3 วันก่อนทำ',
      'แจ้งแพทย์หากมีผิวอักเสบหรือติดเชื้อ',
    ],
    aftercare: 'งดแต่งหน้า 6 ชม. และทากันแดดทุกวัน',
    sortOrder: 5,
  },
  {
    id: 'treatment-consult',
    slug: 'doctor-consultation',
    name: 'ปรึกษาแพทย์ฟรี',
    category: 'CONSULT',
    badge: 'เริ่มที่นี่',
    summary:
      'คุยกับแพทย์เรื่องผิวและเป้าหมายของคุณ วางแผนที่เหมาะสม ไม่บังคับซื้อ',
    description:
      'ยังไม่แน่ใจว่าทรีตเมนต์ไหนเหมาะ เริ่มจากคุยกับแพทย์ แพทย์จะตรวจสภาพผิว อธิบายทางเลือกพร้อมราคาที่ชัดเจน ไม่มีเซลล์ ไม่มีการกดดันให้ซื้อแพ็กเกจ',
    highlight: 'ไม่มีเซลล์ ไม่มีค่าใช้จ่าย',
    priceThb: 0,
    durationMin: 30,
    imageUrl: '/images/doctor-consultation.jpg',
    popular: false,
    steps: [
      { title: 'เล่าเป้าหมาย', description: 'บอกปัญหาผิวและสิ่งที่อยากปรับ' },
      { title: 'ตรวจสภาพผิว', description: 'แพทย์ประเมินผิวและโครงหน้า' },
      { title: 'วางแผน', description: 'สรุปทางเลือกพร้อมราคาที่ชัดเจน' },
    ],
    prepTips: ['มาหน้าสด หรือเตรียมล้างเครื่องสำอางที่คลินิก'],
    aftercare: 'รับสรุปแผนการรักษาทาง LINE หลังปรึกษา',
    sortOrder: 6,
  },
];
