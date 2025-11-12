
import React, { useEffect, useState } from "react";
import { useAuth } from '../contexts/AuthContext';
import axios from "axios";
import { showToast } from '../components/common/CustomToast';

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001/api";

export default function StaffCertifications() {
  const [pendingCerts, setPendingCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoomImgUrl, setZoomImgUrl] = useState(null);
  const [certUrls, setCertUrls] = useState({});
  const { token } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios
      .get(`${API_BASE_URL}/taskers/certifications/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        // Nếu API trả về { data: [...] }
        const certs = Array.isArray(res.data) ? res.data : (Array.isArray(res.data.data) ? res.data.data : []);
        setPendingCerts(certs);
        setLoading(false);
      })
      .catch((err) => {
        setError("Lỗi khi tải danh sách chứng chỉ");
        setPendingCerts([]); // Đảm bảo là mảng khi lỗi
        setLoading(false);
      });
  }, []);

  // Helper fetch with Authorization header
  const authFetch = async (url, token, options = {}) => {
    const headers = options.headers ? { ...options.headers } : {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!headers['Accept']) headers['Accept'] = 'application/json';
    return fetch(url, { ...options, headers });
  };

  // Fetch a short-lived signed URL by Cloudinary public_id
  const fetchSignedCertificateUrlByPublicId = async (public_id, token) => {
    if (!public_id) return null;
    try {
      const res = await authFetch(`${API_BASE_URL}/tasker/certifications/signed-url?public_id=${encodeURIComponent(public_id)}`, token);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to get signed URL');
      return json.data; // { url, expiresAt }
    } catch (e) {
      console.warn('[StaffApplications] signed-url by public_id failed', e.message);
      return null;
    }
  };

    useEffect(() => {
    const loadSignedUrls = async () => {
      const urls = {};
      for (const cert of pendingCerts) {
        if (cert.cert_public_id) {
          const signed = await fetchSignedCertificateUrlByPublicId(cert.cert_public_id, token);
          if (signed?.url) urls[cert.certification_id] = signed.url;
        }
      }
      setCertUrls(urls);
    };
    if (pendingCerts?.length) loadSignedUrls();
  }, [pendingCerts, token]);


  // showToast.confirm đã được cung cấp trung tâm trong CustomToast.js

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    
    const day = String(date.getDate()).padStart(2, '0');       // dd
    const month = String(date.getMonth() + 1).padStart(2, '0'); // mm (0-based)
    const year = date.getFullYear();                             // yyyy
    
    return `${day}/${month}/${year}`;
  };

  const handleApprove = async (cert) => {
    const confirmed = await showToast.confirm(`Bạn có chắc muốn DUYỆT chứng chỉ "${cert.certificate_name}" của Tasker ${cert.tasker_name}?`);
    if (!confirmed) return;
    try {
      const token = localStorage.getItem('token');
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
  showToast.success(`Đã duyệt chứng chỉ "${cert.certificate_name}" thành công!`);
    } catch (err) {
  showToast.error("Lỗi khi duyệt chứng chỉ");
    }
  };

  const handleReject = async (cert) => {
    const confirmed = await showToast.confirm(`Bạn có chắc muốn TỪ CHỐI chứng chỉ "${cert.certificate_name}" của Tasker ${cert.tasker_name}?`);
    if (!confirmed) return;
    try {
      const token = localStorage.getItem('token');
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
        `${API_BASE_URL}/taskers/certifications/reject`,
        {
          cert_ids: [cert.cert_public_id],
          variant_ids: variantIds,
          tasker_id: cert.tasker_id 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPendingCerts((prev) => prev.filter((c) => c.certification_id !== cert.certification_id));
  showToast.success(`Đã từ chối chứng chỉ "${cert.certificate_name}" thành công!`);
    } catch (err) {
  showToast.error("Lỗi khi từ chối chứng chỉ");
    }
  };

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2 className="mb-3">Duyệt chứng chỉ</h2>

      {pendingCerts.length === 0 ? (
        <p>Không có chứng chỉ nào đang chờ duyệt.</p>
      ) : (
        <div className="row g-3">
          {pendingCerts.map((cert) => {
            const fileUrl = certUrls[cert.certification_id];
            return (
              <div
                className="card shadow-sm border-0 flex-row position-relative"
                style={{ borderRadius: '12px', overflow: 'hidden' }}
              >
                {/* Ngày đăng ký góc phải */}
                <div className="position-absolute top-0 end-0 p-2 small text-muted">
                  {formatDate(cert.registered_at)}
                </div>

                {/* Ảnh chứng chỉ */}
                <div
                  className="d-flex align-items-center justify-content-center bg-light flex-shrink-0"
                  style={{ width: '150px', height: '100%', borderRight: '1px solid #eee' }}
                >
                  {fileUrl ? (
                    (/\.pdf(\?|$)/i).test(fileUrl) ? (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-outline-secondary"
                      >
                        Xem PDF
                      </a>
                    ) : (
                      <img
                        src={fileUrl}
                        alt="cert"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain',
                          display: 'block', // thêm để chắc chắn căn giữa
                        }}
                        onClick={() => setZoomImgUrl(fileUrl)}
                      />
                    )
                  ) : (
                    <div className="border rounded p-2 text-center small text-muted bg-white w-100 h-100">
                      <em>Đang tải...</em>
                    </div>
                  )}
                </div>

                {/* Nội dung */}
                <div className="card-body d-flex flex-column" style={{ flex: 1 }}>
                  <div>
                    <div className="fw-bold mb-1 text-truncate">{cert.certificate_name}</div>
                    <div className="small text-muted mb-1">
                      <strong>Tasker:</strong> {cert.tasker_name}
                    </div>
                    <div className="small text-muted mb-1">
                      <strong>tên trong chứng chỉ</strong> {cert.parsed_holder_name || '(Không có)'}
                    </div>
                    <div className="small text-muted mb-1">
                      <strong>Mã chứng chỉ:</strong> {cert.parsed_certificate_code || '(Không có)'}
                    </div>
                    <div className="small text-muted mb-1">
                      <strong>Ngày cấp:</strong> {formatDate(cert.issued_date)}
                    </div>
                    <div className="small text-muted mb-1">
                      <strong>Dịch vụ:</strong> {cert.service_name || cert.service_id}
                    </div>
                    {cert.variant_name && (
                      <div className="small text-muted mb-1">
                        <strong>Loại:</strong>{' '}
                        {cert.variant_name.split(';').map((v) => v.trim()).join(' • ')}
                      </div>
                    )}
                  </div>

                  {/* Nút Duyệt/Từ chối */}
                  <div className="mt-auto d-flex gap-2 justify-content-end">
                    <button className="btn btn-success" onClick={() => handleApprove(cert)}>
                      Duyệt
                    </button>
                    <button className="btn btn-danger" onClick={() => handleReject(cert)}>
                      Từ chối
                    </button>
                  </div>
                </div>
              </div>

            );
          })}
        </div>
      )}

      {/* Overlay zoom ảnh */}
      {zoomImgUrl && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-75"
          style={{ zIndex: 1050 }}
          onClick={() => setZoomImgUrl(null)}
        >
          <div
            className="position-relative p-2 bg-white rounded shadow"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '90%', maxHeight: '90%' }}
          >
            <button
              type="button"
              className="btn-close position-absolute end-0 top-0 m-2"
              onClick={() => setZoomImgUrl(null)}
            />
            <img
              src={zoomImgUrl}
              alt="zoom"
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

