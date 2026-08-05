'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '../../components/Navbar'

const districts = [
  'พระนคร', 'ดุสิต', 'หนองจอก', 'บางรัก', 'บางเขน', 'บางกะปิ',
  'ปทุมวัน', 'ป้อมปราบศัตรูพ่าย', 'พระโขนง', 'มีนบุรี', 'ลาดกระบัง',
  'ยานนาวา', 'สัมพันธวงศ์', 'พญาไท', 'ธนบุรี', 'บางกอกใหญ่',
  'ห้วยขวาง', 'คลองสาน', 'ตลิ่งชัน', 'บางกอกน้อย', 'บางขุนเทียน',
  'ภาษีเจริญ', 'หนองแขม', 'ราษฎร์บูรณะ', 'บางพลัด', 'ดินแดง',
  'บึงกุ่ม', 'สาทร', 'บางซื่อ', 'จตุจักร', 'บางคอแหลม', 'ประเวศ',
  'คลองเตย', 'สวนหลวง', 'จอมทอง', 'ดอนเมือง', 'ราชเทวี', 'ลาดพร้าว',
  'วัฒนา', 'บางแค', 'หลักสี่', 'สายไหม', 'คันนายาว', 'สะพานสูง',
  'วังทองหลาง', 'คลองสามวา', 'บางนา', 'ทวีวัฒนา', 'ทุ่งครุ',
  'บางบอน'
]

export default function NewPetPage() {
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)

  const [form, setForm] = useState({
    name: '',
    species: 'DOG',
    breed: '',
    gender: 'MALE',
    ageValue: '',
    ageUnit: 'YEAR',
    description: '',
    imageUrl: '',
    district: '',
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    setCheckingAuth(false)
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (
      !form.name ||
      !form.species ||
      !form.gender ||
      !form.ageValue ||
      !form.ageUnit ||
      !form.imageUrl ||
      !form.district
    ) {
      setError('กรุณากรอกข้อมูลให้ครบ')
      return
    }

    const ageValueNum = Number(form.ageValue)
    if (isNaN(ageValueNum) || ageValueNum <= 0) {
      setError('อายุต้องเป็นตัวเลขที่มากกว่า 0')
      return
    }

    setSubmitting(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/pets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          ageValue: ageValueNum,
          breed: form.breed || null,
          description: form.description || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่')
        return
      }

      router.push(`/pets/${data.data.id}`)
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setSubmitting(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-900">
          <div className="text-4xl mb-3">🐾</div>
          <p className="text-sm">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">ลงประกาศสัตว์เลี้ยง</h1>
          <p className="text-gray-500 text-sm mt-1">กรอกข้อมูลน้องที่ต้องการหาบ้านใหม่</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5"
        >
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* ชื่อ */}
          <div>
            <label className="block text-sm text-gray-900 mb-1">ชื่อน้อง *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="เช่น โบโบ้"
              required
              className="w-full border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5]"
            />
          </div>

          {/* ประเภท + เพศ */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-900 mb-1">ประเภท *</label>
              <select
                name="species"
                value={form.species}
                onChange={handleChange}
                className="w-full border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#185FA5] bg-white"
              >
                <option value="DOG">🐶 หมา</option>
                <option value="CAT">🐱 แมว</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-900 mb-1">เพศ *</label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#185FA5] bg-white"
              >
                <option value="MALE">เพศผู้</option>
                <option value="FEMALE">เพศเมีย</option>
              </select>
            </div>
          </div>

          {/* พันธุ์ */}
          <div>
            <label className="block text-sm text-gray-900 mb-1">พันธุ์ (ไม่บังคับ)</label>
            <input
              type="text"
              name="breed"
              value={form.breed}
              onChange={handleChange}
              placeholder="เช่น พันธุ์ผสม, โกลเด้น"
              className="w-full border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5]"
            />
          </div>

          {/* อายุ */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-900 mb-1">อายุ *</label>
              <input
                type="number"
                name="ageValue"
                value={form.ageValue}
                onChange={handleChange}
                min="1"
                placeholder="เช่น 2"
                required
                className="w-full border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5]"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-900 mb-1">ปี/เดือน *</label>
              <select
                name="ageUnit"
                value={form.ageUnit}
                onChange={handleChange}
                className="w-full border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#185FA5] bg-white"
              >
                <option value="YEAR">ปี</option>
                <option value="MONTH">เดือน</option>
              </select>
            </div>
          </div>

          {/* เขต */}
          <div>
            <label className="block text-sm text-gray-900 mb-1">เขต/พื้นที่ *</label>
            <select
              name="district"
              value={form.district}
              onChange={handleChange}
              required
              className="w-full border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#185FA5] bg-white"
            >
              <option value="">เลือกเขต</option>
              {districts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* รูปภาพ (URL ชั่วคราว) */}
          <div>
            <label className="block text-sm text-gray-900 mb-1">ลิงก์รูปภาพ *</label>
            <input
              type="url"
              name="imageUrl"
              value={form.imageUrl}
              onChange={handleChange}
              placeholder="https://..."
              required
              className="w-full border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5]"
            />
            <p className="text-xs text-gray-900 mt-1">
              ระบบยังไม่รองรับอัปโหลดไฟล์ ให้วางลิงก์รูปภาพจากอินเทอร์เน็ตก่อน
            </p>
          </div>

          {/* คำอธิบาย */}
          <div>
            <label className="block text-sm text-gray-900 mb-1">เกี่ยวกับน้อง (ไม่บังคับ)</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="นิสัย, สุขภาพ, เรื่องราวของน้อง..."
              className="w-full border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5] resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#185FA5] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#0C447C] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'กำลังลงประกาศ...' : '🐾 ลงประกาศ'}
          </button>
        </form>
      </div>
    </div>
  )
}