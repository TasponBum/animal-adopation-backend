// Pet House - smoke test สำหรับ auth fixes (pets + adoption-requests)
// เวอร์ชัน Node.js — รันได้ตรงๆ ไม่ต้องพึ่ง bash
//
// วิธีใช้:
//   1. แก้ค่า config ด้านล่าง (หรือตั้ง env var ก่อนรัน) ให้ตรงกับเครื่องคุณ
//   2. รัน: node test-auth.mjs
//
// ต้องมี user 2 คนใน DB ล่วงหน้า (สมัครผ่าน /register ก่อน):
//   - USER_A: จะใช้เป็นคนลงประกาศ pet
//   - USER_B: จะใช้เป็นคนส่งคำขอรับเลี้ยง
//
// ตั้ง env var แบบ PowerShell (ถ้าไม่ตั้ง จะใช้ค่า default ด้านล่าง):
//   $env:BASE_URL="http://localhost:3000"
//   $env:USER_A_EMAIL="usera@example.com"
//   $env:USER_A_PASSWORD="password123"
//   $env:USER_B_EMAIL="userb@example.com"
//   $env:USER_B_PASSWORD="password123"
//   node test-auth.mjs

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const USER_A_EMAIL = process.env.USER_A_EMAIL || "usera@example.com";
const USER_A_PASSWORD = process.env.USER_A_PASSWORD || "password123";
const USER_B_EMAIL = process.env.USER_B_EMAIL || "userb@example.com";
const USER_B_PASSWORD = process.env.USER_B_PASSWORD || "password123";

let pass = 0;
let fail = 0;

function checkStatus(label, expected, actual) {
  if (expected === actual) {
    console.log(`✅ PASS - ${label} (status ${actual})`);
    pass++;
  } else {
    console.log(`❌ FAIL - ${label} (expected ${expected}, got ${actual})`);
    fail++;
  }
}

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json().catch(() => ({}));
  return json?.data?.token || null;
}

