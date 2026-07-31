import { prisma } from '@/lib/prisma'

// GET /api/users/[id] - ดึง user รายตัว
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
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { firstName, lastName, phone, role } = body

    const user = await prisma.user.update({
      where: { id },
      data: { firstName, lastName, phone, role },
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
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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