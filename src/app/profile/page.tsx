'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '../components/Navbar'

type User = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
}

type AdoptionRequest = {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  message: string | null
  createdAt: string
  pet: {
    id: string
    name: string
    species: 'DOG' | 'CAT'
    breed: string | null
    imageUrl: string
    status: string
  }
}

type Pet = {
  id: string
  name: string
  species: 'DOG' | 'CAT'
  breed: string | null
  imageUrl: string
  status: 'AVAILABLE' | 'PENDING' | 'ADOPTED'
  district: string
  postedBy: { id: string }
}

type IncomingRequest = {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  message: string | null
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  pet: {
    id: string
    name: string
    species: 'DOG' | 'CAT'
    breed: string | null
    imageUrl: string
    status: string
  }
}


const requestStatusMap = {
  PENDING: { label: 'รอพิจารณา', className: 'bg-[#FAEEDA] text-[#633806]' },
  APPROVED: { label: 'ได้รับอนุมัติ', className: 'bg-green-50 text-green-700' },
  REJECTED: { label: 'ไม่ได้รับอนุมัติ', className: 'bg-red-50 text-red-600' },
}

const petStatusMap = {
  AVAILABLE: { label: 'พร้อมรับเลี้ยง', className: 'bg-[#E6F1FB] text-[#185FA5]' },
  PENDING: { label: 'กำลังพิจารณา', className: 'bg-[#FAEEDA] text-[#633806]' },
  ADOPTED: { label: 'มีเจ้าของแล้ว', className: 'bg-gray-100 text-gray-500' },
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [tab, setTab] = useState<'requests' | 'posted' | 'incoming'>('requests')

  const [requests, setRequests] = useState<AdoptionRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(true)

  const [myPets, setMyPets] = useState<Pet[]>([])
  const [loadingPets, setLoadingPets] = useState(true)
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([])
  const [loadingIncoming, setLoadingIncoming] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (!token || !storedUser) {
      router.push('/login')
      return
    }

    const parsedUser: User = JSON.parse(storedUser)
    setUser(parsedUser)
    setEditForm({
      firstName: parsedUser.firstName,
      lastName: parsedUser.lastName,
      phone: parsedUser.phone || '',
    })

    fetchRequests(parsedUser.id, token)
    fetchMyPets(parsedUser.id,token)
  }, [])

  const fetchRequests = async (userId: string, token: string) => {
    try {
      setLoadingRequests(true)
      const res = await fetch(`/api/adoption-requests?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.status === 'success') setRequests(data.data)
    } catch (err) {
      console.error('Error fetching requests:', err)
    } finally {
      setLoadingRequests(false)
    }
  }

  // GET /api/pets ยังไม่รองรับ filter ด้วย postedById โดยตรง
  // เลยดึงทั้งหมดมา filter ฝั่ง client ไปก่อน
const fetchMyPets = async (userId: string, token: string) => {
  try {
    setLoadingPets(true)
    const res = await fetch('/api/pets')
    const data = await res.json()
    if (data.status === 'success') {
      const mine = data.data.filter((p: Pet) => p.postedBy.id === userId)
      setMyPets(mine)
      fetchIncomingRequests(mine.map((p: Pet) => p.id), token)
    }
  } catch (err) {
    console.error('Error fetching my pets:', err)
  } finally {
    setLoadingPets(false)
  }
}

// ดึงคำขอทั้งหมดแล้ว filter เฉพาะที่เป็นสัตว์ของเรา
// (GET /api/adoption-requests ยังไม่รองรับ filter ด้วย postedById โดยตรง)
const fetchIncomingRequests = async (myPetIds: string[], token: string) => {
  try {
    setLoadingIncoming(true)
    const res = await fetch('/api/adoption-requests', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (data.status === 'success') {
      const mine = data.data.filter((r: IncomingRequest) =>
        myPetIds.includes(r.pet.id)
      )
      setIncomingRequests(mine)
    }
  } catch (err) {
    console.error('Error fetching incoming requests:', err)
  } finally {
    setLoadingIncoming(false)
  }
}

const handleDecision = async (requestId: string, newStatus: 'APPROVED' | 'REJECTED') => {
  setActingId(requestId)
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/adoption-requests/${requestId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    })

    const data = await res.json()

    if (!res.ok) {
      alert(data.message || 'เกิดข้อผิดพลาด')
      return
    }

    // อัปเดต state ในหน้าโดยไม่ต้อง refetch ทั้งหมด
    setIncomingRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: newStatus } : r))
    )

    // ถ้า approve แล้ว คำขออื่นของ pet เดียวกันจะถูก backend เปลี่ยนเป็น REJECTED อัตโนมัติ
    if (newStatus === 'APPROVED' && user) {
      const token2 = localStorage.getItem('token')
      if (token2) fetchIncomingRequests(myPets.map((p) => p.id), token2)
    }
  } catch {
    alert('เกิดข้อผิดพลาด กรุณาลองใหม่')
  } finally {
    setActingId(null)
  }
}


  const handleSaveProfile = async () => {
    if (!user) return
    setSaving(true)
    setSaveError('')

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      })

      const data = await res.json()

      if (!res.ok) {
        setSaveError(data.message || 'เกิดข้อผิดพลาด')
        return
      }

      const updatedUser = { ...user, ...data.data }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setEditing(false)
    } catch {
      setSaveError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
          {!editing ? (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#E6F1FB] text-[#185FA5] flex items-center justify-center text-2xl font-medium shrink-0">
                {user.firstName[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-semibold text-gray-900">
                  {user.firstName} {user.lastName}
                </h1>
                <p className="text-sm text-gray-500">{user.email}</p>
                {user.phone && <p className="text-sm text-gray-500">{user.phone}</p>}
              </div>
              <button
                onClick={() => setEditing(true)}
                className="text-sm text-[#185FA5] hover:underline shrink-0"
              >
                แก้ไขโปรไฟล์
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {saveError && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-4 py-3">
                  {saveError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">ชื่อ</label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">นามสกุล</label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">เบอร์โทร</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5]"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="bg-[#185FA5] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0C447C] transition-colors disabled:opacity-60"
                >
                  {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false)
                    setSaveError('')
                    setEditForm({
                      firstName: user.firstName,
                      lastName: user.lastName,
                      phone: user.phone || '',
                    })
                  }}
                  className="text-sm text-gray-500 px-4 py-2 hover:text-gray-700"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('requests')}
            className={`px-4 py-2 rounded-full text-sm border transition-colors ${
              tab === 'requests'
                ? 'bg-[#185FA5] text-white border-[#185FA5]'
                : 'bg-white text-gray-500 border-gray-200 hover:border-[#185FA5] hover:text-[#185FA5]'
            }`}
          >
            คำขอที่ส่งไป ({requests.length})
          </button>
          <button
            onClick={() => setTab('posted')}
            className={`px-4 py-2 rounded-full text-sm border transition-colors ${
              tab === 'posted'
                ? 'bg-[#185FA5] text-white border-[#185FA5]'
                : 'bg-white text-gray-500 border-gray-200 hover:border-[#185FA5] hover:text-[#185FA5]'
            }`}
          >
            สัตว์ที่ลงประกาศ ({myPets.length})
          </button>
        </div>
          
            {/*ต่อจากปุ่ม "สัตว์ที่ลงประกาศ" แต่ยังอยู่ใน div เดียวกัน */}
          <button
            onClick={() => setTab('incoming')}
            className={`px-4 py-2 rounded-full text-sm border transition-colors relative ${
              tab === 'incoming'
                ? 'bg-[#185FA5] text-white border-[#185FA5]'
                : 'bg-white text-gray-500 border-gray-200 hover:border-[#185FA5] hover:text-[#185FA5]'
            }`}
          >
            คำขอที่ได้รับ ({incomingRequests.filter((r) => r.status === 'PENDING').length})
          </button>


        {/* Requests Tab */}
        {tab === 'requests' && (
          <div className="space-y-3">
            {loadingRequests && (
              <div className="text-center py-16 text-gray-400">
                <div className="text-4xl mb-3">🐾</div>
                <p className="text-sm">กำลังโหลด...</p>
              </div>
            )}

            {!loadingRequests && requests.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-sm">ยังไม่มีคำขอรับเลี้ยงที่ส่งไป</p>
                <Link href="/pets" className="text-sm text-[#185FA5] hover:underline mt-2 inline-block">
                  ไปดูน้องที่รอบ้านอยู่
                </Link>
              </div>
            )}

            



            {!loadingRequests &&
              requests.map((req) => {
                const s = requestStatusMap[req.status]
                return (
                  <Link href={`/pets/${req.pet.id}`} key={req.id}>
                    <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4 hover:border-[#B5D4F4] hover:shadow-sm transition-all">
                      <div className="w-16 h-16 rounded-lg bg-[#E6F1FB] flex items-center justify-center text-3xl overflow-hidden shrink-0">
                        {req.pet.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={req.pet.imageUrl}
                            alt={req.pet.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : (
                          <span>{req.pet.species === 'DOG' ? '🐶' : '🐱'}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">{req.pet.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${s.className}`}>
                            {s.label}
                          </span>
                        </div>
                        {req.message && (
                          <p className="text-sm text-gray-500 truncate">{req.message}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          ส่งเมื่อ {new Date(req.createdAt).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              })}
          </div>
        )}

        {/* Posted Pets Tab */}
        {tab === 'posted' && (
          <div className="space-y-3">
            {loadingPets && (
              <div className="text-center py-16 text-gray-400">
                <div className="text-4xl mb-3">🐾</div>
                <p className="text-sm">กำลังโหลด...</p>
              </div>
            )}

            {!loadingPets && myPets.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-sm">ยังไม่มีสัตว์ที่ลงประกาศ</p>
                <Link href="/pets/new" className="text-sm text-[#185FA5] hover:underline mt-2 inline-block">
                  ลงประกาศสัตว์ตัวแรก
                </Link>
              </div>
            )}

            {!loadingPets &&
              myPets.map((pet) => {
                const s = petStatusMap[pet.status]
                return (
                  <Link href={`/pets/${pet.id}`} key={pet.id}>
                    <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4 hover:border-[#B5D4F4] hover:shadow-sm transition-all">
                      <div className="w-16 h-16 rounded-lg bg-[#E6F1FB] flex items-center justify-center text-3xl overflow-hidden shrink-0">
                        {pet.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={pet.imageUrl}
                            alt={pet.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : (
                          <span>{pet.species === 'DOG' ? '🐶' : '🐱'}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">{pet.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${s.className}`}>
                            {s.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">📍 {pet.district}</p>
                      </div>
                    </div>
                  </Link>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}