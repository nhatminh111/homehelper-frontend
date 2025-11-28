import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faEnvelope, 
  faPhone, 
  faMapMarkerAlt, 
  faCalendar,
  faStar,
  faAward,
  faCheckCircle,
  faEdit,
  faSave,
  faTimes,
  faUpload,
  faCamera,
  faLock,
  faShieldAlt,
  faCreditCard,
  faHistory,
  faCog,
  faBell,
  faGlobe,
  faGraduationCap,
  faCertificate,
  faClock,
  faMapPin,
  faIdCard,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { addressAPI, cccdAPI, pythonOCRAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AccountManagement = () => {
  const { user, token, logout, isCustomer, isTasker } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [userType, setUserType] = useState('customer'); // 'customer' or 'tasker'
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

  const [profileData, setProfileData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    dateOfBirth: '1990-05-15',
    profileImage: '/images/person_1.jpg',
    bio: 'Professional cleaner with 5+ years of experience in residential and commercial cleaning services.',
    languages: ['English', 'Spanish'],
    skills: ['Deep Cleaning', 'Kitchen Cleaning', 'Window Cleaning', 'Carpet Cleaning'],
    certifications: [
      { name: 'Professional Cleaning Certification', issuer: 'Cleaning Institute', date: '2023-01-15', status: 'verified' },
      { name: 'Eco-Friendly Cleaning', issuer: 'Green Clean Academy', date: '2023-03-20', status: 'pending' }
    ],
    points: 1250,
    membershipTier: 'Gold',
    rating: 4.8,
    totalJobs: 156,
    successRate: 98
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: faUser },
    { id: 'addresses', label: 'Addresses', icon: faMapMarkerAlt },
    { id: 'cccd', label: 'CCCD Verification', icon: faIdCard },
    { id: 'security', label: 'Security', icon: faLock },
    { id: 'certifications', label: 'Certifications', icon: faCertificate },
    { id: 'points', label: 'Points & Rewards', icon: faStar },
    { id: 'history', label: 'History', icon: faHistory },
    { id: 'settings', label: 'Settings', icon: faCog }
  ];

  // Redirect to appropriate profile based on role
  useEffect(() => {
    if (!token) return;
    
    if (isCustomer()) {
      navigate('/user-profile', { replace: true });
    } else if (isTasker()) {
      navigate('/tasker-profile', { replace: true });
    }
  }, [token, isCustomer, isTasker, navigate]);

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
      setSuccess(response.message || 'Thêm địa chỉ thành công! Tọa độ đã được tự động lấy từ bản đồ.');
    } catch (error) {
      console.error('Lỗi khi thêm địa chỉ:', error);
      if (error.message.includes('Không tìm thấy địa chỉ trên bản đồ')) {
        setError('Không tìm thấy địa chỉ này trên bản đồ VietMap. Vui lòng kiểm tra chính tả, thêm thông tin chi tiết (phường, quận, thành phố), hoặc thử địa chỉ khác.');
      } else if (error.message.includes('Lỗi API VietMap')) {
        setError('Lỗi kết nối bản đồ VietMap. Vui lòng thử lại sau.');
      } else if (error.message.includes('Phiên đăng nhập hết hạn') || error.message.includes('không có quyền truy cập')) {
        setError(error.message);
        logout();
      } else {
        setError(error.message || 'Không thể thêm địa chỉ');
      }
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
      setSuccess(response.message || 'Cập nhật địa chỉ thành công! Tọa độ đã được tự động cập nhật.');
    } catch (error) {
      console.error('Lỗi khi cập nhật địa chỉ:', error);
      if (error.message.includes('Không tìm thấy địa chỉ trên bản đồ')) {
        setError('Không tìm thấy địa chỉ này trên bản đồ VietMap. Vui lòng kiểm tra chính tả, thêm thông tin chi tiết (phường, quận, thành phố), hoặc thử địa chỉ khác.');
      } else if (error.message.includes('Lỗi API VietMap')) {
        setError('Lỗi kết nối bản đồ VietMap. Vui lòng thử lại sau.');
      } else if (error.message.includes('Phiên đăng nhập hết hạn') || error.message.includes('không có quyền truy cập')) {
        setError(error.message);
        logout();
      } else {
        setError(error.message || 'Không thể cập nhật địa chỉ');
      }
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
      if (error.message.includes('Phiên đăng nhập hết hạn') || error.message.includes('không có quyền truy cập')) {
        setError(error.message);
        logout();
      } else {
        setError(error.message || 'Không thể xóa địa chỉ');
      }
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
  };

  const handleCccdChange = (e) => setCccdForm({ ...cccdForm, [e.target.name]: e.target.value });

  // Function để refresh trạng thái CCCD
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
    
    // Validate ngày sinh
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
      alert('Ngày sinh không hợp lệ! Vui lòng nhập đúng định dạng dd/mm/yyyy (ví dụ: 01/01/1990)');
      return;
    }
    
    try {
      setCccdLoading(true);
      console.log('🚀 Starting CCCD submission...');
      console.log('📋 Form data:', cccdForm);
      console.log('📸 Front file:', front);
      console.log('📸 Back file:', back);
      
      const payload = { 
        ...cccdForm, 
        front, 
        back 
      };
      
      console.log('📦 Payload:', payload);
      
      const res = await cccdAPI.submit(payload, token);
      console.log('✅ CCCD submission result:', res);
      
      setCccdResult(res);
      
      if (res.success) {
        alert(res.message || 'Xác minh CCCD thành công!');
        // Refresh trạng thái CCCD thay vì reload toàn trang
        await refreshCCCDStatus();
      }
      
    } catch (err) {
      console.error('❌ CCCD submission error:', err);
      console.error('❌ Error type:', typeof err);
      console.error('❌ Error message:', err.message);
      console.error('❌ Error stack:', err.stack);
      console.error('❌ Full error object:', err);
      
      let errorMessage = 'Có lỗi xảy ra khi xử lý CCCD';
      
      if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && err.message) {
        errorMessage = err.message;
      } else if (err && typeof err === 'object') {
        try {
          errorMessage = JSON.stringify(err);
        } catch (e) {
          errorMessage = 'Lỗi không xác định';
        }
      }
      
      alert(errorMessage);
    } finally {
      setCccdLoading(false);
    }
  };

  const formatCoordinates = (lat, lng) => {
    if (lat === 0 || lng === 0) {
      return 'Chưa có tọa độ';
    }
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  if (!token) {
    return (
      <div className="container py-5 text-center">
        <p>Vui lòng đăng nhập để quản lý tài khoản</p>
      </div>
    );
  }

  return (
    <div className="account-management-container">
      {/* Header */}
      <div className="page-header bg-white shadow-sm">
        <div className="container">
          <div className="row align-items-center py-4">
            <div className="col-md-6">
              <h1 className="mb-0">Account Management</h1>
              <p className="text-muted mb-0">Manage your profile and account settings</p>
            </div>
            <div className="col-md-6 text-right">
              <div className="user-type-selector">
                <div className="btn-group" role="group">
                  <button
                    type="button"
                    className={`btn ${userType === 'customer' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setUserType('customer')}
                  >
                    Customer
                  </button>
                  <button
                    type="button"
                    className={`btn ${userType === 'tasker' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setUserType('tasker')}
                  >
                    Tasker
                  </button>
                </div>
              </div>
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
                  <h5 className="mb-1">{profileData.firstName} {profileData.lastName}</h5>
                  <p className="text-muted mb-2">{userType === 'tasker' ? 'Professional Cleaner' : 'Customer'}</p>
                  {userType === 'tasker' && (
                    <div className="rating-badge">
                      <FontAwesomeIcon icon={faStar} className="text-warning mr-1" />
                      {profileData.rating}
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
                  <h4>Profile Information</h4>
                  <button
                    className={`btn ${isEditing ? 'btn-success' : 'btn-primary'}`}
                    onClick={isEditing ? handleSave : () => setIsEditing(true)}
                  >
                    <FontAwesomeIcon icon={isEditing ? faSave : faEdit} className="mr-2" />
                    {isEditing ? 'Save Changes' : 'Edit Profile'}
                  </button>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label>First Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={profileData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label>Last Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={profileData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
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
                      <label>Phone</label>
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
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    className="form-control"
                    value={profileData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="form-group mb-3">
                  <label>Bio</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={profileData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                {userType === 'tasker' && (
                  <>
                    <div className="form-group mb-3">
                      <label>Languages</label>
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
                            Add Language
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="form-group mb-3">
                      <label>Skills & Specializations</label>
                      <div className="skills-tags">
                        {profileData.skills.map((skill, index) => (
                          <span key={index} className="badge badge-info mr-2 mb-2">
                            {skill}
                          </span>
                        ))}
                        {isEditing && (
                          <button className="btn btn-sm btn-outline-info">
                            <FontAwesomeIcon icon={faEdit} className="mr-1" />
                            Add Skill
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {isEditing && (
                  <div className="text-right">
                    <button className="btn btn-secondary mr-2" onClick={() => setIsEditing(false)}>
                      <FontAwesomeIcon icon={faTimes} className="mr-1" />
                      Cancel
                    </button>
                    <button className="btn btn-primary" onClick={handleSave}>
                      <FontAwesomeIcon icon={faSave} className="mr-1" />
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="content-card bg-white rounded shadow-sm p-4">
                <h4 className="mb-4">Manage Addresses</h4>

                {error && (
                  <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {error}
                    <button type="button" className="close" onClick={() => setError(null)}>
                      <span aria-hidden="true">&times;</span>
                    </button>
                  </div>
                )}
                {success && (
                  <div className="alert alert-success alert-dismissible fade show" role="alert">
                    {success}
                    <button type="button" className="close" onClick={() => setSuccess(null)}>
                      <span aria-hidden="true">&times;</span>
                    </button>
                  </div>
                )}
                {isLoading && (
                  <div className="alert alert-info d-flex align-items-center">
                    <div className="spinner-border spinner-border-sm mr-2" role="status">
                      <span className="sr-only">Đang tải...</span>
                    </div>
                    Đang xử lý... (Đang lấy tọa độ từ bản đồ)
                  </div>
                )}

                <div className="form-group mb-3">
                  <label><FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1" /> Địa chỉ</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="Nhập địa chỉ đầy đủ (ví dụ: 23 Nguyễn Văn Thoại, Phường An Hải, Thành Phố Đà Nẵng)"
                    disabled={isLoading}
                  />
                  <small className="form-text text-muted">
                    Tọa độ sẽ được tự động lấy từ bản đồ VietMap khi bạn lưu.
                  </small>
                  <div className="text-right mt-2">
                    {editingAddress && (
                      <button 
                        className="btn btn-secondary mr-2" 
                        onClick={handleCancelEdit}
                        disabled={isLoading}
                      >
                        <FontAwesomeIcon icon={faTimes} className="mr-1" />
                        Hủy
                      </button>
                    )}
                    <button
                      className="btn btn-primary"
                      onClick={editingAddress ? handleUpdateAddress : handleAddAddress}
                      disabled={isLoading || !newAddress.trim()}
                    >
                      <FontAwesomeIcon icon={faEdit} className="mr-1" />
                      {editingAddress ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ'}
                    </button>
                  </div>
                </div>

                <div className="form-group mb-3">
                  <h6>Danh sách địa chỉ</h6>
                  {addresses.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="thead-light">
                          <tr>
                            <th><FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1" /> Địa chỉ</th>
                            <th><FontAwesomeIcon icon={faMapPin} className="mr-1" /> Tọa độ</th>
                            <th>Ngày tạo</th>
                            <th>Hành động</th>
                          </tr>
                        </thead>
                        <tbody>
                          {addresses.map((address) => (
                            <tr key={address.address_id}>
                              <td>
                                <strong>{address.address}</strong>
                                {address.lat && address.lng && (
                                  <small className="text-muted d-block">
                                    <FontAwesomeIcon icon={faMapPin} className="mr-1 text-success" />
                                    Đã có tọa độ
                                  </small>
                                )}
                              </td>
                              <td>
                                {address.lat && address.lng ? (
                                  <span className="badge badge-info">
                                    {formatCoordinates(address.lat, address.lng)}
                                  </span>
                                ) : (
                                  <span className="badge badge-secondary">Chưa có tọa độ</span>
                                )}
                              </td>
                              <td>{new Date(address.created_at).toLocaleDateString('vi-VN')}</td>
                              <td>
                                <button
                                  className="btn btn-sm btn-outline-warning mr-2"
                                  onClick={() => handleEditAddress(address)}
                                  disabled={isLoading}
                                  title="Chỉnh sửa địa chỉ"
                                >
                                  <FontAwesomeIcon icon={faEdit} />
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDeleteAddress(address.address_id)}
                                  disabled={isLoading}
                                  title="Xóa địa chỉ"
                                >
                                  <FontAwesomeIcon icon={faTimes} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <FontAwesomeIcon icon={faMapMarkerAlt} size="3x" className="text-muted mb-3" />
                      <p className="text-muted">Không tìm thấy địa chỉ. Vui lòng thêm địa chỉ đầu tiên.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CCCD Verification Tab */}
            {activeTab === 'cccd' && (
              <div className="content-card bg-white rounded shadow-sm p-4 position-relative">
                {cccdStatusLoading && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(255,255,255,0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 5,
                      borderRadius: '0.25rem'
                    }}
                  >
                    <div className="text-muted">
                      <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                      Đang tải trạng thái CCCD...
                    </div>
                  </div>
                )}
                <h4 className="mb-3">
                  <FontAwesomeIcon icon={faIdCard} className="me-2" />
                  Xác minh CCCD
                </h4>
                
                {/* Hiển thị trạng thái CCCD */}
                {cccdStatus && (
                  <div className={`alert ${cccdStatus.status === 'Verified' ? 'alert-success' : 
                    cccdStatus.status === 'Pending' ? 'alert-warning' : 
                    cccdStatus.status === 'Rejected' ? 'alert-danger' : 'alert-info'} mb-4`}>
                    <div className="d-flex align-items-center">
                      <FontAwesomeIcon 
                        icon={cccdStatus.status === 'Verified' ? faCheckCircle : 
                              cccdStatus.status === 'Pending' ? faClock : 
                              cccdStatus.status === 'Rejected' ? faTimes : faIdCard} 
                        className="me-2" 
                      />
                      <div>
                        <strong>{cccdStatus.message}</strong>
                        {cccdStatus.verified_at && (
                          <div className="small text-muted">
                            Duyệt lúc: {new Date(cccdStatus.verified_at).toLocaleString('vi-VN')}
                          </div>
                        )}
                        {cccdStatus.created_at && cccdStatus.status !== 'Verified' && (
                          <div className="small text-muted">
                            Gửi lúc: {new Date(cccdStatus.created_at).toLocaleString('vi-VN')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Nếu đã duyệt, hiển thị thông tin đã duyệt */}
                {hasVerifiedCCCD ? (
                  <div className="text-center py-5">
                    <FontAwesomeIcon icon={faCheckCircle} size="4x" className="text-success mb-3" />
                    <h5 className="text-success mb-3">CCCD đã được xác minh thành công!</h5>
                    <p className="text-muted">Tài khoản của bạn đã được xác minh danh tính. Bạn có thể sử dụng đầy đủ các tính năng của hệ thống.</p>
                    <div className="mt-3">
                      {cccdImageLoading ? (
                        <div className="py-4">
                          <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                          Đang tải ảnh CCCD an toàn...
                        </div>
                      ) : cccdImageUrl ? (
                        <img
                          src={cccdImageUrl}
                          alt="CCCD đã duyệt"
                          style={{ maxWidth: '100%', maxHeight: 320, borderRadius: 12, boxShadow: '0 6px 16px rgba(0,0,0,0.15)' }}
                        />
                      ) : (
                        <div className="text-muted">Không có ảnh CCCD khả dụng</div>
                      )}
                    </div>
                    <div className="mt-3">
                      <button 
                        className="btn btn-outline-primary"
                        onClick={refreshCCCDStatus}
                      >
                        <FontAwesomeIcon icon={faCog} className="me-1" />
                        Làm mới trạng thái
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Form xác minh CCCD */
                  <form onSubmit={submitCccd}>
                  <div className="row g-3">
                    <div className="col-md-3">
                      <label className="form-label">Số CCCD</label>
                      <input className="form-control" name="number" value={cccdForm.number} onChange={handleCccdChange} required />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Họ và tên</label>
                      <input className="form-control" name="full_name" value={cccdForm.full_name} onChange={handleCccdChange} required />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Ngày sinh (dd/mm/yyyy)</label>
                      <input 
                        className="form-control" 
                        name="dob" 
                        value={cccdForm.dob} 
                        onChange={handleCccdChange} 
                        placeholder="01/01/1990"
                        pattern="\d{2}/\d{2}/\d{4}"
                        title="Nhập ngày sinh theo định dạng dd/mm/yyyy (ví dụ: 01/01/1990)"
                        required 
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label">Giới tính</label>
                      <select className="form-select" name="gender" value={cccdForm.gender} onChange={handleCccdChange}>
                        <option>Nam</option>
                        <option>Nữ</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Ảnh CCCD mặt trước</label>
                      <input className="form-control" type="file" accept="image/*" onChange={(e) => setFront(e.target.files[0])} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Ảnh CCCD mặt sau</label>
                      <input className="form-control" type="file" accept="image/*" onChange={(e) => setBack(e.target.files[0])} required />
                    </div>
                  </div>
                    <button className="btn btn-primary mt-3" disabled={cccdLoading}>
                      {cccdLoading ? 'Đang xử lý...' : 'Gửi xác minh'}
                    </button>
                  </form>
                )}

                {/* Hiển thị kết quả xử lý */}
                {cccdResult && (
                  <div className="alert alert-info mt-3">
                    <div className="d-flex justify-content-between">
                      <strong>Kết quả:</strong>
                      <span className="badge badge-secondary">Nguồn: {cccdResult.source || 'backend'}</span>
                    </div>
                    <pre className="mt-2" style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(cccdResult, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="content-card bg-white rounded shadow-sm p-4">
                <h4 className="mb-4">Security Settings</h4>
                
                <div className="security-section mb-4">
                  <h6>Change Password</h6>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group mb-3">
                        <label>Current Password</label>
                        <input type="password" className="form-control" />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group mb-3">
                        <label>New Password</label>
                        <input type="password" className="form-control" />
                      </div>
                    </div>
                  </div>
                  <button className="btn btn-primary">Update Password</button>
                </div>

                <div className="security-section mb-4">
                  <h6>Two-Factor Authentication</h6>
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="twoFactor" />
                    <label className="form-check-label" htmlFor="twoFactor">
                      Enable two-factor authentication
                    </label>
                  </div>
                </div>

                <div className="security-section">
                  <h6>Login History</h6>
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Device</th>
                          <th>Location</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>2025-01-15 10:30</td>
                          <td>Chrome - Windows</td>
                          <td>New York, NY</td>
                          <td><span className="badge badge-success">Active</span></td>
                        </tr>
                        <tr>
                          <td>2025-01-14 15:45</td>
                          <td>Safari - iPhone</td>
                          <td>New York, NY</td>
                          <td><span className="badge badge-secondary">Previous</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Certifications Tab */}
            {activeTab === 'certifications' && (
              <div className="content-card bg-white rounded shadow-sm p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4>Certifications</h4>
                  <button className="btn btn-primary">
                    <FontAwesomeIcon icon={faUpload} className="mr-2" />
                    Upload New Certification
                  </button>
                </div>

                <div className="certifications-list">
                  {profileData.certifications.map((cert, index) => (
                    <div key={index} className="certification-card border rounded p-3 mb-3">
                      <div className="row align-items-center">
                        <div className="col-md-8">
                          <h6 className="mb-1">{cert.name}</h6>
                          <p className="text-muted mb-1">Issued by: {cert.issuer}</p>
                          <p className="text-muted mb-0">Date: {cert.date}</p>
                        </div>
                        <div className="col-md-4 text-right">
                          <span className={`badge badge-${cert.status === 'verified' ? 'success' : 'warning'}`}>
                            <FontAwesomeIcon icon={cert.status === 'verified' ? faCheckCircle : faClock} className="mr-1" />
                            {cert.status === 'verified' ? 'Verified' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Points & Rewards Tab */}
            {activeTab === 'points' && (
              <div className="content-card bg-white rounded shadow-sm p-4">
                <h4 className="mb-4">Points & Rewards</h4>
                
                <div className="row mb-4">
                  <div className="col-md-4">
                    <div className="points-card bg-primary text-white rounded p-3 text-center">
                      <h3 className="mb-1">{profileData.points}</h3>
                      <p className="mb-0">Total Points</p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="points-card bg-warning text-white rounded p-3 text-center">
                      <h3 className="mb-1">{profileData.membershipTier}</h3>
                      <p className="mb-0">Membership Tier</p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="points-card bg-success text-white rounded p-3 text-center">
                      <h3 className="mb-1">{userType === 'tasker' ? profileData.totalJobs : '24'}</h3>
                      <p className="mb-0">{userType === 'tasker' ? 'Jobs Completed' : 'Services Used'}</p>
                    </div>
                  </div>
                </div>

                <div className="rewards-section">
                  <h6>Available Rewards</h6>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <div className="reward-card border rounded p-3">
                        <h6>Free Deep Cleaning</h6>
                        <p className="text-muted">Get a free deep cleaning service</p>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-primary">500 points</span>
                          <button className="btn btn-sm btn-outline-primary">Redeem</button>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <div className="reward-card border rounded p-3">
                        <h6>20% Discount</h6>
                        <p className="text-muted">20% off your next booking</p>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-primary">300 points</span>
                          <button className="btn btn-sm btn-outline-primary">Redeem</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="content-card bg-white rounded shadow-sm p-4">
                <h4 className="mb-4">Service History</h4>
                
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Service</th>
                        <th>{userType === 'tasker' ? 'Customer' : 'Tasker'}</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>2025-01-15</td>
                        <td>House Cleaning</td>
                        <td>{userType === 'tasker' ? 'John Smith' : 'Sarah Johnson'}</td>
                        <td>$75</td>
                        <td><span className="badge badge-success">Completed</span></td>
                        <td>
                          <FontAwesomeIcon icon={faStar} className="text-warning" />
                          4.9
                        </td>
                      </tr>
                      <tr>
                        <td>2025-01-10</td>
                        <td>Kitchen Cleaning</td>
                        <td>{userType === 'tasker' ? 'Mary Johnson' : 'Mike Wilson'}</td>
                        <td>$60</td>
                        <td><span className="badge badge-success">Completed</span></td>
                        <td>
                          <FontAwesomeIcon icon={faStar} className="text-warning" />
                          5.0
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="content-card bg-white rounded shadow-sm p-4">
                <h4 className="mb-4">Account Settings</h4>
                
                <div className="settings-section mb-4">
                  <h6>Notifications</h6>
                  <div className="form-check mb-2">
                    <input className="form-check-input" type="checkbox" id="emailNotif" defaultChecked />
                    <label className="form-check-label" htmlFor="emailNotif">
                      Email notifications
                    </label>
                  </div>
                  <div className="form-check mb-2">
                    <input className="form-check-input" type="checkbox" id="smsNotif" />
                    <label className="form-check-label" htmlFor="smsNotif">
                      SMS notifications
                    </label>
                  </div>
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="pushNotif" defaultChecked />
                    <label className="form-check-label" htmlFor="pushNotif">
                      Push notifications
                    </label>
                  </div>
                </div>

                <div className="settings-section mb-4">
                  <h6>Privacy</h6>
                  <div className="form-check mb-2">
                    <input className="form-check-input" type="checkbox" id="profilePublic" defaultChecked />
                    <label className="form-check-label" htmlFor="profilePublic">
                      Make profile public
                    </label>
                  </div>
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="showContact" />
                    <label className="form-check-label" htmlFor="showContact">
                      Show contact information
                    </label>
                  </div>
                </div>

                <div className="settings-section">
                  <h6>Account Actions</h6>
                  <button className="btn btn-outline-warning mr-2">Deactivate Account</button>
                  <button className="btn btn-outline-danger">Delete Account</button>
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
        
        .points-card {
          transition: transform 0.2s;
        }
        
        .points-card:hover {
          transform: translateY(-2px);
        }
        
        .certification-card {
          transition: transform 0.2s;
        }
        
        .certification-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .reward-card {
          transition: transform 0.2s;
        }
        
        .reward-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .language-tags .badge,
        .skills-tags .badge {
          font-size: 0.8rem;
          padding: 6px 12px;
        }

        .btn-outline-warning, .btn-outline-danger {
          padding: 5px 10px;
        }

        .badge {
          font-size: 0.8rem;
        }

        .text-muted {
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
};

export default AccountManagement;