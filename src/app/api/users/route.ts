import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET /api/users - ดึง user ทั้งหมด
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // ไม่ select passwordHash เด็ดขาด
      },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json({ status: 'success', data: users })
  } catch (error) {
    return Response.json(
      { status: 'error', message: String(error) },
      { status: 500 }
    )
  }
}

// POST /api/users - สร้าง user ใหม่ (register)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, password, phone, role } = body

    // validate เบื้องต้น
    if (!firstName || !lastName || !email || !password || !phone) {
      return Response.json(
        { status: 'error', message: 'กรุณากรอกข้อมูลให้ครบ' },
        { status: 400 }
      )
    }

    // hash password ก่อนเก็บ
    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash,
        phone,
        role: role ?? 'USER',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    })

    return Response.json({ status: 'success', data: user }, { status: 201 })
  } catch (error: any) {
    // เช็ค error email ซ้ำ (Prisma unique constraint)
    if (error.code === 'P2002') {
      return Response.json(
        { status: 'error', message: 'อีเมลนี้ถูกใช้งานแล้ว' },
        { status: 409 }
      )
    }

    return Response.json(
      { status: 'error', message: String(error) },
      { status: 500 }
    )
  }
}