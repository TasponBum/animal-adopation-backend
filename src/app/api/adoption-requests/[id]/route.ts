import { prisma } from '@/lib/prisma'

// GET /api/adoption-requests/[id] - ดึงคำขอรายตัว
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const adoptionRequest = await prisma.adoptionRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
            imageUrl: true,
            status: true,
            postedById: true,
          },
        },
      },
    })

    if (!adoptionRequest) {
      return Response.json(
        { status: 'error', message: 'ไม่พบคำขอนี้' },
        { status: 404 }
      )
    }

    return Response.json({ status: 'success', data: adoptionRequest })
  } catch (error) {
    return Response.json(
      { status: 'error', message: String(error) },
      { status: 500 }
    )
  }
}

// PATCH /api/adoption-requests/[id] - อัปเดตสถานะคำขอ (approve/reject)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, message } = body

    if (status) {
      const validStatus = ['PENDING', 'APPROVED', 'REJECTED']
      if (!validStatus.includes(status)) {
        return Response.json(
          {
            status: 'error',
            message: 'status ไม่ถูกต้อง (PENDING, APPROVED, REJECTED)',
          },
          { status: 400 }
        )
      }
    }

    const existingRequest = await prisma.adoptionRequest.findUnique({
      where: { id },
    })

    if (!existingRequest) {
      return Response.json(
        { status: 'error', message: 'ไม่พบคำขอนี้' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (status !== undefined) updateData.status = status
    if (message !== undefined) updateData.message = message

    const adoptionRequest = await prisma.adoptionRequest.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        pet: true,
      },
    })

    if (status === 'APPROVED') {
      await prisma.pet.update({
        where: { id: existingRequest.petId },
        data: { status: 'ADOPTED' },
      })

      await prisma.adoptionRequest.updateMany({
        where: {
          petId: existingRequest.petId,
          id: { not: id },
          status: 'PENDING',
        },
        data: { status: 'REJECTED' },
      })
    } else if (status === 'REJECTED') {
      await prisma.pet.update({
        where: { id: existingRequest.petId },
        data: { status: 'AVAILABLE' },
      })
    }

    return Response.json({ status: 'success', data: adoptionRequest })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return Response.json(
        { status: 'error', message: 'ไม่พบคำขอนี้' },
        { status: 404 }
      )
    }

    return Response.json(
      { status: 'error', message: String(error) },
      { status: 500 }
    )
  }
}

// DELETE /api/adoption-requests/[id] - ลบคำขอ (ยกเลิกคำขอ)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existingRequest = await prisma.adoptionRequest.findUnique({
      where: { id },
    })

    if (!existingRequest) {
      return Response.json(
        { status: 'error', message: 'ไม่พบคำขอนี้' },
        { status: 404 }
      )
    }

    await prisma.adoptionRequest.delete({ where: { id } })

    if (existingRequest.status === 'PENDING') {
      await prisma.pet.update({
        where: { id: existingRequest.petId },
        data: { status: 'AVAILABLE' },
      })
    }

    return Response.json({ status: 'success', message: 'ยกเลิกคำขอสำเร็จ' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return Response.json(
        { status: 'error', message: 'ไม่พบคำขอนี้' },
        { status: 404 }
      )
    }

    return Response.json(
      { status: 'error', message: String(error) },
      { status: 500 }
    )
  }
}