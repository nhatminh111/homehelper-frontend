import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronRight, faQrcode, faCircleCheck, faCopy, faArrowUpRightFromSquare,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import '../css/topUp.css';
import useWalletBalance from '../hooks/useWalletBalance';
import { formatVND } from '../utils/formatVND';

import api from '../services/api';

function useCurrentUser() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (raw) setUser(JSON.parse(raw));
  }, []);
  return user;
}

const PRESETS = [10000, 20000, 50000, 100000, 200000, 500000, 1000000, 2000000];

const TopUp = () => {
  const currentUser = useCurrentUser();
  const navigate = useNavigate();

  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [payUrl, setPayUrl] = useState('');
  const [orderInfo, setOrderInfo] = useState(null);
  const [error, setError] = useState('');
  const [polling, setPolling] = useState(false);

  const disabled = useMemo(() => loading || polling, [loading, polling]);

  const { balance, loading: balanceLoading, error: balanceError, refresh } = useWalletBalance();

  const createOrder = async (e) => {
    e?.preventDefault?.();
    setError('');

    const v = Number(amount);
    if (!Number.isFinite(v) || v < 1000) {
      setError('Số tiền không hợp lệ (>= 1.000đ).');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/momo/create', { amount: v });
      const data = res.data;

      // Trường hợp tạo đơn mới bình thường (có payUrl)
      if (!data?.momo?.payUrl) {
        throw new Error(data?.error?.message || data?.detail?.message || data?.error || 'Tạo đơn thất bại');
      }
      setPayUrl(data.momo.payUrl);
      setOrderInfo({
        orderId: data.momo.orderId,
        requestId: data.momo.requestId,
        amount: v,
        startedAt: Date.now(),
      });
      try { window.open(data.momo.payUrl, '_blank', 'noopener'); } catch { }
      setPolling(true);
    } catch (err) {
      // Nếu BE báo đã có đơn pending (409) → khởi động poll đơn cũ
      if (err.status === 409 && (err.data?.error === 'pending_exists' || err.data?.momo?.status === 'pending')) {
        const data = err.data;
        setPayUrl('');
        setOrderInfo({
          orderId: data.momo.orderId,
          requestId: null,
          amount: data.momo.amount ?? v,
          startedAt: Date.now(),
        });
        setPolling(true);
        return;
      }

      console.error('[TopUp] Lỗi tạo đơn:', err);
      setError(err.message || 'Có lỗi xảy ra');
      setPayUrl('');
      setOrderInfo(null);
      setPolling(false);
    } finally {
      setLoading(false);
    }
  };

  // Poll trạng thái đơn mỗi 3s trong tối đa 5 phút, xong thì điều hướng
  useEffect(() => {
    if (!polling || !orderInfo?.orderId) return;

    const interval = setInterval(async () => {
      const exceeded =
        orderInfo?.startedAt && Date.now() - orderInfo.startedAt > 5 * 60 * 1000;

      if (exceeded) {
        clearInterval(interval);
        setPolling(false);
        return;
      }

      try {
        const res = await api.get(`/momo/order/${orderInfo.orderId}`);
        const d = res.data;
        if (d?.status === 'success' || d?.status === 'failed') {
          clearInterval(interval);
          setPolling(false);
          navigate(`/payment-result?orderId=${orderInfo.orderId}`);
        }
      } catch {
        // bỏ qua lỗi lẻ
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [polling, orderInfo?.orderId, orderInfo?.startedAt, navigate]);

  const copyLink = async () => {
    if (!payUrl) return;
    await navigator.clipboard.writeText(payUrl);
    alert('Đã copy liên kết thanh toán.');
  };

  const pickPreset = (v) => setAmount(String(v));

  return (
    <>
      {/* Hero giữ nguyên, nhưng CSS đã làm sáng overlay */}
      <section className="hero-wrap hero-wrap-2" style={{ backgroundImage: "url('/images/bg_2.jpg')" }} data-stellar-background-ratio="0.5">
        <div className="overlay"></div>
        <div className="container">
          <div className="row no-gutters slider-text align-items-end">
            <div className="col-md-9 ftco-animate pb-5">
              <p className="breadcrumbs mb-2">
                <span className="mr-2"><Link to="/">Home <FontAwesomeIcon icon={faChevronRight} /></Link></span>
                <span>Nạp Ví</span>
              </p>
              <h1 className="mb-0 bread">Nạp ví qua MoMo</h1>
              {currentUser && (
                <p className="text-white-50 small mb-0">
                  Xin chào, <b>{currentUser.name || currentUser.email}</b>
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Body: layout 1 cột, từ trên xuống ===== */}
      <section className="topup-body one-column">
        <div className="shell single-col">

          <div
            className="glass card-top mb-4"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            onClick={refresh}
          >
            <h3 className="card-title mb-0">Số dư ví</h3>
            <strong style={{ fontSize: 22, color: '#16a34a' }}>
              {balanceError ? 'Lỗi' : (balanceLoading ? '...' : formatVND(balance))}
            </strong>
          </div>

          {/* ===== Bước 1: Nhập số tiền ===== */}
          <div className="glass card-top">
            <h3 className="card-title">1) Nhập số tiền</h3>
            <form onSubmit={createOrder}>
              <div className="amount-input">
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  inputMode="numeric"
                  placeholder="Ví dụ: 10000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={disabled}
                  aria-label="Số tiền cần nạp"
                />
                <span className="suffix">VND</span>
              </div>

              <div className="presets" aria-label="Mệnh giá nhanh">
                {PRESETS.map(v => (
                  <button
                    key={v}
                    type="button"
                    className={`pill ${Number(amount) === v ? 'active' : ''}`}
                    onClick={() => pickPreset(v)}
                    disabled={disabled}
                  >
                    {formatVND(v / 1000)}
                  </button>
                ))}
              </div>

              {error && <div className="alert error" role="alert">{error}</div>}

              <button className={`btn-gradient btn-xl ${disabled ? 'btn-disabled' : ''}`} disabled={disabled}>
                {loading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin /> Đang tạo mã...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faQrcode} /> Tạo mã nạp MoMo
                  </>
                )}
              </button>
            </form>

            {orderInfo && (
              <div className="order-box" aria-live="polite">
                <div className="order-icon">
                  <FontAwesomeIcon icon={faCircleCheck} />
                </div>
                <div className="order-meta">
                  <div>Đơn nạp: <b>{orderInfo.orderId}</b></div>
                  <div>Số tiền: <b>{formatVND(orderInfo.amount / 1000)}</b></div>
                </div>
              </div>
            )}
          </div>

          {/* ===== Bước 2: Thanh toán ===== */}
          <div className="glass card-payment">
            <div className="card-payment-header">
              <h3 className="payment-title">2) Thanh toán MoMo</h3>
              <div className="actions">
                <button className="btn-icon" onClick={copyLink} disabled={!payUrl} title="Copy link">
                  <FontAwesomeIcon icon={faCopy} />
                </button>
                <a className={`btn-icon ${!payUrl ? 'disabled' : ''}`} href={payUrl || '#'} target="_blank" rel="noreferrer" title="Mở MoMo">
                  <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                </a>
              </div>
            </div>

            <div className={`qr-frame tall ${payUrl ? '' : 'skeleton'}`}>
              {payUrl ? (
                <iframe title="MoMo Payment" src={payUrl} />
              ) : (
                <div className="qr-empty">
                  <div className="ghost-line w-60" />
                  <div className="ghost-line w-40" />
                  <p className="hint">
                    Sau khi tạo, tab MoMo sẽ mở tự động. Nếu không, bấm <b>Mở MoMo</b> ở góc phải.
                  </p>
                </div>
              )}
            </div>

            <p className="note">
              Trang MoMo đã hiển thị thời gian hết hạn đơn. Bạn có thể rời trang này trong lúc thanh toán.
              Hệ thống sẽ tự chuyển sang trang kết quả khi hoàn tất.
            </p>
          </div>

        </div>
      </section>
    </>
  );
}

export default TopUp;
