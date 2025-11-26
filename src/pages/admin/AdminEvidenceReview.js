import React, { useEffect, useState } from "react";
import { Table, Button, Spinner } from "react-bootstrap";
import api from "./../../services/api";

export default function AdminEvidenceReview() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchData = async () => {
    setLoading(true);

    try {
      const res = await api.get("/admin/evidence/pending");
      if (res.data.success) {
        setList(res.data.data);
      }
    } catch (err) {
      console.error("Lỗi fetch pending evidence:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="container mt-4">
      <h2 className="fw-bold">📂 Báo cáo NO-SHOW đang chờ duyệt</h2>
      <p className="text-muted">Admin xem và xác nhận khách có thật sự vắng mặt.</p>

      {loading ? (
        <Spinner />
      ) : list.length === 0 ? (
        <p className="text-muted mt-3">Không có báo cáo nào.</p>
      ) : (
        <Table bordered hover className="mt-3">
          <thead>
            <tr>
              <th>#</th>
              <th>Mã Booking</th>
              <th>Tasker</th>
              <th>Ngày gửi</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {list.map((item, idx) => (
              <tr key={item.id}>
                <td>{idx + 1}</td>
                <td>{item.booking_id}</td>
                <td>{item.tasker_id}</td>
                <td>{new Date(item.created_at).toLocaleString()}</td>
                <td>
                  <Button variant="info" onClick={() => setSelected(item)}>
                    Xem chi tiết
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

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
    const res = await api.post(`/admin/evidence/${review.id}/approve`);
    alert(res.data.message);
    onClose();
  };

  const reject = async () => {
    const res = await api.post(`/admin/evidence/${review.id}/reject`);
    alert(res.data.message);
    onClose();
  };

  return (
    <div
      className="modal fade show"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">📝 Chi tiết báo cáo NO-SHOW</h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            <p><b>Mã Booking:</b> {review.booking_id}</p>
            <p><b>Tasker:</b> {review.tasker_id}</p>
            <p><b>Gửi lúc:</b> {new Date(review.created_at).toLocaleString()}</p>

            <hr />

            <h5>📷 Ảnh bằng chứng</h5>

            <EvidenceImage label="Ảnh số nhà" src={review.house_number_img} />
            <EvidenceImage label="Cuộc gọi nhỡ" src={review.call_screenshot_img} />
            <EvidenceImage label="Ảnh GPS" src={review.gps_screenshot_img} />
            <EvidenceImage label="Ảnh mặt tiền nhà" src={review.house_front_img} />

            {review.note && (
              <>
                <hr />
                <h5>🗒 Ghi chú</h5>
                <p>{review.note}</p>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Đóng
            </button>
            <button className="btn btn-danger" onClick={reject}>
              ❌ Từ chối
            </button>
            <button className="btn btn-success" onClick={approve}>
              ✔ Xác nhận NO-SHOW
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EvidenceImage({ label, src }) {
  return (
    <div className="mb-3">
      <p><b>{label}</b></p>
      <img
        src={src}
        alt={label}
        style={{ width: "100%", borderRadius: "8px", border: "1px solid #ccc" }}
      />
    </div>
  );
}
