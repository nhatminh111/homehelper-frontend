import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Toast } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import socketService from '../../services/socketService';

export default function TaskerBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [toastMessage, setToastMessage] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Force re-render for countdown
  const [takenSosJobs, setTakenSosJobs] = useState(new Set()); // Track which SOS jobs are already taken

  useEffect(() => {
    fetchBookings();
  }, [filterStatus]);

  // Update countdown timer every second + remove expired SOS jobs
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);

      // Remove expired SOS jobs
      setBookings(prev => prev.filter(b => {
        if (b.type === 'SOS' && b.sos_expires_at) {
          const expiresAt = new Date(b.sos_expires_at);
          const now = new Date();
          return expiresAt > now; // Keep only non-expired
        }
        return true; // Keep non-SOS bookings
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Listen for incoming SOS jobs via socket and prepend to bookings list (with dedup)
  useEffect(() => {
    const handleNewSos = (event) => {

      // ĐẢM BẢO lấy đúng data, không dùng e.detail || e nữa
      const data = event.detail ?? event.data ?? event;

      console.log('Raw socket event:', event);
      console.log('Parsed SOS data:', data);

      if (!data || !data.booking_id) {
        console.warn('Invalid SOS payload:', event);
        return;
      }

      setBookings(prev => {
        const exists = prev.some(b => b.booking_id === data.booking_id);
        if (exists) return prev;

        const newBooking = {
          booking_id: data.booking_id,
          customer_name: data.customer_name || 'Khách hàng',
          service_name: data.service_name,
          variant_name: data.variant_name || '',
          task_description: data.description || data.task_description || '',
          start_time: data.start_time || new Date().toISOString(),
          final_price: data.final_price,
          expected_price: data.expected_price || data.final_price,
          status: 'Chờ xử lý',
          type: 'SOS',
          sos_expires_at: data.sos_expires_at,  // ← BẮT BUỘC phải có
          location: data.location || ''
        };

        return [newBooking, ...prev];
      });
    };

    const handleTaken = (e) => {
      const data = e.detail || e;
      setBookings(prev => prev.map(b => b.booking_id === data.booking_id ? { ...b, status: 'Đã chấp nhận' } : b));
      setTakenSosJobs(prev => new Set([...prev, data.booking_id]));

      // Show toast if this job was on current user's screen
      if (data.taken_by_tasker_id) {
        setToastMessage({ type: 'info', message: `Đơn SOS #${data.booking_id} đã được ${data.taken_by_name || 'người khác'} nhận` });
      }
    };

    const handleAcceptSuccess = (e) => {
      const data = e.detail || e;
      setToastMessage({ type: 'success', message: 'Chúc mừng! Bạn đã nhận được công việc!' });
    };

    const handleAcceptFailed = (e) => {
      const data = e.detail || e;
      setToastMessage({ type: 'danger', message: data?.message || 'Đã có người nhận trước bạn' });
    };

    window.addEventListener('socket_new_sos_job', handleNewSos);
    window.addEventListener('socket_sos_job_taken', handleTaken);
    window.addEventListener('socket_sos_job_accepted', handleTaken);
    window.addEventListener('socket_sos_accept_success', handleAcceptSuccess);
    window.addEventListener('socket_sos_accept_failed', handleAcceptFailed);

    return () => {
      window.removeEventListener('socket_new_sos_job', handleNewSos);
      window.removeEventListener('socket_sos_job_taken', handleTaken);
      window.removeEventListener('socket_sos_job_accepted', handleTaken);
      window.removeEventListener('socket_sos_accept_success', handleAcceptSuccess);
      window.removeEventListener('socket_sos_accept_failed', handleAcceptFailed);
    };
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = api.getStoredToken();
      if (!token) {
        navigate('/login');
        return;
      }

      // Fetch both regular bookings and active SOS jobs
      const [regularResponse, sosResponse] = await Promise.all([
        fetch(`http://localhost:3001/api/bookings/tasker/my`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`http://localhost:3001/api/bookings/tasker/active-sos`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      const regularData = await regularResponse.json();
      const sosData = await sosResponse.json();

      if (regularData.success && sosData.success) {
        // Combine SOS jobs with regular bookings, SOS jobs first
        const sosJobs = sosData.data || [];
        const regularBookings = regularData.data || [];

        // Filter out any SOS jobs from regular bookings to avoid duplicates
        const filteredRegularBookings = regularBookings.filter(b => b.type !== 'SOS');

        // Merge: SOS jobs first, then regular bookings
        setBookings([...sosJobs, ...filteredRegularBookings]);
      } else {
        setError(regularData.message || sosData.message || 'Không thể tải danh sách booking');
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
    // Nếu đang chờ khách hoặc admin xác nhận → vào trang job done
    if (booking.status === "Chờ xác nhận") {
      return navigate(`/tasker/bookings/${booking.booking_id}/jobdone`, {
        state: { booking }
      });
    }

    // Nếu đang trong quá trình → vào progress
    if (booking.status === "Đang tiến hành") {
      return navigate(`/tasker/bookings/${booking.booking_id}/progress`, {
        replace: true,
        state: { booking }
      });
    }

    // Các trạng thái còn lại → vào trang detail như cũ
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
      'Hủy': { variant: 'danger', text: 'Hủy' },
      'Chờ duyệt báo cáo': { variant: 'warning', text: 'Chờ duyệt báo cáo' },
      'Báo cáo được duyệt': { variant: 'info', text: 'Báo cáo được duyệt' },
      'Báo cáo bị từ chối': { variant: 'dark', text: 'Báo cáo bị từ chối' },
    };

    const statusInfo = statusMap[status] || { variant: 'secondary', text: status };
    return <Badge bg={statusInfo.variant}>{statusInfo.text}</Badge>;
  };
  const getTimeRemaining = (expiresAt) => {
    if (!expiresAt) return null;

    // BƯỚC FIX: Luôn hiểu chuỗi là UTC (có Z hoặc không có Z đều ok)
    let expiresAtStr = expiresAt.trim();
    if (!expiresAtStr.endsWith('Z')) {
      expiresAtStr += 'Z';  // Thêm Z để ép JavaScript hiểu là UTC
    }

    const expires = new Date(expiresAtStr);
    const now = new Date();

    const diffMs = expires.getTime() - now.getTime();
    if (diffMs <= 0) return 'Hết hạn';

    const totalSeconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
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
                      <div className="d-flex align-items-center gap-2">
                        {booking.type === 'SOS' ? (
                          <>
                            <Badge bg="danger">🔥 SOS</Badge>
                            {booking.sos_expires_at && (
                              <Badge bg="warning" text="dark" className="ms-1">
                                ⏱️ {refreshTrigger && getTimeRemaining(booking.sos_expires_at)}
                              </Badge>
                            )}
                          </>
                        ) : null}
                        {getStatusBadge(booking.status)}
                      </div>
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
                      {booking.duration_hours ? (
                        <small className="text-muted">Thời lượng: {booking.duration_hours} giờ</small>
                      ) : null}
                      {booking.duration_days ? (
                        <small className="text-muted d-block">Thời lượng: {booking.duration_days} ngày</small>
                      ) : null}
                      {booking.type ? (
                        <small className="text-muted d-block">Loại: {booking.type}</small>
                      ) : null}
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
                          {formatPrice(
                            booking.paid_amount > 0
                              ? booking.paid_amount
                              : booking.final_price > 0
                                ? booking.final_price
                                : booking.expected_price
                          )}
                        </h5>
                        <small className="text-muted">Giá</small>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        {booking.type === 'SOS' && takenSosJobs.has(booking.booking_id) ? (
                          <small className="text-danger fw-bold">
                            <i className="bi bi-check-circle-fill me-1"></i>
                            Đã có người nhận
                          </small>
                        ) : (
                          <small className="text-primary fw-bold" style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); handleBookingClick(booking); }}>
                            <i className="bi bi-eye me-1"></i>
                            Nhấn để xem chi tiết
                          </small>
                        )}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}

      </Container>

      {/* Toast notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999
        }}>
          <Toast
            onClose={() => setToastMessage(null)}
            show={!!toastMessage}
            delay={3000}
            autohide
            bg={toastMessage.type}
          >
            <Toast.Header>
              <strong className="me-auto">
                {toastMessage.type === 'success' ? '✓ Thành công' : '✗ Thông báo'}
              </strong>
            </Toast.Header>
            <Toast.Body className={toastMessage.type === 'success' ? 'text-white' : 'text-white'}>
              {toastMessage.message}
            </Toast.Body>
          </Toast>
        </div>
      )}
    </div>
  );
}
