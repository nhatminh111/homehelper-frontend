"use client"

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import QuoteService from '../services/quoteService';

const QuotesPage = () => {
  const { postId } = useParams();
  const { user } = useAuth();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);

  const styles = {
    container: {
      fontFamily: "Arial, sans-serif",
      backgroundColor: "#f8fafc",
      minHeight: "100vh",
      padding: "24px",
      maxWidth: "1200px",
      margin: "0 auto",
    },
    header: {
      marginBottom: "32px",
    },
    title: {
      fontSize: "32px",
      fontWeight: "bold",
      color: "#1f2937",
      marginBottom: "8px",
    },
    subtitle: {
      fontSize: "16px",
      color: "#6b7280",
      marginBottom: "24px",
    },
    searchContainer: {
      display: "flex",
      gap: "16px",
      alignItems: "center",
      marginBottom: "32px",
    },
    searchInputWrapper: {
      position: "relative",
      flex: "1",
    },
    searchIcon: {
      position: "absolute",
      left: "12px",
      top: "50%",
      transform: "translateY(-50%)",
      color: "#9ca3af",
      fontSize: "16px",
    },
    searchInput: {
      width: "100%",
      padding: "12px 12px 12px 40px",
      border: "1px solid #d1d5db",
      borderRadius: "8px",
      fontSize: "14px",
      backgroundColor: "white",
    },
    select: {
      padding: "12px 16px",
      border: "1px solid #d1d5db",
      borderRadius: "8px",
      fontSize: "14px",
      backgroundColor: "white",
      minWidth: "180px",
    },
    profileCard: {
      backgroundColor: "white",
      borderRadius: "8px",
      padding: "24px",
      marginBottom: "24px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      position: "relative",
      overflow: "hidden",
    },
    statusBadge: {
      position: "absolute",
      top: "16px",
      left: "16px",
      padding: "6px 12px",
      borderRadius: "16px",
      fontSize: "12px",
      fontWeight: "500",
      zIndex: 10,
    },
    approvedBadge: {
      backgroundColor: "#10b981",
      color: "white",
    },
    pendingBadge: {
      backgroundColor: "#fef3c7",
      color: "#92400e",
    },
    profileContent: {
      paddingTop: "24px",
    },
    profileLayout: {
      display: "flex",
      gap: "16px",
    },
    avatar: {
      width: "80px",
      height: "80px",
      borderRadius: "50%",
      objectFit: "cover",
      flexShrink: 0,
    },
    mainContent: {
      flex: "1",
    },
    topSection: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "start",
      marginBottom: "16px",
    },
    leftInfo: {
      flex: "1",
    },
    profileName: {
      fontSize: "20px",
      fontWeight: "600",
      color: "#1f2937",
      marginBottom: "8px",
    },
    priceSection: {
      marginBottom: "16px",
    },
    price: {
      fontSize: "28px",
      fontWeight: "bold",
      color: "#2563eb",
      marginBottom: "4px",
    },
    priceNote: {
      fontSize: "14px",
      color: "#6b7280",
    },
    rightInfo: {
      textAlign: "right",
    },
    dateContainer: {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      fontSize: "14px",
      color: "#6b7280",
      marginBottom: "4px",
    },
    calendarIcon: {
      color: "#eab308",
      fontSize: "16px",
    },
    sectionTitle: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#374151",
      marginBottom: "8px",
    },
    descriptionSection: {
      marginBottom: "24px",
    },
    description: {
      fontSize: "14px",
      color: "#374151",
      lineHeight: "1.6",
      padding: "16px",
      backgroundColor: "#fffbeb",
      borderRadius: "8px",
      borderLeft: "4px solid #eab308",
    },
    buttonContainer: {
      display: "flex",
      gap: "12px",
    },
    button: {
      padding: "12px 24px",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "500",
      border: "none",
      cursor: "pointer",
      transition: "all 0.2s",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    primaryButton: {
      backgroundColor: "#2563eb",
      color: "white",
      flex: "1",
    },
    infoButton: {
      backgroundColor: "#3b82f6",
      color: "white",
    },
    dangerButton: {
      backgroundColor: "#dc2626",
      color: "white",
    },
    warningButton: {
      backgroundColor: "#eab308",
      color: "black",
    },
  };

  useEffect(() => {
    const fetchQuotes = async () => {
      if (!user?.user_id || !postId) return;
      try {
        setLoading(true);
        setError(null);
        const response = await QuoteService.getPostQuotes(postId);
        if (response.success) {
          setQuotes(response.data || []);
        } else {
          setError(response.message || 'Không thể tải danh sách báo giá.');
        }
      } catch (err) {
        setError(err.message || 'Đã xảy ra lỗi khi tải dữ liệu.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuotes();
  }, [postId, user?.user_id]);

  const handleReject = (quote) => {
    setSelectedQuote(quote);
    setShowModal(true);
  };

  const handleConfirm = async () => {
    try {
      setError(null);
      await QuoteService.rejectQuote(selectedQuote.quote_id);
      const response = await QuoteService.getPostQuotes(postId);
      if (response.success) {
        setQuotes(response.data || []);
      }
      setShowModal(false);
    } catch (err) {
      setError(err.message || 'Lỗi khi từ chối báo giá.');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedQuote(null);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Danh Sách Báo Giá</h1>
        <p style={styles.subtitle}>Quản lý và đánh giá các báo giá cho bài viết của bạn</p>
      </div>

      <div style={styles.searchContainer}>
        <div style={styles.searchInputWrapper}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên..."
            style={styles.searchInput}
          />
        </div>
        <select style={styles.select}>
          <option>Tất cả danh giá</option>
          <option>Ngày đăng ký</option>
        </select>
      </div>

      {loading && <div className="text-center">Đang tải...</div>}
      {error && (
        <div style={{ ...styles.descriptionSection, backgroundColor: '#fee2e2', borderLeftColor: '#dc2626' }}>
          {error}
        </div>
      )}

      {!loading && !error && quotes.length === 0 && (
        <div style={{ ...styles.descriptionSection, backgroundColor: '#dbeafe', borderLeftColor: '#3b82f6' }}>
          Chưa có báo giá nào cho bài viết này.
        </div>
      )}

      {quotes.length > 0 && quotes.map((quote) => (
        <div key={quote.quote_id} style={styles.profileCard}>
          <div
            style={{
              ...styles.statusBadge,
              ...(quote.status === 'Đã duyệt' ? styles.approvedBadge : styles.pendingBadge),
            }}
          >
            {quote.status}
          </div>

          <div style={styles.profileContent}>
            <div style={styles.profileLayout}>
              <img src={quote.tasker_avatar || "/placeholder.svg"} alt={quote.tasker_name} style={styles.avatar} />

              <div style={styles.mainContent}>
                <div style={styles.topSection}>
                  <div style={styles.leftInfo}>
                    <h3 style={styles.profileName}>{quote.tasker_name}</h3>
                    <div style={styles.priceSection}>
                      <div style={styles.price}>₫ {quote.proposed_price.toLocaleString()}</div>
                      <div style={styles.priceNote}>Giá đề xuất</div>
                    </div>
                  </div>

                  <div style={styles.rightInfo}>
                    <div style={styles.dateContainer}>
                      <span style={styles.calendarIcon}>📅</span>
                      <span>{new Date(quote.sent_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={styles.sectionTitle}>Dịch vụ:</h4>
                  <span style={{ ...styles.serviceTag, backgroundColor: '#dbeafe', color: '#1d4ed8' }}>
                    {quote.variant_name}
                  </span>
                </div>

                <div style={styles.descriptionSection}>
                  <h4 style={styles.sectionTitle}>Đề xuất:</h4>
                  <div style={styles.description}>{quote.proposal || 'Không có đề xuất'}</div>
                </div>

                <div style={styles.buttonContainer}>
                  {quote.status === 'Chờ xử lý' && (
                    <>
                      <button style={{ ...styles.button, ...styles.infoButton }}>
                        👁 Xem chi tiết
                      </button>
                      <button
                        style={{ ...styles.button, ...styles.dangerButton }}
                        onClick={() => handleReject(quote)}
                      >
                        ✕ Từ chối
                      </button>
                    </>
                  )}
                  <button style={{ ...styles.button, ...styles.warningButton }}>
                    💬 Liên hệ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div style={styles.buttonContainer}>
        <Link to="/my-blogs" style={{ ...styles.button, ...styles.primaryButton }}>
          Quay lại bài viết của tôi
        </Link>
      </div>

      {showModal && (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={handleCloseModal}>
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '20px', borderRadius: '8px', minWidth: '300px' }} onClick={(e) => e.stopPropagation()}>
            <h3>Xác nhận Từ chối Báo giá</h3>
            <p>Bạn có chắc chắn muốn từ chối báo giá này không?</p>
            {selectedQuote && (
              <div>
                <p><strong>Tasker:</strong> {selectedQuote.tasker_name}</p>
                <p><strong>Dịch vụ:</strong> {selectedQuote.variant_name}</p>
                <p><strong>Giá đề xuất:</strong> {selectedQuote.proposed_price.toLocaleString()} VND</p>
                <p><strong>Đề xuất:</strong> {selectedQuote.proposal || 'Không có đề xuất'}</p>
              </div>
            )}
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button style={{ ...styles.button, ...styles.primaryButton }} onClick={handleConfirm}>Xác nhận Từ chối</button>
              <button style={{ ...styles.button, ...styles.dangerButton }} onClick={handleCloseModal}>Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotesPage;