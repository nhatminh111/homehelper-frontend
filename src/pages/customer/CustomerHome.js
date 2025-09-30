import React, { useState } from 'react';

const mockApplications = [
  { id: 1, name: 'Nguyễn Văn A', phone: '0901 234 567', address: 'Đà Nẵng', introduce: '3 năm kinh nghiệm dọn dẹp.', certifications: 'Vệ sinh công nghiệp', submitted_at: '2025-09-05 10:00:00', status: 'pending' },
  { id: 2, name: 'Trần Thị B', phone: '0902 111 222', address: 'Hà Nội', introduce: 'Chăm sóc người già 2 năm.', certifications: '', submitted_at: '2025-09-06 09:30:00', status: 'pending' },
];

const CustomerHome = () => {
  const [apps, setApps] = useState(mockApplications);
  const [filter, setFilter] = useState('pending');

  const approve = (id) => setApps(prev => prev.map(a => a.id === id ? { ...a, status: 'approved' } : a));
  const reject = (id) => setApps(prev => prev.map(a => a.id === id ? { ...a, status: 'rejected' } : a));

  const shown = apps.filter(a => (filter === 'all' ? true : a.status === filter));

  return (
    <div className="container py-4">
      <div className="row">
        <div className="col-12 mb-3">
          <div className="bg-white rounded shadow-sm p-4">
            <h3 className="mb-2">Customer Home</h3>
            <p className="text-muted mb-0">Trang dành cho khách hàng. UI demo, chưa kết nối API.</p>
          </div>
        </div>

        <div className="col-12">
          <div className="bg-white rounded shadow-sm p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Duyệt đơn đăng ký Tasker</h5>
              <select className="form-control" style={{ maxWidth: 200 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="pending">Chờ duyệt</option>
                <option value="approved">Đã duyệt</option>
                <option value="rejected">Từ chối</option>
                <option value="all">Tất cả</option>
              </select>
            </div>

            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Họ tên</th>
                    <th>SĐT</th>
                    <th>Địa chỉ</th>
                    <th>Giới thiệu</th>
                    <th>Chứng chỉ</th>
                    <th>Gửi lúc</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((a) => (
                    <tr key={a.id}>
                      <td>{a.id}</td>
                      <td>{a.name}</td>
                      <td>{a.phone}</td>
                      <td>{a.address}</td>
                      <td style={{ maxWidth: 240 }}>{a.introduce}</td>
                      <td>{a.certifications || '-'}</td>
                      <td>{a.submitted_at}</td>
                      <td>
                        <span className={`badge badge-${a.status === 'pending' ? 'warning' : a.status === 'approved' ? 'success' : 'danger'}`}>{a.status}</span>
                      </td>
                      <td>
                        {a.status === 'pending' ? (
                          <>
                            <button className="btn btn-sm btn-success mr-2" onClick={() => approve(a.id)}>Duyệt</button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => reject(a.id)}>Từ chối</button>
                          </>
                        ) : (
                          <span className="text-muted">Không có</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {shown.length === 0 && (
                    <tr>
                      <td colSpan="9" className="text-center text-muted py-4">Không có đơn phù hợp</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerHome;


