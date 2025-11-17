import React, { useState, useEffect } from 'react';
import BadgeModal from './BadgeModal';
import { badgesAPI, adminTaskersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminTaskers() {
  const { token } = useAuth();
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [taskers, setTaskers] = useState([]);
  // Map of tasker_id -> Set(serviceKey) for opened collapsible tabs
  const [openTabs, setOpenTabs] = useState({});
  // Preview state for certificate zoom
  const [preview, setPreview] = useState(null); // { src, alt }
  // Badge modal state
  const [badgeModal, setBadgeModal] = useState({ open: false, tasker: null });

  useEffect(() => {
    const load = async () => {
      setLoadingList(true);
      try {
        const data = await adminTaskersAPI.summary(token);
        setTaskers(data.data || []);
      } catch (e) {
        setError(e.message || 'Không tải được danh sách tasker');
      } finally {
        setLoadingList(false);
      }
    };
    load();
  }, [token]);

  // Close preview with ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setPreview(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const triggerScan = async () => {
    setRunning(true);
    setError(null);
    try {
      const data = await badgesAPI.scan(token);
      setLastResult(data.result || null);
    } catch (e) {
      setError(e.message || 'Lỗi không xác định');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="container py-3">
      <h4 className="mb-3">Quản lý Tasker & Huy hiệu</h4>
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <h5 className="card-title">Quét huy hiệu thủ công</h5>
          <p className="text-muted mb-2">Chạy kiểm tra tất cả người dùng và cấp huy hiệu đạt điều kiện (thay vì đợi 02:00 sáng).</p>
          <button className="btn btn-primary" disabled={running} onClick={triggerScan}>
            {running ? 'Đang quét...' : 'Chạy quét ngay'}
          </button>
          {error && <div className="mt-3 alert alert-danger">{error}</div>}
          {lastResult && (
            <div className="mt-3">
              <div className="alert alert-success mb-2">
                ✅ Đã chạy xong. Cấp mới: <strong>{lastResult.granted}</strong> / kiểm tra: {lastResult.checked}. Thời gian: {lastResult.durationSeconds}s
              </div>
              <small className="text-muted">Bắt đầu: {new Date(lastResult.startedAt).toLocaleString('vi-VN')} | Kết thúc: {new Date(lastResult.finishedAt).toLocaleString('vi-VN')}</small>
            </div>
          )}
        </div>
      </div>
      {/* Danh sách Tasker dạng thẻ, hiển thị dịch vụ + gói (variants) và chứng chỉ gắn với dịch vụ */}
      <div className="mb-3">
        <h5 className="mb-3">Danh sách Tasker</h5>
        {loadingList && <div>Đang tải danh sách...</div>}
        {!loadingList && taskers.length === 0 && <div className="text-muted">Không có tasker nào.</div>}
        {!loadingList && taskers.length > 0 && (
          <div className="row g-3">
            {taskers.map((t, idx) => {
              // Build map: service_id -> { name, variants: [variant_name] }
              const serviceMap = new Map();
              (t.variants || []).forEach(v => {
                const sid = Number(v.service_id);
                if (!serviceMap.has(sid)) serviceMap.set(sid, { name: v.service_name, variants: [] });
                serviceMap.get(sid).variants.push(v.variant_name);
              });
              // Build quick lookup of service names from backend services + variants
              const svcNameById = new Map();
              (t.services || []).forEach(s => {
                const sid = Number(s.service_id);
                if (!Number.isNaN(sid)) svcNameById.set(sid, s.service_name);
              });
              serviceMap.forEach((val, sid) => {
                if (!svcNameById.has(sid)) svcNameById.set(sid, val.name);
              });
              // Group certifications by service_id (null/undefined => 'none')
              // Normalize key to string so lookups match tabServiceKeys (which are strings)
              const certsByService = new Map();
              (t.certifications || []).forEach(c => {
                const key = c.service_id == null ? 'none' : String(c.service_id);
                if (!certsByService.has(key)) certsByService.set(key, []);
                certsByService.get(key).push(c);
              });

              // Build list of service keys for tab buttons (include those with certs only even if not in serviceMap)
              const tabServiceKeys = new Set();
              serviceMap.forEach((_, sid) => tabServiceKeys.add(String(sid)));
              certsByService.forEach((_, key) => tabServiceKeys.add(String(key)));

              const toggleService = (taskerId, serviceKey) => {
                setOpenTabs(prev => {
                  const current = new Set(prev[taskerId] || []);
                  if (current.has(serviceKey)) {
                    current.delete(serviceKey);
                  } else {
                    current.add(serviceKey);
                  }
                  return { ...prev, [taskerId]: Array.from(current) };
                });
              };

              const isOpen = (taskerId, serviceKey) => {
                return (openTabs[taskerId] || []).includes(serviceKey);
              };

              return (
                <div className="col-12" key={t.tasker_id}>
                  <div className="card shadow-sm">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h6 className="mb-1">{idx + 1}. {t.name}</h6>
                          <div className="text-muted small">Rating: {t.rating ?? '-'} • Trạng thái: {t.status}</div>
                        </div>
                        {t.badges && t.badges.length > 0 && (
                          <div className="d-flex align-items-center gap-2 flex-wrap ms-2">
                            {t.badges.map(badge => (
                              <img
                                key={badge.badge_id}
                                src={badge.icon_url}
                                alt={badge.badge_name}
                                title={badge.badge_name}
                                style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: '50%', border: '2.5px solid #eee', background: '#fff', marginLeft: 2, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                                onClick={() => setBadgeModal({ open: true, tasker: t })}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mb-2 fw-semibold">Dịch vụ đăng kí</div>
                      {tabServiceKeys.size === 0 && (
                        <div className="text-muted">(Không có dịch vụ hoặc chứng chỉ)</div>
                      )}
                      {tabServiceKeys.size > 0 && (
                        <div className="mb-3 d-flex flex-wrap gap-2">
                          {Array.from(tabServiceKeys.values()).map(key => {
                            const numericKey = key !== 'none' ? Number(key) : null;
                            const svcName = key === 'none'
                              ? 'Khác/Không xác định'
                              : (svcNameById.get(numericKey) || serviceMap.get(numericKey)?.name || 'Dịch vụ');
                            const active = isOpen(t.tasker_id, key);
                            return (
                              <button
                                type="button"
                                key={key}
                                className={`btn btn-sm ${active ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => toggleService(t.tasker_id, key)}
                              >
                                {svcName}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {/* Collapsible sections */}
                      {Array.from(tabServiceKeys.values()).map(key => {
                        if (!isOpen(t.tasker_id, key)) return null;
                        const numericKey = key !== 'none' ? Number(key) : null;
                        const svcInfo = numericKey != null ? serviceMap.get(numericKey) : null;
                        const certs = certsByService.get(key) || [];
                        return (
                          <div key={`panel-${key}`} className="border rounded p-2 mb-2 bg-light">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <strong>
                                {key === 'none' ? 'Khác/Không xác định' : (svcInfo?.name || svcNameById.get(numericKey) || 'Dịch vụ')}
                              </strong>
                              <button
                                type="button"
                                className="btn btn-sm btn-link text-decoration-none"
                                onClick={() => toggleService(t.tasker_id, key)}
                              >
                                Đóng
                              </button>
                            </div>
                            {svcInfo?.variants && svcInfo.variants.length > 0 && (
                              <div className="mb-2">
                                {svcInfo.variants.map((vn, idx) => (
                                  <span key={idx} className="badge bg-secondary me-1 mb-1">{vn}</span>
                                ))}
                              </div>
                            )}
                            <div>
                              {certs.length === 0 ? (
                                <div className="text-muted small">(Chưa có chứng chỉ)</div>
                              ) : (
                                <ul className="mb-0 ps-3 small">
                                  {certs.map(c => {
                                    const issued = c.issued_date ? new Date(c.issued_date).toLocaleDateString('vi-VN') : null;
                                    const expiresLeftMs = c.cert_signed_expires_at ? c.cert_signed_expires_at - Date.now() : null;
                                    const minutesLeft = expiresLeftMs != null ? Math.floor(expiresLeftMs / 60000) : null;
                                    return (
                                      <div key={c.cert_id} className="mb-3">
                                        <div className="d-flex flex-column flex-sm-row align-items-start gap-3">
                                          <div>
                                            {c.cert_public_id && c.cert_signed_preview_url ? (
                                              <img
                                                src={c.cert_signed_preview_url}
                                                alt={c.cert_name}
                                                style={{ width: '160px', height: '120px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ddd', cursor: 'zoom-in' }}
                                                onClick={() => setPreview({ src: c.cert_signed_preview_url, alt: c.cert_name })}
                                              />
                                            ) : (
                                              <div className="d-flex align-items-center justify-content-center bg-light text-muted" style={{ width: '160px', height: '120px', borderRadius: '6px', border: '1px solid #ddd' }}>
                                                Không có ảnh
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex-grow-1">
                                            <div className="mb-1">
                                              <strong>{c.cert_name}</strong>{' '}
                                              <span className={c.status === 'Approved' ? 'text-success' : c.status === 'Rejected' ? 'text-danger' : 'text-warning'}>
                                                ({c.status})
                                              </span>
                                            </div>
                                            {c.service_name && (
                                              <div className="text-muted">Dịch vụ: {c.service_name}</div>
                                            )}
                                            {c.parsed_holder_name && (
                                              <div>Người sỡ hữu: <span className="text-muted">{c.parsed_holder_name}</span></div>
                                            )}
                                            {c.parsed_certificate_code && (
                                              <div>Mã chứng chỉ: <code>{c.parsed_certificate_code}</code></div>
                                            )}
                                            {issued && (
                                              <div>Ngày cấp: {issued}</div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </ul>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Badge modal popup */}
      {badgeModal.open && (
        <BadgeModal
          tasker={badgeModal.tasker}
          onClose={() => setBadgeModal({ open: false, tasker: null })}
        />
      )}
      {/* Image preview overlay */}
      {preview && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setPreview(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1050 }}
        >
          <button
            type="button"
            aria-label="Close"
            className="btn-close btn-close-white position-absolute top-0 end-0 m-3"
            onClick={(e) => { e.stopPropagation(); setPreview(null); }}
          />
          <div
            className="w-100 h-100 d-flex align-items-center justify-content-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={preview.src}
              alt={preview.alt || 'Preview'}
              style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '6px', boxShadow: '0 10px 30px rgba(0,0,0,.6)' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Inline preview overlay
// Render after component to avoid interfering with layout
// Note: kept simple, no external modal libs

