import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Card, Button, Spinner, Alert } from "react-bootstrap";

export default function PaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [remainingTime, setRemainingTime] = useState(null);

  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3001";

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.token) return;

    const fetchData = async () => {
      try {
        const [bRes, wRes] = await Promise.all([
          fetch(`${API_BASE}/api/bookings/${bookingId}`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          fetch(`${API_BASE}/api/wallet/balance`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
        ]);
        const bookingData = await bRes.json();
        const walletData = await wRes.json();
        setBooking(bookingData.data || bookingData.booking);
        setWallet(walletData);
      } catch (err) {
        console.error("Error loading payment info:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API_BASE, bookingId]);

  useEffect(() => {
    if (!booking?.booking_time) return;

    const countdownTimer = setInterval(() => {
      const bookingCreated = new Date(booking.booking_time.replace("Z", ""));
      const now = new Date();
      const diffMs = 30 * 60 * 1000 - (now - bookingCreated);

      if (diffMs <= 0) {
        setRemainingTime(0);
        clearInterval(countdownTimer);
      } else {
        const minutes = Math.floor(diffMs / 60000);
        const seconds = Math.floor((diffMs % 60000) / 1000);
        setRemainingTime(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      }
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, [booking]);

  const handleConfirmPayment = async () => {
    if (!wallet || !booking) return;

    const total = Number(booking.final_price || booking.expected_price);
    if (wallet.balance < total) {
      setMessage("❌ Số dư không đủ. Vui lòng nạp thêm tiền.");
      return;
    }

    try {
      await fetch(`${API_BASE}/api/wallet/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${
            JSON.parse(localStorage.getItem("user"))?.token
          }`,
        },
        body: JSON.stringify({
          booking_id: booking.booking_id,
          amount: total,
        }),
      });

      setMessage("✅ Thanh toán thành công!");
      setTimeout(() => navigate("/customer/bookings"), 1500);
    } catch (err) {
      console.error("Payment failed:", err);
      setMessage("❌ Thanh toán thất bại, thử lại sau.");
    }
  };

  useEffect(() => {
    if (!booking?.booking_id || booking?.status === "Hủy" || booking?.status === "Đã thanh toán") return;

    const interval = setInterval(async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const res = await fetch(`${API_BASE}/api/bookings/${booking.booking_id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const data = await res.json();
        if (data?.data?.status && data.data.status !== booking.status) {
          console.log("🔄 Booking status changed:", data.data.status);
          setBooking(prev => ({ ...prev, status: data.data.status }));
        }
      } catch (err) {
        console.error("Polling booking failed:", err);
      }
    }, 10000); // 🔁 Kiểm tra mỗi 10 giây

    return () => clearInterval(interval);
  }, [booking, API_BASE]);

  if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;

  return (
    <Container className="py-5">
      <style>{`
        .payment-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          padding: 24px;
          max-width: 600px;
          margin: auto;
        }
        .payment-header {
          font-weight: 700;
          font-size: 1.4rem;
          color: #0f4c75;
        }
        .payment-info {
          line-height: 1.8;
        }
        .price {
          color: #00b894;
          font-weight: 600;
          font-size: 1.2rem;
        }
      `}</style>

      <Card className="payment-card">
        <div className="payment-header mb-3">💳 Xác nhận thanh toán</div>

        {message && <Alert variant={message.includes("✅") ? "success" : "danger"}>{message}</Alert>}

        <div className="payment-info mb-4">
          <p><strong>Dịch vụ:</strong> {booking?.service_name}</p>
          <p><strong>Gói:</strong> {booking?.variant_name || "-"}</p>
          <p><strong>Giá cuối cùng:</strong> <span className="price">{Number(booking?.final_price || booking?.expected_price).toLocaleString("vi-VN")} ₫</span></p>
          <hr />
          <p><strong>Số dư ví hiện tại:</strong> <span className="price">{wallet?.balance.toLocaleString("vi-VN")} ₫</span></p>
        </div>

        {remainingTime !== null && (
          <div className="text-center text-danger fw-semibold mb-3">
            {remainingTime === 0
              ? "⏰ Đơn này đã hết thời gian thanh toán (30 phút) và sẽ bị hủy."
              : `🕒 Đơn sẽ tự hủy sau ${remainingTime}`}
          </div>
        )}

        <Button
          variant="success"
          className="w-100"
          size="lg"
          onClick={handleConfirmPayment}
          disabled={remainingTime === 0}
        >
          ✅ Xác nhận thanh toán
        </Button>

        <Button variant="secondary" className="w-100 mt-2" onClick={() => navigate("/customer/bookings")}>
          ↩️ Quay lại
        </Button>
      </Card>
    </Container>
  );
}
