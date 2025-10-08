import React, { useState, useEffect, useMemo } from 'react';
import serviceService from '../services/serviceService';
// Use same base URL strategy as api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Helper fetch with auth header
const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = options.headers ? { ...options.headers } : {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, { ...options, headers });
};

const BecomeTasker = () => {
  const [introduce, setIntroduce] = useState('');
  const [services, setServices] = useState([]); // full list with variants
  const [selectedServiceId, setSelectedServiceId] = useState('');
  // Removed serviceSearch per refinement
  const [selectedVariants, setSelectedVariants] = useState([]); // variant_id list
  // Certificates per service: { [service_id]: [{ cert_name, cert_file_url, issued_by, issued_date, service_id }] }
  const [serviceCerts, setServiceCerts] = useState({});
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitState, setSubmitState] = useState({ done: false, error: null });
  const [zoomImage, setZoomImage] = useState(null);
  const [extracting, setExtracting] = useState(null); // { service_id, idx }
  const [introVideo, setIntroVideo] = useState(null); // { video_url, public_id, title, description, uploading }
  const [videoUploading, setVideoUploading] = useState(false);
  // Current user/account name (for holder comparison)
  const [accountName, setAccountName] = useState('');

  useEffect(()=>{
    // Try to get user info from localStorage (assuming auth stores user object JSON under 'user')
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj && obj.name) setAccountName(obj.name);
      }
    } catch(e){ /* silent */ }
  }, []);

  // Fetch services + variants
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await serviceService.getAll();
        if (!cancelled) setServices(list);
      } catch (e) {
        console.error('Load services failed', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // NEW: Reset variants & certificates when switching the focused service in dropdown
  const handleChangeService = (newServiceId) => {
    setSelectedServiceId(newServiceId);
    if (!newServiceId) {
      // If cleared selection, also clear variants/certs entirely
      setSelectedVariants([]);
      setServiceCerts({});
      return;
    }
    // Keep certificates only for services that still have selected variants (none right now after reset)
    setSelectedVariants([]);
    setServiceCerts(prev => {
      // Optionally retain certs of other services already committed? Requirement says reset below -> clear all
      return {};
    });
  };

  const toggleVariant = (variantId) => {
    setSelectedVariants(prev => prev.includes(variantId)
      ? prev.filter(v => v !== variantId)
      : [...prev, variantId]);
  };

  const currentService = services.find(s => String(s.service_id) === String(selectedServiceId));
  const filteredServices = services; // no search filter now

  const groupedSelected = services
    .map(s => {
      const variants = (s.variants || []).filter(v => selectedVariants.includes(v.variant_id));
      if (!variants.length) return null;
      return { service: s, variants };
    })
    .filter(Boolean);

  // Services (ids) that are selected via variants and require certificate
  const requiredServiceIds = useMemo(() => {
    const ids = new Set();
    groupedSelected.forEach(group => {
      if (group.service.requires_certificate) ids.add(group.service.service_id);
    });
    return Array.from(ids);
  }, [groupedSelected]);

  const hasMissingRequired = requiredServiceIds.some(sid => !serviceCerts[sid] || serviceCerts[sid].length === 0);

  // Certificate manipulation
  const addBlankCert = (service_id) => {
    setServiceCerts(prev => ({
      ...prev,
      [service_id]: [...(prev[service_id] || []), { cert_name: '', cert_file_url: '', issued_by: '', issued_date: '', holder_name: '', holder_authorization_confirmed: false, service_id }]
    }));
  };

  const updateServiceCertField = (service_id, idx, field, value) => {
    setServiceCerts(prev => ({
      ...prev,
      [service_id]: (prev[service_id] || []).map((c, i) => i === idx ? { ...c, [field]: value } : c)
    }));
  };

  const removeServiceCert = (service_id, idx) => {
    setServiceCerts(prev => ({
      ...prev,
      [service_id]: (prev[service_id] || []).filter((_, i) => i !== idx)
    }));
  };

  const handleCertFileUpload = async (service_id, files) => {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      const form = new FormData();
      Array.from(files).forEach(f => form.append('cert_files', f));
  // Use absolute URL to avoid dev server (3000) relative proxy confusion
  const res = await authFetch(`${API_BASE_URL}/tasker/certifications/upload`, { method: 'POST', body: form });
      const text = await res.text();
      let json;
      try { json = JSON.parse(text); } catch (_) {
        // Likely received HTML (e.g. 404 page or proxy). Surface raw content.
        throw new Error(text.startsWith('<!DOCTYPE') ? 'Server trả về HTML (có thể sai URL hoặc 404). Kiểm tra endpoint /api/tasker/certifications/upload.' : text);
      }
      if (!res.ok || !json.success) throw new Error(json.message || 'Upload thất bại');
      const uploadedFiles = json.data?.files || [];
      // For each uploaded file create certification (auto AI extraction) sequentially to reduce load
      const createdCerts = [];
      for (const f of uploadedFiles) {
        try {
          const createRes = await authFetch(`${API_BASE_URL}/tasker/certifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              service_id,
              cert_name: f.original,
              cert_file_url: f.url,
              variant_ids: selectedVariants
            })
          });
          const createJson = await createRes.json();
          console.log('[AI][upload-create] response', createJson);
          // Immediate debug log summary
          if (createJson?.data) {
            const d = createJson.data;
            console.log('[AI][upload-summary]', {
              cert_file_url: d.cert_file_url,
              ai_status: d.ai_status,
              ai_confidence: d.ai_confidence,
              parsed_cert_name: d.parsed_cert_name,
              parsed_issued_by: d.parsed_issued_by,
              parsed_issued_date: d.parsed_issued_date,
              parsed_holder_name: d.parsed_holder_name,
              parsed_grade_or_level: d.parsed_grade_or_level,
              parsed_certificate_code: d.parsed_certificate_code,
              ai_detected_service: d.ai_detected_service,
              has_raw_ai: !!d.raw_ai
            });
          }
          // Fallback: if ai_status Extracted but parsed_* missing, try parse raw_ai JSON locally to enrich
          if (createJson?.data && createJson.data.ai_status === 'Extracted') {
            const d = createJson.data;
            const needsEnrich = !d.parsed_holder_name || !d.parsed_grade_or_level || !d.parsed_certificate_code;
            if (needsEnrich && d.raw_ai) {
              try {
                const raw = d.raw_ai;
                let jsonText = raw;
                const first = raw.indexOf('{');
                const last = raw.lastIndexOf('}');
                if (first !== -1 && last !== -1 && last > first) {
                  jsonText = raw.substring(first, last + 1);
                }
                const parsedObj = JSON.parse(jsonText);
                if (parsedObj) {
                  d.parsed_holder_name = d.parsed_holder_name || parsedObj.holder_name || null;
                  d.parsed_grade_or_level = d.parsed_grade_or_level || parsedObj.level_or_grade || null;
                  d.parsed_certificate_code = d.parsed_certificate_code || parsedObj.certificate_code || null;
                  console.log('[AI][upload-enrich-fallback] Applied parsed fields from raw_ai JSON');
                }
              } catch (e) {
                console.warn('[AI][upload-enrich-fallback] Failed to parse raw_ai JSON', e.message);
              }
            }
          }
          if (createRes.status === 409 && createJson.duplicate) {
            console.warn('Duplicate certificate skipped:', createJson.message);
            createdCerts.push({
              cert_name: f.original,
              cert_file_url: f.url,
              service_id,
              error_type: 'duplicate',
              error_message: createJson.message
            });
            continue;
          }
          if (createRes.status === 400 && (createJson.service_mismatch || createJson.holder_mismatch || createJson.service_content_mismatch || createJson.ai_service_mismatch)) {
            console.warn('Validation error certificate kept:', createJson.message);
            createdCerts.push({
              cert_name: f.original,
              cert_file_url: f.url,
              service_id,
              error_type: 'validation',
              error_message: createJson.message,
              service_content_mismatch: createJson.service_content_mismatch,
              service_mismatch: createJson.service_mismatch,
              ai_service_mismatch: createJson.ai_service_mismatch,
              holder_mismatch: createJson.holder_mismatch
            });
            continue;
          }
          if (createRes.ok && createJson.success) {
            const row = createJson.data;
            createdCerts.push({
              cert_id: row.cert_id,
              cert_name: row.parsed_cert_name || row.cert_name || f.original,
              cert_file_url: row.cert_file_url,
              issued_by: row.parsed_issued_by || row.issued_by || '',
              issued_date: row.parsed_issued_date || row.issued_date || '',
              holder_name: row.parsed_holder_name || row.parsed_holder_name || '',
              holder_authorization_confirmed: false,
              service_id,
              ai_confidence: row.ai_confidence,
              ai_status: row.ai_status,
              needs_review: row.needs_review,
              validation: row.validation || null,
              // Preserve parsed_* fields for upgrade
              parsed_cert_name: row.parsed_cert_name,
              parsed_issued_by: row.parsed_issued_by,
              parsed_issued_date: row.parsed_issued_date,
              parsed_holder_name: row.parsed_holder_name,
              parsed_grade_or_level: row.parsed_grade_or_level,
              parsed_certificate_code: row.parsed_certificate_code,
              extracted_payload: row.extracted_payload || row.raw_ai,
              ai_detected_service: row.validation?.ai_detected_service || row.ai_detected_service,
              ai_service_match: row.validation?.ai_service_match,
              ai_service_score: row.validation?.ai_service_score
            });
          } else {
            createdCerts.push({
              cert_name: f.original,
              cert_file_url: f.url,
              issued_by: '',
              issued_date: '',
              holder_name: '',
              holder_authorization_confirmed: false,
              service_id
            });
          }
        } catch (inner) {
          console.error('Create cert failed', inner);
          createdCerts.push({
            cert_name: f.original,
            cert_file_url: f.url,
            issued_by: '',
            issued_date: '',
            holder_name: '',
              holder_authorization_confirmed: false,
            service_id
          });
        }
      }
      setServiceCerts(prev => ({
        ...prev,
        [service_id]: [...(prev[service_id] || []), ...createdCerts]
      }));
    } catch (e) {
      alert(e.message);
    } finally {
      setUploading(false);
    }
  };

  const runAIExtraction = async (service_id, idx) => {
    try {
      setExtracting({ service_id, idx });
      const cert = (serviceCerts[service_id] || [])[idx];
      if (!cert || !cert.cert_file_url) {
        alert('Chứng chỉ chưa có URL file.');
        setExtracting(null);
        return;
      }
      if (!cert.cert_id) {
        const createRes = await authFetch(`${API_BASE_URL}/tasker/certifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id,
            cert_name: cert.cert_name || 'Chứng chỉ',
            cert_file_url: cert.cert_file_url,
            issued_by: cert.issued_by || '',
            issued_date: cert.issued_date || '',
            variant_ids: selectedVariants
          })
        });
        const createJson = await createRes.json();
        console.log('[AI][rerun-ephemeral] response', createJson); // debug
        if (createRes.status === 409 && createJson.duplicate) {
          alert('Chứng chỉ trùng đã tồn tại: ' + createJson.message);
          return;
        }
        if (createRes.status === 400 && (createJson.service_mismatch || createJson.service_content_mismatch || createJson.ai_service_mismatch)) {
          alert(createJson.message || 'Chứng chỉ không thuộc dịch vụ hoặc nội dung không phù hợp.');
          return;
        }
        if (!createRes.ok || !createJson.success) throw new Error(createJson.message || 'AI extract failed');
        const row = createJson.data;
        setServiceCerts(prev => ({
          ...prev,
          [service_id]: prev[service_id].map((c,i) => i===idx ? {
            ...c,
            cert_id: row.cert_id || c.cert_id,
            cert_name: row.parsed_cert_name || row.cert_name || c.cert_name,
            issued_by: row.parsed_issued_by || row.issued_by || c.issued_by,
            issued_date: row.parsed_issued_date || row.issued_date || c.issued_date,
            holder_name: row.parsed_holder_name || c.holder_name || '',
            ai_confidence: row.ai_confidence,
            ai_status: row.ai_status,
            needs_review: row.needs_review,
            validation: row.validation || c.validation,
            parsed_cert_name: row.parsed_cert_name,
            parsed_issued_by: row.parsed_issued_by,
            parsed_issued_date: row.parsed_issued_date,
            parsed_holder_name: row.parsed_holder_name,
            parsed_grade_or_level: row.parsed_grade_or_level,
            parsed_certificate_code: row.parsed_certificate_code,
            extracted_payload: row.extracted_payload || row.raw_ai,
            ai_detected_service: row.validation?.ai_detected_service || row.ai_detected_service,
            ai_service_match: row.validation?.ai_service_match,
            ai_service_score: row.validation?.ai_service_score
          } : c)
        }));
        return;
      }
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/tasker/certifications/${cert.cert_id}/extract-ai`, { method: 'POST', headers: { 'Authorization': token ? `Bearer ${token}` : '' } });
      const json = await res.json();
      console.log('[AI][rerun-persisted] response', json); // debug
      if (!res.ok || !json.success) throw new Error(json.message || 'AI extract failed');
      const updated = json.data;
      setServiceCerts(prev => ({
        ...prev,
        [service_id]: prev[service_id].map((c,i) => i===idx ? {
          ...c,
            cert_name: updated.parsed_cert_name || c.cert_name,
            issued_by: updated.parsed_issued_by || c.issued_by,
            issued_date: updated.parsed_issued_date || c.issued_date,
            holder_name: updated.parsed_holder_name || c.holder_name || '',
            ai_confidence: updated.ai_confidence,
            ai_status: updated.ai_status,
            needs_review: updated.needs_review,
            parsed_cert_name: updated.parsed_cert_name,
            parsed_issued_by: updated.parsed_issued_by,
            parsed_issued_date: updated.parsed_issued_date,
            parsed_holder_name: updated.parsed_holder_name,
            parsed_grade_or_level: updated.parsed_grade_or_level,
            parsed_certificate_code: updated.parsed_certificate_code,
            extracted_payload: updated.extracted_payload,
            ai_detected_service: updated.ai_detected_service,
            ai_service_match: updated.ai_service_match,
            ai_service_score: updated.ai_service_score
        } : c)
      }));
    } catch (e) {
      alert(e.message);
    }
    finally {
      setExtracting(null);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitState({ done: false, error: null });
    try {
      const certifications = Object.values(serviceCerts)
        .flat()
        .filter(c => c.cert_name && c.cert_file_url)
        .map(c => ({
          cert_id: c.cert_id,
          cert_name: c.cert_name,
          cert_file_url: c.cert_file_url,
          issued_by: c.issued_by,
          issued_date: c.issued_date,
          service_id: c.service_id,
          ai_confidence: c.ai_confidence,
          ai_status: c.ai_status,
          needs_review: c.needs_review,
          holder_name: c.holder_name || c.parsed_holder_name,
          parsed_cert_name: c.parsed_cert_name,
          parsed_issued_by: c.parsed_issued_by,
          parsed_issued_date: c.parsed_issued_date,
          parsed_holder_name: c.holder_name || c.parsed_holder_name,
          parsed_grade_or_level: c.parsed_grade_or_level,
          parsed_certificate_code: c.parsed_certificate_code,
          extracted_payload: c.extracted_payload,
          ai_detected_service: c.ai_detected_service,
          ai_service_match: c.ai_service_match,
          ai_service_score: c.ai_service_score,
          holder_mismatch: (()=>{
            const inferredHolder = (c.holder_name || c.parsed_holder_name || '').trim();
            const normalizedAccount = (accountName||'').trim().toLowerCase();
            if (!inferredHolder || !normalizedAccount) return false;
            return inferredHolder.toLowerCase() !== normalizedAccount;
          })(),
          holder_authorization_confirmed: !!c.holder_authorization_confirmed
        }));
      // Client side validation for required services
      if (requiredServiceIds.length && hasMissingRequired) {
        throw new Error('Vui lòng thêm ít nhất 1 chứng chỉ cho tất cả dịch vụ yêu cầu.');
      }
      // Confirmation if any holder mismatch
      const anyHolderMismatch = certifications.some(c => c.holder_mismatch);
      const unconfirmedMismatch = certifications.some(c => c.holder_mismatch && !c.holder_authorization_confirmed);
      if (unconfirmedMismatch) {
        throw new Error('Bạn phải xác nhận quyền sở hữu/ủy quyền cho các chứng chỉ có holder khác tên tài khoản.');
      }
      if (anyHolderMismatch) {
        const ok = window.confirm('Một hoặc nhiều chứng chỉ có tên holder khác tên tài khoản. Bạn vẫn muốn gửi?');
        if (!ok) { setLoading(false); return; }
      }
      const body = { introduce, variant_ids: selectedVariants, certifications };
      if (introVideo && introVideo.video_url) {
        body.introduction_video = {
          video_url: introVideo.video_url,
            public_id: introVideo.public_id,
            title: introVideo.title || 'Video giới thiệu',
            description: introVideo.description || ''
        };
      }
  const res = await authFetch(`${API_BASE_URL}/tasker/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Upgrade failed');
      setSubmitState({ done: true, error: null });
    } catch (err) {
      setSubmitState({ done: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="bg-white rounded shadow-sm p-4">
              <h3 className="mb-3">Đăng ký trở thành Tasker</h3>
              <p className="text-muted mb-4">Chọn dịch vụ bạn có thể cung cấp và thêm chứng chỉ (nếu có).</p>

              {submitState.done && <div className="alert alert-success">Gửi đơn thành công. Đơn của bạn sẽ được gửi cho Staff duyệt.</div>}
              {submitState.error && <div className="alert alert-danger">{submitState.error}</div>}

              <form onSubmit={submit}>
                <div className="form-group mb-3">
                  <label className="fw-semibold">Giới thiệu bản thân</label>
                  <textarea className="form-control" rows={3} value={introduce} onChange={(e) => setIntroduce(e.target.value)} required />
                </div>

                <div className="mb-4">
                  <h5 className="d-flex align-items-center gap-2">Dịch vụ & Variants</h5>
                  {services.length === 0 && <div className="text-muted small">Đang tải dịch vụ...</div>}
                  {services.length > 0 && (
                    <>
                      <div className="row g-2 mb-2">
                        <div className="col-md-12">
                          <select
                            className="form-select form-select-sm"
                            value={selectedServiceId}
                            onChange={e => handleChangeService(e.target.value)}
                          >
                            <option value="">-- Chọn dịch vụ --</option>
                            {filteredServices.map(s => (
                              <option key={s.service_id} value={s.service_id}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {currentService && (
                        <div className="border rounded p-2 mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <strong>{currentService.name}</strong>
                            <small className="text-muted">{(currentService.variants || []).length} lựa chọn</small>
                          </div>
                          <div className="row">
                            {(currentService.variants || []).map(v => {
                              const checked = selectedVariants.includes(v.variant_id);
                              return (
                                <div key={v.variant_id} className="col-md-4 col-sm-6 mb-2">
                                  <div className={`form-check small h-100 p-2 rounded border ${checked ? 'bg-light border-primary' : 'border-light'}`}> 
                                    <input type="checkbox" className="form-check-input" style={{ display: 'none' }} id={`variant-${v.variant_id}`} checked={checked} onChange={() => toggleVariant(v.variant_id)} />
                                    <label htmlFor={`variant-${v.variant_id}`} className="form-check-label">
                                      <span className="fw-semibold d-block">{v.variant_name}</span>
                                      {v.price_min && v.price_max && (
                                        <span className="text-muted">{v.price_min}-{v.price_max}/{v.unit}</span>
                                      )}
                                    </label>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {currentService.variants && currentService.variants.length === 0 && (
                            <div className="text-muted small">Dịch vụ này chưa có biến thể.</div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {groupedSelected.length > 0 && (
                    <div className="mt-3">
                      <h6 className="fw-semibold mb-2">Đã chọn:</h6>
                      {groupedSelected.map(group => (
                        <div key={group.service.service_id} className="mb-2">
                          <div className="small fw-semibold mb-1">{group.service.name}</div>
                          <div className="d-flex flex-wrap gap-2">
                            {group.variants.map(v => (
                              <span key={v.variant_id} className="badge text-bg-light border position-relative pe-4">
                                {v.variant_name}
                                <button
                                  type="button"
                                  className="btn-close btn-close-sm position-absolute top-50 translate-middle-y end-0 me-1"
                                  aria-label="Remove"
                                  onClick={() => setSelectedVariants(prev => prev.filter(id => id !== v.variant_id))}
                                  style={{ fontSize: '0.5rem' }}
                                />
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                      <div className="mt-2 d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => setSelectedVariants([])}
                        >Xóa tất cả</button>
                        {currentService && (currentService.variants || []).some(v => !selectedVariants.includes(v.variant_id)) && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => {
                              const currentIds = (currentService.variants || []).map(v => v.variant_id);
                              setSelectedVariants(prev => Array.from(new Set([...prev, ...currentIds])));
                            }}
                          >Chọn tất cả biến thể dịch vụ này</button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <h5>Chứng chỉ theo dịch vụ</h5>
                  {requiredServiceIds.length === 0 && (
                    <p className="text-muted small mb-2">Không có dịch vụ bắt buộc chứng chỉ trong các lựa chọn hiện tại. Bạn vẫn có thể thêm chứng chỉ tùy chọn bên dưới cho bất kỳ dịch vụ nào.</p>
                  )}
                  {groupedSelected.map(group => (
                    <div key={group.service.service_id} className="border rounded p-3 mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div>
                          <strong>{group.service.name}</strong>{' '}
                          {group.service.requires_certificate && <span className="badge bg-danger ms-1">Bắt buộc chứng chỉ</span>}
                        </div>
                        <div className="d-flex gap-2">
                          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => addBlankCert(group.service.service_id)}>+ Thêm thủ công</button>
                          <label className="btn btn-sm btn-outline-primary mb-0">
                            {uploading ? 'Đang tải...' : 'Upload file'}
                            <input type="file" multiple hidden onChange={(e) => { handleCertFileUpload(group.service.service_id, e.target.files); e.target.value=''; }} />
                          </label>
                        </div>
                      </div>
                      {(serviceCerts[group.service.service_id] || []).length === 0 && (
                        <div className="text-muted small mb-2">Chưa có chứng chỉ</div>
                      )}
                      {(serviceCerts[group.service.service_id] || []).map((c, idx) => {
                        const warnHolder = c.validation && c.validation.holder_name_match === false;
                        const aiDetected = c.ai_detected_service;
                        const aiServiceMismatch = c.ai_service_match === false || c.ai_service_mismatch;
                        const normalizedAccount = (accountName||'').trim().toLowerCase();
                        const inferredHolder = (c.holder_name || c.parsed_holder_name || '').trim();
                        const holderMismatch = inferredHolder && normalizedAccount && inferredHolder.toLowerCase() !== normalizedAccount;
                        return (
                        <div key={idx} className={`position-relative border rounded p-3 mb-3 bg-light-subtle ${warnHolder || holderMismatch ? 'border-warning' : ''} ${c.error_type ? 'border-danger' : ''} ${extracting && extracting.service_id === group.service.service_id && extracting.idx === idx ? 'opacity-50' : ''}`}>
                          {extracting && extracting.service_id === group.service.service_id && extracting.idx === idx && (
                            <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center" style={{backdropFilter:'blur(2px)', zIndex:20, background:'rgba(255,255,255,0.65)'}}>
                              <div className="spinner-border text-primary mb-2" role="status" style={{width:'2.5rem', height:'2.5rem'}}>
                                <span className="visually-hidden">Loading...</span>
                              </div>
                            </div>
                          )}
                          {c.error_type && (
                            <div className="alert alert-danger py-1 mb-2 small">
                              {c.error_message || 'Lỗi xác thực chứng chỉ'}
                            </div>
                          )}

                          <div className="mb-2">
                            <label className="form-label form-label-sm mb-1">Tên bằng cấp / chứng chỉ</label>
                            <textarea rows={3} className="form-control form-control-sm" style={{resize:'vertical'}} placeholder="VD: Chứng chỉ đào tạo – Chăm sóc người cao tuổi (Elderly Care)" value={c.cert_name} onChange={(e) => updateServiceCertField(group.service.service_id, idx, 'cert_name', e.target.value)} />
                          </div>
                          
                          {/* Combined row: Image | Issuer | Code | Date */}
                          <div className="row g-2 mb-2 align-items-start">
                            <div className="col-md-4">
                              <label className="form-label form-label-sm mb-1">Ảnh / File chứng chỉ</label>
                              {c.cert_file_url ? (
                                <div className="position-relative border rounded p-1 bg-white">
                                  {(/\.(pdf)(\?|$)/i).test(c.cert_file_url) ? (
                                    <div className="small text-muted text-center" style={{minHeight: '120px'}}>
                                      <a href={c.cert_file_url} target="_blank" rel="noreferrer">Xem file PDF</a>
                                    </div>
                                  ) : (
                                    <img
                                      src={c.cert_file_url}
                                      alt="cert"
                                      className="img-fluid d-block mx-auto hover-shadow"
                                      style={{maxHeight:'140px', objectFit:'contain', cursor:'zoom-in'}}
                                      onClick={() => setZoomImage(c.cert_file_url)}
                                    />
                                  )}
                                </div>
                              ) : (
                                <div className="border rounded p-2 text-center small bg-light">
                                  <em>Chưa có file</em>
                                </div>
                              )}
                            </div>
                            <div className="col-md-4">
                              <label className="form-label form-label-sm mb-1">Tên đơn vị cấp chứng chỉ</label>
                              <textarea rows={2} className="form-control form-control-sm" style={{resize:'vertical'}} placeholder="Trường / Tổ chức cấp" value={c.issued_by} onChange={(e) => updateServiceCertField(group.service.service_id, idx, 'issued_by', e.target.value)} />
                              <label className="form-label form-label-sm mb-1 mt-2">Tên trên chứng chỉ (Holder)</label>
                              <input type="text" className="form-control form-control-sm" placeholder="Tên người được cấp" value={c.holder_name || c.parsed_holder_name || ''} onChange={(e)=> updateServiceCertField(group.service.service_id, idx, 'holder_name', e.target.value)} />
                            </div>
                            <div className="col-md-2">
                              <label className="form-label form-label-sm mb-1">Mã chứng chỉ</label>
                              <input type="text" className="form-control form-control-sm" placeholder="Mã" value={c.parsed_certificate_code || ''} onChange={(e) => updateServiceCertField(group.service.service_id, idx, 'parsed_certificate_code', e.target.value)} />
                            </div>
                            <div className="col-md-2">
                              <label className="form-label form-label-sm mb-1">Ngày cấp</label>
                              <input type="date" className="form-control form-control-sm" value={c.issued_date} onChange={(e) => updateServiceCertField(group.service.service_id, idx, 'issued_date', e.target.value)} />
                            </div>
                          </div>
                          {/* Action buttons bottom-right */}
                          <div className="d-flex justify-content-end gap-2 mb-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary position-relative"
                              style={{minWidth:'42px'}}
                              title="Chạy lại AI"
                              disabled={extracting && extracting.service_id === group.service.service_id && extracting.idx === idx}
                              onClick={() => runAIExtraction(group.service.service_id, idx)}
                            >
                              <span
                                className="d-inline-block"
                                style={extracting && extracting.service_id === group.service.service_id && extracting.idx === idx ? {animation:'spin 1s linear infinite'} : {}}
                              >⟳</span>
                            </button>
                            <button type="button" className="btn btn-sm btn-outline-danger" title="Xóa chứng chỉ" onClick={() => removeServiceCert(group.service.service_id, idx)}>&times;</button>
                          </div>
                          {/* {c.ai_confidence !== undefined && (
                            <div className="small text-muted d-flex flex-wrap gap-3">
                              <span>Trạng thái: <strong>{c.ai_status || 'N/A'}</strong></span>
                              <span>Độ tin cậy: {c.ai_confidence ?? '—'} {c.needs_review ? <span className="text-warning">(cần xem lại)</span> : null}</span>
                            </div>
                          )} */}
                          {warnHolder && (
                            <div className="alert alert-warning mt-2 py-1 mb-0 small">
                              Tên trên chứng chỉ khác tên tài khoản. Vui lòng kiểm tra lại (User: {c.validation.holder_compare?.user_name} / Extract: {c.validation.holder_compare?.extracted_holder_name}).
                            </div>
                          )}
                          {!warnHolder && holderMismatch && (
                            <div className="alert alert-warning mt-2 py-1 mb-0 small">
                              Holder name khác tên tài khoản: <strong>{inferredHolder}</strong> ≠ <strong>{accountName}</strong>.
                            </div>
                          )}
                          {holderMismatch && (
                            <div className="form-check mt-2 small">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id={`auth-confirm-${group.service.service_id}-${idx}`}
                                checked={!!c.holder_authorization_confirmed}
                                onChange={(e)=> updateServiceCertField(group.service.service_id, idx, 'holder_authorization_confirmed', e.target.checked)}
                              />
                              <label className="form-check-label" htmlFor={`auth-confirm-${group.service.service_id}-${idx}`}>
                                Tôi xác nhận tôi là chủ sở hữu hoặc được ủy quyền sử dụng chứng chỉ này.
                              </label>
                            </div>
                          )}
                          {aiServiceMismatch && !c.error_type && (
                            <div className="alert alert-danger mt-2 py-1 mb-0 small">
                              AI phát hiện dịch vụ khác với lựa chọn hiện tại. Hãy kiểm tra lại chứng chỉ hoặc đổi dịch vụ tương ứng.
                            </div>
                          )}
                          {c.service_content_mismatch && (
                            <div className="alert alert-danger mt-2 py-1 mb-0 small">
                              Nội dung chứng chỉ không khớp dịch vụ đã chọn.
                            </div>
                          )}
                        </div>
                      )})}
                      {group.service.requires_certificate && (!serviceCerts[group.service.service_id] || serviceCerts[group.service.service_id].length === 0) && (
                        <div className="text-danger small">Cần ít nhất 1 chứng chỉ cho dịch vụ này.</div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mb-4">
                  <h5>Video giới thiệu (tuỳ chọn)</h5>
                  {!introVideo && (
                    <div className="border rounded p-3 text-center bg-light">
                      <p className="small text-muted mb-2">Tải lên 1 video giới thiệu kỹ năng làm việc của bạn.</p>
                      <label className="btn btn-sm btn-outline-primary mb-0">
                        {videoUploading ? 'Đang tải...' : 'Chọn video'}
                        <input type="file" hidden accept="video/*" onChange={async (e) => {
                          if (!e.target.files || !e.target.files[0]) return; 
                          const file = e.target.files[0];
                          setVideoUploading(true);
                          try {
                            const form = new FormData();
                            form.append('video', file);
                            const resp = await authFetch(`${API_BASE_URL}/tasker/application/video-upload`, { method: 'POST', body: form });
                            const data = await resp.json();
                            if (!resp.ok || !data.success) throw new Error(data.message || 'Upload video thất bại');
                            setIntroVideo({
                              video_url: data.data.video_url,
                              public_id: data.data.public_id,
                              title: '',
                              description: ''
                            });
                          } catch(err) {
                            alert(err.message);
                          } finally {
                            setVideoUploading(false);
                            e.target.value='';
                          }
                        }} />
                      </label>
                    </div>
                  )}
                  {introVideo && (
                    <div className="border rounded p-3 position-relative">
                      <button type="button" className="btn-close position-absolute end-0 top-0 m-2" onClick={() => setIntroVideo(null)} />
                      <div className="row g-3">
                        <div className="col-md-6">
                          <div className="ratio ratio-16x9 bg-dark rounded overflow-hidden">
                            <video controls style={{width:'100%', height:'100%', objectFit:'cover'}} src={introVideo.video_url} />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-2">
                            <label className="form-label form-label-sm mb-1">Tiêu đề video</label>
                            <input type="text" className="form-control form-control-sm" value={introVideo.title} onChange={(e)=> setIntroVideo(v => ({...v, title: e.target.value}))} />
                          </div>
                          <div className="mb-2">
                            <label className="form-label form-label-sm mb-1">Mô tả</label>
                            <textarea rows={3} className="form-control form-control-sm" placeholder="Mô tả ngắn về kinh nghiệm, phong cách làm việc..." value={introVideo.description} onChange={(e)=> setIntroVideo(v => ({...v, description: e.target.value}))} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {hasMissingRequired && (
                  <div className="alert alert-warning py-2">Còn thiếu chứng chỉ ở một số dịch vụ bắt buộc.</div>
                )}

                <button disabled={loading || uploading} type="submit" className="btn btn-primary">
                  {loading ? 'Đang gửi...' : uploading ? 'Đang upload...' : 'Gửi đăng ký'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      {zoomImage && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-75" style={{zIndex:1050}} onClick={() => setZoomImage(null)}>
          <div className="position-relative p-2 bg-white rounded shadow" onClick={e => e.stopPropagation()} style={{maxWidth:'90%', maxHeight:'90%'}}>
            <button type="button" className="btn-close position-absolute end-0 top-0 m-2" onClick={() => setZoomImage(null)} />
            <img src={zoomImage} alt="zoom" style={{maxWidth:'100%', maxHeight:'80vh', objectFit:'contain'}} />
          </div>
        </div>
      )}
      <style>{`@keyframes spin {from {transform: rotate(0deg);} to {transform: rotate(360deg);}}`}</style>
    </>
  );
};

export default BecomeTasker;



