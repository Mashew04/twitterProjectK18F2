import { createHash } from 'crypto'
import { config } from 'dotenv'
config()
// TẠO 1 HÀM NHẬN VÀO CHUỖI LÀ MÃ HÓA THEO CHUẨN SHA256
function sha256(content: string) {
  return createHash('sha256').update(content).digest('hex')
}

// HÀM NHẬN VÀO PASSWORD VÀ TRẢ VỀ PASSWORD ĐÃ MÃ HÓA

export function hashPassword(password: string) {
  return sha256(password + process.env.PASSWORD_SECRET)
}
