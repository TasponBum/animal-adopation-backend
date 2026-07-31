import { prisma } from '@/lib/prisma'

// GET /api/pets/[id] - ดึง pet รายตัว
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const pet = await prisma.pet.findUnique({
      where: { id },
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
        requests: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!pet) {
      return Response.json(
        { status: 'error', message: 'ไม่พบสัตว์เลี้ยงนี้' },
        { status: 404 }
      )
    }

    return Response.json({ status: 'success', data: pet })
  } catch (error) {
    return Response.json(
      { status: 'error', message: String(error) },
      { status: 500 }
    )
  }
}

// PATCH /api/pets/[id] - แก้ไขข้อมูล pet
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      status,
      foundAt,
    } = body

    if (species) {
      const validSpecies = ['DOG', 'CAT']
      if (!validSpecies.includes(species)) {
        return Response.json(
          { status: 'error', message: 'species ไม่ถูกต้อง (DOG หรือ CAT)' },
          { status: 400 }
        )
      }
    }

    if (gender) {
      const validGender = ['MALE', 'FEMALE']
      if (!validGender.includes(gender)) {
        return Response.json(
          { status: 'error', message: 'gender ไม่ถูกต้อง (MALE หรือ FEMALE)' },
          { status: 400 }
        )
      }
    }

    if (ageUnit) {
      const validAgeUnit = ['MONTH', 'YEAR']
      if (!validAgeUnit.includes(ageUnit)) {
        return Response.json(
          { status: 'error', message: 'ageUnit ไม่ถูกต้อง (MONTH หรือ YEAR)' },
          { status: 400 }
        )
      }
    }

    if (status) {
      const validStatus = ['AVAILABLE', 'PENDING', 'ADOPTED']
      if (!validStatus.includes(status)) {
        return Response.json(
          {
            status: 'error',
            message: 'status ไม่ถูกต้อง (AVAILABLE, PENDING, ADOPTED)',
          },
          { status: 400 }
        )
      }
    }

    if (ageValue !== undefined && (typeof ageValue !== 'number' || ageValue <= 0)) {
      return Response.json(
        { status: 'error', message: 'ageValue ต้องเป็นตัวเลขบวก' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (species !== undefined) updateData.species = species
    if (breed !== undefined) updateData.breed = breed
    if (gender !== undefined) updateData.gender = gender
    if (ageValue !== undefined) updateData.ageValue = ageValue
    if (ageUnit !== undefined) updateData.ageUnit = ageUnit
    if (description !== undefined) updateData.description = description
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (district !== undefined) updateData.district = district
    if (status !== undefined) updateData.status = status
    if (foundAt !== undefined) updateData.foundAt = foundAt ? new Date(foundAt) : null

    const pet = await prisma.pet.update({
      where: { id },
      data: updateData,
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

    return Response.json({ status: 'success', data: pet })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return Response.json(
        { status: 'error', message: 'ไม่พบสัตว์เลี้ยงนี้' },
        { status: 404 }
      )
    }

    return Response.json(
      { status: 'error', message: String(error) },
      { status: 500 }
    )
  }
}

// DELETE /api/pets/[id] - ลบ pet
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.pet.delete({ where: { id } })

    return Response.json({ status: 'success', message: 'ลบสัตว์เลี้ยงสำเร็จ' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return Response.json(
        { status: 'error', message: 'ไม่พบสัตว์เลี้ยงนี้' },
        { status: 404 }
      )
    }

    return Response.json(
      { status: 'error', message: String(error) },
      { status: 500 }
    )
  }
}