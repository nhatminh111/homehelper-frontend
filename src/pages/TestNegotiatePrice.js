import React, { useEffect, useState } from 'react';
import NegotiatePriceButton from '../components/negotiation/NegotiatePriceButton';
import { Card, Container, Spinner, Alert } from 'react-bootstrap';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export default function TestNegotiatePrice() {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem('token');
    fetch(`${API_BASE_URL}/bookings/1`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Không lấy được dữ liệu booking');
        return res.json();
      })
      .then(json => {
        setBooking(json.data || json.booking || null);
        setError(null);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Container className="py-5">
      <Card className="p-4 mb-4">
        <h4 className="mb-3">Test nút thương lượng giá từ phía Tasker</h4>
        {loading && <Spinner animation="border" />}
        {error && <Alert variant="danger">{error}</Alert>}
        {booking && <>
          {/* Debug info */}
          <pre style={{background:'#f8f9fa',fontSize:12,padding:8}}>
            {(() => {
              const userObj = JSON.parse(localStorage.getItem('user') || '{}');
              const userId = userObj.user_id || userObj.userId || 'N/A';
              return `Debug: user_id (localStorage): ${userId}\nbooking.customer_id: ${booking.customer_id}\nbooking.tasker_id: ${booking.tasker_id}`;
            })()}
          </pre>
          <div className="mb-2"><strong>Booking ID:</strong> {booking.booking_id}</div>
          <div className="mb-2"><strong>Khách hàng (customer_id):</strong> {booking.customer_id}</div>
          <div className="mb-2"><strong>Tasker (tasker_id):</strong> {booking.tasker_id}</div>
          <div className="mb-2"><strong>Địa điểm:</strong> {booking.location}</div>
          <div className="mb-2"><strong>Giá gốc:</strong> {booking.base_price}k</div>
          <div className="mb-2"><strong>Giá cuối:</strong> {booking.final_price}k</div>
          <NegotiatePriceButton
            peerId={booking.customer_id}
            bookingId={booking.booking_id}
            label="Thương lượng giá với tasker"
            size="md"
            onClick={() => {
              window.location.href = `/chat?bookingId=${booking.booking_id}&negotiation=1&peer=${booking.customer_id}`;
            }}
          />
        </>}
      </Card>
    </Container>
  );
}
