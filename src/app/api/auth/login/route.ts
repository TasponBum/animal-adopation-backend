import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET as string
const JWT_EXPIRES_IN = '7d'

// POST /api/auth/login - เข้าสู่ระบบ
export async function POST(request: Request) {
  try {
    if (!JWT_SECRET) {
      return Response.json(
        { status: 'error', message: 'เซิร์ฟเวอร์ยังไม่ได้ตั้งค่า JWT_SECRET' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return Response.json(
        { status: 'error', message: 'กรุณากรอกอีเมลและรหัสผ่าน' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    // ไม่บอกแยกว่า "ไม่พบอีเมล" หรือ "รหัสผ่านผิด" เพื่อป้องกัน user enumeration
    if (!user) {
      return Response.json(
        { status: 'error', message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

    if (!isPasswordValid) {
      return Response.json(
        { status: 'error', message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      )
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    return Response.json({
      status: 'success',
      data: {
        token,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
    })
  } catch (error) {
    return Response.json(
      { status: 'error', message: String(error) },
      { status: 500 }
    )
  }
}