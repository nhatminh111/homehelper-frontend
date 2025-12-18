import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faXmarkCircle, faArrowLeft, faRepeat } from '@fortawesome/free-solid-svg-icons';
import { formatVND } from '../utils/formatVND';
import '../css/topUp.css'; // tái dùng biến màu

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const PaymentResult = () => {
  const query = useQuery();
  const navigate = useNavigate();

  const [status, setStatus] = useState(null);
  const [info, setInfo] = useState({});

  useEffect(() => {
    const resultCode = query.get('resultCode');
    const orderId = query.get('orderId') || '';
    const amount = query.get('amount');
    const message = query.get('message');

    setInfo({ orderId, amount, message });
    setStatus(resultCode === '0' ? 'success' : 'fail');

    if (resultCode === '0') {
      try { window.dispatchEvent(new Event('wallet:refresh')); } catch { }
    }
  }, [query]);

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
