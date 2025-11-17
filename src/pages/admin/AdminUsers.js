import React, { useEffect, useState, useCallback } from 'react';
import '../../css/AdminUsers.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faUserPen, faBan, faCheck, faTrash } from '@fortawesome/free-solid-svg-icons';
import ReactDOM from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import adminUsersAPI from '../../services/adminUsers';
import { showToast } from '../../components/common/CustomToast';

// ✅ Confirm toast dùng chung từ CustomToast
const confirmToast = (content, options) => showToast.confirm(content, options);

const roleOptions = ['Customer', 'Tasker', 'Staff', 'Admin'];

export default function AdminUsers() {
  const { token, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', role: '' });

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await adminUsersAPI.list({ token, page, pageSize, search, role: roleFilter });
      setUsers(res.data);
      setTotalPages(res.pagination.totalPages || 1);
    } catch (e) {
      showToast.error(e.message || 'Lỗi tải danh sách user');
    } finally { setLoading(false); }
  }, [token, page, pageSize, search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (u) => {
    setEditingUser(u);
    setEditForm({ name: u.name || '', phone: u.phone || '', role: u.role || '' });
  };
  const cancelEdit = () => { setEditingUser(null); };
  const handleEditChange = (e) => setEditForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    const diffs = [];
    if ((editingUser.name || '') !== (editForm.name || '')) diffs.push(`Tên: "${editingUser.name || ''}" → "${editForm.name || ''}"`);
    if ((editingUser.phone || '') !== (editForm.phone || '')) diffs.push(`Phone: "${editingUser.phone || ''}" → "${editForm.phone || ''}"`);
    if ((editingUser.role || '') !== (editForm.role || '')) diffs.push(`Role: ${editingUser.role || ''} → ${editForm.role || ''}`);

    const ok = await confirmToast(
      <div>
        <div>Bạn có chắc muốn lưu thay đổi cho user #{editingUser.user_id}?</div>
        {diffs.length
          ? <ul className="mt-2 mb-0">{diffs.map((d, i) => <li key={i}>{d}</li>)}</ul>
          : <div className="mt-2">Không có thay đổi nào.</div>}
      </div>
    );
    if (!ok) return;

    try {
      await adminUsersAPI.update({ token, id: editingUser.user_id, payload: editForm });
      showToast.success('Cập nhật user thành công');
      cancelEdit();
      setTimeout(() => load(), 100);
    } catch (err) { showToast.error(err.message || 'Lỗi cập nhật'); }
  };

  const banUser = async (u) => {
    const ok = await confirmToast(<div>Bạn có chắc muốn BAN user "{u.name || u.email}" (#{u.user_id})?</div>);
    if (!ok) return;
    try {
      await adminUsersAPI.ban({ token, id: u.user_id });
      showToast.success('Đã ban');
      setTimeout(() => load(), 100);
    } catch (e) { showToast.error(e.message || 'Lỗi ban'); }
  };

  const unbanUser = async (u) => {
    const ok = await confirmToast(<div>Bạn có chắc muốn GỠ BAN user "{u.name || u.email}" (#{u.user_id})?</div>);
    if (!ok) return;
    try {
      await adminUsersAPI.unban({ token, id: u.user_id });
      showToast.success('Đã gỡ ban');
      setTimeout(() => load(), 100);
    } catch (e) { showToast.error(e.message || 'Lỗi gỡ ban'); }
  };

  const deleteUser = async (u) => {
    const ok = await confirmToast(
      <div>
        <div>Bạn có chắc muốn XOÁ user "{u.name || u.email}"?</div>
        <div className="text-danger mt-1">Hành động này không thể hoàn tác.</div>
      </div>
    );
    if (!ok) return;
    try {
      await adminUsersAPI.remove({ token, id: u.user_id });
      showToast.success('Đã xoá');
      setTimeout(() => load(), 100);
    } catch (e) { showToast.error(e.message || 'Lỗi xoá'); }
  };

  if (!isAdmin()) return <div>Không có quyền truy cập</div>;

  const EditUserModal = ({ user, form, onChange, onClose, onSubmit }) => {
    if (!user) return null;
    return ReactDOM.createPortal(
      <div
        className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
        style={{ background: 'rgba(0,0,0,0.45)', zIndex: 1050 }}
        onClick={onClose}
        onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="modal-content shadow"
          style={{ maxWidth: 520, width: '92%', borderRadius: 12 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h5 className="modal-title">Sửa User #{user.user_id}</h5>
            <button type="button" className="btn-close" aria-label="Đóng" onClick={onClose}></button>
          </div>
          <form onSubmit={onSubmit}>
            <div className="modal-body">
              <div className="mb-2">
                <label className="form-label" htmlFor="edit-name">Tên</label>
                <input id="edit-name" name="name" value={form.name} onChange={onChange} className="form-control" autoFocus />
              </div>
              <div className="mb-2">
                <label className="form-label" htmlFor="edit-phone">Phone</label>
                <input id="edit-phone" name="phone" value={form.phone} onChange={onChange} className="form-control" />
              </div>
              <div className="mb-2">
                <label className="form-label" htmlFor="edit-role">Role</label>
                <select id="edit-role" name="role" value={form.role} onChange={onChange} className="form-select">
                  <option value="">--Chọn--</option>
                  {roleOptions.map(r=> <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Huỷ</button>
              <button type="submit" className="btn btn-primary">Lưu</button>
            </div>
          </form>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="container py-3 admin-users">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h2 className="mb-0">Quản lý User</h2>
          <div className="text-muted small">Danh sách tài khoản người dùng trong hệ thống</div>
        </div>
      </div>

      <div className="admin-users-toolbar row g-2 mb-3 align-items-center">
        <div className="col-12 col-md-9 col-lg-5">
          <div className="admin-input-wrapper position-relative">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="admin-input-icon" />
            <input
              className="form-control admin-input-field" 
              placeholder="Tìm tên/email"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        <div className="col-6 col-md-3 col-lg-3">
          <div className="admin-input-wrapper position-relative">
            <select
              className="form-select admin-input-field" 
              value={roleFilter}
              onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            >
              <option value="">Tất cả vai trò</option>
              {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <div className="col-6 col-md-3 col-lg-2">
          <select
            className="form-select admin-input-field"
            value={pageSize}
            onChange={e => { setPageSize(parseInt(e.target.value, 10)); setPage(1); }}
          >
            {[10, 20, 50].map(sz => <option key={sz} value={sz}>{sz}/trang</option>)}
          </select>
        </div>
      </div>

      <div className="table-responsive admin-users-table-wrapper">
        <table className="table table-striped table-hover align-middle admin-users-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Tên</th>
              <th>Email</th>
              <th>Role</th>
              <th>Trạng thái</th>
              <th>Phone</th>
              <th className="text-end">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center">Đang tải...</td></tr>
            ) : users.length ? users.map((u, idx) => (
              <tr key={u.user_id} className={(u.is_banned ? 'table-danger ' : '') + 'admin-user-row'}>
                <td>{(page - 1) * pageSize + idx + 1}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>
                  {u.is_banned ? (
                    <span className="badge rounded-pill text-bg-danger">Banned</span>
                  ) : (
                    <span className="badge rounded-pill text-bg-success">Active</span>
                  )}
                </td>
                <td>{u.phone || ''}</td>
                <td className="text-end">
                  <div className="btn-group-action d-inline-flex gap-2">
                    <button className="btn btn-sm btn-outline-secondary icon-btn" onClick={() => openEdit(u)} title="Sửa">
                      <FontAwesomeIcon icon={faUserPen} />
                      <span className="d-none d-lg-inline ms-1">Sửa</span>
                    </button>
                    {u.is_banned ? (
                      <button className="btn btn-sm btn-outline-success icon-btn" onClick={() => unbanUser(u)} title="Gỡ ban">
                        <FontAwesomeIcon icon={faCheck} />
                        <span className="d-none d-lg-inline ms-1">Gỡ</span>
                      </button>
                    ) : (
                      <button className="btn btn-sm btn-outline-warning icon-btn" onClick={() => banUser(u)} title="Ban">
                        <FontAwesomeIcon icon={faBan} />
                        <span className="d-none d-lg-inline ms-1">Ban</span>
                      </button>
                    )}
                    <button className="btn btn-sm btn-outline-danger icon-btn" onClick={() => deleteUser(u)} title="Xoá">
                      <FontAwesomeIcon icon={faTrash} />
                      <span className="d-none d-lg-inline ms-1">Xoá</span>
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="text-center">Không có dữ liệu</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-between align-items-center admin-pagination">
        <div>Trang {page}/{totalPages}</div>
        <div className="btn-group">
          <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>«</button>
          <button className="btn btn-sm btn-outline-secondary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>»</button>
        </div>
      </div>

      <EditUserModal
        user={editingUser}
        form={editForm}
        onChange={handleEditChange}
        onClose={cancelEdit}
        onSubmit={submitEdit}
      />
    </div>
  );
}