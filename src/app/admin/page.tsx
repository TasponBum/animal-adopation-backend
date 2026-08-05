'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '../components/Navbar'

type Pet = {
  id: string
  name: string
  species: 'DOG' | 'CAT'
  breed?: string | null
  status: 'AVAILABLE' | 'PENDING' | 'ADOPTED'
  district: string
  imageUrl: string
  postedBy: { id: string; firstName: string; lastName: string; email: string }
}

type AdoptionRequest = {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  message?: string | null
  user: { id: string; firstName: string; lastName: string; email: string; phone: string }
  pet: { id: string; name: string; species: string; imageUrl: string; status: string }
}

type AdminUser = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: 'USER' | 'ADMIN' | 'SHELTER'
  createdAt: string
}

type CurrentUser = { id: string; firstName: string; email: string; role?: string }

type Tab = 'pets' | 'requests' | 'users'

export default function AdminDashboardPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [allowed, setAllowed] = useState(false)

  const [tab, setTab] = useState<Tab>('pets')
  const [pets, setPets] = useState<Pet[]>([])
  const [requests, setRequests] = useState<AdoptionRequest[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // เช็คสิทธิ์ ADMIN จาก localStorage ก่อนเข้าหน้า
  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (!token || !storedUser) {
      router.push('/login')
      return
    }

    try {
      const user: CurrentUser = JSON.parse(storedUser)
      if (user.role !== 'ADMIN') {
        router.push('/')
        return
      }
      setAllowed(true)
    } catch {
      router.push('/login')
      return
    } finally {
      setChecking(false)
    }
  }, [router])

  useEffect(() => {
    if (!allowed) return
    loadTab(tab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, tab])

  async function loadTab(t: Tab) {
    setLoading(true)
    setError('')
    const token = localStorage.getItem('token')

    try {
      if (t === 'pets') {
        const res = await fetch('/api/pets')
        const json = await res.json()
        if (json.status !== 'success') throw new Error(json.message)
        setPets(json.data)
      } else if (t === 'requests') {
        const res = await fetch('/api/adoption-requests', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        if (json.status !== 'success') throw new Error(json.message)
        setRequests(json.data)
      } else if (t === 'users') {
        const res = await fetch('/api/users', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        if (json.status !== 'success') throw new Error(json.message)
        setUsers(json.data)
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  async function handleRequestAction(id: string, status: 'APPROVED' | 'REJECTED') {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/adoption-requests/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      })
      const json = await res.json()
      if (json.status !== 'success') throw new Error(json.message)
      loadTab('requests')
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด')
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-6xl mx-auto px-6 py-16 text-center text-gray-400">
          กำลังตรวจสอบสิทธิ์...
        </div>
      </div>
    )
  }

  if (!allowed) return null

  const statusMap: Record<string, { label: string; className: string }> = {
    AVAILABLE: { label: 'พร้อมรับเลี้ยง', className: 'bg-[#E6F1FB] text-[#185FA5]' },
    PENDING: { label: 'รอดำเนินการ', className: 'bg-[#FAEEDA] text-[#633806]' },
    ADOPTED: { label: 'มีเจ้าของแล้ว', className: 'bg-gray-100 text-gray-500' },
    APPROVED: { label: 'อนุมัติแล้ว', className: 'bg-green-50 text-green-600' },
    REJECTED: { label: 'ปฏิเสธแล้ว', className: 'bg-red-50 text-red-500' },
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mb-8">ภาพรวมสัตว์เลี้ยง คำขอรับเลี้ยง และผู้ใช้งานทั้งระบบ</p>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-100 mb-6">
          {[
            { key: 'pets' as Tab, label: `สัตว์เลี้ยงทั้งหมด (${pets.length})` },
            { key: 'requests' as Tab, label: `คำขอรับเลี้ยง (${requests.length})` },
            { key: 'users' as Tab, label: `ผู้ใช้งาน (${users.length})` },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-[#185FA5] text-[#185FA5]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-400 py-16">กำลังโหลด...</div>
        ) : (
          <>
            {tab === 'pets' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-100">
                      <th className="py-3 pr-4">สัตว์เลี้ยง</th>
                      <th className="py-3 pr-4">สถานะ</th>
                      <th className="py-3 pr-4">เขต</th>
                      <th className="py-3 pr-4">ผู้ลงประกาศ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pets.map((pet) => (
                      <tr key={pet.id} className="border-b border-gray-50">
                        <td className="py-3 pr-4 flex items-center gap-2">
                          <span>{pet.species === 'DOG' ? '🐶' : '🐱'}</span>
                          <span className="text-gray-900">{pet.name}</span>
                          {pet.breed && <span className="text-gray-400">· {pet.breed}</span>}
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${statusMap[pet.status].className}`}>
                            {statusMap[pet.status].label}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-gray-500">{pet.district}</td>
                        <td className="py-3 pr-4 text-gray-500">
                          {pet.postedBy.firstName} {pet.postedBy.lastName}
                          <div className="text-xs text-gray-400">{pet.postedBy.email}</div>
                        </td>
                      </tr>
                    ))}
                    {pets.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-400">
                          ยังไม่มีสัตว์เลี้ยงในระบบ
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'requests' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-100">
                      <th className="py-3 pr-4">สัตว์เลี้ยง</th>
                      <th className="py-3 pr-4">ผู้ขอ</th>
                      <th className="py-3 pr-4">สถานะ</th>
                      <th className="py-3 pr-4">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r) => (
                      <tr key={r.id} className="border-b border-gray-50">
                        <td className="py-3 pr-4 text-gray-900">{r.pet.name}</td>
                        <td className="py-3 pr-4 text-gray-500">
                          {r.user.firstName} {r.user.lastName}
                          <div className="text-xs text-gray-400">{r.user.email}</div>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${statusMap[r.status].className}`}>
                            {statusMap[r.status].label}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          {r.status === 'PENDING' ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRequestAction(r.id, 'APPROVED')}
                                className="text-xs bg-[#185FA5] text-white px-3 py-1.5 rounded-lg hover:bg-[#0C447C]"
                              >
                                อนุมัติ
                              </button>
                              <button
                                onClick={() => handleRequestAction(r.id, 'REJECTED')}
                                className="text-xs border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-50"
                              >
                                ปฏิเสธ
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {requests.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-400">
                          ยังไม่มีคำขอรับเลี้ยง
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'users' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-100">
                      <th className="py-3 pr-4">ชื่อ</th>
                      <th className="py-3 pr-4">อีเมล</th>
                      <th className="py-3 pr-4">เบอร์โทร</th>
                      <th className="py-3 pr-4">สิทธิ์</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-gray-50">
                        <td className="py-3 pr-4 text-gray-900">{u.firstName} {u.lastName}</td>
                        <td className="py-3 pr-4 text-gray-500">{u.email}</td>
                        <td className="py-3 pr-4 text-gray-500">{u.phone}</td>
                        <td className="py-3 pr-4">
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                            {u.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-400">
                          ยังไม่มีผู้ใช้งาน
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}