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
    const raw = localStorage.getItem('user') || localStorage.getItem('currentUser');
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
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
      setError('Số tiền không hợp lệ (tối thiểu 1.000đ).');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/momo/create', { amount: v });
      const data = res.data;

      if (!data?.momo?.payUrl) {
        throw new Error(data?.error?.message || data?.detail?.message || data?.error || 'Tạo đơn thanh toán thất bại');
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

      const errMsg = err.message || 'Có lỗi xảy ra khi tạo đơn hàng';
      setError(errMsg);
      setPayUrl('');
      setOrderInfo(null);
      setPolling(false);
    } finally {
      setLoading(false);
    }
  };

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
        if (d?.status === 'success') {
          clearInterval(interval);
          setPolling(false);
          navigate(`/payment-result?orderId=${orderInfo.orderId}`);
        } else if (d?.status === 'failed') {
          clearInterval(interval);
          setPolling(false);
          navigate(`/payment-result?orderId=${orderInfo.orderId}`);
        }
      } catch (pollErr) {
        // Silently retry polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [polling, orderInfo?.orderId, orderInfo?.startedAt, navigate]);

  const copyLink = async () => {
    if (!payUrl) return;
    await navigator.clipboard.writeText(payUrl);
    alert('Đã sao chép liên kết thanh toán MoMo.');
  };

  const pickPreset = (v) => setAmount(String(v));

  return (
    <>
      <section className="hero-wrap hero-wrap-2" style={{ backgroundImage: "url('/images/bg_2.jpg')" }} data-stellar-background-ratio="0.5">
        <div className="overlay"></div>
        <div className="container">
          <div className="row no-gutters slider-text align-items-end">
            <div className="col-md-9 ftco-animate pb-5">
              <p className="breadcrumbs mb-2">
                <span className="mr-2"><Link to="/">Trang chủ <FontAwesomeIcon icon={faChevronRight} /></Link></span>
                <span>Nạp Ví</span>
              </p>
              <h1 className="mb-0 bread">Nạp tiền vào ví qua MoMo</h1>
              {currentUser && (
                <p className="text-white-50 small mb-0">
                  Xin chào, <b>{currentUser.name || currentUser.email || 'bạn'}</b>
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="topup-body one-column">
        <div className="shell single-col">

          <div
            className="glass card-top mb-4"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            onClick={refresh}
          >
            <h3 className="card-title mb-0">Số dư hiện tại</h3>
            <strong style={{ fontSize: 22, color: '#16a34a' }}>
              {balanceError ? 'Lỗi tải' : (balanceLoading ? 'Đang tải...' : formatVND(balance))}
            </strong>
          </div>

          <div className="glass card-top">
            <h3 className="card-title">1) Nhập số tiền muốn nạp</h3>
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
                    <FontAwesomeIcon icon={faSpinner} spin /> Đang tạo mã nạp...
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
                  <div>Mã đơn: <b>{orderInfo.orderId}</b></div>
                  <div>Số tiền: <b>{formatVND(orderInfo.amount / 1000)}</b></div>
                </div>
              </div>
            )}
          </div>

          <div className="glass card-payment">
            <div className="card-payment-header">
              <h3 className="payment-title">2) Thanh toán an toàn</h3>
              <div className="actions">
                <button className="btn-icon" onClick={copyLink} disabled={!payUrl} title="Sao chép liên kết">
                  <FontAwesomeIcon icon={faCopy} />
                </button>
                <a className={`btn-icon ${!payUrl ? 'disabled' : ''}`} href={payUrl || '#'} target="_blank" rel="noreferrer" title="Mở ứng dụng MoMo">
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
                    Sau khi nhấn tạo mã, ứng dụng MoMo sẽ tự động mở. Nếu không, bạn vui lòng nhấn <b>Mở MoMo</b> ở phía trên.
                  </p>
                </div>
              )}
            </div>

            <p className="note">
              Sau khi thanh toán thành công trên ứng dụng MoMo, tiền sẽ tự động được cộng vào ví của bạn.
              Bạn có thể đóng trang này sau khi giao dịch hoàn tất.
            </p>
          </div>

        </div>
      </section>
    </>
  );
}

export default TopUp;
