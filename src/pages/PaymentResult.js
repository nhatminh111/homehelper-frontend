import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faXmarkCircle, faArrowLeft, faRepeat } from '@fortawesome/free-solid-svg-icons';
import { formatVND } from '../utils/formatVND';
import api from '../services/api';
import '../css/topUp.css'; // tái dùng biến màu

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const PaymentResult = () => {
  const location = useLocation();
  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const navigate = useNavigate();

  const [status, setStatus] = useState('loading'); // loading | success | failed
  const [info, setInfo] = useState({});

  useEffect(() => {
    const orderId = query.get('orderId');
    const amount = query.get('amount');

    if (!orderId) {
      console.log('[PaymentResult] No orderId found in URL');
      setStatus('failed');
      return;
    }

    setInfo({ orderId, amount });

    // Gọi API để đồng bộ và kiểm tra trạng thái thực tế từ Server
    let isMounted = true;
    const verifyPayment = async () => {
      try {
        console.log('[PaymentResult] Verifying order:', orderId);
        const res = await api.get(`/momo/order/${orderId}`);
        const data = res.data;

        if (!isMounted) return;

        if (data.status === 'success') {
          setStatus('success');
          setInfo(prev => ({ ...prev, amount: data.amount || amount }));
          try { window.dispatchEvent(new Event('wallet:refresh')); } catch { }
        } else {
          setStatus('failed');
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('[PaymentResult] Verify error:', err);
        setStatus('failed');
      }
    };

    verifyPayment();
    return () => { isMounted = false; };
  }, [query]); // query hiện tại đã được memoize, không gây lặp

  const displayOrderId = useMemo(
    () => (info.orderId || ''), // .replace(/^TOPUP_/, 'NAPVI_')
    [info.orderId]
  );

  const niceAmount = useMemo(() => {
    if (info.amount == null || info.amount === '') return '—';
    const n = Number(info.amount);
    return Number.isFinite(n) ? formatVND(n / 1000) : String(info.amount) + '₫';
  }, [info.amount]);

  const note = status === 'success'
    ? 'Nạp tiền vào ví thành công'
    : 'Thanh toán thất bại, vui lòng thử lại';

  return (
    <section className="result-wrap">
      <div className="result-shell">
        <div className={`result-card ${status === 'success' ? 'result-success' : 'result-failed'}`}>
          <div className="result-icon">
            {status === 'success' ? (
              <FontAwesomeIcon icon={faCheckCircle} />
            ) : (
              <FontAwesomeIcon icon={faXmarkCircle} />
            )}
          </div>

          <h1 className="result-title">
            {status === 'success' ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
          </h1>

          <div className="result-kpis">
            <div className="kpi">
              <span className="kpi-label">Mã đơn</span>
              <span className="kpi-value">{displayOrderId || '—'}</span>
            </div>
            <div className="kpi">
              <span className="kpi-label">Số tiền</span>
              <span className="kpi-value">{niceAmount}</span>
            </div>
            <div className="kpi centered">
              <span className="kpi-label">Ghi chú</span>
              <span className="kpi-value">{note}</span>
            </div>
          </div>

          <div className="result-actions">
            {/* <button className="btn-ghost-lite" onClick={() => navigate(-1)}>
              <span className="ico"><FontAwesomeIcon icon={faArrowLeft} /></span> Quay lại
            </button> */}
            <button className="btn-solid" onClick={() => navigate('/topUp')}>
              <span className="ico"><FontAwesomeIcon icon={faRepeat} /></span> Nạp thêm
            </button>
            <button className="btn-outline" onClick={() => navigate('/')}>
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PaymentResult;
