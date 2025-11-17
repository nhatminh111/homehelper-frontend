// Mapping criteria keys to human-readable labels for badge creation
export const BADGE_CRITERIA_OPTIONS = [
  { value: 'COMPLETED_JOBS', label: 'Số công việc đã hoàn thành' },
  { value: 'AVERAGE_RATING', label: 'Đánh giá trung bình' },
  { value: 'RATING_5_STAR', label: 'Số lượng đánh giá 5 sao' },
  { value: 'VERIFIED_CCCD', label: 'Đã xác minh CCCD' },
  { value: 'CERTIFIED_PRO', label: 'Đã duyệt chứng chỉ' },
  { value: 'NO_CANCELLATION_30D', label: 'Không hủy cuốc (30 ngày)' },
  { value: 'VIDEO_CREATOR', label: 'Số video đã đăng' },
  { value: 'FAVORITED_BY', label: 'Số người yêu thích' }
];

export const isValidBadgeCriteria = (key) => BADGE_CRITERIA_OPTIONS.some(o => o.value === key);