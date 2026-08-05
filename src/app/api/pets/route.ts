import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET as string

// GET /api/pets - ดึง pet ทั้งหมด (มี filter ได้)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const species = searchParams.get('species')
    const status = searchParams.get('status')
    const district = searchParams.get('district')

    const where: any = {}
    if (species) where.species = species
    if (status) where.status = status
    if (district) where.district = district

    const pets = await prisma.pet.findMany({
      where,
      include: {
        postedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json({ status: 'success', data: pets })
  } catch (error) {
    return Response.json(
      { status: 'error', message: String(error) },
      { status: 500 }
    )
  }
}

// ตรวจ JWT จาก Authorization header แล้วคืน userId ที่ผ่านการ verify แล้ว
// คืนค่า null ถ้าไม่มี token หรือ token ไม่ถูกต้อง/หมดอายุ
function getUserIdFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.slice('Bearer '.length)
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string }
    return payload.userId
  } catch {
    return null
  }
}

// POST /api/pets - สร้าง pet ใหม่
export async function POST(request: Request) {
  try {
    if (!JWT_SECRET) {
      return Response.json(
        { status: 'error', message: 'เซิร์ฟเวอร์ยังไม่ได้ตั้งค่า JWT_SECRET' },
        { status: 500 }
      )
    }

    const postedById = getUserIdFromRequest(request)
    if (!postedById) {
      return Response.json(
        { status: 'error', message: 'กรุณาเข้าสู่ระบบก่อนลงประกาศ' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      name,
      species,
      breed,
      gender,
      ageValue,
      ageUnit,
      description,
      imageUrl,
      district,
    } = body
    // หมายเหตุ: ไม่รับ postedById จาก body อีกต่อไป — ดึงจาก token ที่ verify แล้วเท่านั้น
    // ป้องกันไม่ให้ใครส่ง postedById ปลอมเป็น user คนอื่นตอนสร้างประกาศ

    if (
      !name ||
      !species ||
      !gender ||
      ageValue === undefined ||
      !ageUnit ||
      !imageUrl ||
      !district
    ) {
      return Response.json(
        { status: 'error', message: 'กรุณากรอกข้อมูลให้ครบ' },
        { status: 400 }
      )
    }

    const validSpecies = ['DOG', 'CAT']
    const validGender = ['MALE', 'FEMALE']
    const validAgeUnit = ['MONTH', 'YEAR']

    if (!validSpecies.includes(species)) {
      return Response.json(
        { status: 'error', message: 'species ไม่ถูกต้อง (DOG หรือ CAT)' },
        { status: 400 }
      )
    }

    if (!validGender.includes(gender)) {
      return Response.json(
        { status: 'error', message: 'gender ไม่ถูกต้อง (MALE หรือ FEMALE)' },
        { status: 400 }
      )
    }

    if (!validAgeUnit.includes(ageUnit)) {
      return Response.json(
        { status: 'error', message: 'ageUnit ไม่ถูกต้อง (MONTH หรือ YEAR)' },
        { status: 400 }
      )
    }

    if (typeof ageValue !== 'number' || ageValue <= 0) {
      return Response.json(
        { status: 'error', message: 'ageValue ต้องเป็นตัวเลขบวก' },
        { status: 400 }
      )
    }

    // ไม่ต้องเช็ค userExists อีกต่อไป — postedById มาจาก token ที่ verify แล้ว
    // ถ้า user ถูกลบไปหลัง token ออก prisma.create จะ throw foreign key error เอง (จับใน catch ด้านล่าง)

    const pet = await prisma.pet.create({
      data: {
        name,
        species,
        breed,
        gender,
        ageValue,
        ageUnit,
        description,
        imageUrl,
        district,
        postedById,
      },
      include: {
        postedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    return Response.json({ status: 'success', data: pet }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating pet:', error)
    return Response.json(
      { status: 'error', message: String(error) },
      { status: 500 }
    )
  }
}