'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '../components/Navbar'

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

const PAGE_SIZE = 12

export default function PetsPage() {
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [species, setSpecies] = useState<'ALL' | 'DOG' | 'CAT'>('ALL')
  const [status, setStatus] = useState('ALL')
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchPets()
  }, [])

  // reset หน้ากลับ 1 เมื่อ filter เปลี่ยน
  useEffect(() => {
    setPage(1)
  }, [search, species, status])

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

  const filtered = pets.filter((pet) => {
    const matchSearch = pet.name.toLowerCase().includes(search.toLowerCase())
    const matchSpecies = species === 'ALL' || pet.species === species
    const matchStatus = status === 'ALL' || pet.status === status
    return matchSearch && matchSpecies && matchStatus
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">น้องที่รอบ้านอยู่</h1>
          <p className="text-gray-500 text-sm mt-1">
            {loading
              ? 'กำลังโหลด...'
              : `พบ ${filtered.length} น้อง${totalPages > 1 ? ` (หน้า ${page}/${totalPages})` : ''}`}
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <input
            type="text"
            placeholder="🔍 ค้นหาชื่อน้อง..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w[200px] border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5]"
          />

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
        {!loading && paginated.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {paginated.map((pet) => (
              <Link href={`/pets/${pet.id}`} key={pet.id}>
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md hover:border-[#B5D4F4] transition-all cursor-pointer">
                  <div
                    className={`h-44 flex items-center justify-center overflow-hidden ${
                      pet.species === 'DOG' ? 'bg-[#E6F1FB]' : 'bg-[#E1F5EE]'
                    }`}
                  >
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
                    <span className={`text-6xl ${pet.imageUrl ? 'hidden' : ''}`}>
                      {pet.species === 'DOG' ? '🐶' : '🐱'}
                    </span>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">{pet.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${statusMap[pet.status].className}`}>
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
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-500 hover:border-[#185FA5] hover:text-[#185FA5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← ก่อนหน้า
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis')
                acc.push(p)
                return acc
              }, [])
              .map((p, idx) =>
                p === 'ellipsis' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 text-sm">
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`w-9 h-9 text-sm rounded-lg border transition-colors ${
                      page === p
                        ? 'bg-[#185FA5] text-white border-[#185FA5]'
                        : 'border-gray-200 text-gray-500 hover:border-[#185FA5] hover:text-[#185FA5]'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-500 hover:border-[#185FA5] hover:text-[#185FA5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ถัดไป →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}