import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faEnvelope, 
  faPhone, 
  faMapMarkerAlt, 
  faStar,
  faEdit,
  faSave,
  faTimes,
  faCamera,
  faLock,
  faHistory,
  faCog,
  faIdCard,
  faSpinner,
  faCertificate,
  faAward,
  faCalendarCheck,
  faTools,
  faGlobe,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import { addressAPI, cccdAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import TaskerCertificateRegister from '../components/TaskerCertificateRegister';
import { CustomToastContainer, showToast } from '../components/common/CustomToast';

const API_BASE_URL = "http://localhost:3001/api";

const TaskerMyProfile = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState('');
  const [editingAddress, setEditingAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [cccdForm, setCccdForm] = useState({ number: '', full_name: '', dob: '', gender: 'Nữ' });
  const [front, setFront] = useState(null);
  const [back, setBack] = useState(null);
  const [cccdResult, setCccdResult] = useState(null);
  const [cccdLoading, setCccdLoading] = useState(false);
  const [cccdStatus, setCccdStatus] = useState(null);
  const [hasVerifiedCCCD, setHasVerifiedCCCD] = useState(false);
  const [cccdImageUrl, setCccdImageUrl] = useState(null);
  const [cccdImageLoading, setCccdImageLoading] = useState(false);
  const [cccdStatusLoading, setCccdStatusLoading] = useState(false);
  const [certifications, setCertifications] = useState([]);
  const [showCertForm, setShowCertForm] = useState(false);

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    profileImage: '/images/default-avatar.png',
    languages: [],
    skills: [],
    rating: 0,
    totalJobs: 0,
  });

  const tabs = [
    { id: 'profile', label: 'Thông tin cá nhân', icon: faUser },
    { id: 'addresses', label: 'Địa chỉ', icon: faMapMarkerAlt },
    { id: 'cccd', label: 'Xác minh CCCD', icon: faIdCard },
    { id: 'certifications', label: 'Chứng chỉ', icon: faCertificate },
    { id: 'bookings', label: 'Công việc', icon: faCalendarCheck },
    { id: 'security', label: 'Bảo mật', icon: faLock },
    { id: 'history', label: 'Lịch sử', icon: faHistory },
    { id: 'settings', label: 'Cài đặt', icon: faCog }
  ];

  // Load user data
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: '',
        profileImage: '/images/default-avatar.png',
        languages: [],
        skills: [],
        rating: 0,
        totalJobs: 0,
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!token) return;
      try {
        setIsLoading(true);
        const addresses = await addressAPI.getAll(token);
        setAddresses(addresses);
      } catch (error) {
        if (error.message.includes('Phiên đăng nhập hết hạn') || error.message.includes('không có quyền truy cập')) {
          setError(error.message);
          logout();
        } else {
          setError(error.message || 'Không thể tải danh sách địa chỉ');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchAddresses();
  }, [token, logout]);

  // Load certifications
  useEffect(() => {
    if (!user?.user_id || !token) return;
    fetch(`${API_BASE_URL}/taskers/${user.user_id}/certifications`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        const certList = Array.isArray(data.data) ? data.data : [];
        setCertifications(certList);
      })
      .catch(err => console.error('Error loading certifications:', err));
  }, [user, token]);

  // Kiểm tra trạng thái CCCD
  useEffect(() => {
    const checkCCCDStatus = async () => {
      if (!token) return;
      try {
        setCccdStatusLoading(true);
        const [statusRes, verifiedRes] = await Promise.all([
          cccdAPI.getCCCDStatus(token),
          cccdAPI.checkVerifiedCCCD(token)
        ]);
        
        if (statusRes.success) {
          setCccdStatus(statusRes.data);
        }
        
        if (verifiedRes.success) {
          const verified = verifiedRes.data.hasVerified;
          setHasVerifiedCCCD(verified);
          if (verified) {
            try {
              setCccdImageLoading(true);
              const urlRes = await cccdAPI.getSignedUrl(token);
              const data = urlRes?.data || urlRes;
              setCccdImageUrl(data?.url || null);
            } catch (_) {
              setCccdImageUrl(null);
            } finally {
              setCccdImageLoading(false);
            }
          }
        }
      } catch (error) {
        console.error('Lỗi kiểm tra trạng thái CCCD:', error);
      } finally {
        setCccdStatusLoading(false);
      }
    };
    checkCCCDStatus();
  }, [token]);

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddAddress = async () => {
    if (!newAddress.trim()) {
      setError('Vui lòng nhập địa chỉ');
      return;
    }
    try {
      setError(null);
      setSuccess(null);
      setIsLoading(true);
      const response = await addressAPI.create(newAddress.trim(), token);
      setAddresses(prev => [...prev, response]);
      setNewAddress('');
      setSuccess(response.message || 'Thêm địa chỉ thành công!');
    } catch (error) {
      console.error('Lỗi khi thêm địa chỉ:', error);
      setError(error.message || 'Không thể thêm địa chỉ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setNewAddress(address.address);
  };

  const handleUpdateAddress = async () => {
    if (!newAddress.trim()) {
      setError('Vui lòng nhập địa chỉ');
      return;
    }
    try {
      setError(null);
      setSuccess(null);
      setIsLoading(true);
      const response = await addressAPI.update(editingAddress.address_id, newAddress.trim(), token);
      setAddresses(prev => prev.map(addr => 
        addr.address_id === editingAddress.address_id ? response : addr
      ));
      setEditingAddress(null);
      setNewAddress('');
      setSuccess('Cập nhật địa chỉ thành công!');
    } catch (error) {
      console.error('Lỗi khi cập nhật địa chỉ:', error);
      setError(error.message || 'Không thể cập nhật địa chỉ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này không?')) return;
    try {
      setError(null);
      setSuccess(null);
      setIsLoading(true);
      await addressAPI.delete(addressId, token);
      setAddresses(prev => prev.filter(addr => addr.address_id !== addressId));
      setSuccess('Xóa địa chỉ thành công');
    } catch (error) {
      setError(error.message || 'Không thể xóa địa chỉ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingAddress(null);
    setNewAddress('');
  };

  const handleSave = () => {
    setIsEditing(false);
    console.log('Profile updated:', profileData);
    // TODO: Call API to update profile
  };

  const handleCccdChange = (e) => setCccdForm({ ...cccdForm, [e.target.name]: e.target.value });

  const refreshCCCDStatus = async () => {
    if (!token) return;
    try {
      const [statusRes, verifiedRes] = await Promise.all([
        cccdAPI.getCCCDStatus(token),
        cccdAPI.checkVerifiedCCCD(token)
      ]);
      
      if (statusRes.success) {
        setCccdStatus(statusRes.data);
      }
      
      if (verifiedRes.success) {
        const verified = verifiedRes.data.hasVerified;
        setHasVerifiedCCCD(verified);
        if (verified) {
          try {
            setCccdImageLoading(true);
            const urlRes = await cccdAPI.getSignedUrl(token);
            const data = urlRes?.data || urlRes;
            setCccdImageUrl(data?.url || null);
          } catch (_) {
            setCccdImageUrl(null);
          } finally {
            setCccdImageLoading(false);
          }
        }
      }
    } catch (error) {
      console.error('Lỗi refresh trạng thái CCCD:', error);
    }
  };

  const submitCccd = async (e) => {
    e.preventDefault();
    if (!front || !back) return alert('Vui lòng tải ảnh mặt trước và mặt sau CCCD');
    
    const validateDate = (dateStr) => {
      if (!dateStr) return false;
      const parts = dateStr.split('/');
      if (parts.length !== 3) return false;
      
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const year = parseInt(parts[2]);
      
      if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) {
        return false;
      }
      
      const date = new Date(year, month - 1, day);
      return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year;
    };
    
    if (!validateDate(cccdForm.dob)) {
      alert('Ngày sinh không hợp lệ! Vui lòng nhập đúng định dạng dd/mm/yyyy');
      return;
    }
    
    try {
      setCccdLoading(true);
      const payload = { 
        ...cccdForm, 
        front, 
        back 
      };
      
      const res = await cccdAPI.submit(payload, token);
      setCccdResult(res);
      
      if (res.success) {
        showToast.success(res.message || 'Xác minh CCCD thành công!');
        await refreshCCCDStatus();
      }
      
    } catch (err) {
      console.error('❌ CCCD submission error:', err);
      showToast.error(err.message || 'Có lỗi xảy ra khi xử lý CCCD');
    } finally {
      setCccdLoading(false);
    }
  };

  const handleCertSubmit = async (data) => {
    try {
      const payload = {
        service_id: Number(data.service_id),
        variant_ids: (data.variant_ids || data.variants || []).map(v => Number(v)),
        cert_ids: (data.certs || []).map(c => c.cert_public_id),
        certs: data.certs,
        status: 'pending'
      };
      
      const res = await fetch(`${API_BASE_URL}/tasker/certifications/pending`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload)
      });
      
      const json = await res.json();
      if (res.ok && json.success) {
        showToast.success('Đăng ký thành công! Chờ duyệt.');
        setShowCertForm(false);
        // Reload certifications
        const certRes = await fetch(`${API_BASE_URL}/taskers/${user.user_id}/certifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const certData = await certRes.json();
        setCertifications(Array.isArray(certData.data) ? certData.data : []);
      } else {
        showToast.error('Không thể tạo đăng ký: ' + (json.message || 'Lỗi không xác định'));
      }
    } catch (e) {
      showToast.error('Lỗi khi tạo đăng ký: ' + e.message);
    }
  };

  if (!token) {
    return (
      <div className="container py-5 text-center">
        <p>Vui lòng đăng nhập để xem profile</p>
      </div>
    );
  }

  return (
    <div className="account-management-container">
      <CustomToastContainer />
      {/* Header */}
      <div className="page-header bg-white shadow-sm">
        <div className="container">
          <div className="row align-items-center py-4">
            <div className="col-md-12">
              <h1 className="mb-0">Hồ sơ Tasker</h1>
              <p className="text-muted mb-0">Quản lý thông tin và dịch vụ của bạn</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-4">
        <div className="row">
          {/* Left Sidebar - Navigation */}
          <div className="col-lg-3">
            <div className="sidebar1 bg-white rounded shadow-sm">
              <div className="user-summary p-4 border-bottom">
                <div className="text-center">
                  <div className="profile-image-container mb-3">
                    <img 
                      src={profileData.profileImage} 
                      alt="Profile" 
                      className="rounded-circle"
                      style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                    />
                    <button className="edit-photo-btn">
                      <FontAwesomeIcon icon={faCamera} />
                    </button>
                  </div>
                  <h5 className="mb-1">{profileData.name || user?.name || 'Tasker'}</h5>
                  <p className="text-muted mb-2">Tasker</p>
                  {profileData.rating > 0 && (
                    <div className="rating-badge">
                      <FontAwesomeIcon icon={faStar} className="text-warning mr-1" />
                      {profileData.rating.toFixed(1)}
                    </div>
                  )}
                </div>
              </div>

              <nav className="nav flex-column p-3">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={`nav-link text-left ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <FontAwesomeIcon icon={tab.icon} className="mr-2" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Right Content */}
          <div className="col-lg-9">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="content-card bg-white rounded shadow-sm p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4>Thông tin cá nhân</h4>
                  <button
                    className={`btn ${isEditing ? 'btn-success' : 'btn-primary'}`}
                    onClick={isEditing ? handleSave : () => setIsEditing(true)}
                  >
                    <FontAwesomeIcon icon={isEditing ? faSave : faEdit} className="mr-2" />
                    {isEditing ? 'Lưu thay đổi' : 'Chỉnh sửa'}
                  </button>
                </div>

                <div className="row">
                  <div className="col-md-12">
                    <div className="form-group mb-3">
                      <label>Họ và tên</label>
                      <input
                        type="text"
                        className="form-control"
                        value={profileData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label>Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={profileData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label>Số điện thoại</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={profileData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label>Giới thiệu</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={profileData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Giới thiệu về dịch vụ và kinh nghiệm của bạn..."
                  />
                </div>

                <div className="form-group mb-3">
                  <label>Ngôn ngữ</label>
                  <div className="language-tags">
                    {profileData.languages.map((lang, index) => (
                      <span key={index} className="badge badge-primary mr-2 mb-2">
                        <FontAwesomeIcon icon={faGlobe} className="mr-1" />
                        {lang}
                      </span>
                    ))}
                    {isEditing && (
                      <button className="btn btn-sm btn-outline-primary">
                        <FontAwesomeIcon icon={faEdit} className="mr-1" />
                        Thêm ngôn ngữ
                      </button>
                    )}
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label>Kỹ năng & Chuyên môn</label>
                  <div className="skills-tags">
                    {profileData.skills.map((skill, index) => (
                      <span key={index} className="badge badge-info mr-2 mb-2">
                        {skill}
                      </span>
                    ))}
                    {isEditing && (
                      <button className="btn btn-sm btn-outline-info">
                        <FontAwesomeIcon icon={faEdit} className="mr-1" />
                        Thêm kỹ năng
                      </button>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="text-right">
                    <button className="btn btn-secondary mr-2" onClick={() => setIsEditing(false)}>
                      <FontAwesomeIcon icon={faTimes} className="mr-1" />
                      Hủy
                    </button>
                    <button className="btn btn-primary" onClick={handleSave}>
                      <FontAwesomeIcon icon={faSave} className="mr-1" />
                      Lưu thay đổi
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Addresses Tab - Same as UserProfile */}
            {activeTab === 'addresses' && (
              <div className="content-card bg-white rounded shadow-sm p-4">
                <h4 className="mb-4">Quản lý địa chỉ</h4>
                {error && <div className="alert alert-danger">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}
                
                <div className="form-group mb-3">
                  <label><FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1" /> Địa chỉ</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="Nhập địa chỉ đầy đủ"
                    disabled={isLoading}
                  />
                  <div className="text-right mt-2">
                    {editingAddress && (
                      <button className="btn btn-secondary mr-2" onClick={handleCancelEdit}>
                        Hủy
                      </button>
                    )}
                    <button
                      className="btn btn-primary"
                      onClick={editingAddress ? handleUpdateAddress : handleAddAddress}
                      disabled={isLoading || !newAddress.trim()}
                    >
                      {editingAddress ? 'Cập nhật' : 'Thêm địa chỉ'}
                    </button>
                  </div>
                </div>

                {addresses.length > 0 && (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Địa chỉ</th>
                          <th>Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {addresses.map((address) => (
                          <tr key={address.address_id}>
                            <td><strong>{address.address}</strong></td>
                            <td>
                              <button className="btn btn-sm btn-outline-warning mr-2" onClick={() => handleEditAddress(address)}>
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteAddress(address.address_id)}>
                                <FontAwesomeIcon icon={faTimes} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* CCCD Tab - Same as UserProfile */}
            {activeTab === 'cccd' && (
              <div className="content-card bg-white rounded shadow-sm p-4">
                <h4 className="mb-3"><FontAwesomeIcon icon={faIdCard} className="me-2" />Xác minh CCCD</h4>
                {cccdStatus && (
                  <div className={`alert ${cccdStatus.status === 'Verified' ? 'alert-success' : 'alert-warning'} mb-4`}>
                    <strong>{cccdStatus.message}</strong>
                  </div>
                )}
                {hasVerifiedCCCD ? (
                  <div className="text-center py-5">
                    <FontAwesomeIcon icon={faCheckCircle} size="4x" className="text-success mb-3" />
                    <h5 className="text-success mb-3">CCCD đã được xác minh thành công!</h5>
                  </div>
                ) : (
                  <form onSubmit={submitCccd}>
                    <div className="row g-3">
                      <div className="col-md-3"><input className="form-control" name="number" value={cccdForm.number} onChange={handleCccdChange} placeholder="Số CCCD" required /></div>
                      <div className="col-md-4"><input className="form-control" name="full_name" value={cccdForm.full_name} onChange={handleCccdChange} placeholder="Họ và tên" required /></div>
                      <div className="col-md-3"><input className="form-control" name="dob" value={cccdForm.dob} onChange={handleCccdChange} placeholder="dd/mm/yyyy" required /></div>
                      <div className="col-md-2"><select className="form-select" name="gender" value={cccdForm.gender} onChange={handleCccdChange}><option>Nam</option><option>Nữ</option></select></div>
                      <div className="col-md-6"><input className="form-control" type="file" accept="image/*" onChange={(e) => setFront(e.target.files[0])} required /></div>
                      <div className="col-md-6"><input className="form-control" type="file" accept="image/*" onChange={(e) => setBack(e.target.files[0])} required /></div>
                    </div>
                    <button className="btn btn-primary mt-3" disabled={cccdLoading}>
                      {cccdLoading ? 'Đang xử lý...' : 'Gửi xác minh'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Certifications Tab */}
            {activeTab === 'certifications' && (
              <div className="content-card bg-white rounded shadow-sm p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4>Chứng chỉ dịch vụ</h4>
                  {!showCertForm && (
                    <button className="btn btn-primary" onClick={() => setShowCertForm(true)}>
                      <FontAwesomeIcon icon={faCertificate} className="mr-2" />
                      Đăng ký dịch vụ mới
                    </button>
                  )}
                </div>

                {showCertForm ? (
                  <div>
                    <button className="btn btn-secondary mb-3" onClick={() => setShowCertForm(false)}>
                      <FontAwesomeIcon icon={faTimes} className="mr-1" />
                      Hủy
                    </button>
                    <TaskerCertificateRegister onSubmit={handleCertSubmit} />
                  </div>
                ) : (
                  <div>
                    {certifications.length > 0 ? (
                      <div className="row g-3">
                        {certifications.map((cert, idx) => (
                          <div key={idx} className="col-12">
                            <div className="card shadow-sm border-0 p-3">
                              <div className="d-flex justify-content-between">
                                <div>
                                  <h6>{cert.cert_name || 'Chứng chỉ'}</h6>
                                  <p className="text-muted mb-0">
                                    {cert.service_name} - {cert.variant_name}
                                  </p>
                                </div>
                                <span className={`badge ${cert.status === 'Approved' ? 'bg-success' : 'bg-warning'}`}>
                                  {cert.status === 'Approved' ? 'Đã duyệt' : 'Chờ duyệt'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="alert alert-info">Chưa có chứng chỉ nào. Hãy đăng ký dịch vụ mới!</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div className="content-card bg-white rounded shadow-sm p-4">
                <h4 className="mb-4">Công việc của tôi</h4>
                <button className="btn btn-primary" onClick={() => navigate('/tasker/bookings')}>
                  Xem danh sách công việc
                </button>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="content-card bg-white rounded shadow-sm p-4">
                <h4 className="mb-4">Bảo mật</h4>
                <div className="form-group mb-3">
                  <label>Mật khẩu hiện tại</label>
                  <input type="password" className="form-control" />
                </div>
                <div className="form-group mb-3">
                  <label>Mật khẩu mới</label>
                  <input type="password" className="form-control" />
                </div>
                <button className="btn btn-primary">Cập nhật mật khẩu</button>
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="content-card bg-white rounded shadow-sm p-4">
                <h4 className="mb-4">Lịch sử công việc</h4>
                <p className="text-muted">Chức năng đang được phát triển...</p>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="content-card bg-white rounded shadow-sm p-4">
                <h4 className="mb-4">Cài đặt tài khoản</h4>
                <div className="form-check mb-2">
                  <input className="form-check-input" type="checkbox" id="emailNotif" defaultChecked />
                  <label className="form-check-label" htmlFor="emailNotif">Thông báo qua email</label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .account-management-container {
          background-color: #f8f9fa;
          min-height: 100vh;
        }
        .page-header {
          border-bottom: 1px solid #e9ecef;
        }
        .sidebar1 {
          position: sticky;
          top: 20px;
        }
        .profile-image-container {
          position: relative;
          display: inline-block;
        }
        .edit-photo-btn {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background-color: #007bff;
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
        }
        .rating-badge {
          background-color: #f8f9fa;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.9rem;
        }
        .nav-link {
          color: #6c757d;
          border: none;
          padding: 0.75rem 1rem;
          text-align: left;
        }
        .nav-link:hover {
          background-color: #f8f9fa;
          color: #007bff;
        }
        .nav-link.active {
          background-color: #e3f2fd;
          color: #007bff;
          border-left: 3px solid #007bff;
        }
        .content-card {
          min-height: 500px;
        }
      `}</style>
    </div>
  );
};

export default TaskerMyProfile;

