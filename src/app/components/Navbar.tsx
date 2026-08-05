'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type User = {
  id: string
  firstName: string
  lastName?: string
  email: string
  role?: 'USER' | 'ADMIN' | 'SHELTER'
}

export default function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      }
    }
    setLoaded(true)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-[#185FA5] text-lg">
          🐾 Pet House
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="/pets" className="text-sm text-gray-600 hover:text-[#185FA5] transition-colors">
            สัตว์เลี้ยง
          </Link>
          <Link href="/about" className="text-sm text-gray-600 hover:text-[#185FA5] transition-colors">
            เกี่ยวกับเรา
          </Link>
          {user?.role === 'ADMIN' && (
            <Link href="/admin" className="text-sm text-gray-600 hover:text-[#185FA5] transition-colors">
              Admin
            </Link>
          )}
        </div>

        {!loaded ? (
          <div className="w-24 h-8" />
        ) : user ? (
          <div className="flex items-center gap-4">
            <Link href="/profile" className="text-sm text-gray-700 hover:text-[#185FA5] transition-colors">
              สวัสดี {user.firstName}
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-500 transition-colors"
            >
              ออกจากระบบ
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-[#185FA5] hover:underline">
              เข้าสู่ระบบ
            </Link>
            <Link
              href="/register"
              className="text-sm bg-[#185FA5] text-white px-4 py-2 rounded-lg hover:bg-[#0C447C] transition-colors"
            >
              ลงทะเบียน
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}