'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/app/components/Navbar'

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
  vaccinated: boolean
  neutered: boolean
}

const statusMap = {
  AVAILABLE: { label: 'พร้อมรับเลี้ยง', className: 'bg-[#E6F1FB] text-[#185FA5]' },
  PENDING: { label: 'กำลังพิจารณา', className: 'bg-[#FAEEDA] text-[#633806]' },
  ADOPTED: { label: 'มีเจ้าของแล้ว', className: 'bg-gray-100 text-gray-500' },
}

const genderMap = {
  MALE: 'เพศผู้',
  FEMALE: 'เพศเมีย',
}

export default function PetsPage() {
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [species, setSpecies] = useState<'ALL' | 'DOG' | 'CAT'>('ALL')
  const [status, setStatus] = useState('ALL')

  useEffect(() => {
    fetchPets()
  }, [])

  const fetchPets = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/pets')
      const data = await res.json()
      if (data.status === 'success') {
        setPets(data.data)
      }
    } catch (err) {
      console.error('Error fetching pets:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter pets
  const filtered = pets.filter((pet) => {
    const matchSearch = pet.name.toLowerCase().includes(search.toLowerCase())
    const matchSpecies = species === 'ALL' || pet.species === species
    const matchStatus = status === 'ALL' || pet.status === status
    return matchSearch && matchSpecies && matchStatus
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">น้องที่รอบ้านอยู่</h1>
          <p className="text-gray-500 text-sm mt-1">
            {loading ? 'กำลังโหลด...' : `พบ ${filtered.length} น้อง`}
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          {/* Search */}
          <input
            type="text"
            placeholder="🔍 ค้นหาชื่อน้อง..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5]"
          />

          {/* Species Tabs */}
          <div className="flex gap-2">
            {[
              { value: 'ALL', label: 'ทั้งหมด' },
              { value: 'DOG', label: '🐶 หมา' },
              { value: 'CAT', label: '🐱 แมว' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSpecies(tab.value as 'ALL' | 'DOG' | 'CAT')}
                className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                  species === tab.value
                    ? 'bg-[#185FA5] text-white border-[#185FA5]'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-[#185FA5] hover:text-[#185FA5]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#185FA5] bg-white"
          >
            <option value="ALL">ทุกสถานะ</option>
            <option value="AVAILABLE">พร้อมรับเลี้ยง</option>
            <option value="PENDING">กำลังพิจารณา</option>
            <option value="ADOPTED">มีเจ้าของแล้ว</option>
          </select>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-20 text-gray-400">
            <div className="text-4xl mb-3">🐾</div>
            <p className="text-sm">กำลังโหลดข้อมูล...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm">ไม่พบน้องที่ตรงกับเงื่อนไข</p>
          </div>
        )}

        {/* Pet Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtered.map((pet) => (
              <Link href={`/pets/${pet.id}`} key={pet.id}>
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md hover:border-[#B5D4F4] transition-all cursor-pointer">
                  {/* Image */}
                  <div
                    className={`h-44 flex items-center justify-center text-6xl overflow-hidden ${
                      pet.species === 'DOG' ? 'bg-[#E6F1FB]' : 'bg-[#E1F5EE]'
                    }`}
                  >
                    {pet.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={pet.imageUrl}
                        alt={pet.name}
                        className="w-full h-full object-cover"
                      />
                    ) : pet.species === 'DOG' ? (
                      '🐶'
                    ) : (
                      '🐱'
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">{pet.name}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${statusMap[pet.status].className}`}
                      >
                        {statusMap[pet.status].label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {pet.species === 'DOG' ? 'หมา' : 'แมว'}
                      {pet.breed ? ` • ${pet.breed}` : ''}
                      {` • ${genderMap[pet.gender]}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {`อายุ ${pet.ageValue} ${pet.ageUnit === 'YEAR' ? 'ปี' : 'เดือน'}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">📍 {pet.district}</p>
                    {(pet.vaccinated || pet.neutered) && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {pet.vaccinated && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                            💉 ฉีดวัคซีนแล้ว
                          </span>
                        )}
                        {pet.neutered && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                            ✂️ ทำหมันแล้ว
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}