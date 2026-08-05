'use client'

// src/app/page.tsx
// Pet House - Landing Page

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from './components/Navbar'

type Pet = {
  id: string
  name: string
  species: 'DOG' | 'CAT'
  breed?: string | null
  ageValue: number
  ageUnit: 'MONTH' | 'YEAR'
  district: string
  status: 'AVAILABLE' | 'PENDING' | 'ADOPTED'
  imageUrl: string
}

export default function LandingPage() {
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPets() {
      try {
        const res = await fetch('/api/pets?status=AVAILABLE')
        const json = await res.json()
        if (json.status === 'success') {
          setPets(json.data.slice(0, 6))
        }
      } catch {
        // เงียบไว้ก่อน — ถ้าดึงไม่ได้ให้แสดง section ว่างแทนที่จะพังทั้งหน้า
      } finally {
        setLoading(false)
      }
    }
    loadPets()
  }, [])

  return (
    <div className="min-h-screen bg-white">

      <Navbar />

      {/* Hero Section */}
      <section className="bg-[#E6F1FB] py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block bg-[#B5D4F4] text-[#0C447C] text-s font-medium px-4 py-1.5 rounded-full mb-6">
            🐾 แพลตฟอร์มรับเลี้ยงสัตว์
          </span>
          <h1 className="text-4xl md:text-5xl font-semibold text-[#0C447C] leading-tight mb-5">
            ให้น้องสัตว์ทุกตัว<br />
            มีบ้านที่อบอุ่น
          </h1>
          <p className="text-[#185FA5] text-lg mb-8">
            น้องๆทั้งหลายกำลังรอพวกคุณอยู่
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/pets"
              className="bg-[#185FA5] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#0C447C] transition-colors"
            >
              ค้นหาน้องสัตว์
            </Link>
            <Link
              href="/pets/new"
              className="bg-white text-[#185FA5] border border-[#185FA5] px-6 py-3 rounded-lg font-medium hover:bg-[#E6F1FB] transition-colors"
            >
              ลงประกาศสัตว์
            </Link>
          </div>
        </div>
      </section>

      {/* Pet Cards Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8 ">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">น้องที่รอบ้านอยู่</h2>
              <p className="text-gray-500 text-sm mt-1">เลือกน้องที่เหมาะกับคุณ</p>
            </div>
            <Link
              href="/pets"
              className="text-sm text-[#185FA5] hover:underline"
            >
              ดูทั้งหมด →
            </Link>
          </div>

          {loading ? (
            <div className="text-center text-gray-400 py-12">กำลังโหลด...</div>
          ) : pets.length === 0 ? (
            <div className="text-center text-gray-400 py-12">ยังไม่มีสัตว์เลี้ยงในระบบตอนนี้</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 ">
              {pets.map((pet) => (
                <PetCard key={pet.id} pet={pet} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">วิธีการรับเลี้ยง</h2>
          <p className="text-gray-500 text-sm mb-12">ง่ายแค่ 3 ขั้นตอน</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step) => (
              <div key={step.number} className="flex flex-col items-center">
                <div className="w-14 h-14 bg-[#E6F1FB] rounded-full flex items-center justify-center text-2xl mb-4">
                  {step.icon}
                </div>
                <h3 className="font-medium text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 text-center">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#185FA5] py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-white mb-3">
            พร้อมหาน้องใหม่แล้วหรือยัง?
          </h2>
          <p className="text-[#B5D4F4] mb-8">
            ลงทะเบียนฟรี เริ่มต้นรับเลี้ยงสัตว์ได้เลยวันนี้
          </p>
          <Link
            href="/register"
            className="inline-block bg-white text-[#185FA5] px-8 py-3 rounded-lg font-medium hover:bg-[#E6F1FB] transition-colors"
          >
            ลงทะเบียนฟรี
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold text-[#185FA5]">
            🐾 Pet House
          </div>
          <p className="text-sm text-gray-400">© 2026 Pet House. สงวนลิขสิทธิ์</p>
          <div className="flex gap-6">
            <Link href="/pets" className="text-sm text-gray-500 hover:text-[#185FA5]">สัตว์เลี้ยง</Link>
            <Link href="/about" className="text-sm text-gray-500 hover:text-[#185FA5]">เกี่ยวกับเรา</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}

// Pet Card Component
function PetCard({ pet }: { pet: Pet }) {
  const statusMap = {
    AVAILABLE: { label: 'พร้อมรับเลี้ยง', className: 'bg-[#E6F1FB] text-[#185FA5]' },
    PENDING: { label: 'กำลังพิจารณา', className: 'bg-[#FAEEDA] text-[#633806]' },
    ADOPTED: { label: 'มีเจ้าของแล้ว', className: 'bg-gray-100 text-gray-500' },
  }

  const status = statusMap[pet.status]
  const [imgError, setImgError] = useState(false)
  const showEmoji = !pet.imageUrl || imgError

  return (
    <Link href={`/pets/${pet.id}`}>
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md hover:border-[#B5D4F4] transition-all cursor-pointer hover:-translate-y-1">
        <div className="h-48 bg-[#E6F1FB] flex items-center justify-center overflow-hidden">
          {showEmoji ? (
            <span className="text-6xl">{pet.species === 'DOG' ? '🐶' : '🐱'}</span>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pet.imageUrl}
              alt={pet.name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium text-gray-900">{pet.name}</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${status.className}`}>
              {status.label}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {pet.species === 'DOG' ? 'หมา' : 'แมว'}
            {pet.breed ? ` • ${pet.breed}` : ''}
            {` • ${pet.ageValue} ${pet.ageUnit === 'YEAR' ? 'ปี' : 'เดือน'}`}
          </p>
          <p className="text-xs text-gray-400 mt-1">📍 {pet.district}</p>
        </div>
      </div>
    </Link>
  )
}

const STEPS = [
  {
    number: 1,
    icon: '🔍',
    title: 'ค้นหาน้อง',
    desc: 'เลือกจากรายการสัตว์ที่ต้องการบ้านตามที่ชอบ',
  },
  {
    number: 2,
    icon: '📝',
    title: 'ส่งคำขอ',
    desc: 'กรอกข้อมูลและส่งคำขอรับเลี้ยงได้เลย',
  },
  {
    number: 3,
    icon: '🏠',
    title: 'รับน้องกลับบ้าน',
    desc: 'เมื่อได้รับการอนุมัติ พาน้องกลับบ้านได้เลย',
  },
]