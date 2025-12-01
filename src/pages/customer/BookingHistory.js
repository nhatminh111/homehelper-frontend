import React, { useEffect, useState } from "react";
import { Container, Table, Badge, Button, Spinner } from "react-bootstrap";
import { Calendar, MapPin, Clock, Info, MessageCircle } from "lucide-react";
import NegotiatePriceButton from "../../components/negotiation/NegotiatePriceButton";

export default function BookingHistory() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isCancelling, setIsCancelling] = useState(false);

    const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3001";

    const openCancelModal = (booking) => {
        setSelectedBooking(booking);
        setShowCancelModal(true);
    };

    const closeCancelModal = () => {
        setSelectedBooking(null);
        setShowCancelModal(false);
    };

    const handleConfirmCancel = async () => {
        if (!selectedBooking) return;
        setIsCancelling(true);

        try {
            const user = JSON.parse(localStorage.getItem("user"));
            const res = await fetch(`${API_BASE}/api/bookings/${selectedBooking.booking_id}/cancel`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user?.token}`,
                },
                body: JSON.stringify({ cancelledBy: "customer" }),
            });

            const data = await res.json();
            if (data.success) {
                alert(`✅ Hủy thành công!\nRule: ${data.rule}\nHoàn: ${data.refundAmount.toLocaleString("vi-VN")}₫`);
                // Reload danh sách booking
                window.location.reload();
            } else {
                alert(`❌ Hủy thất bại: ${data.message}`);
            }
        } catch (err) {
            console.error("Cancel booking failed:", err);
            alert("Lỗi khi gửi yêu cầu hủy!");
        } finally {
            setIsCancelling(false);
            closeCancelModal();
        }
    };

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const user = JSON.parse(localStorage.getItem("user"));
                const token = user?.token;
                if (!token) return;

                let url = `${API_BASE}/api/bookings/mybookings`;
                if (statusFilter !== "all") url += `?status=${statusFilter}`;

                const res = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                setBookings(data.data || []);
            } catch (err) {
                console.error("❌ Error fetching bookings:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, [statusFilter, API_BASE]);

    const getBadgeVariant = (status) => {
        if (!status) return "secondary";
        if (status.includes("Hoàn")) return "success";
        if (status.includes("Chờ")) return "warning";
        if (status.includes("Hủy")) return "danger";
        if (status.includes("Đang")) return "info";
        if (status.includes("Chấp")) return "primary";
        if (status.includes("Thanh toán")) return "dark";
        return "secondary";
    };

    const handleContract = (booking) => {
        window.location.href = `/contract/${booking.booking_id}`;
    };

    return (
        <Container className="py-4">
            <style>{`
      .history-header {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
        }

        .history-header h3 {
          font-weight: 700;
          color: #0f4c75;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-select {
          border-radius: 12px;
          padding: 8px 16px;
          border: 1px solid #d0e2ff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
          transition: all 0.2s;
        }
        .filter-select:hover {
          border-color: #00b4d8;
        }
        .booking-row:hover {
          background-color: #f9fcff;
          transition: background-color 0.2s ease-in-out;
        }
        .table {
          border-radius: 12px;
          overflow: hidden;
        }
        button.btn {
          border-radius: 10px !important;
        }
        .action-buttons {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          flex-wrap: nowrap;
        }
          .cancel-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.4);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
        }

        .cancel-box {
            background: white;
            padding: 24px;
            border-radius: 12px;
            max-width: 480px;
            width: 90%;
            box-shadow: 0 6px 20px rgba(0,0,0,0.15);
            animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .cancel-box h5 {
            color: #d90429;
            font-weight: bold;
            margin-bottom: 12px;
        }

        .cancel-box ul {
            font-size: 14px;
            color: #555;
            margin-bottom: 16px;
        }
      `}</style>

            <div className="history-header">
                <h3>📜 Lịch sử đặt dịch vụ</h3>
                <select
                    className="filter-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="all">Tất cả</option>
                    <option value="Pending">Chờ xử lý</option>
                    <option value="Accepted">Đã chấp nhận</option>
                    <option value="In Progress">Đang tiến hành</option>
                    <option value="Completed">Hoàn thành</option>
                    <option value="Cancelled">Hủy</option>
                </select>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                </div>
            ) : bookings.length === 0 ? (
                <div className="text-center text-muted py-5">
                    <Info size={32} className="mb-2" />
                    <p>Không có công việc nào phù hợp.</p>
                </div>
            ) : (
                <div className="table-responsive">
                    <Table hover className="align-middle shadow-sm border rounded-3">
                        <thead className="table-light">
                            <tr>
                                <th>#</th>
                                <th>Dịch vụ</th>
                                <th>Gói</th>
                                <th>Thời gian</th>
                                <th>Địa chỉ</th>
                                <th>Trạng thái</th>
                                <th>Tổng tiền</th>
                                <th className="text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map((b, idx) => (
                                <tr key={b.booking_id} className="booking-row">
                                    <td className="fw-semibold text-secondary">{idx + 1}</td>
                                    <td className="fw-semibold text-dark">{b.service_name}</td>
                                    <td>{b.variant_name || "-"}</td>
                                    <td className="small text-muted">
                                        <Calendar size={14} className="me-1" />
                                        {b.start_time
                                            ? new Date(b.start_time).toLocaleString("vi-VN", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                            })
                                            : "-"}
                                        <br />
                                        <Clock size={14} className="me-1" />
                                        {b.end_time
                                            ? new Date(b.end_time).toLocaleTimeString("vi-VN", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                year: "numeric",
                                            })
                                            : "-"}
                                    </td>
                                    <td>
                                        <MapPin size={14} className="me-1 text-secondary" />
                                        {b.location || "Không có địa chỉ"}
                                    </td>
                                    <td>
                                        <Badge bg={getBadgeVariant(b.status)}>{b.status}</Badge>
                                    </td>
                                    <td className="fw-bold text-primary">
                                        {(b.final_price && b.final_price !== 0)
                                            ? Number(b.final_price).toLocaleString("vi-VN") + " ₫"
                                            : (b.expected_price
                                                ? Number(b.expected_price).toLocaleString("vi-VN") + " ₫"
                                                : "-")}
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            {/* Nút hành động chính */}
                                            {b.status === "Đã chấp nhận" ? (
                                                ["week", "month"].includes(b.pricing_type) ? (
                                                    <Button
                                                        variant="warning"
                                                        size="sm"
                                                        onClick={() => handleContract(b)}
                                                    >
                                                        📄 Ký hợp đồng
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        className="btn-modern"
                                                        onClick={() => {
                                                            window.location.href = `/payment/${b.booking_id}`;
                                                        }}
                                                    >
                                                        💳 Thanh toán
                                                    </Button>
                                                )
                                            ) : b.status === "Đã thanh toán" ? (
                                                <Button variant="outline-secondary" size="sm" disabled>
                                                    Đang tiến hành
                                                </Button>
                                            ) : (
                                                <Button variant="outline-secondary" size="sm" disabled>
                                                    {b.status}
                                                </Button>
                                            )}
                                            {/* ➕ Nút Hủy (chỉ hiện khi còn có thể hủy) */}
                                            {["Đã chấp nhận", "Đã thanh toán"].includes(b.status) && (
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    className="ms-2"
                                                    onClick={() => openCancelModal(b)} // mở modal điều khoản
                                                >
                                                    ❌ Hủy
                                                </Button>
                                            )}

                                            {/* Nút Chat */}
                                            <NegotiatePriceButton
                                                peerId={b.tasker_id}
                                                bookingId={b.booking_id}
                                                label="Chat"
                                                size="md"
                                                onClick={() => {
                                                    window.location.href = `/chat?bookingId=${b.booking_id}&negotiation=1&peer=${b.tasker_id}`;
                                                }}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            )}
            {showCancelModal && (
                <div className="cancel-overlay" onClick={closeCancelModal}>
                    <div className="cancel-box" onClick={(e) => e.stopPropagation()}>
                        <h5>📜 Chính sách hủy & hoàn tiền</h5>
                        <ul>
                            <li>🕐 Trên 24h: Hoàn 100%</li>
                            <li>⏰ 12–24h: Hoàn 75% – trừ 25%</li>
                            <li>⌛ 4–12h: Hoàn 50% – đền 50%</li>
                            <li>🚫 Dưới 4h: Không hoàn tiền</li>
                            <li>⚡ Tasker hủy: Hoàn 100% + voucher 15%</li>
                            <li>🏠 Khách không có mặt: Không hoàn tiền (xác minh)</li>
                            <li>🌧️ Lỗi hệ thống: Hoàn 100%</li>
                        </ul>
                        <p className="fw-semibold text-danger">Bạn có chắc chắn muốn hủy đơn này không?</p>
                        <div className="d-flex justify-content-end gap-2 mt-3">
                            <Button variant="secondary" onClick={closeCancelModal}>Đóng</Button>
                            <Button
                                variant="danger"
                                onClick={handleConfirmCancel}
                                disabled={isCancelling}
                            >
                                {isCancelling ? "Đang hủy..." : "Xác nhận hủy"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Container>
    );
}