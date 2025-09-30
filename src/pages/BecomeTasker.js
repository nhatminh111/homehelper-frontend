import React, { useState } from 'react';

const BecomeTasker = () => {
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    introduce: '',
    certifications: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="bg-white rounded shadow-sm p-4">
            <h3 className="mb-3">Đăng ký trở thành Tasker</h3>
            <p className="text-muted mb-4">Điền thông tin bên dưới để gửi yêu cầu. Đây chỉ là UI demo, chưa kết nối API.</p>

            {submitted && (
              <div className="alert alert-info">Đã chuẩn bị dữ liệu gửi (UI). Vui lòng chờ phần backend.</div>
            )}

            <form onSubmit={onSubmit}>
              <div className="form-group">
                <label>Họ và tên</label>
                <input
                  name="full_name"
                  type="text"
                  className="form-control"
                  value={form.full_name}
                  onChange={onChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Số điện thoại</label>
                <input
                  name="phone"
                  type="tel"
                  className="form-control"
                  value={form.phone}
                  onChange={onChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Địa chỉ</label>
                <input
                  name="address"
                  type="text"
                  className="form-control"
                  value={form.address}
                  onChange={onChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Giới thiệu</label>
                <textarea
                  name="introduce"
                  className="form-control"
                  rows="3"
                  value={form.introduce}
                  onChange={onChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Chứng chỉ (tuỳ chọn)</label>
                <textarea
                  name="certifications"
                  className="form-control"
                  rows="2"
                  placeholder="Ví dụ: Chứng chỉ vệ sinh công nghiệp, chứng chỉ nấu ăn..."
                  value={form.certifications}
                  onChange={onChange}
                />
              </div>

              <button type="submit" className="btn btn-primary">Gửi đăng ký</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BecomeTasker;



