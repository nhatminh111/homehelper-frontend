import React, { useEffect, useState, useCallback } from 'react';
import './StaffApplications.css';
import { useAuth } from '../contexts/AuthContext';
import { taskerApplicationsAPI, servicesAPI } from '../services/api';

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
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  }, [token, status, search]);

  useEffect(()=>{ load(); }, [load]);

  const approve = async (id) => {
    if (!window.confirm('Duyệt đơn #' + id + '?')) return;
    try { setActionLoading(id); await taskerApplicationsAPI.approve(id, token); await load(); if (showDetail) { // refresh detail
        try { const data = await taskerApplicationsAPI.detail(id, token); setDetail(data.data || data); } catch(_){}
      } }
    catch(e){ alert('Approve lỗi: '+ e.message); }
    finally { setActionLoading(null); }
  };
  const reject = async (id) => {
    const note = window.prompt('Lý do từ chối (tuỳ chọn):','');
    if (note === null) return;
    try { setActionLoading(id); await taskerApplicationsAPI.reject(id, note, token); await load(); if (showDetail) { setDetail(d => d ? { ...d, application: { ...d.application, status: 'Rejected', note } } : d ); } }
    catch(e){ alert('Reject lỗi: '+ e.message); }
    finally { setActionLoading(null); }
  };
  const openDetail = async (id) => {
    setShowDetail(true); setDetail(null); setDetailError(null); setDetailLoading(true);
    console.debug('[StaffApplications] openDetail start', id);
    try {
      const data = await taskerApplicationsAPI.detail(id, token);
      setDetail(data.data || data);
    } catch(e){
      console.warn('[StaffApplications] openDetail error', e);
      setDetailError(e.message);
    } finally { setDetailLoading(false); }
  };
  const closeDetail = () => { setShowDetail(false); setDetail(null); setDetailError(null); setDetailLoading(false); };

  return (
    <div className="staff-applications-container">
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
        <table className="apps-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Email</th>
              <th>Giới thiệu</th>
              <th>Biến thể</th>
              <th>Chứng chỉ</th>
              <th>Video?</th>
              <th>Ngày tạo</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {apps.map(a => (
              <tr key={a.application_id} className="clickable" onClick={()=>openDetail(a.application_id)}>
                <td>{a.application_id}</td>
                <td>{a.user_name}</td>
                <td>{a.email}</td>
                <td className="intro-cell" title={a.introduce}>{(a.introduce||'').slice(0,40)}{(a.introduce||'').length>40?'…':''}</td>
                <td>{Array.isArray(a.variants)? a.variants.length : 0}</td>
                <td>{Array.isArray(a.certifications)? a.certifications.length : 0}</td>
                <td>{a.introduction_video? '✔️':'—'}</td>
                <td>{a.created_at? new Date(a.created_at).toLocaleString() : ''}</td>
                <td>{a.status}</td>
                <td>
                  {a.status === 'Pending' && (
                    <div className="actions">
                      <button disabled={!!actionLoading} onClick={(e)=>{e.stopPropagation(); approve(a.application_id);}}>{actionLoading===a.application_id?'…':'Duyệt'}</button>
                      <button disabled={!!actionLoading} className="danger" onClick={(e)=>{e.stopPropagation(); reject(a.application_id);}}>{actionLoading===a.application_id?'…':'Từ chối'}</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
                  <ul className="cert-list">
                    {detail.application.certifications?.map((c,i)=>{
                      const isImage = c.cert_file_url && /(\.jpg|\.jpeg|\.png|\.gif|\.webp)$/i.test(c.cert_file_url);
                      return (
                        <li key={i}>
                          <div className="cert-head">
                            <strong>{c.cert_name || c.parsed_cert_name || 'Chứng chỉ #' + (i+1)}</strong>
                          </div>
                          {isImage && (
                            <div className="cert-thumb-wrap" onClick={()=> setZoomSrc(c.cert_file_url)}>
                              <img loading="lazy" src={c.cert_file_url} alt={c.cert_name || 'certificate'} className="cert-thumb" />
                            </div>
                          )}
                          {!isImage && c.cert_file_url && <a href={c.cert_file_url} target="_blank" rel="noreferrer">Mở file</a>}
                          {c.parsed_certificate_code && <div className="cert-meta"><span>Mã:</span> {c.parsed_certificate_code}</div>}
                          {c.issued_by && <div className="cert-meta"><span>Đơn vị cấp:</span> {c.issued_by}</div>}
                          {c.issued_date && <div className="cert-meta"><span>Ngày cấp:</span> {c.issued_date}</div>}
                          {c.ai_detected_service && <div className="cert-meta"><span>AI dịch vụ:</span> {c.ai_detected_service}</div>}
                        </li>
                      );
                    })}
                  </ul>
                </section>
                <section>
                  <h4>Video giới thiệu</h4>
                  {detail.application.introduction_video ? (
                    <video controls width="100%" src={detail.application.introduction_video.video_url} />
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
