"use client"


import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import QuoteService from '../services/quoteService';
import NegotiatePriceButton from '../components/negotiation/NegotiatePriceButton';
import { FaArrowLeft, FaCheckCircle, FaTimesCircle, FaHandshake } from 'react-icons/fa';
import '../css/QuotesPage.css';
import { showToast } from '../components/common/CustomToast'; // Thông báo toast

const QuotesPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);



  // All styles moved to QuotesPage.css

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
    if (!selectedQuote) return;
    try {
      setError(null);
      const res = await QuoteService.rejectQuote(selectedQuote.quote_id);
      if (res?.success) {
        showToast.success('Đã từ chối báo giá thành công');
      } else {
        showToast.error(res?.message || 'Từ chối báo giá thất bại');
      }
      const response = await QuoteService.getPostQuotes(postId);
      if (response.success) {
        setQuotes(response.data || []);
      }
      setShowModal(false);
      setSelectedQuote(null);
    } catch (err) {
      const msg = err.message || 'Lỗi khi từ chối báo giá.';
      setError(msg);
      showToast.error(msg);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedQuote(null);
  };

  const handleApprove = async (quote) => {
    try {
      // Gọi API duyệt báo giá (chấp nhận)
      const res = await QuoteService.approveQuote(quote.quote_id);
      if (!res?.success) {
        showToast.error(res?.message || 'Duyệt báo giá thất bại');
        return;
      }
      showToast.success('Đã chấp nhận báo giá');
      // Cập nhật trạng thái trong local state để ẩn nút
      setQuotes(prev => prev.map(q => q.quote_id === quote.quote_id ? { ...q, status: 'Chấp nhận' } : q));
      // Điều hướng sang booking
      navigate(`/booking/${quote.tasker_id}`, {
        state: {
          fromQuote: true,
          tasker_id: quote.tasker_id,
          tasker_name: quote.tasker_name,
          variant_name: quote.variant_name,
          lockedPrice: quote.proposed_price,
          quote_id: quote.quote_id,
          post_id: postId,
        }
      });
    } catch (err) {
      showToast.error(err.message || 'Lỗi duyệt báo giá');
    }
  };

  return (

    <div className="quotes-container">
      <div className="quotes-header">
        <h1 className="quotes-title">Danh Sách Báo Giá</h1>
        <p className="quotes-subtitle">Quản lý và đánh giá các báo giá cho bài viết của bạn</p>
      </div>

      <div className="quotes-search-container">
        <div className="quotes-search-input-wrapper">
          <span className="quotes-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên..."
            className="quotes-search-input"
          />
        </div>
        <select className="quotes-select">
          <option>Tất cả danh giá</option>
          <option>Ngày đăng ký</option>
        </select>
      </div>


      {loading && <div className="text-center">Đang tải...</div>}
      {error && (
        <div className="quote-description-section" style={{ backgroundColor: '#fee2e2', borderLeft: '4px solid #dc2626' }}>
          {error}
        </div>
      )}

      {!loading && !error && quotes.length === 0 && (
        <div className="quote-description-section" style={{ backgroundColor: '#dbeafe', borderLeft: '4px solid #3b82f6' }}>
          Chưa có báo giá nào cho bài viết này.
        </div>
      )}

      {quotes.length > 0 && quotes.map((quote) => (
        <div key={quote.quote_id} className="quote-card">
          {/* Header: avatar, name, date */}
          <div className="quote-header-row" style={{ position: 'relative' }}>
            {/* Status badge in top right */}
            <div
              className={
                'quote-status-badge ' +
                ((quote.status === 'Đã duyệt' || quote.status === 'Chấp nhận') ? 'quote-status-approved' : 'quote-status-pending')
              }
              style={{ position: 'absolute', top: 0, right: 0, left: 'auto', zIndex: 2 }}
            >
              {quote.status}
            </div>
            <img src={quote.tasker_avatar || "/placeholder.svg"} alt={quote.tasker_name} className="quote-avatar" />
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' }}>
              <span className="quote-header-name">
                <Link
                  to={`/tasker-profile/${quote.tasker_id}`}
                  style={{ color: '#1e293b', textDecoration: 'none' }}
                >
                  {quote.tasker_name}
                </Link>
              </span>
              <span className="quote-header-date" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                {new Date(quote.sent_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          {/* Main content: service, price, message */}
          <div className="quote-main-content">
            <div>
              <span className="quote-service-label">Dịch vụ:</span>
              <span className="quote-service-name">{quote.variant_name}</span>
            </div>
            <div>
              <span className="quote-price-label">Giá đề xuất:</span>
              <span className="quote-price-value">
                {quote.proposed_price.toLocaleString()} ₫
              </span>
            </div>
            <div>
              <span className="quote-price-label">Tasker đề xuất:</span>
              <span className="quote-service-name">{quote.proposal || 'Không có đề xuất'}</span>
            </div>
          </div>
          {/* Action buttons row (ẩn nếu đã từ chối) */}
          {quote.status !== 'Đã từ chối' && quote.status !== 'Từ chối' && quote.status !== 'Chấp nhận' && quote.status !== 'Đã duyệt' && (
            <div className="quote-action-row">
              <button
                className="quote-action-btn"
                onClick={() => handleApprove(quote)}
                title="Duyệt"
              >
                <FaCheckCircle className="quote-action-icon" /> Duyệt
              </button>
              <button
                className="quote-action-btn"
                onClick={() => handleReject(quote)}
                title="Từ chối"
              >
                <FaTimesCircle className="quote-action-icon" /> Từ chối
              </button>
              <button
                className="quote-action-btn"
                title="Thương lượng giá"
              >
                <FaHandshake className="quote-action-icon" />
                <NegotiatePriceButton
                  peerId={quote.tasker_id || quote.taskerUserId}
                  quoteId={quote.quote_id}
                  label="Thương lượng giá"
                  className="btn"
                  size="md"
                />
              </button>
            </div>
          )}
        </div>
      ))}

      <div className="quote-button-container">
        <Link to="/my-blogs" className="quote-button">
          <FaArrowLeft size={20} />
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
              <button className="quote-button" onClick={handleConfirm}>Xác nhận Từ chối</button>
              <button className="quote-button quote-button-danger" onClick={handleCloseModal}>Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotesPage;