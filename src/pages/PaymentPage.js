import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Card, Button, Spinner, Alert } from "react-bootstrap";
import { formatVND } from "../utils/formatVND";
import api from "../services/api";

export default function PaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [remainingTime, setRemainingTime] = useState(null);

  const [vouchers, setVouchers] = useState([]);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);

  const API_BASE = (process.env.REACT_APP_API_URL || "http://localhost:3001/api").replace(/\/api$/, "").replace(/\/$/, "");

  useEffect(() => {
    const load = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const [bRes, wRes, vRes] = await Promise.all([
          fetch(`${API_BASE}/api/bookings/${bookingId}`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          fetch(`${API_BASE}/api/wallet/balance`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          fetch(`${API_BASE}/api/vouchers/available-for-booking`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
        ]);

        const bookingData = await bRes.json();
        const walletData = await wRes.json();
        const voucherData = await vRes.json();

        console.log("📦 [PaymentPage] Raw bookingData:", bookingData);

        // Ensure we get the object whether it's wrapped or flat
        const bookingObj = bookingData.data || bookingData.booking || bookingData;

        console.log("📦 [PaymentPage] Extracted bookingObj:", bookingObj);
        console.log("🔢 [PaymentPage] Quantity:", bookingObj?.quantity);

        setBooking(bookingObj);
        setWallet(walletData);
        setVouchers(voucherData.vouchers || []);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [bookingId, API_BASE]);

  useEffect(() => {
    if (!booking?.booking_time) return;

    const timer = setInterval(() => {
      const created = new Date(booking.booking_time.replace("Z", ""));
      const now = new Date();
      const diffMs = 30 * 60 * 1000 - (now - created);

      if (diffMs <= 0) {
        setRemainingTime(0);
        clearInterval(timer);
      } else {
        const m = Math.floor(diffMs / 60000);
        const s = Math.floor((diffMs % 60000) / 1000);
        setRemainingTime(`${m}:${s.toString().padStart(2, "0")}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [booking]);

  const getDisplayUnit = (u) => {
    if (!u) return "Lượt";
    const lower = u.toLowerCase();
    if (lower.includes("m2") || lower.includes("m²") || lower.includes("mét")) return "Mét vuông";
    if (lower.includes("giờ") || lower.includes("hour")) return "Giờ";
    if (lower.includes("ngày") || lower.includes("day")) return "Ngày";
    if (lower.includes("tuần") || lower.includes("week")) return "Tuần";
    if (lower.includes("tháng") || lower.includes("month")) return "Tháng";
    if (lower.includes("buổi")) return "Buổi";
    if (lower.includes("chiếc") || lower.includes("item")) return "Chiếc";
    return u;
  };

  const quantity = Number(booking?.quantity || 1);
  let unitPrice = 0;
  let rawTotal = 0;

  if (booking?.final_price && Number(booking.final_price) > 0) {
    unitPrice = Number(booking.final_price);
    rawTotal = unitPrice * quantity;
  } else {
    unitPrice = Number(booking?.expected_price || 0);
    rawTotal = unitPrice * quantity;
  }

  const total = selectedVoucher
    ? Math.round(rawTotal * (1 - selectedVoucher.discount))
    : rawTotal;

  const handlePay = async () => {
    if (!wallet || !booking) return;
    if (wallet.balance < total) {
      setMessage("❌ Số dư không đủ. Vui lòng nạp thêm tiền.");
      return;
    }

    try {
      await fetch(`${API_BASE}/api/wallet/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${JSON.parse(localStorage.getItem("user"))?.token}`,
        },
        body: JSON.stringify({
          booking_id: booking.booking_id,
          amount: total,
          voucher_id: selectedVoucher?.voucher_id || null,
        }),
      });

      setMessage("✅ Thanh toán thành công!");
      setTimeout(() => navigate("/customer/bookings"), 1200);
    } catch {
      setMessage("❌ Thanh toán thất bại.");
    }
  };

  if (loading)
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
      </div>
    );

  return (
    <>
      {/* STYLE NEW UI */}
      <style>{`
        .payment-wrapper {
          max-width: 700px;
          margin: auto;
        }

        .payment-card {
          background: #ffffff;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.08);
          transition: 0.3s;
        }

        .payment-card:hover {
          transform: translateY(-2px);
        }

        .title-text {
          font-size: 1.8rem;
          font-weight: 700;
          color: #0d4a78;
        }

        .price-main {
          color: #ff0000ff;
          font-weight: 700;
          font-size: 1.6rem;
        }

        /* VOUCHER BUTTON */
        .voucher-btn {
          background: #fff4e6;
          border: 2px dashed #ffb866;
          color: #ff7b00;
          padding: 12px;
          border-radius: 14px;
          font-weight: 600;
          width: 100%;
          transition: 0.25s;
        }

        .voucher-btn:hover {
          background: #ffe4c4;
          transform: translateY(-2px);
        }

        .voucher-item {
          background: linear-gradient(135deg, #fff5e6, #ffe0b7);
          padding: 18px;
          border-radius: 18px;
          border: 1px solid #f3c288;
          cursor: pointer;
          transition: 0.25s;
        }

        .voucher-item:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 14px rgba(0,0,0,0.12);
        }

        .voucher-item.active {
          border: 2px solid #ffa533;
          box-shadow: 0 0 8px rgba(255,165,51,0.6);
        }

        /* MODAL STYLE – COPY FROM NoShowReportPage */
        .cancel-overlay {
          position: fixed;
          top:0; left:0;
          width:100%; height:100%;
          background-color: rgba(0,0,0,0.45);
          display:flex;
          justify-content:center;
          align-items:center;
          z-index:2000;
        }

        .cancel-box {
          width:90%;
          max-width:480px;
          background:white;
          padding:24px;
          border-radius:16px;
          box-shadow:0 8px 22px rgba(0,0,0,0.18);
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from { opacity:0; transform:scale(0.97); }
          to   { opacity:1; transform:scale(1); }
        }
          .modal-voucher-box {
            width: 92%;
            max-width: 480px;
            max-height: 70vh;        /* cố định chiều cao */
            overflow-y: auto;        /* danh sách cuộn */
            background: white;
            padding: 24px;
            border-radius: 16px;
            box-shadow: 0 8px 22px rgba(0,0,0,0.18);
            animation: fadeIn 0.2s ease-out;
          }

          /* thanh cuộn đẹp */
          .modal-voucher-box::-webkit-scrollbar {
            width: 8px;
          }
          .modal-voucher-box::-webkit-scrollbar-thumb {
            background: #ffb86c;
            border-radius: 10px;
          }
          .price-origin {
            color: #6c757d; /* xám nhạt */
            font-weight: 600;
          }

          .price-discount {
            color: #1aa11a; /* xanh tiết kiệm */
            font-weight: 700;
          }

          .price-total {
            color: #e60000; /* đỏ nổi bật */
            font-size: 1.3rem;
            font-weight: 700;
          }
          .voucher-disabled {
            opacity: 0.45;
            pointer-events: none;
            filter: grayscale(100%);
          }

          .voucher-disabled:hover {
            transform: none;
            box-shadow: none;
            cursor: not-allowed;
          }
      `}</style>

      <Container className="py-4 payment-wrapper">
        <Card className="payment-card">

          <div className="title-text mb-3">💳 Xác nhận thanh toán</div>

          {message && (
            <Alert
              variant={message.includes("✅") ? "success" : "danger"}
              className="fw-semibold"
            >
              {message}
            </Alert>
          )}

          <p><strong>Dịch vụ:</strong> {booking?.service_name}</p>
          <p><strong>Gói:</strong> {booking?.variant_name || "-"}</p>
          {booking?.description && (
            <p><strong>Lưu ý:</strong> <span className="text-primary fw-bold">{booking.description}</span></p>
          )}

          {/* HIỂN THỊ GIÁ THEO 3 DÒNG */}
          <p className="mb-1 text-muted">
            - Đơn giá: {formatVND(unitPrice)} / {getDisplayUnit(booking?.unit)}
          </p>

          {quantity > 1 && (
            <p className="mb-1 text-muted">
              - Số lượng: {quantity} {getDisplayUnit(booking?.unit)}
            </p>
          )}

          <p className="mb-1 price-origin">
            - Tổng tiền: {formatVND(rawTotal)}
          </p>

          {selectedVoucher ? (
            <p className="mb-1 price-discount mt-2">
              - Giảm {selectedVoucher.discount * 100}%
              {" "}(-{formatVND(Math.round(rawTotal * selectedVoucher.discount))})
            </p>
          ) : (
            <p className="mb-1 text-muted mt-2">
              Chưa áp dụng voucher
            </p>
          )}

          <p className="mt-2">
            <span className="price-total">
              - Giá tiền phải trả: {formatVND(total)}
            </span>
          </p>

          <button
            className="voucher-btn mt-2"
            onClick={() => setShowVoucherModal(true)}
          >
            🎟 Chọn voucher
          </button>

          <hr />

          {remainingTime !== null && (
            <div className="text-center text-danger fw-bold mt-2">
              {remainingTime === 0
                ? "⏰ Đơn đã hết thời gian thanh toán!"
                : `🕒 Đơn tự hủy sau ${remainingTime}`}
            </div>
          )}

          <Button
            onClick={handlePay}
            className="w-100 mt-3 py-2"
            variant="success"
            size="lg"
            disabled={remainingTime === 0}
          >
            Xác nhận thanh toán
          </Button>

          <Button
            className="w-100 mt-2 py-2"
            variant="secondary"
            onClick={() => navigate("/customer/bookings")}
          >
            Quay lại
          </Button>
        </Card>
      </Container>

      {/* MODAL – voucher cố định + cuộn */}
      {showVoucherModal && (
        <div className="cancel-overlay" onClick={() => setShowVoucherModal(false)}>
          <div className="modal-voucher-box" onClick={(e) => e.stopPropagation()}>
            <h5 className="fw-bold mb-3">🎟 Danh sách voucher</h5>

            {vouchers.length === 0 ? (
              <p className="text-muted text-center">
                Hiện bạn không có voucher nào.
              </p>
            ) : (
              vouchers.map((v) => {
                const disabled = v.used === 1 || new Date(v.expiry_date) < new Date();

                return (
                  <div
                    key={v.voucher_id}
                    className={
                      "voucher-item mb-3 " +
                      (disabled ? "voucher-disabled" : "") +
                      (selectedVoucher?.voucher_id === v.voucher_id ? " active" : "")
                    }
                    onClick={() => {
                      if (disabled) return; // chặn click voucher used
                      if (selectedVoucher?.voucher_id === v.voucher_id) setSelectedVoucher(null);
                      else setSelectedVoucher(v);
                      setShowVoucherModal(false);
                    }}
                  >
                    <div className="fw-bold">
                      {v.type === "compensation" ? "🎁 Đền bù" : "⭐ Thưởng"}
                    </div>

                    <div>Giảm: {v.discount * 100}%</div>

                    <div className="text-muted small">
                      HSD: {new Date(v.expiry_date).toLocaleDateString("vi-VN")}
                    </div>

                    {v.used === 1 && (
                      <div className="text-danger small fw-bold mt-1">
                        ĐÃ SỬ DỤNG
                      </div>
                    )}
                  </div>
                );
              })
            )}

            <div className="d-flex justify-content-end mt-2">
              <button
                className="btn btn-light fw-semibold"
                onClick={() => setShowVoucherModal(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