async function main() {
  console.log("== Pet House auth smoke test (Node.js) ==");
  console.log(`BASE_URL=${BASE_URL}`);
  console.log();

  // ---------- setup: login both users ----------
  console.log("-- logging in test users --");
  const tokenA = await login(USER_A_EMAIL, USER_A_PASSWORD);
  const tokenB = await login(USER_B_EMAIL, USER_B_PASSWORD);

  if (!tokenA || !tokenB) {
    console.log("❌ ไม่สามารถ login ได้ทั้ง USER_A และ USER_B — เช็คว่า user มีอยู่จริงใน DB และรหัสผ่านถูกต้อง");
    console.log("   สมัครผ่าน /register ก่อน แล้วตั้ง env var USER_A_EMAIL/PASSWORD, USER_B_EMAIL/PASSWORD");
    process.exit(1);
  }
  console.log("ได้ token ของทั้งสอง user แล้ว");
  console.log();

  // ---------- 1. happy path: USER_A posts a pet ----------
  console.log("-- Test 1: ลงประกาศสัตว์ปกติ (มี token ถูกต้อง) --");
  let res = await fetch(`${BASE_URL}/api/pets`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      name: "ทดสอบ-สคริปต์",
      species: "DOG",
      gender: "MALE",
      ageValue: 2,
      ageUnit: "YEAR",
      imageUrl: "https://example.com/dog.jpg",
      district: "บางนา",
    }),
  });
  checkStatus("POST /api/pets พร้อม token", 201, res.status);
  const createBody = await res.json().catch(() => ({}));
  const petId = createBody?.data?.id;
  const postedBy = createBody?.data?.postedById;
  if (petId) console.log(`   -> สร้าง pet id: ${petId}, postedById: ${postedBy}`);
  console.log();

  // ---------- 2. no token ----------
  console.log("-- Test 2: ยิง POST /api/pets โดยไม่มี token --");
  res = await fetch(`${BASE_URL}/api/pets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "ไม่ควรสร้างได้",
      species: "DOG",
      gender: "MALE",
      ageValue: 1,
      ageUnit: "YEAR",
      imageUrl: "https://example.com/dog.jpg",
      district: "บางนา",
    }),
  });
  checkStatus("POST /api/pets ไม่มี token ต้อง 401", 401, res.status);
  console.log();

  // ---------- 3. spoofed postedById is ignored ----------
  console.log("-- Test 3: ส่ง postedById ปลอมใน body (ต้องถูก ignore) --");
  res = await fetch(`${BASE_URL}/api/pets`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenB}` },
    body: JSON.stringify({
      name: "เช็ค-postedById-ปลอม",
      species: "CAT",
      gender: "FEMALE",
      ageValue: 1,
      ageUnit: "YEAR",
      imageUrl: "https://example.com/cat.jpg",
      district: "บางนา",
      postedById: "some-fake-user-id-that-is-not-B",
    }),
  });
  const spoofBody = await res.json().catch(() => ({}));
  const spoofPostedBy = spoofBody?.data?.postedById;
  if (spoofPostedBy && spoofPostedBy !== "some-fake-user-id-that-is-not-B") {
    console.log(`✅ PASS - postedById ปลอมถูก ignore (บันทึกจริงเป็น: ${spoofPostedBy})`);
    pass++;
  } else {
    console.log("❌ FAIL - postedById ปลอมหลุดเข้าไปใน DB!");
    fail++;
  }
  console.log();

  // ---------- 4. invalid token ----------
  console.log("-- Test 4: token ปลอม/ไม่ถูกต้อง --");
  res = await fetch(`${BASE_URL}/api/pets`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer not.a.valid.token" },
    body: JSON.stringify({
      name: "ไม่ควรสร้างได้",
      species: "DOG",
      gender: "MALE",
      ageValue: 1,
      ageUnit: "YEAR",
      imageUrl: "https://example.com/dog.jpg",
      district: "บางนา",
    }),
  });
  checkStatus("POST /api/pets token ปลอม ต้อง 401 (ไม่ใช่ 500)", 401, res.status);
  console.log();

  // ---------- 5 & 6: adoption request tests (need petId from Test 1) ----------
  if (petId) {
    console.log("-- Test 5: USER_B ส่งคำขอรับเลี้ยง pet ของ USER_A --");
    res = await fetch(`${BASE_URL}/api/adoption-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ petId, message: "อยากรับเลี้ยงครับ" }),
    });
    checkStatus("POST /api/adoption-requests (USER_B ขอ pet ของ USER_A)", 201, res.status);
    console.log();

    console.log("-- Test 6: USER_A ส่งคำขอรับเลี้ยง pet ของตัวเอง (ต้องโดน block) --");
    res = await fetch(`${BASE_URL}/api/adoption-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ petId, message: "ขอ pet ตัวเอง" }),
    });
    checkStatus("POST /api/adoption-requests (ขอ pet ตัวเอง ต้อง 400)", 400, res.status);
    console.log();
  } else {
    console.log("-- ข้าม Test 5 และ 6 (ไม่มี petId จาก Test 1) --");
    console.log();
  }

  // ---------- 7. GET adoption-requests requires auth ----------
  console.log("-- Test 7: GET /api/adoption-requests โดยไม่มี token --");
  res = await fetch(`${BASE_URL}/api/adoption-requests`);
  checkStatus("GET /api/adoption-requests ไม่มี token ต้อง 401", 401, res.status);
  console.log();

  // ---------- 8. invalid species still rejected ----------
  console.log("-- Test 8: validation เดิมยังทำงาน (species ผิด) --");
  res = await fetch(`${BASE_URL}/api/pets`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      name: "สัตว์ประหลาด",
      species: "BIRD",
      gender: "MALE",
      ageValue: 1,
      ageUnit: "YEAR",
      imageUrl: "https://example.com/bird.jpg",
      district: "บางนา",
    }),
  });
  checkStatus("POST /api/pets species ผิด ต้อง 400", 400, res.status);
  console.log();

  // ---------- summary ----------
  console.log("================================");
  console.log(`สรุป: PASS=${pass}  FAIL=${fail}`);
  console.log("================================");

  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("เกิดข้อผิดพลาดระหว่างรันเทส:", err);
  process.exit(1);
});
