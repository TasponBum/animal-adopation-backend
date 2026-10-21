'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'

type PetForm = {
  name: string
  species: 'DOG' | 'CAT'
  breed: string
  gender: 'MALE' | 'FEMALE'
  ageValue: string
  ageUnit: 'MONTH' | 'YEAR'
  description: string
  imageUrl: string
  district: string
  vaccinated: boolean
  neutered: boolean
}

const inputClass =
  'w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5] bg-white text-black placeholder:text-black placeholder:opacity-100'

export default function EditPetPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [petId, setPetId] = useState('')
  const [form, setForm] = useState<PetForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')

      // ยังไม่ login → ไปหน้า login
      if (!token || !storedUser) {
        router.push('/login')
        return
      }

      const user = JSON.parse(storedUser) as { id: string; role?: string }
      const { id } = await params
      setPetId(id)

      try {
        const res = await fetch(`/api/pets/${id}`)
        const data = await res.json()

        if (data.status !== 'success') {
          router.push('/pets')
          return
        }

        const pet = data.data

        // ไม่ใช่เจ้าของโพสต์ (และไม่ใช่ ADMIN) → กลับไปหน้ารายละเอียด
        if (pet.postedBy.id !== user.id && user.role !== 'ADMIN') {
          router.push(`/pets/${id}`)
          return
        }

        setForm({
          name: pet.name,
          species: pet.species,
          breed: pet.breed ?? '',
          gender: pet.gender,
          ageValue: String(pet.ageValue),
          ageUnit: pet.ageUnit,
          description: pet.description ?? '',
          imageUrl: pet.imageUrl,
          district: pet.district,
          vaccinated: pet.vaccinated ?? false,
          neutered: pet.neutered ?? false,
        })
      } catch {
        router.push('/pets')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return

    setError('')

    const ageValue = Number(form.ageValue)
    if (!ageValue || ageValue <= 0) {
      setError('อายุต้องเป็นตัวเลขที่มากกว่า 0')
      return
    }

    setSaving(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/pets/${petId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          species: form.species,
          breed: form.breed || null,
          gender: form.gender,
          ageValue,
          ageUnit: form.ageUnit,
          description: form.description || null,
          imageUrl: form.imageUrl,
          district: form.district,
          vaccinated: form.vaccinated,
          neutered: form.neutered,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'เกิดข้อผิดพลาด')
        return
      }

      router.push(`/pets/${petId}`)
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-3">🐾</div>
          <p className="text-sm">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  const update = <K extends keyof PetForm>(key: K, value: PetForm[K]) =>
    setForm({ ...form, [key]: value })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-8">
        <Link
          href={`/pets/${petId}`}
          className="text-sm text-[#185FA5] hover:underline inline-block mb-6"
        >
          ← กลับไปหน้ารายละเอียด
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">แก้ไขข้อมูลสัตว์เลี้ยง</h1>
          <p className="text-sm text-gray-500 mb-6">แก้ไขแล้วกดบันทึกเพื่ออัปเดตโพสต์</p>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">ชื่อ</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">ประเภท</label>
                <select
                  value={form.species}
                  onChange={(e) => update('species', e.target.value as 'DOG' | 'CAT')}
                  className={inputClass}
                >
                  <option value="DOG">🐶 หมา</option>
                  <option value="CAT">🐱 แมว</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">เพศ</label>
                <select
                  value={form.gender}
                  onChange={(e) => update('gender', e.target.value as 'MALE' | 'FEMALE')}
                  className={inputClass}
                >
                  <option value="MALE">เพศผู้</option>
                  <option value="FEMALE">เพศเมีย</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">พันธุ์ (ไม่บังคับ)</label>
              <input
                type="text"
                value={form.breed}
                onChange={(e) => update('breed', e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">อายุ</label>
                <input
                  type="number"
                  min={1}
                  value={form.ageValue}
                  onChange={(e) => update('ageValue', e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">หน่วย</label>
                <select
                  value={form.ageUnit}
                  onChange={(e) => update('ageUnit', e.target.value as 'MONTH' | 'YEAR')}
                  className={inputClass}
                >
                  <option value="MONTH">เดือน</option>
                  <option value="YEAR">ปี</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">พื้นที่ (เขต/อำเภอ)</label>
              <input
                type="text"
                value={form.district}
                onChange={(e) => update('district', e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">ลิงก์รูปภาพ</label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => update('imageUrl', e.target.value)}
                required
                className={inputClass}
              />
              {form.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.imageUrl}
                  alt="ตัวอย่างรูป"
                  className="mt-3 h-40 rounded-xl object-cover border border-gray-100"
                />
              )}
            </div>

            
            <div>
              <label className="block text-sm text-gray-600 mb-2">สุขภาพ (ไม่บังคับ)</label>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.vaccinated}
                    onChange={(e) => update('vaccinated', e.target.checked)}
                    className="w-4 h-4 accent-[#185FA5]"
                  />
                  ฉีดวัคซีนแล้ว
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.neutered}
                    onChange={(e) => update('neutered', e.target.checked)}
                    className="w-4 h-4 accent-[#185FA5]"
                  />
                  ทำหมันแล้ว
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">เกี่ยวกับน้อง (ไม่บังคับ)</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Link
                href={`/pets/${petId}`}
                className="flex-1 text-center border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-[#185FA5] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#0C447C] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}