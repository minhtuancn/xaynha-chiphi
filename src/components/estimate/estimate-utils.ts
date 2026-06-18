export const costTypeLabels: Record<string, string> = {
  MATERIAL: 'VT',
  LABOR: 'NC',
  EQUIPMENT: 'TT',
  SUBCONTRACT: 'NTP',
  OTHER: 'Khác',
};

export const costTypeColors: Record<string, string> = {
  MATERIAL: 'bg-blue-100 text-blue-800',
  LABOR: 'bg-orange-100 text-orange-800',
  EQUIPMENT: 'bg-purple-100 text-purple-800',
  SUBCONTRACT: 'bg-teal-100 text-teal-800',
  OTHER: 'bg-gray-100 text-gray-800',
};

export const costTypeFullNames: Record<string, string> = {
  MATERIAL: 'Vật tư',
  LABOR: 'Nhân công',
  EQUIPMENT: 'Thiết bị',
  SUBCONTRACT: 'Nhà thầu phụ',
  OTHER: 'Khác',
};

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  return new Intl.NumberFormat('vi-VN').format(n);
}