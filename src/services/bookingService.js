import api from './api';

export async function updateFinalPrice(bookingId, price) {
  if (!bookingId || !Number.isFinite(Number(price))) {
    throw new Error('Invalid bookingId or price');
  }
  try {
    const res = await api.patch(`/bookings/${bookingId}/final-price`, { price: Number(price) });
    return res.data;
  } catch (error) {
    console.error('Failed to update final price:', error);
    throw new Error(error?.response?.data?.message || 'Không thể cập nhật giá cuối');
  }
}

export async function getBookingDetails(bookingId) {
  if (!bookingId) throw new Error('Invalid bookingId');
  try {
    const res = await api.get(`/bookings/${bookingId}`, {
      headers: { 'Cache-Control': 'no-cache' }
    });
    // Normalize: backend may return { success, data }, { booking }, or the booking object directly
    const payload = res?.data;
    const booking = (payload && (payload.booking || payload.data)) || payload;
    if (booking && booking.booking_id) return booking;
    // If data is nested further (rare), try to unwrap once more
    if (booking?.data && booking.data.booking_id) return booking.data;
    throw new Error('Invalid booking response');
  } catch (error) {
    console.error('Failed to get booking details:', error);
    throw new Error(error?.response?.data?.message || 'Không thể tải thông tin booking');
  }
}

export async function getTaskerStats() {
  try {
    const token = api.getStoredToken();
    const res = await api.get('/bookings/tasker/stats', {
      token,
      headers: {
        'Cache-Control': 'no-cache',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }
    });
    // Backend returns { success, data }
    return res.data?.data || res.data;
  } catch (error) {
    console.error('Failed to get tasker stats:', error);
    throw new Error(error?.message || error?.response?.data?.message || 'Không thể tải thống kê');
  }
}

export async function getTaskerEarningsSeries(params = {}) {
  const token = api.getStoredToken();
  const res = await api.get('/bookings/tasker/earnings-series', { params, headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return res.data?.data || [];
}

export async function getTaskerBookingsMonthly(params = {}) {
  const token = api.getStoredToken();
  const res = await api.get('/bookings/tasker/bookings-monthly', { params, headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return res.data?.data || [];
}

export async function getTaskerSuccessCancel(params = {}) {
  const token = api.getStoredToken();
  const res = await api.get('/bookings/tasker/success-cancel', { params, headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return res.data?.data || { completed: 0, cancelled: 0 };
}

export async function getTaskerUpcoming(params = {}) {
  const token = api.getStoredToken();
  const res = await api.get('/bookings/tasker/upcoming', { params, headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return res.data?.data || [];
}

export async function getTaskerOverdue(params = {}) {
  const token = api.getStoredToken();
  const res = await api.get('/bookings/tasker/overdue', { params, headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return res.data?.data || [];
}

export async function getTaskerRecentReviews(params = {}) {
  const token = api.getStoredToken();
  const res = await api.get('/bookings/tasker/reviews', { params, headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return res.data?.data || [];
}

export async function getTaskerByService(params = {}) {
  const token = api.getStoredToken();
  const res = await api.get('/bookings/tasker/by-service', { params, headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return res.data?.data || [];
}

export default {
  updateFinalPrice,
  getBookingDetails,
  getTaskerStats,
  getTaskerEarningsSeries,
  getTaskerBookingsMonthly,
  getTaskerSuccessCancel,
  getTaskerUpcoming,
  getTaskerOverdue,
  getTaskerRecentReviews,
  getTaskerByService,
};
