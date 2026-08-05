import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { getAuthFromRequest, unauthorizedResponse, forbiddenResponse } from '@/lib/auth'

// GET /api/users - ดึง user ทั้งหมด (เฉพาะ ADMIN เท่านั้น)
export async function GET(request: Request) {
  try {
    const auth = getAuthFromRequest(request)
    if (!auth) return unauthorizedResponse()
    if (auth.role !== 'ADMIN') return forbiddenResponse('เฉพาะแอดมินเท่านั้น')

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
// role ถูกล็อคเป็น USER เสมอ — ไม่รับจาก body
// เพื่อกันคนสมัครแล้วส่ง role: "ADMIN" มาเองตรงๆ
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, password, phone } = body
    // หมายเหตุ: ไม่รับ role จาก body อีกต่อไป
    // ถ้าอยากเปลี่ยน role ต้องให้ ADMIN ยิง PATCH /api/users/[id] เท่านั้น

    if (!firstName || !lastName || !email || !password || !phone) {
      return Response.json(
        { status: 'error', message: 'กรุณากรอกข้อมูลให้ครบ' },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash,
        phone,
        role: 'USER', // ล็อคไว้เสมอ ไม่อ่านจาก body
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