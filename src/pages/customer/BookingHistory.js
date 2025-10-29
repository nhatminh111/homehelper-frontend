import React, { useEffect, useState } from "react";
import { Container, Table, Badge, Button, Spinner } from "react-bootstrap";
import { Calendar, MapPin, Clock, Info, MessageCircle } from "lucide-react";
import NegotiatePriceButton from "../../components/negotiation/NegotiatePriceButton";

export default function BookingHistory() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");

    const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3001";

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

    const handlePayment = (booking) => {
        alert(`💳 Thanh toán thành công cho booking #${booking.booking_id}`);
        const updated = bookings.map((b) =>
            b.booking_id === booking.booking_id
                ? { ...b, status: "Đã thanh toán" }
                : b
        );
        setBookings(updated);
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
                                        {b.expected_price
                                            ? Number(b.expected_price).toLocaleString("vi-VN") + " ₫"
                                            : "-"}
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
                                                        onClick={() => handlePayment(b)}
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
        </Container>
    );
}