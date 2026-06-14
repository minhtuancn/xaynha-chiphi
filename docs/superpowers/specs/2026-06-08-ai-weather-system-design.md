# Spec: AI Weather & Safety System for XayNha

## 1. Mục tiêu
Hệ thống dự báo thời tiết chuyên sâu cho công trình, hỗ trợ ra quyết định làm việc an toàn cho thợ/thầu trong các ca làm việc (06:30-10:30, 14:00-18:00) dựa trên phân tích dữ liệu thực tế và cảnh báo cực đoan.

## 2. Kiến trúc dữ liệu (Database Schema)
Bổ sung bảng `WeatherHistory` để lưu dữ liệu mỗi 15 phút cho từng dự án.

```prisma
model WeatherHistory {
  id               String   @id @default(cuid())
  projectId        String
  timestamp        DateTime @default(now())
  temperature      Decimal  @db.Decimal(5, 2)
  humidity         Decimal  @db.Decimal(5, 2)
  precipitation    Decimal  @db.Decimal(5, 2) // Lượng mưa (mm)
  rainProbability  Decimal  @db.Decimal(5, 2) // %
  cloudCover       Decimal  @db.Decimal(5, 2) // %
  alertLevel       String   // 'NORMAL', 'WARNING', 'DANGER'
  aiSummary        String?
  project          Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
}
```

## 3. Ngưỡng thời tiết cực đoan (Safety Thresholds)
Hệ thống AI sẽ đánh giá "DANGER" nếu:
- Nhiệt độ: `>= 38°C` hoặc `<= 13°C`
- Mưa: Lượng mưa lớn/Dông lốc.
- Gió: Gió mạnh (được lấy từ API dự báo).

## 4. API Strategy
- Nguồn chính: OpenWeatherMap hoặc WeatherAPI (có phí).
- Fallback: Dùng API miễn phí (Open-Meteo) nếu nguồn chính lỗi.
- Job 15 phút/lần: Chạy bằng Cron-job (hoặc Vercel Cron).

## 5. Phân tích AI
Sử dụng prompt hệ thống gửi data về LLM (Gemini/GPT) để tạo nhận xét:
- "Ca làm việc 06:30-10:30: Thời tiết đẹp, an toàn."
- "Ca làm việc 14:00-18:00: CẢNH BÁO: Nhiệt độ 39°C, cực đoan, khuyến nghị nghỉ làm."

## 6. Self-Review
- [x] Placeholder: Đã liệt kê chi tiết các ngưỡng nhiệt.
- [x] Tính nhất quán: Schema, API, AI Logic khớp nhau.
- [x] Ambiguity: Đã rõ ràng về ca làm việc và ngữ cảnh nguy hiểm.
