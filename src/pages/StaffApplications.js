
import React, { useEffect, useState, useCallback, useRef } from 'react';
import '../css/StaffApplications.css';
import { useAuth } from '../contexts/AuthContext';
import { taskerApplicationsAPI, servicesAPI } from '../services/api';
import CustomToastContainer, { showToast } from '../components/common/CustomToast';
// Toast confirm using showToast.confirm (extend if not present)
if (!showToast.confirm) {
  showToast.confirm = (message) => {
    return new Promise((resolve) => {
      const id = showToast.info(
        <div>
          <div className="mb-2">{message}</div>
          <div className="d-flex gap-2 justify-content-end">
            <button
              className="btn btn-sm btn-success"
              onClick={() => {
                if (window.toast?.dismiss) window.toast.dismiss(id);
                resolve(true);
              }}
            >
              Đồng ý
            </button>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => {
                if (window.toast?.dismiss) window.toast.dismiss(id);
                resolve(false);
              }}
            >
              Huỷ
            </button>
          </div>
        </div>,
        {
          autoClose: false,
          closeOnClick: false,
          draggable: false,
          closeButton: false,
          className: 'toast-confirm',
          containerId: 'custom-toast',
        }
      );
      if (!window.toast) window.toast = require('react-toastify').toast;
    });
  };
}

// Toast prompt using showToast.prompt (extend if not present)
if (!showToast.prompt) {
  showToast.prompt = (message, defaultValue = '') => {
    return new Promise((resolve) => {
      let inputValue = defaultValue;
      const id = showToast.info(
        <div>
          <div className="mb-2">{message}</div>
          <input className="form-control mb-2" defaultValue={defaultValue} autoFocus onChange={e => { inputValue = e.target.value; }} />
          <div className="d-flex gap-2 justify-content-end">
            <button className="btn btn-sm btn-success" onClick={() => { if (window.toast?.dismiss) window.toast.dismiss(id); resolve(inputValue); }}>OK</button>
            <button className="btn btn-sm btn-secondary" onClick={() => { if (window.toast?.dismiss) window.toast.dismiss(id); resolve(null); }}>Huỷ</button>
          </div>
        </div>,
        {
          autoClose: false,
          closeOnClick: false,
          draggable: false,
          closeButton: false,
          className: 'toast-confirm',
          containerId: 'custom-toast',
        }
      );
      if (!window.toast) window.toast = require('react-toastify').toast;
    });
  };
}

// Use same base URL strategy as other pages
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

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

