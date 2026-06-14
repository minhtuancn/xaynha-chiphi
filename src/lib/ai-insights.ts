import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateFinancialInsights(data: any): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    return 'AI insights unavailable: GEMINI_API_KEY not configured.';
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const categories = data?.categories?.map((c: any) => 
    `- ${c.name}: ${c.total.toLocaleString()} VND (${c.count} items)`
  ).join('\n') || 'No category data';

  const monthly = data?.monthlySpending?.map((m: any) => 
    `- ${m.month}: ${m.total.toLocaleString()} VND`
  ).join('\n') || 'No monthly data';

  const prompt = `
Phân tích dữ liệu tài chính sau và đưa ra nhận xét, khuyến nghị ngắn gọn bằng tiếng Việt:

TỔNG QUAN:
- Ngân sách: ${data?.budgetVsActual?.budget?.toLocaleString() ?? 0} VND
- Đã chi: ${data?.budgetVsActual?.spent?.toLocaleString() ?? 0} VND
- Còn lại: ${data?.budgetVsActual?.remaining?.toLocaleString() ?? 0} VND
- Tỷ lệ chi tiêu: ${data?.budgetVsActual?.budget ? ((data.budgetVsActual.spent / data.budgetVsActual.budget) * 100).toFixed(1) : 0}%

CHI PHÍ THEO DANH MỤC:
${categories}

CHI PHÍ THEO THÁNG:
${monthly}

Hãy đưa ra:
1. Đánh giá chung (quá chi/duy trì tốt)
2. Danh mục chi tiêu nhiều nhất
3. Xu hướng chi tiêu theo tháng
4. Khuyến nghị cụ thể
  `.trim();

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('AI Insight error:', error);
    return 'Không thể tạo AI insights lúc này.';
  }
}
