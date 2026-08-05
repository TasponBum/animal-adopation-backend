import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET as string

export type JwtPayload = {
  userId: string
  email: string
  role: 'USER' | 'ADMIN' | 'SHELTER'
}

/**
 * ตรวจ JWT จาก Authorization header (รูปแบบ "Bearer <token>")
 * คืนค่า payload ที่ verify แล้วถ้า token ถูกต้อง หรือ null ถ้าไม่มี/ไม่ถูกต้อง/หมดอายุ
 */
export function getAuthFromRequest(request: Request): JwtPayload | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.slice('Bearer '.length)
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

/** เหมือน getAuthFromRequest แต่คืนแค่ userId เฉยๆ ให้ใช้งานสั้นๆ ตรงจุดที่ไม่ต้องใช้ email/role */
export function getUserIdFromRequest(request: Request): string | null {
  return getAuthFromRequest(request)?.userId ?? null
}

/**
 * Response มาตรฐานสำหรับกรณีไม่ได้ login / token ไม่ถูกต้อง
 */
export function unauthorizedResponse() {
  return Response.json(
    { status: 'error', message: 'กรุณาเข้าสู่ระบบ' },
    { status: 401 }
  )
}

/**
 * Response มาตรฐานสำหรับกรณี login แล้วแต่ไม่มีสิทธิ์ทำรายการนี้
 */
export function forbiddenResponse(message = 'คุณไม่มีสิทธิ์ทำรายการนี้') {
  return Response.json({ status: 'error', message }, { status: 403 })
}

/**
 * เช็คว่า login อยู่ และ (เป็นเจ้าของ resourceOwnerId เอง หรือเป็น ADMIN)
 * ใช้กับ route ที่ต้องเป็น "เจ้าของข้อมูล" เท่านั้นถึงจะแก้ไข/ลบได้ เช่น PATCH /users/[id]
 * คืนค่า payload ถ้าผ่าน หรือ Response (401/403) ถ้าไม่ผ่าน — เช็คด้วย instanceof Response ที่ route
 */
export function requireOwnerOrAdmin(
  request: Request,
  resourceOwnerId: string
): JwtPayload | Response {
  const auth = getAuthFromRequest(request)
  if (!auth) return unauthorizedResponse()

  if (auth.userId !== resourceOwnerId && auth.role !== 'ADMIN') {
    return forbiddenResponse()
  }

  return auth
}
