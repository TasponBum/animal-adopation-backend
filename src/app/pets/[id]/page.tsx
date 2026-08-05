'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '../../components/Navbar'

type Pet = {
  id: string
  name: string
  species: 'DOG' | 'CAT'
  breed: string | null
  gender: 'MALE' | 'FEMALE'
  ageValue: number
  ageUnit: 'MONTH' | 'YEAR'
  description: string | null
  imageUrl: string
  district: string
  status: 'AVAILABLE' | 'PENDING' | 'ADOPTED'
  postedBy: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
  }
}

const statusMap = {
  AVAILABLE: { label: 'พร้อมรับเลี้ยง', className: 'bg-[#E6F1FB] text-[#185FA5]' },
  PENDING: { label: 'กำลังพิจารณา', className: 'bg-[#FAEEDA] text-[#633806]' },
  ADOPTED: { label: 'มีเจ้าของแล้ว', className: 'bg-gray-100 text-gray-500' },
}

const genderMap = { MALE: 'เพศผู้', FEMALE: 'เพศเมีย' }

export default function PetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [pet, setPet] = useState<Pet | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string; firstName: string } | null>(null)
  const [message, setMessage] = useState('')
  const [requesting, setRequesting] = useState(false)
  const [requestSuccess, setRequestSuccess] = useState(false)
  const [requestError, setRequestError] = useState('')

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) setUser(JSON.parse(storedUser))

    const fetchPet = async () => {
      const { id } = await params
      try {
        const res = await fetch(`/api/pets/${id}`)
        const data = await res.json()
        if (data.status === 'success') setPet(data.data)
        else router.push('/pets')
      } catch {
        router.push('/pets')
      } finally {
        setLoading(false)
      }
    }

    fetchPet()
  }, [])

  const handleRequest = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    setRequesting(true)
    setRequestError('')

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/adoption-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          petId: pet?.id,
          message,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setRequestError(data.message || 'เกิดข้อผิดพลาด')
        return
      }

      setRequestSuccess(true)
    } catch {
      setRequestError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setRequesting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-3">🐾</div>
          <p className="text-sm">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  if (!pet) return null

  const status = statusMap[pet.status]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Back */}
        <Link href="/pets" className="text-sm text-[#185FA5] hover:underline flex items-center gap-1 mb-6">
          ← กลับไปรายการสัตว์
        </Link>
        
        
        
        {/* Image */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className={`rounded-2xl h-80 flex items-center justify-center text-8xl overflow-hidden ${
  pet.species === 'DOG' ? 'bg-[#E6F1FB]' : 'bg-[#E1F5EE]'
}`}>
  {pet.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={pet.imageUrl}
      alt={pet.name}
      className="w-full h-full object-cover"
      onError={(e) => {
        e.currentTarget.style.display = 'none'
        e.currentTarget.nextElementSibling?.classList.remove('hidden')
      }}
    />
  ) : null}
  <span className={pet.imageUrl ? 'hidden' : ''}>
    {pet.species === 'DOG' ? '🐶' : '🐱'}
  </span>
</div>

          {/* Info */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-3xl font-semibold text-gray-900">{pet.name}</h1>
              <span className={`text-sm px-3 py-1 rounded-full ${status.className}`}>
                {status.label}
              </span>
            </div>

            <div className="space-y-2 mb-6">
              <p className="text-gray-600 text-sm">
                <span className="text-gray-400 w-20 inline-block">ประเภท</span>
                {pet.species === 'DOG' ? '🐶 หมา' : '🐱 แมว'}
              </p>
              {pet.breed && (
                <p className="text-gray-600 text-sm">
                  <span className="text-gray-400 w-20 inline-block">พันธุ์</span>
                  {pet.breed}
                </p>
              )}
              <p className="text-gray-600 text-sm">
                <span className="text-gray-400 w-20 inline-block">เพศ</span>
                {genderMap[pet.gender]}
              </p>
              <p className="text-gray-600 text-sm">
                <span className="text-gray-400 w-20 inline-block">อายุ</span>
                {pet.ageValue} {pet.ageUnit === 'YEAR' ? 'ปี' : 'เดือน'}
              </p>
              <p className="text-gray-600 text-sm">
                <span className="text-gray-400 w-20 inline-block">พื้นที่</span>
                📍 {pet.district}
              </p>
              <p className="text-gray-600 text-sm">
                <span className="text-gray-400 w-20 inline-block">โพสต์โดย</span>
                {pet.postedBy.firstName} {pet.postedBy.lastName}
              </p>
            </div>

            {pet.description && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-500 font-medium mb-1">เกี่ยวกับน้อง</p>
                <p className="text-sm text-gray-700 leading-relaxed">{pet.description}</p>
              </div>
            )}

            {/* Adoption Request */}
            {pet.status === 'AVAILABLE' && (
              <div>
                {requestSuccess ? (
                  <div className="bg-green-50 border border-green-100 text-green-700 text-sm rounded-xl px-4 py-3">
                    ✅ ส่งคำขอรับเลี้ยงสำเร็จแล้ว รอการอนุมัติจากเจ้าของ
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requestError && (
                      <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
                        {requestError}
                      </div>
                    )}
                    <textarea
                      placeholder="แนะนำตัวเองและเหตุผลที่อยากรับน้องไปเลี้ยง (ไม่บังคับ)"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5] resize-none"
                    />
                    <button
                      onClick={handleRequest}
                      disabled={requesting}
                      className="w-full bg-[#185FA5] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#0C447C] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {requesting ? 'กำลังส่งคำขอ...' : user ? '🐾 ขอรับเลี้ยงน้อง' : 'เข้าสู่ระบบเพื่อขอรับเลี้ยง'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {pet.status === 'PENDING' && (
              <div className="bg-[#FAEEDA] text-[#633806] text-sm rounded-xl px-4 py-3">
                ⏳ น้องตัวนี้กำลังอยู่ในระหว่างการพิจารณาคำขอรับเลี้ยง
              </div>
            )}

            {pet.status === 'ADOPTED' && (
              <div className="bg-gray-100 text-gray-500 text-sm rounded-xl px-4 py-3">
                🏠 น้องตัวนี้มีบ้านใหม่แล้ว
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}