import { prisma } from '@/lib/prisma'

// GET /api/adoption-requests - ดึงคำขอรับเลี้ยงทั้งหมด (filter ได้)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const petId = searchParams.get('petId')
    const status = searchParams.get('status')

    const where: any = {}
    if (userId) where.userId = userId
    if (petId) where.petId = petId
    if (status) where.status = status

    const requests = await prisma.adoptionRequest.findMany({
      where,
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
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json({ status: 'success', data: requests })
  } catch (error) {
    return Response.json(
      { status: 'error', message: String(error) },
      { status: 500 }
    )
  }
}

// POST /api/adoption-requests - สร้างคำขอรับเลี้ยงใหม่
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, petId, message } = body

    if (!userId || !petId) {
      return Response.json(
        { status: 'error', message: 'กรุณาระบุ userId และ petId' },
        { status: 400 }
      )
    }

    const userExists = await prisma.user.findUnique({ where: { id: userId } })
    if (!userExists) {
      return Response.json(
        { status: 'error', message: 'ไม่พบผู้ใช้นี้' },
        { status: 404 }
      )
    }

    const pet = await prisma.pet.findUnique({ where: { id: petId } })
    if (!pet) {
      return Response.json(
        { status: 'error', message: 'ไม่พบสัตว์เลี้ยงนี้' },
        { status: 404 }
      )
    }

    if (pet.status !== 'AVAILABLE') {
      return Response.json(
        { status: 'error', message: 'สัตว์เลี้ยงนี้ไม่พร้อมให้รับเลี้ยงแล้ว' },
        { status: 400 }
      )
    }

    const adoptionRequest = await prisma.adoptionRequest.create({
      data: { userId, petId, message },
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
          },
        },
      },
    })

    await prisma.pet.update({
      where: { id: petId },
      data: { status: 'PENDING' },
    })

    return Response.json(
      { status: 'success', data: adoptionRequest },
      { status: 201 }
    )
  } catch (error: any) {
    if (error.code === 'P2002') {
      return Response.json(
        { status: 'error', message: 'คุณได้ส่งคำขอรับเลี้ยงสัตว์ตัวนี้ไปแล้ว' },
        { status: 409 }
      )
    }

    return Response.json(
      { status: 'error', message: String(error) },
      { status: 500 }
    )
  }
}