// Hàm giả lập lấy danh sách certificate_code đã duyệt
async function fetchApprovedCertificateCodes(token) {
  try {
    const res = await fetch(`${API_BASE_URL}/tasker/certifications/approved-codes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Failed to get approved codes');
  return json.codes || [];
  } catch (e) {
    console.warn('[StaffApplications] fetchApprovedCertificateCodes failed', e.message);
    return [];
  }
}

export default function StaffApplications() {
  const { token, isStaff, user } = useAuth();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('Pending');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [variantMap, setVariantMap] = useState({});
  const [zoomSrc, setZoomSrc] = useState(null);
  const [recheckLoading, setRecheckLoading] = useState(false);
  const [recheckData, setRecheckData] = useState(null); // shape: { overall, certifications, recheck_at }
  const [recheckError, setRecheckError] = useState(null);
  const [portraitMap, setPortraitMap] = useState({}); // {cert_url: true|false}
  const [previewMap, setPreviewMap] = useState({}); // {application_id: { url, expiresAt, key }}
  const [videoMeta, setVideoMeta] = useState(null); // {orientation, width, height}
  // Active certificate index for highlighting & sync with AI results
  const [activeCert, setActiveCert] = useState(null);
  const [approvedCodes, setApprovedCodes] = useState([]);
  const [pendingCodes, setPendingCodes] = useState([]);
  const aiRefs = useRef({});

  // Scroll AI block into view when active certificate changes
  useEffect(()=> {
    if (activeCert === null || !aiRefs.current) return;
    const node = aiRefs.current[activeCert];
    if (node && node.scrollIntoView) {
      node.scrollIntoView({behavior:'smooth', block:'nearest'});
    }
  }, [activeCert]);

  const runRecheck = async (appId) => {
    setRecheckLoading(true); setRecheckError(null); setRecheckData(null);
    try {
      const resp = await taskerApplicationsAPI.recheck(appId, token);
      // backend returns { success, data:{...} }
      const core = resp.data ? resp.data : resp; // ensure we always store the inner data object
      setRecheckData(core);
    } catch(e){ setRecheckError(e.message); }
    finally { setRecheckLoading(false); }
  };

  const fieldLabels = {
    cert_name: 'Tên chứng chỉ',
    issued_by: 'Đơn vị cấp',
    issued_date: 'Ngày cấp',
    holder_name: 'Tên người trên chứng chỉ',
    certificate_code: 'Mã chứng chỉ',
    grade_or_level: 'Xếp loại / Cấp độ'
  };

  // Preload services & variants mapping (one-time)
  useEffect(()=> {
    let mounted = true;
    (async () => {
      try {
        const svc = await servicesAPI.getAllServices(token);
        if (!mounted) return;
        const map = {};
        svc.forEach(s => {
          if (Array.isArray(s.variants)) {
            s.variants.forEach(v => { if (v.variant_id) map[v.variant_id] = { name: v.variant_name, service: s.name }; });
          }
        });
        setVariantMap(map);
      } catch(e){ console.warn('[StaffApplications] load services for variant names failed', e.message); }
    })();
    return ()=> { mounted = false; };
  }, [token]);

  const load = useCallback(async () => {
    if (!token) { console.warn('[StaffApplications] Missing auth token'); return; }
    setLoading(true); setError(null);
    try {
      const data = await taskerApplicationsAPI.list(status, token);
      let rows = data.data || data || [];
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        rows = rows.filter(r => (r.user_name||'').toLowerCase().includes(q) || (r.email||'').toLowerCase().includes(q));
      }
      setApps(rows);
      // Collect all certificate codes from all pending applications
      if (status === 'Pending') {
        const codes = [];
        rows.forEach(app => {
          (app.certifications||[]).forEach(cert => {
            const code = cert.certificate_code || cert.parsed_certificate_code;
            if (code) codes.push(code);
          });
        });
        setPendingCodes(codes);
      } else {
        setPendingCodes([]);
      }
      // Resolve one preview image per application if authenticated
      rows.forEach(async (a) => {
        const certs = Array.isArray(a.certifications) ? a.certifications : [];
        const candidate = certs.find(c => c.delivery_type === 'authenticated' && c.cert_public_id) ||
                          certs.find(c => c.cert_file_url);
        if (!candidate) return;
        // For authenticated certs, fetch signed URL by public_id
        if (candidate.delivery_type === 'authenticated' && candidate.cert_public_id) {
          const signed = await fetchSignedCertificateUrlByPublicId(candidate.cert_public_id, token);
          if (signed && signed.url) {
            setPreviewMap(prev => ({ ...prev, [a.application_id]: { url: signed.url, expiresAt: signed.expiresAt, key: candidate.cert_public_id } }));
          }
        } else if (candidate.cert_file_url) {
          setPreviewMap(prev => ({ ...prev, [a.application_id]: { url: candidate.cert_file_url, expiresAt: null, key: candidate.cert_file_url } }));
        }
      });
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  }, [token, status, search]);

  useEffect(()=>{ load(); }, [load]);

  const approve = async (id) => {
    const confirmed = await showToast.confirm('Duyệt đơn #' + id + '?');
    if (!confirmed) return;
    try {
      setActionLoading(id);
      await taskerApplicationsAPI.approve(id, token);
      await load();
      if (showDetail) {
        try {
          const data = await taskerApplicationsAPI.detail(id, token);
          setDetail(data.data || data);
        } catch (_) {}
      }
    } catch (e) {
      showToast.error('Approve lỗi: ' + e.message);
    } finally {
      setActionLoading(null);
    }
  };
  const reject = async (id) => {
    const note = await showToast.prompt('Lý do từ chối (tuỳ chọn):', '');
    if (note === null) return;
    try {
      setActionLoading(id);
      await taskerApplicationsAPI.reject(id, note, token);
      await load();
      if (showDetail) {
        setDetail(d => d ? { ...d, application: { ...d.application, status: 'Rejected', note } } : d );
      }
    } catch (e) {
      showToast.error('Reject lỗi: ' + e.message);
    } finally {
      setActionLoading(null);
    }
  };
  const openDetail = async (id) => {
    setShowDetail(true); setDetail(null); setDetailError(null); setDetailLoading(true);
    console.debug('[StaffApplications] openDetail start', id);
    try {
      const data = await taskerApplicationsAPI.detail(id, token);
      const core = data.data || data;
      // Enrich certifications with signed URLs where needed
      if (core && core.application && Array.isArray(core.application.certifications)) {
        const enriched = await Promise.all(core.application.certifications.map(async (c) => {
          if (c && c.delivery_type === 'authenticated' && c.cert_public_id) {
            const signed = await fetchSignedCertificateUrlByPublicId(c.cert_public_id, token);
            if (signed && signed.url) {
              return { ...c, _signed_url: signed.url, _signed_expiry: signed.expiresAt };
            }
          }
          return c;
        }));
        core.application.certifications = enriched;
      }
      setDetail(core);
      // Luôn lấy danh sách mã chứng chỉ đã duyệt khi mở chi tiết đơn
      if (core && core.application) {
        const codes = await fetchApprovedCertificateCodes(token);
        setApprovedCodes(codes);
      } else {
        setApprovedCodes([]);
      }
    } catch(e){
      console.warn('[StaffApplications] openDetail error', e);
      setDetailError(e.message);
    } finally { setDetailLoading(false); }
  };
  const closeDetail = () => { setShowDetail(false); setDetail(null); setDetailError(null); setDetailLoading(false); };

  return (
    <div className="staff-applications-container">
      <CustomToastContainer />
      <div className="staff-applications-header">
        <h2>Đơn đăng ký Tasker ({status})</h2>
        <div className="filters">
          <select value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
          <input placeholder="Tìm tên hoặc email" value={search} onChange={e=>setSearch(e.target.value)} />
          <button onClick={load} disabled={loading}>Làm mới</button>
        </div>
      </div>
  {loading && <div className="loading">Đang tải...</div>}
  {!loading && !token && <div className="error">Không tìm thấy token hoặc chưa đăng nhập Staff.</div>}
  {!loading && token && !isStaff() && <div className="error">Tài khoản hiện không có quyền Staff.</div>}
      {error && <div className="error">{error}</div>}
      {!loading && !apps.length && <div className="empty">Không có đơn</div>}
      {!!apps.length && (
        <div className="apps-grid horizontal-list">
          {apps.map(a => {
            const certs = Array.isArray(a.certifications) ? a.certifications : [];
            const preview = previewMap[a.application_id];
            const firstImg = preview
              ? { cert_file_url: preview.url, isSigned: true, key: preview.key }
              : certs.find(c => c.cert_file_url && /(jpg|jpeg|png|gif|webp)$/i.test(c.cert_file_url));
            const firstCert = certs[0];
            const firstCertName = firstCert ? (firstCert.cert_name || firstCert.parsed_cert_name || '') : '';
            // Services summary via variants (best-effort mapping)
            const variantNames = (a.variants||[]).map(v => {
              if (typeof v === 'object' && v !== null) {
                return v.variant_name || variantMap[v.variant_id]?.name || ('#'+(v.variant_id||'?'));
              }
              // if backend only returns id list
              return variantMap[v]?.name || ('#'+v);
            });
            // Derive distinct main services
            const serviceNames = Array.from(new Set((a.variants||[]).map(v => {
              if (typeof v === 'object' && v !== null) {
                return v.service_name || variantMap[v.variant_id]?.service;
              }
              return variantMap[v]?.service;
            }).filter(Boolean)));
            const maxChips = 4;
            const visibleChips = variantNames.slice(0, maxChips);
            const hiddenCount = variantNames.length - visibleChips.length;
            const statusCls = (a.status||'').toLowerCase();
            const initials = (a.user_name||'?').split(/\s+/).map(p=>p[0]).join('').slice(0,2).toUpperCase();
            return (
              <div key={a.application_id} className="app-card app-card-horizontal" onClick={()=>openDetail(a.application_id)} title={`Mở chi tiết đơn #${a.application_id}`}>
                <div className={`status-badge ${statusCls}`}>{a.status}</div>
                <div className="app-card-left" onClick={(e)=>{e.stopPropagation(); if(firstImg) setZoomSrc(firstImg.cert_file_url); else openDetail(a.application_id);}}>
                  <div className={`cert-preview-wrap horizontal ${firstImg && portraitMap[firstImg.cert_file_url] ? 'portrait' : 'landscape'}`}>
                    {firstImg && (
                      <img
                        src={firstImg.cert_file_url}
                        alt="cert"
                        className="cert-preview"
                        loading="lazy"
                        onLoad={(ev) => {
                          try {
                            const img = ev.target;
                            if (img.naturalHeight > img.naturalWidth) {
                              setPortraitMap(pm => ({ ...pm, [firstImg.cert_file_url]: true }));
                            } else {
                              setPortraitMap(pm => ({ ...pm, [firstImg.cert_file_url]: false }));
                            }
                          } catch (_) {}
                        }}
                        onError={async () => {
                          // Always try to refresh on error; avoid infinite loop by checking URL change
                          const p = previewMap[a.application_id];
                          try {
                            if (p && p.key) {
                              const signed = await fetchSignedCertificateUrlByPublicId(p.key, token);
                              if (signed && signed.url && signed.url !== p.url) {
                                setPreviewMap(prev => ({ ...prev, [a.application_id]: { url: signed.url, expiresAt: signed.expiresAt, key: p.key } }));
                              }
                            }
                          } catch (e) {
                            console.warn('[StaffApplications] refresh preview error', e && e.message);
                          }
                        }}
                      />
                    )}
                    {!firstImg && <div className="no-cert">Không có ảnh chứng chỉ</div>}
                    {certs.length>1 && <div className="cert-count-badge">{certs.length}</div>}
                    {firstCertName && <div className="cert-name-overlay" title={firstCertName}>{firstCertName}</div>}
                  </div>
                </div>
                <div className="app-card-right">
                  <div className="app-card-header">
                    <div className="app-avatar">{initials}</div>
                    <div className="app-main">
                      <h3 className="app-user">{a.user_name}</h3>
                      <p className="app-email" title={a.email}>{a.email}</p>
                    </div>
                  </div>
                  <p className="app-intro top-intro">{a.introduce || '(Không có giới thiệu)'}</p>
                  <div className="app-main-services">
                    {serviceNames.length ? serviceNames.map((s,i)=>(<span key={i} className="service-chip main" title={s}>{s}</span>)) : <span className="service-chip" style={{opacity:.6}}>Không có dịch vụ</span>}
                  </div>
                  <div className="app-services variant-row">
                    {visibleChips.map((n,i)=>(<span key={i} className="service-chip" title={n}>{n}</span>))}
                    {hiddenCount>0 && <span className="service-chip more" title={`${hiddenCount} biến thể khác`}>+{hiddenCount}</span>}
                    {!variantNames.length && <span className="service-chip" style={{opacity:.6}}>Không có biến thể</span>}
                  </div>
                  <div className="app-card-footer with-meta">
                    {/* <div className="footer-left">
                      <span className="badge-inline">{new Date(a.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    </div> */}
                    <div className="footer-meta-block">
                      <div className="app-meta meta-bottom">
                        <span>{a.introduction_video ? '🎬 Video' : 'No video'}</span>
                        <span>{certs.length} chứng chỉ</span>
                        <span>{a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}</span>
                      </div>
                    </div>
                  </div>
                  {a.status === 'Pending' && (
                    <div className="app-actions" onClick={e=>e.stopPropagation()}>
                      <button className="approve" disabled={!!actionLoading} onClick={()=>approve(a.application_id)}>{actionLoading===a.application_id?'…':'Duyệt'}</button>
                      <button className="reject" disabled={!!actionLoading} onClick={()=>reject(a.application_id)}>{actionLoading===a.application_id?'…':'Từ chối'}</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      { showDetail && (
        <div className="sa-modal-overlay" onClick={closeDetail}>
          <div className="sa-modal" onClick={e=>e.stopPropagation()}>
            {detailLoading && <div>Đang tải chi tiết...</div>}
            {!detailLoading && detailError && (
              <div className="detail-wrap">
                <div className="sa-modal-header">
                  <h3>Lỗi tải chi tiết</h3>
                  <button onClick={closeDetail}>×</button>
                </div>
                <p className="error">{detailError}</p>
                <button onClick={()=>openDetail(detail?.application?.application_id || (detail && detail.application_id) || 'UNKNOWN')}>Thử lại</button>
              </div>
            )}
            {!detailLoading && !detailError && detail && (
              <div className="detail-wrap">
                <div className="sa-modal-header">
                  <h3>Đơn #{detail.application.application_id} - {detail.application.status}</h3>
                  <button onClick={closeDetail}>×</button>
                </div>
                <section>
                  <h4>Người dùng</h4>
                  <p><strong>Tên:</strong> {detail.user?.name}</p>
                  <p><strong>Email:</strong> {detail.user?.email}</p>
                  <p><strong>Phone:</strong> {detail.user?.phone}</p>
                  {detail.address && <p><strong>Địa chỉ:</strong> {detail.address.address}</p>}
                </section>
                <section>
                  <h4>Giới thiệu</h4>
                  <p className="pre-wrap">{detail.application.introduce || '(Không có)'}</p>
                </section>
                <section>
                  <h4>Dịch vụ đăng kí</h4>
                  {(!detail.application.services_summary || !detail.application.services_summary.length) && <em>Không có</em>}
                  {!!detail.application.services_summary?.length && (
                    <ul className="service-summary-list">
                      {detail.application.services_summary.map(s => (
                        <li key={s.service_id}>
                          <strong>{s.service_name}</strong>
                          <div className="variant-chips sub">
                            {s.variants.map(v => (
                              <span key={v.variant_id} className="variant-chip" title={v.variant_name}>{v.variant_name}</span>
                            ))}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
                <section>
                  <h4>Chứng chỉ ({detail.application.certifications?.length||0})</h4>
                  {(!detail.application.certifications || !detail.application.certifications.length) && <em>Không có</em>}
                  <div className="cert-flex-wrap" style={{display:'flex', alignItems:'flex-start', gap:16}}>
                    <div className="cert-left-col" style={{flex: '1 1 55%', minWidth:0}}>
                      <ul className="cert-list">
                        {detail.application.certifications?.map((c,i)=>{
                          const resolvedUrl = (c.delivery_type === 'authenticated' && c._signed_url) ? c._signed_url : c.cert_file_url;
                          const isImage = (c.delivery_type === 'authenticated' && !!resolvedUrl) || (resolvedUrl && /(\.jpg|\.jpeg|\.png|\.gif|\.webp)$/i.test(resolvedUrl));
                          const certCode = String(c.certificate_code || c.parsed_certificate_code || '').trim();

                          // Check duplicate in approved codes and in other pending applications (excluding itself)
                          let isDuplicate = false;
                          if (certCode) {
                            if (approvedCodes.map(String).includes(certCode)) {
                              isDuplicate = true;
                            } else if (
                              detail && detail.application && detail.application.status === 'Pending' &&
                              pendingCodes.filter(code => String(code) === certCode).length > 1
                            ) {
                              isDuplicate = true;
                            }
                          }
                          return (
                            <li key={i} className={activeCert===i? 'active-cert' : ''} onMouseEnter={()=>setActiveCert(i)} onFocus={()=>setActiveCert(i)} onClick={()=>setActiveCert(i)}>
                              <div className="cert-row no-ai-inline" style={{cursor:'pointer'}}>
                                <div className="cert-left">
                                  <div className="cert-head">
                                    <strong><span className="ci-chip">#{i+1}</span> {c.cert_name || c.parsed_cert_name || 'Chứng chỉ #' + (i+1)}</strong>
                                    {(c.holder_mismatch || (c.validation && c.validation.holder_name_match === false)) && (
                                      <span className="badge-inline" style={{marginLeft:8, background:'#ffecb3', color:'#b26a00', padding:'2px 6px', borderRadius:4, fontSize:11}}>
                                        Holder khác tên account
                                      </span>
                                    )}
                                    {isDuplicate && (
                                      <span className="badge-inline" style={{marginLeft:8, background:'#ffcdd2', color:'#b71c1c', padding:'2px 6px', borderRadius:4, fontSize:11}}>
                                        ⚠️ Chứng chỉ này đã tồn tại
                                      </span>
                                    )}
                                  </div>
                                  {isImage && (
                                    <div className="cert-thumb-wrap" onClick={()=> setZoomSrc(resolvedUrl)}>
                                      <img
                                        loading="lazy"
                                        src={resolvedUrl}
                                        alt={c.cert_name || 'certificate'}
                                        className="cert-thumb"
                                        onError={async ()=>{
                                          if (c.delivery_type === 'authenticated' && c.cert_public_id) {
                                            const signed = await fetchSignedCertificateUrlByPublicId(c.cert_public_id, token);
                                            if (signed && signed.url) {
                                              // Update detail state with refreshed URL
                                              setDetail(d => {
                                                if (!d) return d;
                                                const clone = { ...d, application: { ...d.application } };
                                                clone.application.certifications = [...(clone.application.certifications||[])];
                                                clone.application.certifications[i] = { ...clone.application.certifications[i], _signed_url: signed.url, _signed_expiry: signed.expiresAt };
                                                return clone;
                                              });
                                            }
                                          }
                                        }}
                                      />
                                    </div>
                                  )}
                                  {!isImage && resolvedUrl && <a href={resolvedUrl} target="_blank" rel="noreferrer">Mở file</a>}
                                  {c.parsed_certificate_code && <div className="cert-meta"><span>Mã:</span> {c.parsed_certificate_code}</div>}
                                  {c.issued_by && <div className="cert-meta"><span>Đơn vị cấp:</span> {c.issued_by}</div>}
                                  {c.issued_date && <div className="cert-meta"><span>Ngày cấp:</span> {c.issued_date}</div>}
                                  {(c.holder_mismatch || (c.validation && c.validation.holder_name_match === false)) && (
                                    <div className="cert-meta" style={{color:'#b26a00'}}>
                                      <span>Holder:</span> {(c.holder_name || c.parsed_holder_name || 'N/A')} 
                                    </div>
                                  )}
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                      {detail.application.certifications?.length > 0 && (
                        <div
                          style={{
                            marginTop: 12,
                            display: 'flex',
                            gap: 8,
                            alignItems: 'center',
                            flexWrap: 'wrap'
                          }}
                        >
                          <button
                            disabled={recheckLoading}
                            onClick={() => runRecheck(detail.application.application_id)}
                            style={{
                              backgroundColor: recheckLoading ? '#d1d5db' : '#2563eb', // xám khi loading, xanh khi sẵn sàng
                              color: '#fff',
                              border: 'none',
                              padding: '8px 16px',
                              borderRadius: 8,
                              fontSize: 15,
                              fontWeight: 500,
                              cursor: recheckLoading ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s ease',
                              boxShadow: recheckLoading ? 'none' : '0 2px 6px rgba(37,99,235,0.3)',
                              opacity: recheckLoading ? 0.7 : 1
                            }}
                            onMouseEnter={(e) => {
                              if (!recheckLoading) e.target.style.backgroundColor = '#1d4ed8';
                            }}
                            onMouseLeave={(e) => {
                              if (!recheckLoading) e.target.style.backgroundColor = '#2563eb';
                            }}
                          >
                            {recheckLoading ? 'Đang kiểm tra ...' : 'AI Check'}
                          </button>
                        </div>
                      )}
                      {recheckData && (
                        <div className="recheck-summary-inline">
                          Chính xác: {recheckData.overall?.accuracy !== null && recheckData.overall?.accuracy !== undefined 
                            ? (recheckData.overall.accuracy * 100).toFixed(1) + '%' 
                            : 'N/A'}
                        </div>                      
                      )}
                    </div>
                    {recheckData && !!recheckData.certifications?.length && (
                      <div className="cert-right-col" style={{flex:'1 1 45%', minWidth:0}}>
                        <div className="cert-ai-panel-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                          <h5 style={{margin:'0 0 8px'}}>Kết quả AI</h5>
                        </div>
                        <div className="cert-ai-result-list" style={{display:'flex', flexDirection:'column', gap:12, maxHeight:400, overflow:'auto', paddingRight:4}}>
                          {recheckData.certifications.map((rc,i)=>{
                            const cert = detail.application.certifications?.[rc.index];
                            return (
                              <div ref={el => { aiRefs.current[rc.index]=el; }} data-cert-index={rc.index} key={i} className={`cert-diff-block side ${rc.error ? 'has-error':''} ${activeCert===rc.index? 'active-ai':''}`} style={{border:'1px solid #eee', borderRadius:6, padding:8, position:'relative'}} onMouseEnter={()=>setActiveCert(rc.index)}>
                                <div className="cert-diff-header" style={{display:'flex', alignItems:'center', gap:8, marginBottom:4}}>
                                  <strong style={{flex:1}}><span className="ci-chip">#{(rc.index||0)+1}</span> {cert?.cert_name || cert?.parsed_cert_name || 'Chứng chỉ #' + (rc.index+1)}</strong>
                                  {rc.accuracy !== null && rc.accuracy !== undefined && <span className="acc-chip" style={{fontSize:11}}>{(rc.accuracy*100).toFixed(1)}%</span>}
                                  {rc.error && <span className="error" style={{fontSize:11}}>{rc.error}</span>}
                                </div>
                                <div className="cert-diff-table-wrapper">
                                  <table className="cert-diff-table" style={{width:'100%', borderCollapse:'collapse'}}>
                                    <thead>
                                      <tr>
                                        <th style={{textAlign:'left'}}>Trường</th>
                                        <th style={{textAlign:'left'}}>Gốc</th>
                                        <th style={{textAlign:'left'}}>AI</th>
                                        <th style={{width:16}}></th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {['cert_name','issued_by','issued_date','holder_name','certificate_code','grade_or_level'].map(f => {
                                        const d = rc.field_diff?.[f];
                                        if (!d) return null;
                                        return (
                                          <tr key={f} className={d.match ? 'match' : 'mismatch'}>
                                            <td>{fieldLabels[f] || f}</td>
                                            <td>{d.original || '-'}</td>
                                            <td>{d.rechecked || '-'}</td>
                                            <td></td>
                                          </tr>
                                        );
                                      })}
                                      {rc.holder_user && (
                                        <tr className={rc.holder_user.match ? 'match':'mismatch'}>
                                          <td>holder vs user</td>
                                          <td colSpan={2}>{rc.holder_user.snapshot_holder || rc.holder_user.rechecked_holder || '-'} ⇔ {rc.holder_user.user_name}</td>
                                          <td></td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
                <section>
                  <h4>Video giới thiệu</h4>
                  {detail.application.introduction_video ? (
                    <div className={`intro-video-wrapper ${videoMeta?.orientation || ''}`}>
                      <div className="intro-video-aspect">
                        <video
                          controls
                          src={detail.application.introduction_video.video_url}
                          onLoadedMetadata={(e)=> {
                            try {
                              const v = e.target;
                              const w = v.videoWidth; const h = v.videoHeight;
                              let orientation = 'landscape';
                              if (h > w) orientation = 'portrait'; else if (Math.abs(w-h) < 40) orientation = 'square';
                              setVideoMeta({ orientation, width:w, height:h });
                            } catch(_){}
                          }}
                        />
                      </div>
                      <div className="intro-video-meta">
                        <div className="intro-video-title">{detail.application.introduction_video.title || 'Video giới thiệu'}</div>
                        {(detail.application.introduction_video.description || '').trim() ? (
                          <div className="intro-video-desc">{detail.application.introduction_video.description}</div>
                        ) : (
                          <div className="intro-video-desc empty">(Không có mô tả)</div>
                        )}
                      </div>
                    </div>
                  ) : <em>Không có</em> }
                </section>
                {detail.application.status === 'Pending' && (
                  <div className="sa-modal-actions">
                    <button disabled={!!actionLoading} onClick={()=>approve(detail.application.application_id)}>Duyệt</button>
                    <button disabled={!!actionLoading} className="danger" onClick={()=>reject(detail.application.application_id)}>Từ chối</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {zoomSrc && (
        <div className="sa-zoom-overlay" onClick={()=>setZoomSrc(null)}>
          <img src={zoomSrc} alt="zoom" className="sa-zoom-img" />
          <button className="sa-zoom-close" onClick={()=>setZoomSrc(null)}>×</button>
        </div>
      )}
    </div>
  );
}
