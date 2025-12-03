import React, { useEffect, useState } from "react";
import { Table, Button, Spinner, Badge } from "react-bootstrap";
import api from "./../../services/api";
import { showToast } from "../../components/common/CustomToast";
import "../../components/common/CustomToast.css";

export default function AdminEvidenceReview() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchData = async () => {
    setLoading(true);

    try {
      const res = await api.get("/evidence/pending");
      if (res.data.success) {
        setList(res.data.data);
      }
    } catch (err) {
      showToast.error("Không thể tải danh sách báo cáo.");
      console.error("Fetch pending evidence:", err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="container mt-4" style={{ maxWidth: "900px" }}>
      <h2 className="fw-bold mb-1">📂 Báo cáo NO-SHOW đang chờ duyệt</h2>
      <p className="text-muted">
        Kiểm tra và xác nhận khách có thực sự không có mặt.
      </p>

      <div className="card shadow-sm p-4 rounded-4 mt-3">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
          </div>
        ) : list.length === 0 ? (
          <p className="text-muted text-center py-4">
            Không có báo cáo nào đang chờ duyệt.
          </p>
        ) : (
          <Table hover responsive className="align-middle">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Mã Booking</th>
                <th>Tasker</th>
                <th>Ngày gửi</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {list.map((item, idx) => (
                <tr key={item.id}>
                  <td>{idx + 1}</td>
                  <td className="fw-semibold">{item.booking_id}</td>
                  <td>{item.tasker_id}</td>
                  <td>{new Date(item.created_at).toLocaleString()}</td>
                  <td>
                    <Badge bg="warning" text="dark">
                      Chờ duyệt
                    </Badge>
                  </td>
                  <td>
                    <Button
                      variant="info"
                      size="sm"
                      onClick={() => setSelected(item)}
                    >
                      👁 Xem chi tiết
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {selected && (
        <EvidenceDetailModal
          review={selected}
          onClose={() => {
            setSelected(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

function EvidenceDetailModal({ review, onClose }) {
  const approve = async () => {
    try {
      const res = await api.post(`/evidence/${review.id}/approve`);
      if (res.data.success) {
        showToast.success("Duyệt NO-SHOW thành công!");
      } else {
        showToast.error(res.data.message || "Không thể duyệt báo cáo.");
      }
    } catch (e) {
      showToast.error("Lỗi khi duyệt báo cáo.");
    }
    onClose();
  };

  const reject = async () => {
    try {
      const res = await api.post(`/evidence/${review.id}/reject`);
      if (res.data.success) {
        showToast.warning("Đã từ chối báo cáo.");
      } else {
        showToast.error(res.data.message || "Không thể từ chối báo cáo.");
      }
    } catch (e) {
      showToast.error("Lỗi khi từ chối báo cáo.");
    }
    onClose();
  };

  return (
    <div
      className="modal fade show"
      style={{
        display: "block",
        backgroundColor: "rgba(0,0,0,0.45)",
      }}
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content rounded-4 shadow-lg">
          <div className="modal-header">
            <h5 className="modal-title">📝 Chi tiết báo cáo NO-SHOW</h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            <div className="mb-3">
              <p><b>Mã Booking:</b> {review.booking_id}</p>
              <p><b>Tasker:</b> {review.tasker_id}</p>
              <p>
                <b>Gửi lúc:</b>{" "}
                {new Date(review.created_at).toLocaleString()}
              </p>
            </div>

            <hr />

            <h5 className="fw-bold mb-3">📷 Ảnh bằng chứng</h5>

            <EvidenceImage label="Ảnh số nhà" src={review.house_number_img} />
            <EvidenceImage label="Cuộc gọi nhỡ" src={review.call_screenshot_img} />
            <EvidenceImage label="Ảnh GPS" src={review.gps_screenshot_img} />
            <EvidenceImage label="Ảnh mặt tiền" src={review.house_front_img} />

            {review.note && (
              <>
                <hr />
                <h5>🗒 Ghi chú thêm</h5>
                <div className="p-3 bg-light rounded-3">{review.note}</div>
              </>
            )}
          </div>

          <div className="modal-footer d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Đóng
            </Button>
            <Button variant="danger" onClick={reject}>
              ❌ Từ chối
            </Button>
            <Button variant="success" onClick={approve}>
              ✔ Xác nhận NO-SHOW
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EvidenceImage({ label, src }) {
  return (
    <div className="mb-4">
      <p className="fw-semibold">{label}</p>
      <img
        src={src}
        alt={label}
        className="rounded-3 border"
        style={{ width: "100%", maxHeight: "320px", objectFit: "cover" }}
      />
    </div>
  );
}
