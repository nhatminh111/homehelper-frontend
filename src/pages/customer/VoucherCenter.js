import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { showToast } from "../../components/common/CustomToast";

export default function VoucherCenter() {
  const [points, setPoints] = useState(0);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState("all"); // all | unused | used | expiring

  const fetchData = async () => {
    try {
      const res = await api.get("/vouchers/my");

      if (res?.data?.success) {
        setPoints(res.data.points);
        setVouchers(res.data.vouchers);
      } else showToast.error("Không tải được voucher.");
    } catch (err) {
      console.error(err);
      showToast.error("Lỗi kết nối server.");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const redeem = async () => {
    if (points < 100) return showToast.warning("Cần đủ 100 điểm để đổi voucher.");

    try {
      const res = await api.post("/vouchers/redeem");
      if (res?.data?.success) {
        showToast.success("🎉 Đổi voucher thành công!");
        setPoints(res.data.points);
        setVouchers(res.data.vouchers);
      } else showToast.error(res.data.message);
    } catch (err) {
      console.error(err);
      showToast.error("Lỗi server.");
    }
  };

  const formatDateTime = (d) =>
    new Date(d).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const daysLeft = (d) => {
    const now = new Date();
    const exp = new Date(d);
    return Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
  };

  const mapType = (t) => (t === "reward" ? "Thưởng" : "Đền bù");

  const progress = Math.min((points % 100) / 100, 1) * 100;
  const pointsToNext = 100 - (points % 100);

  /** 📌 FILTER */
  const filtered = vouchers
    .filter((v) => {
      const left = daysLeft(v.expiry_date);

      switch (filter) {
        case "unused":
          return !v.used;   // used = false
        case "used":
          return !!v.used;  // used = true
        case "expiring":
          return left <= 2 && left >= 0 && v.used === 0;
        default:
          return true;
      }
    })
    .sort((a, b) => daysLeft(a.expiry_date) - daysLeft(b.expiry_date));

  return (
    <div className="container py-4 mt-4">

      <h2 className="fw-bold mb-4">🎟️ Kho Voucher</h2>

      {/* NOTE */}
      <div
        className="p-3 rounded-4 shadow-sm mb-4"
        style={{ background: "#eef6ff", borderLeft: "4px solid #2f80ed" }}
      >
        <p className="mb-1">
          💡 <strong>Mỗi lần hoàn thành công việc, bạn được +10 điểm.</strong>
        </p>
        <p className="mb-0">Đủ 100 điểm → đổi 1 voucher giảm giá 10%.</p>
      </div>

      {/* POINT BOX */}
      <div
        className="p-4 rounded-4 shadow mb-4"
        style={{
          background: "linear-gradient(135deg, #fffaf8ff, #ffeed3ff)",
          border: "1px solid #fbbea5ff",
        }}
      >
        <h4 className="fw-bold mb-2">
          ⭐ Điểm hiện tại:{" "}
          <span className="text-primary" style={{ fontSize: "1.4rem" }}>
            {points}
          </span>
        </h4>

        {/* ---- CHỈ CÒN 2 CASE ---- */}
        {points < 100 ? (
          <div className="mb-1 text-muted small">
            Cần thêm <strong>{pointsToNext}</strong> điểm để đổi voucher 10%
          </div>
        ) : (
          <div className="mb-1 text-success small fw-semibold">
            🎉 Bạn đã đủ điểm để đổi voucher 10%!
          </div>
        )}

        {/* ---- PROGRESS ---- */}
        <div
          className="progress rounded-pill"
          style={{ height: "10px", backgroundColor: "#ffe2b3" }}
        >
          <div
            className="progress-bar"
            role="progressbar"
            style={{
              width: points >= 100 ? "100%" : `${progress}%`,
              backgroundColor: "#ff9900",
              transition: "0.4s",
            }}
          ></div>
        </div>

        {/* ---- BUTTON ---- */}
        <button
          className="btn btn-warning fw-semibold px-4 py-2 rounded-3 shadow-sm mt-3"
          disabled={points < 100}
          onClick={redeem}
        >
          🔄 Đổi 100 điểm → Voucher 10%
        </button>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold mb-0">🎫 Voucher của bạn</h4>

        {/* DROPDOWN FILTER */}
        <select
          className="form-select w-auto fw-semibold"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ minWidth: "160px" }}
        >
          <option value="all">Tất cả</option>
          <option value="unused">Chưa dùng</option>
          <option value="used">Đã dùng</option>
          <option value="expiring">Sắp hết hạn</option>
        </select>
      </div>

      <div className="row">
        {!loading && filtered.length === 0 && (
          <p className="text-muted">Không có voucher phù hợp.</p>
        )}

        {filtered.map((v) => {
          const left = daysLeft(v.expiry_date);
          const expired = left < 0;
          const nearExpire = left <= 2 && left >= 0;

          return (
            <div className="col-md-4 mb-3" key={v.voucher_id}>
              <div
                className={
                  "p-4 h-100 rounded-4 shadow-sm coupon-card " +
                  (v.used ? "disabled-card" : "")
                }
                style={{
                  background: v.used ? "#e9e9e9" : "#ffffff",
                  border: v.type === "reward" ? "2px solid #4CAF50" : "2px solid #ff6f61",
                  transition: "0.3s",
                  cursor: v.used ? "not-allowed" : "pointer",
                  filter: v.used ? "grayscale(100%) brightness(90%)" : "none",
                }}
              >
                <h5
                  className="fw-bold mb-2"
                  style={{
                    color: v.type === "reward" ? "#2e7d32" : "#d84315",
                    fontSize: "1.4rem",
                  }}
                >
                  🎁 Giảm {v.discount * 100}%
                </h5>

                <span
                  className="badge mb-2"
                  style={{
                    backgroundColor: v.type === "reward" ? "#4CAF50" : "#ff6f61",
                    padding: "6px 12px",
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "0.85rem",
                  }}
                >
                  {mapType(v.type)}
                </span>

                <p className="mb-1">
                  <strong>HSD:</strong>{" "}
                  {daysLeft(v.expiry_date) < 0 ? (
                    <span className="text-danger">Đã hết hạn</span>
                  ) : (
                    formatDateTime(v.expiry_date)
                  )}
                </p>

                {daysLeft(v.expiry_date) >= 0 && (
                  <p className="mb-1 text-muted small">
                    ⏳ Còn{" "}
                    <strong
                      className={
                        daysLeft(v.expiry_date) <= 2 ? "text-danger" : "text-success"
                      }
                    >
                      {daysLeft(v.expiry_date)} ngày
                    </strong>
                  </p>
                )}

                <p className="mb-0">
                  <strong>Tình trạng:</strong>{" "}
                  <span className={v.used ? "text-danger" : "text-success"}>
                    {v.used ? "Đã dùng" : "Chưa dùng"}
                  </span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* CSS cho Hover */}
      <style>{`
        .coupon-card:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 8px 16px rgba(0,0,0,0.15) !important;
        }
          
        .disabled-card {
          pointer-events: none;
          opacity: 0.65;
        }

        .coupon-card:hover:not(.disabled-card) {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 8px 16px rgba(0,0,0,0.15) !important;
        }

      `}</style>
    </div>
  );
}
