import { prisma } from '@/lib/prisma'
import { requireOwnerOrAdmin } from '@/lib/auth'

// GET /api/users/[id] - ดึง user รายตัว (ไม่ต้อง login ก็ดูได้ — เหมือนเดิม)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
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
    })

    if (!user) {
      return Response.json(
        { status: 'error', message: 'ไม่พบผู้ใช้นี้' },
        { status: 404 }
      )
    }

    return Response.json({ status: 'success', data: user })
  } catch (error) {
    return Response.json(
      { status: 'error', message: String(error) },
      { status: 500 }
    )
  }
}

// PATCH /api/users/[id] - แก้ไขข้อมูล user
// อนุญาตเฉพาะเจ้าของ account เอง หรือ ADMIN เท่านั้น
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const auth = requireOwnerOrAdmin(request, id)
    if (auth instanceof Response) return auth

    const body = await request.json()
    const { firstName, lastName, phone, role } = body

    // เฉพาะ ADMIN เท่านั้นที่เปลี่ยน role ของคนอื่นได้
    // user ทั่วไปแก้ role ตัวเองไม่ได้ (กันตัวเองเลื่อนขั้นเป็น ADMIN)
    const updateData: any = { firstName, lastName, phone }
    if (role !== undefined && auth.role === 'ADMIN') {
      updateData.role = role
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        updatedAt: true,
      },
    })

    return Response.json({ status: 'success', data: user })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return Response.json(
        { status: 'error', message: 'ไม่พบผู้ใช้นี้' },
        { status: 404 }
      )
    }

    return Response.json(
      { status: 'error', message: String(error) },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - ลบ user
// อนุญาตเฉพาะเจ้าของ account เอง หรือ ADMIN เท่านั้น
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const auth = requireOwnerOrAdmin(request, id)
    if (auth instanceof Response) return auth

    await prisma.user.delete({ where: { id } })

    return Response.json({ status: 'success', message: 'ลบผู้ใช้สำเร็จ' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return Response.json(
        { status: 'error', message: 'ไม่พบผู้ใช้นี้' },
        { status: 404 }
      )
    }

    return Response.json(
      { status: 'error', message: String(error) },
      { status: 500 }
    )
  }
}