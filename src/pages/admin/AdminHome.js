import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faUserShield,
  faDollarSign,
  faChartLine,
  faClock,
  faBriefcase,
  faArrowRight,
  faTicketAlt,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import adminStatsAPI from '../../services/adminStats';
import { showToast } from '../../components/common/CustomToast';
import { formatVND } from "../../utils/formatVND";
import '../../css/AdminHome.css';

const AdminHome = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminStatsAPI.getDashboardStats(token);
      if (res.success) {
        setStats(res.data);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      showToast.error('Không thể tải thống kê hệ thống');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const totalUsers = stats?.userCounts?.reduce((acc, curr) => acc + curr.count, 0) || 0;
  const taskerCount = stats?.userCounts?.find(u => u.role === 'Tasker')?.count || 0;
  const totalRevenue = stats?.revenue?.total_revenue || 0;
  const totalIncome = stats?.revenue?.total_income || 0;

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9'];

  const statCards = [
    { title: 'Người dùng', value: totalUsers.toLocaleString(), icon: faUsers, color: 'primary', desc: 'Toàn hệ thống' },
    { title: 'Cộng tác viên', value: taskerCount.toLocaleString(), icon: faUserShield, color: 'success', desc: 'Sẵn sàng phục vụ' },
    { title: 'Tổng doanh thu hệ thống', value: formatVND(totalRevenue), icon: faDollarSign, color: 'warning', desc: 'Từ các đơn đã hoàn thành' },
    { title: 'Tổng thu nhập', value: formatVND(totalIncome), icon: faChartLine, color: 'info', desc: '10% giá trị mỗi đơn hàng' }
  ];

  return (
    <div className="admin-dashboard container-fluid py-4">
      <header className="mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h2 className="fw-bold mb-1">Bảng điều khiển Admin</h2>
          <p className="text-muted">Giám sát hoạt động và chất lượng dịch vụ toàn hệ thống.</p>
        </div>
        <div className="text-end">
          <div className="badge bg-soft-primary text-primary border p-2 px-3 rounded-pill">
            <FontAwesomeIcon icon={faClock} className="me-2" />
            {new Date().toLocaleDateString('vi-VN')}
          </div>
        </div>
      </header>

      {/* Primary Stats Grid */}
      <div className="row g-4 mb-5">
        {statCards.map((card, idx) => (
          <div key={idx} className="col-md-6 col-xl-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="stat-card"
            >
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="stat-label">{card.title}</div>
                  <div className="stat-value mt-1">{card.value}</div>
                </div>
                <div className={`stat-icon ${card.color}`}>
                  <FontAwesomeIcon icon={card.icon} size="lg" />
                </div>
              </div>
              <div className="mt-3 pt-2">
                <small className="text-muted d-flex align-items-center gap-1">
                  <FontAwesomeIcon icon={faCheckCircle} size="xs" /> {card.desc}
                </small>
              </div>
            </motion.div>
          </div>
        ))}
      </div>

      <div className="row g-4 mb-4">
        {/* Recent Activities */}
        <div className="col-lg-8">
          <div className="dashboard-card shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="dashboard-card-title mb-0">
                <FontAwesomeIcon icon={faClock} className="text-primary" />
                Đơn hàng mới nhất
              </h5>
              <Link to="/admin/bookings" className="btn btn-sm text-primary p-0">
                Xem tất cả <FontAwesomeIcon icon={faArrowRight} size="xs" />
              </Link>
            </div>
            <div className="recent-activities">
              {stats?.recentBookings?.length > 0 ? (
                stats.recentBookings.map((booking, idx) => (
                  <div key={idx} className="recent-activity-item">
                    <div className="activity-icon">
                      <FontAwesomeIcon icon={faBriefcase} />
                    </div>
                    <div className="activity-info">
                      <div className="activity-title text-truncate" style={{ maxWidth: '300px' }}>
                        <strong>{booking.customer_name}</strong> - {booking.service_name}
                      </div>
                      <div className="activity-time">
                        {new Date(booking.booking_time).toLocaleString('vi-VN')} • {formatVND(booking.paid_amount || booking.final_price || booking.expected_price)}
                      </div>
                    </div>
                    <div>
                      <span className={`activity-status ${booking.status === 'Hoàn thành' ? 'status-completed' :
                        booking.status === 'Hủy' ? 'status-cancelled' : 'status-pending'
                        }`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-5 text-muted">Không có đơn hàng nào</div>
              )}
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="col-lg-4">
          {/* Top Services moved here */}
          <div className="dashboard-card shadow-sm mb-4">
            <h5 className="dashboard-card-title">
              <FontAwesomeIcon icon={faChartLine} className="text-primary" />
              Dịch vụ hàng đầu
            </h5>
            <div className="mt-3">
              {stats?.serviceStats?.map((service, idx) => (
                <div key={idx} className="mb-3">
                  <div className="d-flex justify-content-between small mb-1">
                    <span>{service.name}</span>
                    <span className="fw-bold">{service.booking_count} đơn</span>
                  </div>
                  <div className="progress-bar-custom" style={{ height: '6px' }}>
                    <div className="progress-fill" style={{
                      width: `${(service.booking_count / (stats.serviceStats[0]?.booking_count || 1)) * 100}%`,
                      backgroundColor: idx % 2 === 0 ? '#4f46e5' : '#818cf8'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* <div className="dashboard-card shadow-sm">
            <h5 className="dashboard-card-title">
              <FontAwesomeIcon icon={faTicketAlt} className="text-info" />
              Khuyến mãi & Vouchers
            </h5>
            <div className="mt-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="small text-muted">Tỉ lệ sử dụng voucher</span>
                <span className="fw-bold">
                  {stats?.voucherStats?.total_vouchers > 0
                    ? Math.round((stats.voucherStats.used_vouchers / stats.voucherStats.total_vouchers) * 100)
                    : 0}%
                </span>
              </div>
              <div className="progress-bar-custom mb-3">
                <div className="progress-fill" style={{
                  width: `${stats?.voucherStats?.total_vouchers > 0 ? (stats.voucherStats.used_vouchers / stats.voucherStats.total_vouchers) * 100 : 0}%`,
                  backgroundColor: '#0ea5e9'
                }} />
              </div>
              <div className="small text-muted text-center italic">
                {stats?.voucherStats?.used_vouchers || 0} đã dùng / {stats?.voucherStats?.total_vouchers || 0} đã phát hành
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
