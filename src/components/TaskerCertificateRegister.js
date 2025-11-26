

import React, { useState, useEffect, useMemo } from "react";
import { showToast } from './common/CustomToast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const getAuthToken = () => {
  try {
    let t = localStorage.getItem('token')
      || localStorage.getItem('accessToken')
      || localStorage.getItem('authToken')
      || localStorage.getItem('jwt');
    if (!t) {
      const raw = localStorage.getItem('user');
      if (raw) {
        const u = JSON.parse(raw);
        t = u?.token || u?.accessToken || u?.authToken || null;
      }
    }
    return t;
  } catch { return null; }
};

const TaskerCertificateRegister = ({ onSubmit, excludeServiceIds = [], excludeVariantIds = [] }) => {
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedVariants, setSelectedVariants] = useState([]);
  const [serviceCerts, setServiceCerts] = useState({});
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(null);
  const [zoomImgUrl, setZoomImgUrl] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3001/api/services")
      .then((res) => res.json())
      .then((data) => {
        let all = Array.isArray(data.data) ? data.data : [];
        if (excludeServiceIds && excludeServiceIds.length > 0) {
          all = all.filter(s => !excludeServiceIds.includes(String(s.service_id)));
        }
        setServices(all);
      })
      .catch(() => setServices([]));
  }, [excludeServiceIds]);

  const handleChangeService = (newServiceId) => {
    setSelectedServiceId(newServiceId);
    setSelectedVariants([]);
    setServiceCerts((prev) => ({ ...prev, [newServiceId]: [] }));
  };

  const toggleVariant = (variantId) => {
    setSelectedVariants((prev) =>
      prev.includes(variantId)
        ? prev.filter((v) => v !== variantId)
        : [...prev, variantId]
    );
  };

  const runAIExtraction = async (service_id, idx) => {
    try {
      setExtracting({ service_id, idx });
      const cert = (serviceCerts[service_id] || [])[idx];
      if (!cert || !cert.cert_public_id) {
        showToast.error('Thiếu dữ liệu chứng chỉ hoặc public_id.');
        setExtracting(null);
        return;
      }
      const token = getAuthToken();
      const url = `${API_BASE_URL}/tasker/certifications/${cert.cert_public_id}/extract-ai`;
      const res = await fetch(url, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'AI extract failed');
      const updated = json.data || {};
      setServiceCerts(prev => ({
        ...prev,
        [service_id]: prev[service_id].map((c, i) => i === idx ? {
          ...c,
          cert_name: updated.parsed_cert_name || c.cert_name,
          issued_by: updated.parsed_issued_by || c.issued_by,
          issued_date: updated.parsed_issued_date || c.issued_date,
          holder_name: updated.parsed_holder_name || c.holder_name,
          parsed_certificate_code: updated.parsed_certificate_code || c.parsed_certificate_code,
        } : c)
      }));
    } catch (e) {
      showToast.error(e.message);
    } finally {
      setExtracting(null);
    }
  };

  const checkCertCodeExists = async (certCode) => {
    if (!certCode) return false;
    try {
      const token = getAuthToken();
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE_URL}/tasker/certifications/check-code?code=${encodeURIComponent(certCode)}`, { headers });
      const json = await res.json();
      return json.success && json.exists;
    } catch {
      return false;
    }
  };

  const handleCertFileUpload = async (service_id, files) => {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      const token = getAuthToken();
      let newCerts = [];
      for (let i = 0; i < files.length; i++) {
        const form = new FormData();
        form.append('cert_files', files[i]);
        const res = await fetch(`${API_BASE_URL}/tasker/certifications/upload`, {
          method: 'POST',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          body: form
        });
        const text = await res.text();
        let json;
        try { json = JSON.parse(text); } catch (_) {
          throw new Error(text.startsWith('<!DOCTYPE') ? 'Server trả về HTML (có thể sai URL hoặc 404). Kiểm tra endpoint /api/tasker/certifications/upload.' : text);
        }
        if (!res.ok || !json.success) throw new Error(json.message || 'Upload thất bại');
        const f = (json.data?.files || [])[0];
        if (!f || !f.public_id) continue;
        const certPayload = {
          service_id,
          cert_name: f.cert_name || f.file_name || '',
          cert_public_id: f.public_id,
          delivery_type: f.delivery_type,
          cert_file_url: f.url,
          issued_by: '',
          issued_date: '',
          holder_name: '',
          parsed_certificate_code: '',
          variant_ids: selectedVariants
        };
        let cert = { ...certPayload };
        try {
          const createRes = await fetch(`${API_BASE_URL}/tasker/certifications`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(certPayload)
          });
          const createJson = await createRes.json();
          if (createRes.ok && createJson.success && createJson.data) {
            const updated = createJson.data;
            cert = {
              ...cert,
              cert_name: updated.parsed_cert_name || updated.cert_name || cert.cert_name,
              issued_by: updated.parsed_issued_by || updated.issued_by || cert.issued_by,
              issued_date: updated.parsed_issued_date || updated.issued_date || cert.issued_date,
              holder_name: updated.parsed_holder_name || cert.holder_name,
              parsed_certificate_code: updated.parsed_certificate_code || cert.parsed_certificate_code,
            };
            const codeToCheck = cert.parsed_certificate_code || '';
            if (codeToCheck) {
              const exists = await checkCertCodeExists(codeToCheck);
              if (exists) {
                showToast.error(`Mã chứng chỉ ${codeToCheck} đã tồn tại trong hệ thống. Vui lòng kiểm tra lại hoặc sử dụng chứng chỉ khác.`);
                continue;
              }
            }
          } else if (!createRes.ok && createJson) {
            // Distinguish duplicate vs service mismatch vs other errors
            if (createRes.status === 409 && (createJson.duplicate || /t?n t?i|duplicate/i.test(createJson.message || ''))) {
              showToast.error(createJson.message || 'Chứng chỉ đã tồn tại trong hệ thống.');
              continue; // skip pushing this cert
            }
            if (createJson.ai_service_mismatch || createJson.service_mismatch) {
              cert = {
                ...cert,
                error_type: 'service_mismatch',
                error_message: createJson.message || 'Chứng chỉ không thuộc nhóm dịch vụ đã chọn',
                ai_service_mismatch: createJson.ai_service_mismatch,
                ai_detected_service: createJson.ai_detected_service,
              };
              showToast.warning(cert.error_message);
            } else {
              showToast.error(createJson.message || 'Tạo chứng chỉ thất bại');
              continue;
            }
          }
        } catch (e) {
          cert = {
            ...cert,
            error_type: 'service_mismatch',
            error_message: e.message || 'Chứng chỉ không thuộc nhóm dịch vụ đã chọn',
          };
        }
        newCerts.push(cert);
      }
      setServiceCerts(prev => ({
        ...prev,
        [service_id]: [...(prev[service_id] || []), ...newCerts]
      }));
    } catch (e) {
      showToast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const currentService = services.find(
    (s) => String(s.service_id) === String(selectedServiceId)
  );

  // Compute whether submit should be disabled due to any exceptions/errors
  const submitDisabled = useMemo(() => {
    // Determine certificate presence
    const hasCerts = !!(serviceCerts[selectedServiceId] && serviceCerts[selectedServiceId].length > 0);
    const requiresCert = !!currentService?.requires_certificate;
    // Base rules: only require certs if service itself demands them
    const base = uploading || !selectedServiceId || selectedVariants.length === 0 || (requiresCert && !hasCerts);
    if (base) return true;

    const certs = serviceCerts[selectedServiceId] || [];

    // Service mismatch exceptions flagged from backend
    const hasServiceMismatch = certs.some(c => c?.error_type === 'service_mismatch' || c?.ai_service_mismatch === true || c?.ai_service_match === false || c?.service_mismatch === true);

    // Holder mismatch requires explicit confirmation checkbox
    let accountName = '';
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const obj = JSON.parse(raw);
        accountName = obj?.name || '';
      }
    } catch {}
    const hasUnconfirmedHolderMismatch = certs.some(c => {
      const inferredHolder = (c?.holder_name || '').trim();
      if (!inferredHolder || !accountName) return false;
      const mismatch = inferredHolder.toLowerCase() !== accountName.toLowerCase();
      return mismatch && !c?.holder_authorization_confirmed;
    });

    // Local duplicate certificate codes
    const codes = certs.map(c => (c?.parsed_certificate_code || '').trim()).filter(Boolean);
    const unique = new Set(codes);
    const hasLocalDuplicates = unique.size !== codes.length;

    // Any extraction running
    const extractingNow = !!extracting;

    return hasServiceMismatch || hasUnconfirmedHolderMismatch || hasLocalDuplicates || extractingNow;
  }, [selectedServiceId, selectedVariants, serviceCerts, uploading, extracting, currentService?.requires_certificate]);

  return (
    <div className="p-3">
      <h5>Chọn dịch vụ</h5>
      <div className="mb-3">
        <select
          className="form-select"
          value={selectedServiceId}
          onChange={(e) => handleChangeService(e.target.value)}
        >
          <option value="">-- Chọn dịch vụ --</option>
          {services.map((s) => (
            <option key={s.service_id} value={s.service_id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      {currentService && (
        <div className="mb-3">
          <div className="fw-semibold mb-2">Biến thể dịch vụ</div>
          <div className="row g-2">
            {(currentService.variants || [])
              .filter(v => !excludeVariantIds.includes(String(v.variant_id)))
              .map((v) => {
                const checked = selectedVariants.includes(v.variant_id);
                return (
                  <div key={v.variant_id} className="col-md-4 col-sm-6">
                    <label className={`form-check-label w-100 h-100 p-2 rounded border ${checked ? 'bg-light border-primary' : 'border-light'}`} style={{display:'block', cursor:'pointer'}}>
                      <input
                        type="checkbox"
                        className="form-check-input me-1"
                        checked={checked}
                        onChange={() => toggleVariant(v.variant_id)}
                        style={{display:'none'}}
                      />
                      <span className="fw-semibold d-block">{v.variant_name}</span>
                      {v.price_min && v.price_max && (
                        <span className="text-muted">{v.price_min}-{v.price_max}/{v.unit}</span>
                      )}
                    </label>
                  </div>
                );
              })}
          </div>
        </div>
      )}
      {currentService && (
        <div className="mb-4">
          <h5>Chứng chỉ theo dịch vụ</h5>
          <div className="border rounded p-3 mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <span className="fw-semibold">{currentService.name}</span>
                {currentService.requires_certificate && <span className="badge bg-danger ms-2">Bắt buộc chứng chỉ</span>}
              </div>
              <div>
                <label className="btn btn-outline-primary mb-0">
                  {uploading ? "Đang tải..." : "UPLOAD FILE"}
                  <input
                    type="file"
                    multiple
                    hidden
                    onChange={(e) => {
                      handleCertFileUpload(selectedServiceId, e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
            {(serviceCerts[selectedServiceId] || []).length === 0 && (
              <>
                {currentService.requires_certificate && ( 
                  <div className="alert alert-danger py-1 mb-0 small">Cần ít nhất 1 chứng chỉ cho dịch vụ này.</div>
                )}
                {!currentService.requires_certificate && (
                  <div className="text-muted small mb-2">Dịch vụ này không bắt buộc chứng chỉ. Bạn vẫn có thể thêm chứng chỉ nếu muốn.</div>
                )}
              </>
            )}
            {(serviceCerts[selectedServiceId] || []).map((c, idx) => {
              const inferredHolder = (c.holder_name || '').trim();
              let accountName = '';
              try {
                const raw = localStorage.getItem('user');
                if (raw) {
                  const obj = JSON.parse(raw);
                  accountName = obj?.name || '';
                }
              } catch {}
              const holderMismatch = !!(inferredHolder && accountName && inferredHolder.toLowerCase() !== accountName.toLowerCase());
              const aiServiceMismatch = c.ai_service_match === false || c.ai_service_mismatch === true || c.ai_service_mismatch === 'true' || c.error_type === 'service_mismatch';
              return (
                <div key={idx} className="border border-warning rounded p-3 mb-3 position-relative" style={{background:'#fffbe6'}}>
                  <div className="mb-2">
                    <label className="form-label fw-semibold">Tên bằng cấp / chứng chỉ *</label>
                    <textarea rows={3} className="form-control" style={{resize:'vertical'}} value={c.cert_name} onChange={e => {
                      setServiceCerts(prev => ({
                        ...prev,
                        [selectedServiceId]: prev[selectedServiceId].map((cc, i) => i === idx ? { ...cc, cert_name: e.target.value } : cc)
                      }));
                    }} />
                  </div>
                  <div className="row g-2 mb-2 align-items-start">
                    <div className="col-md-3">
                      <label className="form-label">Ảnh chứng chỉ</label>
                      {c.cert_file_url ? (
                        (/\.pdf(\?|$)/i).test(c.cert_file_url) ? (
                          <div className="small text-muted text-center" style={{minHeight: '120px'}}>
                            <a href={c.cert_file_url} target="_blank" rel="noreferrer">Xem file PDF</a>
                          </div>
                        ) : (
                          <img
                            src={c.cert_file_url}
                            alt="cert"
                            className="img-fluid d-block mx-auto hover-shadow"
                            style={{maxHeight:'140px', objectFit:'contain', cursor:'zoom-in'}}
                            onClick={() => setZoomImgUrl(c.cert_file_url)}
                          />
                        )
                      ) : (
                        <div className="border rounded p-2 text-center small bg-light">
                          <em>Chưa có file</em>
                        </div>
                      )}
                    </div>
                    <div className="col-md-5">
                      <label className="form-label">Tên đơn vị cấp chứng chỉ *</label>
                      <input type="text" className="form-control mb-2" value={c.issued_by} onChange={e => {
                        setServiceCerts(prev => ({
                          ...prev,
                          [selectedServiceId]: prev[selectedServiceId].map((cc, i) => i === idx ? { ...cc, issued_by: e.target.value } : cc)
                        }));
                      }} />
                      <label className="form-label">Tên trên chứng chỉ (Holder) *</label>
                      <input type="text" className="form-control" value={c.holder_name} onChange={e => {
                        setServiceCerts(prev => ({
                          ...prev,
                          [selectedServiceId]: prev[selectedServiceId].map((cc, i) => i === idx ? { ...cc, holder_name: e.target.value } : cc)
                        }));
                      }} />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label">Mã chứng chỉ *</label>
                      <input type="text" className="form-control mb-2" value={c.parsed_certificate_code} onChange={e => {
                        setServiceCerts(prev => ({
                          ...prev,
                          [selectedServiceId]: prev[selectedServiceId].map((cc, i) => i === idx ? { ...cc, parsed_certificate_code: e.target.value } : cc)
                        }));
                      }} />
                      <label className="form-label">Ngày cấp *</label>
                      <input type="date" className="form-control" value={c.issued_date} onChange={e => {
                        setServiceCerts(prev => ({
                          ...prev,
                          [selectedServiceId]: prev[selectedServiceId].map((cc, i) => i === idx ? { ...cc, issued_date: e.target.value } : cc)
                        }));
                      }} />
                    </div>
                    <div className="col-md-2 d-flex flex-column align-items-end justify-content-between">
                      <button className="btn btn-sm btn-outline-secondary mb-2" title="Chạy lại AI" disabled={!!extracting && extracting.service_id === selectedServiceId && extracting.idx === idx} onClick={() => runAIExtraction(selectedServiceId, idx)}>
                        <span className="d-inline-block">⟳</span>
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => {
                        setServiceCerts(prev => ({
                          ...prev,
                          [selectedServiceId]: prev[selectedServiceId].filter((_, i) => i !== idx)
                        }));
                      }}>×</button>
                    </div>
                  </div>
                  {aiServiceMismatch && (
                    <div className="alert alert-danger mt-2 py-1 mb-0 small">
                      {c.error_message || c.message || 'AI phát hiện dịch vụ khác với lựa chọn hiện tại. Hãy kiểm tra lại chứng chỉ hoặc đổi dịch vụ tương ứng.'}
                    </div>
                  )}
                  {holderMismatch && (
                    <div className="alert alert-warning mt-2 py-1 mb-0 small">
                      Tên trên chứng chỉ khác tên tài khoản. Vui lòng kiểm tra lại .
                    </div>
                  )}
                  {holderMismatch && (
                    <div className="form-check mt-2 small">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id={`auth-confirm-${selectedServiceId}-${idx}`}
                        checked={!!c.holder_authorization_confirmed}
                        onChange={e => setServiceCerts(prev => ({
                          ...prev,
                          [selectedServiceId]: prev[selectedServiceId].map((cc, i) => i === idx ? { ...cc, holder_authorization_confirmed: e.target.checked } : cc)
                        }))}
                      />
                      <label className="form-check-label" htmlFor={`auth-confirm-${selectedServiceId}-${idx}`}>
                        Tôi xác nhận tôi là chủ sở hữu hoặc được ủy quyền sử dụng chứng chỉ này.
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {zoomImgUrl && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-75" style={{zIndex:1050}} onClick={() => setZoomImgUrl(null)}>
          <div className="position-relative p-2 bg-white rounded shadow" onClick={e => e.stopPropagation()} style={{maxWidth:'90%', maxHeight:'90%'}}>
            <button type="button" className="btn-close position-absolute end-0 top-0 m-2" onClick={() => setZoomImgUrl(null)} />
            <img src={zoomImgUrl} alt="zoom" style={{maxWidth:'100%', maxHeight:'80vh', objectFit:'contain'}} />
          </div>
        </div>
      )}
      <button
        className="btn btn-success"
        onClick={async () => {
          const certsRaw = serviceCerts[selectedServiceId];
          const certsFull = Array.isArray(certsRaw) ? certsRaw.map(c => ({
            cert_public_id: c.cert_public_id,
            cert_name: c.cert_name,
            delivery_type: c.delivery_type || null,
            service_id: selectedServiceId,
            issued_by: c.issued_by || null,
            issued_date: c.issued_date || null,
            holder_name: c.holder_name || null,
            parsed_certificate_code: c.parsed_certificate_code || null,
            extracted_payload: c.extracted_payload || null,
            ai_model: c.ai_model || null,
            ai_confidence: c.ai_confidence || null,
            ai_status: c.ai_status || null,
            needs_review: c.needs_review || 0,
            parsed_cert_name: c.parsed_cert_name || null,
            parsed_issued_by: c.parsed_issued_by || null,
            parsed_issued_date: c.parsed_issued_date || null,
            parsed_holder_name: c.holder_name || null,
            parsed_grade_or_level: c.parsed_grade_or_level || null,
            ai_detected_service: c.ai_detected_service || null,
            variant_ids: c.variant_ids || selectedVariants,
          })) : [];

          // Local duplicate check (same parsed_certificate_code within this submission set)
          const codes = certsFull.map(c => (c.parsed_certificate_code || '').trim()).filter(Boolean);
          const codeCounts = codes.reduce((acc, code) => { acc[code] = (acc[code] || 0) + 1; return acc; }, {});
          const localDuplicates = Object.entries(codeCounts).filter(([_, cnt]) => cnt > 1).map(([code]) => code);
          if (localDuplicates.length) {
            showToast.error(`Phát hiện mã chứng chỉ trùng lặp trong danh sách: ${localDuplicates.join(', ')}. Vui lòng chỉnh sửa trước khi submit.`);
            return;
          }

          // Remote existence check serially (avoid race causing partial submission)
          for (const c of certsFull) {
            const code = (c.parsed_certificate_code || '').trim();
            if (!code) continue; // skip empty code
            const exists = await checkCertCodeExists(code);
            if (exists) {
              showToast.error(`Mã chứng chỉ ${code} đã tồn tại trên hệ thống. Vui lòng thay đổi hoặc xoá chứng chỉ này.`);
              return;
            }
          }

          const requiresCert = !!currentService?.requires_certificate;
          const numericServiceId = selectedServiceId ? Number(selectedServiceId) : null;
          onSubmit && onSubmit({
            service_id: numericServiceId,
            variant_ids: selectedVariants.map(v => Number(v)),
            certs: certsFull,
            cert_ids: certsFull.map(c => c.cert_public_id),
            status: 'pending',
            no_cert_required: !requiresCert,
          });
        }}
        disabled={submitDisabled}
      >
        Xác nhận đăng ký
      </button>
    </div>
  );
};

export default TaskerCertificateRegister;

