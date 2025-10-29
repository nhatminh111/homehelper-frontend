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

export default {
  updateFinalPrice,
  getBookingDetails,
};
