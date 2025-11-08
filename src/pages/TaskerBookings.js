import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function TaskerBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, [filterStatus]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = api.getStoredToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      const response = await fetch(`http://localhost:3001/api/bookings/tasker/my?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setBookings(data.data || []);
      } else {
        setError(data.message || 'Không thể tải danh sách booking');
      }
    } catch (err) {
      console.error('Lỗi khi tải bookings:', err);
      setError('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      const token = api.getStoredToken();
      const response = await fetch(`http://localhost:3001/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      
      if (data.success) {
        // Cập nhật trạng thái trong danh sách
        setBookings(prevBookings => 
          prevBookings.map(booking => 
            booking.booking_id === bookingId 
              ? { ...booking, status: newStatus }
              : booking
          )
        );
        alert(`Đã ${newStatus === 'Đã chấp nhận' ? 'chấp nhận' : 'từ chối'} booking thành công!`);
      } else {
        alert('Có lỗi xảy ra khi cập nhật trạng thái');
      }
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái:', err);
      alert('Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  const handleBookingClick = (booking) => {
    // Navigate to preview page with booking data
    navigate(`/tasker/bookings/${booking.booking_id}`, { 
      state: { booking } 
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'Chờ xử lý': { variant: 'warning', text: 'Chờ xử lý' },
      'Đã chấp nhận': { variant: 'success', text: 'Đã chấp nhận' },
      'Đang tiến hành': { variant: 'info', text: 'Đang tiến hành' },
      'Hoàn thành': { variant: 'primary', text: 'Hoàn thành' },
      'Hủy': { variant: 'danger', text: 'Hủy' }
    };
    
    const statusInfo = statusMap[status] || { variant: 'secondary', text: status };
    return <Badge bg={statusInfo.variant}>{statusInfo.text}</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const endsWithZ = /z$/i.test(String(dateString)); // ISO UTC like 2025-09-20T12:07:00Z
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };
    // If the input is explicitly UTC (ends with 'Z'), format in UTC to avoid +7h shift
    if (endsWithZ) {
      return new Intl.DateTimeFormat('vi-VN', { ...options, timeZone: 'UTC' }).format(date);
    }
    // Otherwise, render with default locale settings
    return new Intl.DateTimeFormat('vi-VN', options).format(date);
  };

  const formatPrice = (price) => {
    if (!price) return '—';
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3">Đang tải danh sách booking...</p>
        </div>
      </Container>
    );
  }

  return (
    <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Container className="py-5">
        {/* Header Section */}
        <Row className="mb-5">
          <Col>
            <div className="text-center text-white">
              <h1 className="fw-bold mb-3" style={{ fontSize: '2.5rem' }}>
                <i className="bi bi-briefcase me-3"></i>
                Quản lý Công việc
              </h1>
              <p className="lead mb-0">Xem và quản lý các công việc đã được gửi cho bạn</p>
            </div>
          </Col>
        </Row>

        {/* Filter Section */}
        <Row className="mb-4">
          <Col>
            <Card className="border-0 shadow-lg" style={{ borderRadius: '20px' }}>
              <Card.Body className="p-4">
                <div className="d-flex flex-wrap gap-2 justify-content-center">
                  <Button
                    variant={filterStatus === 'all' ? 'primary' : 'outline-primary'}
                    size="sm"
                    className="px-3 py-2 rounded-pill"
                    onClick={() => setFilterStatus('all')}
                    style={{ 
                      borderRadius: '20px',
                      fontWeight: '500',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <i className="bi bi-grid-3x3-gap me-1"></i>
                    Tất cả
                  </Button>
                  <Button
                    variant={filterStatus === 'Chờ xử lý' ? 'warning' : 'outline-warning'}
                    size="sm"
                    className="px-3 py-2 rounded-pill"
                    onClick={() => setFilterStatus('Chờ xử lý')}
                    style={{ 
                      borderRadius: '20px',
                      fontWeight: '500',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <i className="bi bi-clock me-1"></i>
                    Chờ xử lý
                  </Button>
                  <Button
                    variant={filterStatus === 'Đã chấp nhận' ? 'success' : 'outline-success'}
                    size="sm"
                    className="px-3 py-2 rounded-pill"
                    onClick={() => setFilterStatus('Đã chấp nhận')}
                    style={{ 
                      borderRadius: '20px',
                      fontWeight: '500',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <i className="bi bi-check-circle me-1"></i>
                    Đã chấp nhận
                  </Button>
                  <Button
                    variant={filterStatus === 'Hoàn thành' ? 'info' : 'outline-info'}
                    size="sm"
                    className="px-3 py-2 rounded-pill"
                    onClick={() => setFilterStatus('Hoàn thành')}
                    style={{ 
                      borderRadius: '20px',
                      fontWeight: '500',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <i className="bi bi-trophy me-1"></i>
                    Hoàn thành
                  </Button>
                  <Button
                    variant={filterStatus === 'Hủy' ? 'danger' : 'outline-danger'}
                    size="sm"
                    className="px-3 py-2 rounded-pill"
                    onClick={() => setFilterStatus('Hủy')}
                    style={{ 
                      borderRadius: '20px',
                      fontWeight: '500',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <i className="bi bi-x-circle me-1"></i>
                    Hủy
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

        {bookings.length === 0 ? (
          <Row>
            <Col>
              <Card className="border-0 shadow-lg text-center py-5" style={{ borderRadius: '20px' }}>
                <Card.Body>
                  <div className="mb-4">
                    <i className="bi bi-inbox display-1 text-muted"></i>
                  </div>
                  <h4 className="fw-bold text-muted mb-3">Chưa có công việc nào</h4>
                  <p className="text-muted lead">Các công việc mới sẽ xuất hiện ở đây</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        ) : (
          <Row className="g-4">
            {bookings.map((booking) => (
              <Col key={booking.booking_id} lg={6} xl={4}>
                <Card 
                  className="h-100 border-0 shadow-lg booking-card" 
                  style={{ 
                    borderRadius: '20px',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)'
                  }}
                  onClick={() => handleBookingClick(booking)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
                  }}
                >
                  <Card.Body className="p-4">
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h5 className="fw-bold mb-1 text-primary">#{booking.booking_id}</h5>
                        <small className="text-muted">
                          <i className="bi bi-calendar-event me-1"></i>
                          {formatDate(booking.booking_time)}
                        </small>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>

                    {/* Customer Info */}
                    <div className="mb-3">
                      <div className="d-flex align-items-center mb-2">
                        <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" 
                             style={{ width: '40px', height: '40px' }}>
                          <i className="bi bi-person text-white"></i>
                        </div>
                        <div>
                          <h6 className="fw-bold mb-0">{booking.customer_name || 'Khách hàng ẩn danh'}</h6>
                          <small className="text-muted">
                            <i className="bi bi-star-fill text-warning me-1"></i>
                            4.8 đánh giá • 12 công việc
                          </small>
                        </div>
                      </div>
                    </div>

                    {/* Service Info */}
                    <div className="mb-3">
                      <h6 className="fw-bold text-dark mb-1">
                        <i className="bi bi-briefcase me-2"></i>
                        Dịch vụ
                      </h6>
                      <p className="text-muted small mb-0">
                        {booking.service_name} - {booking.variant_name}
                      </p>
                    </div>

                    {/* Job Description */}
                    {booking.task_description && (
                      <div className="mb-3">
                        <h6 className="fw-bold text-dark mb-1">
                          <i className="bi bi-file-text me-2"></i>
                          Mô tả
                        </h6>
                        <p className="text-muted small mb-0">
                          {booking.task_description.length > 60 
                            ? `${booking.task_description.substring(0, 60)}...` 
                            : booking.task_description}
                        </p>
                      </div>
                    )}

                    {/* Time */}
                    <div className="mb-3">
                      <div className="d-flex align-items-center text-muted small">
                        <i className="bi bi-calendar me-2"></i>
                        <span>{formatDate(booking.start_time)}</span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-3">
                      <div className="bg-success bg-opacity-10 rounded-3 p-2 text-center">
                        <h5 className="fw-bold text-success mb-0">
                          {formatPrice(booking.final_price)}
                        </h5>
                        <small className="text-muted">Giá hiện tại</small>
                      </div>
                    </div>

                    {/* Click to view more */}
                    <div className="text-center">
                      <small className="text-primary fw-bold">
                        <i className="bi bi-eye me-1"></i>
                        Nhấn để xem chi tiết
                      </small>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}

      </Container>
    </div>
  );
}
