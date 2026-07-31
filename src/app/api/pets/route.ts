import { prisma } from '@/lib/prisma'

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

// POST /api/pets - สร้าง pet ใหม่
export async function POST(request: Request) {
  try {
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
      postedById,
    } = body

    if (
      !name ||
      !species ||
      !gender ||
      ageValue === undefined ||
      !ageUnit ||
      !imageUrl ||
      !district ||
      !postedById
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

    const userExists = await prisma.user.findUnique({
      where: { id: postedById },
    })

    if (!userExists) {
      return Response.json(
        { status: 'error', message: 'ไม่พบผู้ใช้นี้' },
        { status: 404 }
      )
    }

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