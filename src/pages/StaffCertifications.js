import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001/api";

export default function StaffCertifications() {
  const [pendingCerts, setPendingCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch pending certifications for approval
    const token = localStorage.getItem('token');
    axios
      .get(`${API_BASE_URL}/taskers/certifications/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        setPendingCerts(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Lỗi khi tải danh sách chứng chỉ");
        setLoading(false);
      });
  }, []);

  const handleApprove = async (cert) => {
    try {
      const token = localStorage.getItem('token');
      // Parse variant_ids_json nếu có
      let variantIds = [];
      if (cert.variant_ids_json) {
        try {
          variantIds = JSON.parse(cert.variant_ids_json);
          if (!Array.isArray(variantIds)) variantIds = [];
        } catch {
          variantIds = [];
        }
      }
      await axios.post(
        `${API_BASE_URL}/taskers/certifications/approve`,
        {
          cert_ids: [cert.cert_public_id],
          variant_ids: variantIds,
          tasker_id: cert.tasker_id 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPendingCerts((prev) => prev.filter((c) => c.certification_id !== cert.certification_id));
    } catch (err) {
      alert("Lỗi khi duyệt chứng chỉ");
    }
  };

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>Duyệt chứng chỉ</h2>
      {pendingCerts.length === 0 ? (
        <p>Không có chứng chỉ nào đang chờ duyệt.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Tasker</th>
              <th>Tasker ID</th>
              <th>Chứng chỉ</th>
              <th>Ngày đăng ký</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {pendingCerts.map((cert) => (
              <tr key={cert.certification_id}>
                <td>{cert.tasker_name}</td>
                <td>{cert.tasker_id}</td>
                <td>{cert.certificate_name}</td>
                <td>{cert.registered_at}</td>
                <td>
                  <button className="btn btn-success" onClick={() => handleApprove(cert)}>
                    Duyệt
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
