// Các hằng số và hàm dùng chung cho sản phẩm/admin
export const genderOptions = ['Nam', 'Nữ', 'Unisex'];
export const categoryOptions = [
  'Mùi Trầm Ấm', 'Mùi Nhẹ Nhàng', 'Mùi Tươi Mát', 'Mùi Cổ Điển',
  'Mùi Quý Phái', 'Mùi Điệu Đà', 'Mùi Nam Tính', 'Mùi Lãng Mạn'
];

export function normalizeGender(gender) {
  if (!gender) return 'Unisex';
  const g = String(gender).toLowerCase();
  if (g.includes('nam') || g === 'male' || g === 'men') return 'Nam';
  if (g.includes('nữ') || g.includes('nu') || g === 'female' || g === 'women') return 'Nữ';
  return 'Unisex';
}

export function formatPrice(v) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(v||0));
}