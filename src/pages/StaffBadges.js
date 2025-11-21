import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import '../css/StaffBadges.css';
import { BADGE_CRITERIA_OPTIONS } from '../constants/badgeCriteria';
import { useAuth } from '../contexts/AuthContext';
import { badgesAPI, handleResponse } from '../services/api';
import { showToast } from '../components/common/CustomToast';

const initialForm = {
  name: '',
  description: '',
  is_active: true,
  criteria_key: '',
  criteria_value: ''
};

export default function StaffBadges() {
  const { token } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [badges, setBadges] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBadge, setEditingBadge] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [iconPreview, setIconPreview] = useState(null); 

  const loadBadges = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/badges`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      const data = await handleResponse(res);
      setBadges(data.data || data.badges || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadBadges();
  }, [token]);

  useEffect(() => {
    if (showModal) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [showModal]);

  // Cleanup preview when modal closes
  useEffect(() => {
    if (!showModal && iconPreview) {
      try { URL.revokeObjectURL(iconPreview); } catch (_) {}
      setIconPreview(null);
    }
  }, [showModal]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && showModal && !loading) {
        setShowModal(false);
        setEditingBadge(null);
        setForm(initialForm);
        if (iconPreview) { try { URL.revokeObjectURL(iconPreview); } catch (_) {} setIconPreview(null); }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showModal, loading]);

  useEffect(() => {
    if (!openMenuId) return;
    const handleClick = () => setOpenMenuId(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [openMenuId]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // Criteria that return 0/1 (boolean-like)
  const BOOLEAN_CRITERIA = React.useMemo(() => new Set(['VERIFIED_CCCD', 'NO_CANCELLATION_30D']), []);
  const isBooleanCriteria = React.useMemo(() => BOOLEAN_CRITERIA.has(form.criteria_key), [BOOLEAN_CRITERIA, form.criteria_key]);

  // When switching to a boolean criteria, default threshold to 1
  useEffect(() => {
    if (isBooleanCriteria) {
      const num = Number(form.criteria_value);
      if (!(num === 0 || num === 1)) {
        setForm(prev => ({ ...prev, criteria_value: 1 }));
      }
    }
  }, [isBooleanCriteria]);

  // Preview selected icon for both create and edit
  const onIconChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      // Revoke previous preview URL if exists
      setIconPreview(prev => { if (prev) { try { URL.revokeObjectURL(prev); } catch (_) {} } return url; });
    } else {
      if (iconPreview) { try { URL.revokeObjectURL(iconPreview); } catch (_) {} }
      setIconPreview(null);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return showToast.error('Vui lòng nhập tên huy hiệu');
    if (!form.description.trim()) return showToast.error('Vui lòng nhập mô tả');
    if (!form.criteria_key) return showToast.error('Vui lòng chọn tiêu chí');
    if (form.criteria_value === '' || isNaN(Number(form.criteria_value))) {
      return showToast.error('Ngưỡng phải là số');
    }

    const fileInput = document.getElementById('badge-icon-file');
    if (!editingBadge) {
      if (!(fileInput && fileInput.files && fileInput.files[0])) {
        return showToast.error('Vui lòng chọn biểu tượng (icon) để tải lên');
      }
    }

    try {
      setLoading(true);
      if (editingBadge) {
        // Kiểm tra có thay đổi gì không (ngoài icon)
        const fileInput = document.getElementById('badge-icon-file');
        const hasNewIcon = !!(fileInput && fileInput.files && fileInput.files[0]);
        const unchanged =
          (form.name.trim() === (editingBadge.name || '').trim()) &&
          (form.description.trim() === (editingBadge.description || '').trim()) &&
          (Boolean(form.is_active) === Boolean(editingBadge.is_active)) &&
          (form.criteria_key === (editingBadge.criteria_key || '')) &&
          (Number(form.criteria_value) === Number(editingBadge.criteria_value)) &&
          !hasNewIcon;

        if (unchanged) {
          showToast.info('Không có thay đổi để cập nhật');
          return;
        }

        const confirmed = await showToast.confirm('Cập nhật huy hiệu này?');
        if (!confirmed) return;

        let payload;
        if (hasNewIcon) {
          payload = new FormData();
          payload.append('icon', fileInput.files[0]);
        } else payload = {};

        if (payload instanceof FormData) {
          payload.append('name', form.name.trim());
          payload.append('description', form.description.trim());
          payload.append('is_active', form.is_active ? 'true' : 'false');
          payload.append('criteria_key', form.criteria_key);
          payload.append('criteria_value', String(Number(form.criteria_value)));
        } else {
          payload.name = form.name.trim();
          payload.description = form.description.trim();
          payload.is_active = form.is_active;
          payload.criteria_key = form.criteria_key;
          payload.criteria_value = Number(form.criteria_value);
        }

        await badgesAPI.update(editingBadge.badge_id, payload, token);
        showToast.success('Cập nhật huy hiệu thành công');
      } else {
        const fd = new FormData();
        fd.append('name', form.name.trim());
        fd.append('description', form.description.trim());
        fd.append('is_active', form.is_active ? 'true' : 'false');
        fd.append('criteria_key', form.criteria_key);
        fd.append('criteria_value', String(Number(form.criteria_value)));
        fd.append('icon', fileInput.files[0]);
        await badgesAPI.create(fd, token);
        showToast.success('Tạo huy hiệu thành công');
      }
      setForm(initialForm);
      setEditingBadge(null);
      setShowModal(false);
      loadBadges();
    } catch (err) {
      showToast.error(err.message || 'Tạo huy hiệu thất bại');
    } finally {
      setLoading(false);
    }
  };

  const criteriaLabelMap = React.useMemo(() => {
    const m = {};
    BADGE_CRITERIA_OPTIONS.forEach(o => { m[o.value] = o.label; });
    return m;
  }, []);

  return (
    <div className="container py-3">
      <div className="card shadow-sm">
        <div className="card-header d-flex justify-content-between align-items-center">
          <span>Danh sách huy hiệu</span>
          <button className="btn btn-sm btn-primary" onClick={() => { setEditingBadge(null); setForm(initialForm); if (iconPreview) { try { URL.revokeObjectURL(iconPreview); } catch (_) {} } setIconPreview(null); setShowModal(true); }}>
            + Tạo huy hiệu
          </button>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0 staff-badges-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Icon</th>
                  <th>Tên</th>
                  <th>Tiêu chí</th>
                  <th>Mốc</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {badges.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-3 text-muted">Chưa có huy hiệu</td></tr>
                )}
                {badges.map((b, idx) => (
                  <tr key={b.badge_id} className="align-middle">
                    <td>{idx + 1}</td>
                    <td>{b.icon_url ? <img src={b.icon_url} alt="icon" style={{ height: 24 }} /> : '-'}</td>
                    <td>{b.name}</td>
                    <td>{criteriaLabelMap[b.criteria_key] || b.criteria_key}</td>
                    <td>{Number(b.criteria_value)}</td>
                    <td>
                      <span className={`badge ${b.is_active ? 'text-bg-success' : 'text-bg-secondary'}`}>
                        {b.is_active ? 'Khả dụng' : 'Không khả dụng'}
                      </span>
                    </td>
                    <td style={{ width: 48 }} className="text-end badge-actions">
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        type="button"
                        title="Thao tác"
                        style={{ lineHeight: 1 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setMenuPosition({
                            top: rect.bottom + window.scrollY + 4,
                            left: rect.left + window.scrollX - 90
                          });
                          setOpenMenuId(openMenuId === b.badge_id ? null : b.badge_id);
                        }}
                      >
                        ⋮
                      </button>

                      {openMenuId === b.badge_id &&
                        createPortal(
                          <div
                            className="badge-actions-menu show"
                            style={{
                              position: 'absolute',
                              top: `${menuPosition.top}px`,
                              left: `${menuPosition.left}px`,
                              zIndex: 2000
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              className="dropdown-item"
                              type="button"
                              onClick={() => {
                                setEditingBadge(b);
                                setForm({
                                  name: b.name || '',
                                  description: b.description || '',
                                  is_active: !!b.is_active,
                                  criteria_key: b.criteria_key || '',
                                  criteria_value: b.criteria_value || ''
                                });
                                if (iconPreview) { try { URL.revokeObjectURL(iconPreview); } catch (_) {} }
                                setIconPreview(null);
                                setShowModal(true);
                                setOpenMenuId(null);
                              }}
                            >
                              Sửa
                            </button>
                            <button
                              className="dropdown-item text-danger"
                              type="button"
                              onClick={async () => {
                                const ok = await showToast.confirm('Xóa huy hiệu này?');
                                if (!ok) return;
                                try {
                                  await badgesAPI.remove(b.badge_id, token);
                                  showToast.success('Đã xóa');
                                  loadBadges();
                                } catch (err) {
                                  showToast.error(err.message || 'Xóa thất bại');
                                } finally {
                                  setOpenMenuId(null);
                                }
                              }}
                            >
                              Xóa
                            </button>
                          </div>,
                          document.body
                        )
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && createPortal(
        <>
          <div
            className="modal-backdrop fade show"
            style={{ zIndex: 1090, position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => { if (!loading) { setShowModal(false); setEditingBadge(null); setForm(initialForm); if (iconPreview) { try { URL.revokeObjectURL(iconPreview); } catch (_) {} } setIconPreview(null); } }}
          ></div>
          <div
            className="modal fade show"
            style={{
              display: 'flex',
              zIndex: 1095,
              position: 'fixed',
              inset: 0,
              alignItems: 'center',
              justifyContent: 'center'
            }}
            role="dialog"
            aria-modal="true"
          >
            <div
            className="modal-dialog modal-xl modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '1500px' }}
            >
            <div className="modal-content modal-content1">
                <div className="modal-header">
                <h5 className="modal-title">
                    {editingBadge ? 'Cập nhật huy hiệu' : 'Tạo huy hiệu'}
                </h5>
        <button
          type="button"
          className="btn-close"
          onClick={() => { setShowModal(false); setEditingBadge(null); setForm(initialForm); if (iconPreview) { try { URL.revokeObjectURL(iconPreview); } catch (_) {} } setIconPreview(null); }}
          disabled={loading}
        ></button>
                </div>

                <div className="modal-body">
                <form onSubmit={onSubmit} id="badge-create-form">
                    <div className="row">
                    {/* Cột trái */}
                    <div className="col-md-6">
                        <div className="mb-3">
                        <label className="form-label">Tên huy hiệu</label>
                        <input
                            name="name"
                            className="form-control"
                            value={form.name}
                            onChange={onChange}
                            placeholder="Ong Chăm Chỉ 50"
                        />
                        </div>

                        <div className="mb-3">
                        <label className="form-label">Mô tả</label>
                        <textarea
                            name="description"
                            className="form-control"
                            rows={3}
                            value={form.description}
                            onChange={onChange}
                            placeholder="Hoàn thành 50 công việc đầu tiên"
                        />
                        </div>

                        <div className="mb-3">
                        <label className="form-label">Tiêu chí</label>
                        <select
                            name="criteria_key"
                            className="form-select"
                            value={form.criteria_key}
                            onChange={onChange}
                        >
                            <option value="">-- Chọn tiêu chí --</option>
                            {BADGE_CRITERIA_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                            ))}
                        </select>
                        </div>
                    </div>

                    {/* Cột phải */}
                    <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Mốc</label>
                          {isBooleanCriteria ? (
                            <div>
                              <div className="form-check form-check-inline">
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  name="criteria_value_bool"
                                  id="criteria_value_1"
                                  checked={Number(form.criteria_value) === 1}
                                  onChange={() => setForm(prev => ({ ...prev, criteria_value: 1 }))}
                                />
                                <label className="form-check-label" htmlFor="criteria_value_1">Đạt điều kiện</label>
                              </div>
                              <div className="form-check form-check-inline">
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  name="criteria_value_bool"
                                  id="criteria_value_0"
                                  checked={Number(form.criteria_value) === 0}
                                  onChange={() => setForm(prev => ({ ...prev, criteria_value: 0 }))}
                                />
                                <label className="form-check-label" htmlFor="criteria_value_0">Không đạt</label>
                              </div>
                            </div>
                          ) : (
                            <input
                              name="criteria_value"
                              type="number"
                              step="0.01"
                              className="form-control"
                              value={form.criteria_value}
                              onChange={onChange}
                              placeholder="vd: 50 hoặc 4.8"
                            />
                          )}
                        </div>

                        <div className="mb-3">
                        <label className="form-label">Icon</label>
                        <input
                            id="badge-icon-file"
                            type="file"
                            accept="image/*"
                            className="form-control"
                            onChange={onIconChange}
                        />
                        <div className="mt-2 d-flex align-items-center gap-3">
                          {(iconPreview || (editingBadge && editingBadge.icon_url)) && (
                            <>
                              <span className="text-muted small">
                                {iconPreview ? 'Xem trước:' : 'Icon hiện tại:'}
                              </span>
                              <img
                                src={iconPreview || editingBadge.icon_url}
                                alt="icon preview"
                                style={{ height: 64, borderRadius: 8 }}
                              />
                            </>
                          )}
                        </div>
                        </div>

                        <div className="form-check form-switch mb-3 mt-4">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="is_active"
                            name="is_active"
                            checked={form.is_active}
                            onChange={onChange}
                        />
                        <label className="form-check-label" htmlFor="is_active">
                            Kích hoạt huy hiệu này
                        </label>
                        </div>
                    </div>
                    </div>
                </form>
                </div>

                <div className="modal-footer">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => { setShowModal(false); setEditingBadge(null); setForm(initialForm); if (iconPreview) { try { URL.revokeObjectURL(iconPreview); } catch (_) {} } setIconPreview(null); }}
          disabled={loading}
        >
          Đóng
        </button>
                <button
                    form="badge-create-form"
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                >
                    {loading ? 'Đang lưu...' : editingBadge ? 'Cập nhật' : 'Tạo huy hiệu'}
                </button>
                </div>
            </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
