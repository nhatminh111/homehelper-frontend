export const formatVND = (n) =>
  (Number(n) * 1000 || 0).toLocaleString('vi-VN') + '₫';