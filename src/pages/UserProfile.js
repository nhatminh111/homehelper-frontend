import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faEnvelope, 
  faPhone, 
  faMapMarkerAlt, 
  faCalendar,
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
  faCreditCard,
  faShoppingBag,
  faHeart,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import { addressAPI, cccdAPI, authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const UserProfile = () => {
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
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    bio: '',
    avatar_url: null,
  });

  // Filter tabs based on CCCD verification status
  const allTabs = [
    { id: 'profile', label: 'Thông tin cá nhân', icon: faUser },
    { id: 'addresses', label: 'Địa chỉ', icon: faMapMarkerAlt },
    { id: 'cccd', label: 'Xác minh CCCD', icon: faIdCard },
    { id: 'bookings', label: 'Lịch đặt', icon: faShoppingBag },
    { id: 'wishlist', label: 'Yêu thích', icon: faHeart },
    { id: 'security', label: 'Bảo mật', icon: faLock },
    { id: 'history', label: 'Lịch sử', icon: faHistory },
    { id: 'settings', label: 'Cài đặt', icon: faCog }
  ];
  
  // Normalize CCCD status string to handle encoding issues
  const normalizeCCCDStatus = (status) => {
    if (!status) return null;
    // Handle encoding issues: "Ðã xác minh" -> "Đã xác minh"
    const normalized = status.toString().replace(/Ð/g, 'Đ').trim();
    return normalized.toLowerCase();
  };

  // Check if CCCD is verified from multiple sources
  const isCCCDVerified = () => {
    // Check from API response
    if (hasVerifiedCCCD) return true;
    
    // Check from cccdStatus (normalize to handle encoding)
    const cccdStatusNormalized = normalizeCCCDStatus(cccdStatus?.status);
    if (cccdStatusNormalized === 'verified' || cccdStatusNormalized === 'đã xác minh') return true;
    
    // Check from user context (normalize to handle encoding)
    const userStatusNormalized = normalizeCCCDStatus(user?.cccd_status);
    if (userStatusNormalized === 'verified' || userStatusNormalized === 'đã xác minh') return true;
    
    return false;
  };
  
  // Hide CCCD tab if already verified
  const isVerified = isCCCDVerified();
  const tabs = allTabs.filter(tab => {
    if (tab.id === 'cccd') {
      // Hide if verified
      return !isVerified;
    }
    return true;
  });
  
  // Auto-switch away from CCCD tab if verified
  useEffect(() => {
    if (isVerified && activeTab === 'cccd') {
      console.log('🔄 CCCD đã verified, chuyển sang tab profile');
      setActiveTab('profile');
    }
  }, [isVerified, activeTab]);

  // Helper function to format date for input type="date" (YYYY-MM-DD)
  const formatDateForInput = (dateValue) => {
    if (!dateValue) return '';
    
    try {
      // If it's already in YYYY-MM-DD format
      if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
        return dateValue.split('T')[0]; // Remove time part if exists
      }
      
      // If it's a Date object or ISO string
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '';
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // Load user data
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!token) return;
      try {
        const response = await authAPI.getCurrentUser(token);
        const userData = response.user || user || {};
        console.log('📋 User data from API:', userData);
        console.log('📅 date_of_birth raw:', userData.date_of_birth);
        console.log('🆔 cccd_status:', userData.cccd_status);
        
        // Check CCCD status from user data (normalize to handle encoding)
        const statusNormalized = normalizeCCCDStatus(userData.cccd_status);
        if (statusNormalized === 'verified' || statusNormalized === 'đã xác minh') {
          console.log('✅ CCCD đã được xác minh, ẩn tab CCCD');
          setHasVerifiedCCCD(true);
        }
        
        setProfileData({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          dateOfBirth: formatDateForInput(userData.date_of_birth || userData.dateOfBirth),
          bio: userData.bio || userData.biography || '',
          avatar_url: userData.avatar_url || null,
        });
      } catch (error) {
        console.error('Error loading user profile:', error);
        // Fallback to user from context
        if (user) {
          // Check CCCD status from context user (normalize to handle encoding)
          const userStatusNormalized = normalizeCCCDStatus(user.cccd_status);
          if (userStatusNormalized === 'verified' || userStatusNormalized === 'đã xác minh') {
            console.log('✅ CCCD đã được xác minh từ context, ẩn tab CCCD');
            setHasVerifiedCCCD(true);
          }
          
          setProfileData({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            dateOfBirth: '',
            bio: '',
            avatar_url: null,
          });
        }
      }
    };
    loadUserProfile();
  }, [user, token]);

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
          // Also check status from API response (normalize to handle encoding)
          const statusNormalized = normalizeCCCDStatus(statusRes.data?.status);
          if (statusNormalized === 'verified' || statusNormalized === 'đã xác minh') {
            console.log('✅ CCCD đã được xác minh từ status API, ẩn tab CCCD');
            setHasVerifiedCCCD(true);
          }
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

  const handleAvatarUpload = async (file) => {
    if (!token || !file) return;
    
    try {
      setAvatarUploading(true);
      setError(null);
      setSuccess(null);
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Vui lòng chọn file ảnh');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Kích thước file không được vượt quá 5MB');
        return;
      }
      
      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Upload to Cloudinary
      const response = await authAPI.uploadAvatar(file, token);
      
      if (response.success && response.data) {
        // Update profile với encrypted URL
        await authAPI.updateProfile({
          avatar_url: response.data.encrypted_url || response.data.url
        }, token);
        
        setSuccess('Upload ảnh đại diện thành công!');
        
        // Reload user data để lấy decrypted URL từ backend
        const userResponse = await authAPI.getCurrentUser(token);
        if (userResponse.user) {
          // Update profileData với decrypted URL từ backend
          setProfileData(prev => ({
            ...prev,
            avatar_url: userResponse.user.avatar_url || null
          }));
          
          // Clear preview để dùng URL từ backend (đã được decrypt)
          setAvatarPreview(null);
        } else {
          // Fallback: dùng URL gốc từ upload response
          setProfileData(prev => ({
            ...prev,
            avatar_url: response.data.url
          }));
        }
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setError(error.message || 'Không thể upload ảnh đại diện');
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSave = async () => {
    if (!token) {
      setError('Vui lòng đăng nhập');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      const updateData = {
        name: profileData.name,
        phone: profileData.phone,
        date_of_birth: profileData.dateOfBirth || null,
        bio: profileData.bio || null,
        avatar_url: profileData.avatar_url || null,
      };
      
      await authAPI.updateProfile(updateData, token);
      setSuccess('Cập nhật thông tin thành công!');
      setIsEditing(false);
      setAvatarPreview(null);
      
      // Reload user data
      const response = await authAPI.getCurrentUser(token);
      if (response.user) {
        setProfileData({
          name: response.user.name || '',
          email: response.user.email || '',
          phone: response.user.phone || '',
          dateOfBirth: formatDateForInput(response.user.date_of_birth || response.user.dateOfBirth),
          bio: response.user.bio || response.user.biography || '',
          avatar_url: response.user.avatar_url || null,
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Không thể cập nhật thông tin');
    } finally {
      setIsLoading(false);
    }
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
        // If verified, switch to profile tab
        if (verified && activeTab === 'cccd') {
          setActiveTab('profile');
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
      alert('Ngày sinh không hợp lệ! Vui lòng nhập đúng định dạng dd/mm/yyyy (ví dụ: 01/01/1990)');
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
        alert(res.message || 'Xác minh CCCD thành công!');
        await refreshCCCDStatus();
      }
      
    } catch (err) {
      console.error('❌ CCCD submission error:', err);
      let errorMessage = 'Có lỗi xảy ra khi xử lý CCCD';
      
      if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && err.message) {
        errorMessage = err.message;
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
        <p>Vui lòng đăng nhập để xem profile</p>
      </div>
    );
  }

  return (
    <div className="account-management-container">
      {/* Header */}
      <div className="page-header-modern">
        <div className="container">
          <div className="row align-items-center py-4 py-md-5">
            <div className="col-12">
              <h1 className="mb-2 fw-bold text-white header-title-responsive">Hồ sơ của tôi</h1>
              <p className="text-white-50 mb-0 header-subtitle-responsive">Quản lý thông tin cá nhân và tài khoản</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-3 py-md-5">
        <div className="row g-3 g-md-4">
          {/* Left Sidebar - Navigation */}
          <div className="col-12 col-lg-3 order-2 order-lg-1">
            <div className="sidebar-modern">
              <div className="user-summary-modern">
                <div className="text-center">
                  <div className="profile-image-container-modern mb-3 mb-md-4 position-relative d-flex flex-column align-items-center">
                    <div className="position-relative">
                      {(avatarPreview || profileData.avatar_url) ? (
                        <img 
                          src={avatarPreview || profileData.avatar_url} 
                          alt="Profile" 
                          className="profile-avatar-img"
                          onError={(e) => {
                            console.error('Error loading avatar image:', e.target.src);
                            e.target.style.display = 'none';
                            const placeholder = e.target.nextElementSibling;
                            if (placeholder) {
                              placeholder.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div 
                        className="profile-avatar-placeholder"
                        style={{ 
                          display: (avatarPreview || profileData.avatar_url) ? 'none' : 'flex' 
                        }}
                      >
                        {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      {isEditing && (
                        <label 
                          className="edit-photo-btn-modern"
                          title="Thay đổi ảnh đại diện"
                        >
                          {avatarUploading ? (
                            <FontAwesomeIcon icon={faSpinner} spin />
                          ) : (
                            <FontAwesomeIcon icon={faCamera} />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                handleAvatarUpload(file);
                              }
                            }}
                            disabled={avatarUploading}
                          />
                        </label>
                      )}
                    </div>
                    {isEditing && (
                      <small className="text-muted mt-2 mt-md-3 text-center d-block small-text-responsive">
                        Chọn ảnh từ máy tính (JPG, PNG, tối đa 5MB)
                      </small>
                    )}
                  </div>
                  <h5 className="mb-2 fw-bold user-name-responsive">{profileData.name || user?.name || 'User'}</h5>
                  <span className="badge-modern">Khách hàng</span>
                </div>
              </div>

              <nav className="nav-modern">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={`nav-link-modern ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <FontAwesomeIcon icon={tab.icon} className="nav-icon" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Right Content */}
          <div className="col-12 col-lg-9 order-1 order-lg-2">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="content-card-modern">
                <div className="content-header-modern">
                  <div>
                    <h4 className="content-title">Thông tin cá nhân</h4>
                    <p className="content-subtitle d-none d-md-block">Quản lý thông tin tài khoản của bạn</p>
                  </div>
                  <button
                    className={`btn-modern btn-responsive ${isEditing ? 'btn-success-modern' : 'btn-primary-modern'}`}
                    onClick={isEditing ? handleSave : () => setIsEditing(true)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                        <span className="d-none d-sm-inline">Đang lưu...</span>
                        <span className="d-sm-none">Lưu...</span>
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={isEditing ? faSave : faEdit} className="me-2" />
                        <span className="d-none d-sm-inline">{isEditing ? 'Lưu thay đổi' : 'Chỉnh sửa'}</span>
                        <span className="d-sm-none">{isEditing ? 'Lưu' : 'Sửa'}</span>
                      </>
                    )}
                  </button>
                </div>

                {error && (
                  <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert" style={{ borderRadius: '8px' }}>
                    <strong>Lỗi!</strong> {error}
                    <button type="button" className="close" onClick={() => setError(null)}>
                      <span aria-hidden="true">&times;</span>
                    </button>
                  </div>
                )}
                {success && (
                  <div className="alert alert-success alert-dismissible fade show mb-4" role="alert" style={{ borderRadius: '8px' }}>
                    <strong>Thành công!</strong> {success}
                    <button type="button" className="close" onClick={() => setSuccess(null)}>
                      <span aria-hidden="true">&times;</span>
                    </button>
                  </div>
                )}

                <div className="row g-3 g-md-4">
                  <div className="col-12">
                    <div className="form-group mb-3 mb-md-4">
                      <label className="fw-semibold form-label-responsive">
                        <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                        Họ và tên
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-responsive"
                        value={profileData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        disabled={!isEditing}
                        style={{ 
                          borderRadius: '8px',
                          border: isEditing ? '2px solid #007bff' : '1px solid #dee2e6',
                          transition: 'all 0.3s ease'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="row g-3 g-md-4">
                  <div className="col-12 col-md-6">
                    <div className="form-group mb-3 mb-md-4">
                      <label className="fw-semibold form-label-responsive">
                        <FontAwesomeIcon icon={faEnvelope} className="me-2 text-primary" />
                        Email
                      </label>
                      <input
                        type="email"
                        className="form-control form-control-responsive"
                        value={profileData.email}
                        disabled={true}
                        style={{ 
                          borderRadius: '8px',
                          backgroundColor: '#f8f9fa',
                          cursor: 'not-allowed'
                        }}
                        title="Email không thể thay đổi"
                      />
                    </div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="form-group mb-3 mb-md-4">
                      <label className="fw-semibold form-label-responsive">
                        <FontAwesomeIcon icon={faPhone} className="me-2 text-primary" />
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        className="form-control form-control-responsive"
                        value={profileData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={!isEditing}
                        placeholder="Nhập số điện thoại"
                        style={{ 
                          borderRadius: '8px',
                          border: isEditing ? '2px solid #007bff' : '1px solid #dee2e6',
                          transition: 'all 0.3s ease'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="row g-3 g-md-4">
                  <div className="col-12 col-md-6">
                    <div className="form-group mb-3">
                      <label className="fw-semibold form-label-responsive">
                        <FontAwesomeIcon icon={faCalendar} className="me-2 text-primary" />
                        Ngày sinh
                      </label>
                      <input
                        type="date"
                        className="form-control form-control-responsive"
                        value={profileData.dateOfBirth}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                        disabled={!isEditing}
                        style={{ 
                          borderRadius: '8px',
                          border: isEditing ? '2px solid #007bff' : '1px solid #dee2e6'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label className="fw-semibold form-label-responsive">
                    <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                    Giới thiệu về bản thân
                  </label>
                  <textarea
                    className="form-control form-control-responsive"
                    rows="4"
                    value={profileData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Hãy chia sẻ một chút về bản thân bạn..."
                    style={{ 
                      borderRadius: '8px',
                      border: isEditing ? '2px solid #007bff' : '1px solid #dee2e6',
                      resize: 'vertical'
                    }}
                  />
                  <small className="form-text text-muted small-text-responsive">
                    {profileData.bio.length}/500 ký tự
                  </small>
                </div>

                {isEditing && (
                  <div className="d-flex flex-column flex-sm-row justify-content-end gap-2 gap-md-3 mt-4 pt-3 border-top">
                    <button 
                      className="btn btn-outline-secondary px-3 px-md-4 btn-responsive" 
                      onClick={() => {
                        setIsEditing(false);
                        setError(null);
                        setSuccess(null);
                        setAvatarPreview(null);
                        // Reload original data
                        if (user) {
                          setProfileData({
                            name: user.name || '',
                            email: user.email || '',
                            phone: user.phone || '',
                            dateOfBirth: '',
                            bio: '',
                            avatar_url: null,
                          });
                        }
                      }}
                      disabled={isLoading}
                      style={{ borderRadius: '8px', fontWeight: '500' }}
                    >
                      <FontAwesomeIcon icon={faTimes} className="me-1" />
                      Hủy
                    </button>
                    <button 
                      className="btn btn-primary px-3 px-md-4 btn-responsive" 
                      onClick={handleSave}
                      disabled={isLoading}
                      style={{ borderRadius: '8px', fontWeight: '500' }}
                    >
                      {isLoading ? (
                        <>
                          <FontAwesomeIcon icon={faSpinner} spin className="me-1" />
                          <span className="d-none d-sm-inline">Đang lưu...</span>
                          <span className="d-sm-none">Lưu...</span>
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faSave} className="me-1" />
                          <span className="d-none d-sm-inline">Lưu thay đổi</span>
                          <span className="d-sm-none">Lưu</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="content-card-modern">
                <div className="content-header-modern">
                  <div>
                    <h4 className="content-title">Quản lý địa chỉ</h4>
                    <p className="content-subtitle">Thêm và quản lý các địa chỉ giao hàng của bạn</p>
                  </div>
                </div>

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

                <div className="form-group-modern mb-4">
                  <label className="fw-semibold mb-2 form-label-responsive">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2 text-primary" />
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-responsive"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="Nhập địa chỉ đầy đủ (ví dụ: 23 Nguyễn Văn Thoại, Phường An Hải, Thành Phố Đà Nẵng)"
                    disabled={isLoading}
                  />
                  <small className="form-text text-muted mt-2 d-block small-text-responsive">
                    Tọa độ sẽ được tự động lấy từ bản đồ VietMap khi bạn lưu.
                  </small>
                  <div className="d-flex flex-column flex-sm-row justify-content-end gap-2 mt-3">
                    {editingAddress && (
                      <button 
                        className="btn-modern btn-outline-modern btn-responsive w-100 w-sm-auto" 
                        onClick={handleCancelEdit}
                        disabled={isLoading}
                      >
                        <FontAwesomeIcon icon={faTimes} className="me-2" />
                        Hủy
                      </button>
                    )}
                    <button
                      className="btn-modern btn-primary-modern btn-responsive w-100 w-sm-auto"
                      onClick={editingAddress ? handleUpdateAddress : handleAddAddress}
                      disabled={isLoading || !newAddress.trim()}
                    >
                      <FontAwesomeIcon icon={faEdit} className="me-2" />
                      <span className="d-none d-sm-inline">{editingAddress ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ'}</span>
                      <span className="d-sm-none">{editingAddress ? 'Cập nhật' : 'Thêm'}</span>
                    </button>
                  </div>
                </div>

                <div className="addresses-list-modern">
                  <h5 className="mb-4 fw-semibold">Danh sách địa chỉ</h5>
                  {addresses.length > 0 ? (
                    <div className="address-cards-modern">
                      {addresses.map((address) => (
                        <div key={address.address_id} className="address-card-modern">
                          <div className="address-card-header">
                            <div className="address-icon-modern">
                              <FontAwesomeIcon icon={faMapMarkerAlt} />
                            </div>
                            <div className="address-info-modern">
                              <h6 className="mb-1 fw-bold">{address.address}</h6>
                              <div className="address-meta-modern">
                                {address.lat && address.lng ? (
                                  <span className="badge-modern-small badge-info-modern">
                                    {formatCoordinates(address.lat, address.lng)}
                                  </span>
                                ) : (
                                  <span className="badge-modern-small badge-secondary-modern">Chưa có tọa độ</span>
                                )}
                                <span className="text-muted small ms-2">
                                  {new Date(address.created_at).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="address-card-actions">
                            <button
                              className="btn-action-modern btn-edit-modern"
                              onClick={() => handleEditAddress(address)}
                              disabled={isLoading}
                              title="Chỉnh sửa địa chỉ"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button
                              className="btn-action-modern btn-delete-modern"
                              onClick={() => handleDeleteAddress(address.address_id)}
                              disabled={isLoading}
                              title="Xóa địa chỉ"
                            >
                              <FontAwesomeIcon icon={faTimes} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state-modern">
                      <FontAwesomeIcon icon={faMapMarkerAlt} size="4x" className="text-muted mb-3" />
                      <p className="text-muted">Không tìm thấy địa chỉ. Vui lòng thêm địa chỉ đầu tiên.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CCCD Verification Tab */}
            {activeTab === 'cccd' && (
              <div className="content-card-modern position-relative">
                {cccdStatusLoading && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(255,255,255,0.9)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 5,
                      borderRadius: '0.5rem'
                    }}
                  >
                    <div className="text-center">
                      <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-primary mb-3" />
                      <div className="text-muted fw-semibold">Đang tải trạng thái CCCD...</div>
                    </div>
                  </div>
                )}
                
                <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                  <div>
                    <h4 className="mb-1 fw-bold">
                      <FontAwesomeIcon icon={faIdCard} className="me-2 text-primary" />
                      Xác minh CCCD
                    </h4>
                    <p className="text-muted mb-0 small">Xác minh danh tính của bạn để tăng độ tin cậy</p>
                  </div>
                </div>
                
                {cccdStatus && (
                  <div className={`alert alert-dismissible fade show mb-4 ${cccdStatus.status === 'Verified' ? 'alert-success' : 
                    cccdStatus.status === 'Pending' ? 'alert-warning' : 
                    cccdStatus.status === 'Rejected' ? 'alert-danger' : 'alert-info'}`}
                    style={{ borderRadius: '8px', border: 'none' }}>
                    <div className="d-flex align-items-start">
                      <FontAwesomeIcon 
                        icon={cccdStatus.status === 'Verified' ? faCheckCircle : 
                              cccdStatus.status === 'Pending' ? faSpinner : 
                              cccdStatus.status === 'Rejected' ? faTimes : faIdCard} 
                        className="me-3 mt-1"
                        size="lg"
                        spin={cccdStatus.status === 'Pending'}
                      />
                      <div className="flex-grow-1">
                        <h5 className="alert-heading mb-2">{cccdStatus.message}</h5>
                        {cccdStatus.verified_at && (
                          <div className="small">
                            <strong>Duyệt lúc:</strong> {new Date(cccdStatus.verified_at).toLocaleString('vi-VN')}
                          </div>
                        )}
                        {cccdStatus.status === 'Pending' && (
                          <div className="small mt-2">
                            Vui lòng chờ hệ thống xử lý. Thời gian xử lý thường từ 1-3 ngày làm việc.
                          </div>
                        )}
                        {cccdStatus.status === 'Rejected' && (
                          <div className="small mt-2">
                            Nếu bạn cho rằng đây là lỗi, vui lòng liên hệ hỗ trợ để được giải quyết.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {hasVerifiedCCCD ? (
                  <div className="text-center py-5">
                    <div className="mb-4">
                      <div 
                        className="rounded-circle mx-auto d-flex align-items-center justify-content-center"
                        style={{
                          width: '120px',
                          height: '120px',
                          background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                          boxShadow: '0 8px 25px rgba(40,167,69,0.3)'
                        }}
                      >
                        <FontAwesomeIcon icon={faCheckCircle} size="4x" className="text-white" />
                      </div>
                    </div>
                    <h4 className="text-success mb-3 fw-bold">CCCD đã được xác minh thành công!</h4>
                    <p className="text-muted mb-4">Tài khoản của bạn đã được xác minh danh tính và có thể sử dụng đầy đủ các tính năng.</p>
                    {cccdImageUrl && (
                      <div className="mt-4">
                        <h6 className="mb-3 text-muted">Ảnh CCCD đã duyệt</h6>
                        <img
                          src={cccdImageUrl}
                          alt="CCCD đã duyệt"
                          className="img-fluid rounded shadow-sm"
                          style={{ maxWidth: '100%', maxHeight: 400, border: '2px solid #dee2e6' }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="alert alert-info mb-4" style={{ borderRadius: '8px', border: 'none' }}>
                      <div className="d-flex align-items-start">
                        <FontAwesomeIcon icon={faIdCard} className="me-3 mt-1" />
                        <div>
                          <strong>Hướng dẫn xác minh:</strong>
                          <ul className="mb-0 mt-2 small">
                            <li>Chuẩn bị ảnh chụp rõ ràng mặt trước và mặt sau của CCCD</li>
                            <li>Đảm bảo thông tin nhập vào khớp với thông tin trên CCCD</li>
                            <li>Ảnh phải rõ nét, không bị mờ hoặc che khuất thông tin</li>
                            <li>Thời gian xử lý: 1-3 ngày làm việc</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={submitCccd}>
                      <div className="row g-3 g-md-4">
                        <div className="col-12 col-md-6">
                          <label className="form-label fw-semibold form-label-responsive">
                            <FontAwesomeIcon icon={faIdCard} className="me-2 text-primary" />
                            Số CCCD
                          </label>
                          <input 
                            className="form-control form-control-responsive" 
                            name="number" 
                            value={cccdForm.number} 
                            onChange={handleCccdChange} 
                            placeholder="Nhập số CCCD"
                            required
                            style={{ borderRadius: '8px' }}
                          />
                        </div>
                        <div className="col-12 col-md-6">
                          <label className="form-label fw-semibold form-label-responsive">
                            <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                            Họ và tên
                          </label>
                          <input 
                            className="form-control form-control-responsive" 
                            name="full_name" 
                            value={cccdForm.full_name} 
                            onChange={handleCccdChange} 
                            placeholder="Nhập họ và tên"
                            required
                            style={{ borderRadius: '8px' }}
                          />
                        </div>
                        <div className="col-12 col-md-6">
                          <label className="form-label fw-semibold form-label-responsive">
                            <FontAwesomeIcon icon={faCalendar} className="me-2 text-primary" />
                            Ngày sinh
                          </label>
                          <input 
                            className="form-control form-control-responsive" 
                            name="dob" 
                            value={cccdForm.dob} 
                            onChange={handleCccdChange} 
                            placeholder="dd/mm/yyyy (VD: 01/01/1990)"
                            required
                            style={{ borderRadius: '8px' }}
                          />
                          <small className="form-text text-muted small-text-responsive">Định dạng: dd/mm/yyyy</small>
                        </div>
                        <div className="col-12 col-md-6">
                          <label className="form-label fw-semibold form-label-responsive">
                            <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                            Giới tính
                          </label>
                          <select 
                            className="form-select form-control-responsive" 
                            name="gender" 
                            value={cccdForm.gender} 
                            onChange={handleCccdChange}
                            style={{ borderRadius: '8px' }}
                          >
                            <option>Nam</option>
                            <option>Nữ</option>
                          </select>
                        </div>
                        <div className="col-12 col-md-6">
                          <label className="form-label fw-semibold form-label-responsive">
                            <FontAwesomeIcon icon={faCamera} className="me-2 text-primary" />
                            Ảnh CCCD mặt trước
                          </label>
                          <input 
                            className="form-control form-control-responsive" 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => setFront(e.target.files[0])} 
                            required
                            style={{ borderRadius: '8px' }}
                          />
                          <small className="form-text text-muted small-text-responsive">Chọn file ảnh mặt trước của CCCD</small>
                        </div>
                        <div className="col-12 col-md-6">
                          <label className="form-label fw-semibold form-label-responsive">
                            <FontAwesomeIcon icon={faCamera} className="me-2 text-primary" />
                            Ảnh CCCD mặt sau
                          </label>
                          <input 
                            className="form-control form-control-responsive" 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => setBack(e.target.files[0])} 
                            required
                            style={{ borderRadius: '8px' }}
                          />
                          <small className="form-text text-muted small-text-responsive">Chọn file ảnh mặt sau của CCCD</small>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-top">
                        <button 
                          className="btn btn-primary btn-responsive w-100 w-md-auto px-4 px-md-5" 
                          disabled={cccdLoading}
                          style={{ borderRadius: '8px', fontWeight: '500' }}
                        >
                          {cccdLoading ? (
                            <>
                              <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                              <span className="d-none d-sm-inline">Đang xử lý...</span>
                              <span className="d-sm-none">Xử lý...</span>
                            </>
                          ) : (
                            <>
                              <FontAwesomeIcon icon={faIdCard} className="me-2" />
                              <span className="d-none d-sm-inline">Gửi yêu cầu xác minh</span>
                              <span className="d-sm-none">Gửi xác minh</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div className="content-card-modern">
                <div className="content-header-modern">
                  <div>
                    <h4 className="content-title">Lịch đặt của tôi</h4>
                    <p className="content-subtitle">Xem và quản lý các đặt dịch vụ của bạn</p>
                  </div>
                </div>
                <div className="text-center py-5">
                  <FontAwesomeIcon icon={faShoppingBag} size="4x" className="text-muted mb-3" />
                  <p className="text-muted mb-4">Chức năng đang được phát triển...</p>
                  <button className="btn-modern btn-primary-modern" onClick={() => navigate('/customer/bookings')}>
                    <FontAwesomeIcon icon={faShoppingBag} className="me-2" />
                    Xem lịch đặt
                  </button>
                </div>
              </div>
            )}

            {/* Wishlist Tab */}
            {activeTab === 'wishlist' && (
              <div className="content-card-modern">
                <div className="content-header-modern">
                  <div>
                    <h4 className="content-title">Danh sách yêu thích</h4>
                    <p className="content-subtitle">Các dịch vụ bạn đã lưu</p>
                  </div>
                </div>
                <div className="text-center py-5">
                  <FontAwesomeIcon icon={faHeart} size="4x" className="text-muted mb-3" />
                  <p className="text-muted mb-4">Chức năng đang được phát triển...</p>
                  <button className="btn-modern btn-primary-modern" onClick={() => navigate('/wishlists')}>
                    <FontAwesomeIcon icon={faHeart} className="me-2" />
                    Xem wishlist
                  </button>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="content-card-modern">
                <div className="content-header-modern">
                  <div>
                    <h4 className="content-title">Bảo mật</h4>
                    <p className="content-subtitle">Quản lý mật khẩu và bảo mật tài khoản</p>
                  </div>
                </div>
                <div className="security-section-modern">
                  <h5 className="mb-4 fw-semibold">Đổi mật khẩu</h5>
                  <div className="row g-4">
                    <div className="col-md-6">
                      <div className="form-group mb-4">
                        <label className="fw-semibold mb-2">Mật khẩu hiện tại</label>
                        <input type="password" className="form-control form-control-lg" placeholder="Nhập mật khẩu hiện tại" />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group mb-4">
                        <label className="fw-semibold mb-2">Mật khẩu mới</label>
                        <input type="password" className="form-control form-control-lg" placeholder="Nhập mật khẩu mới" />
                      </div>
                    </div>
                  </div>
                  <button className="btn-modern btn-primary-modern">
                    <FontAwesomeIcon icon={faLock} className="me-2" />
                    Cập nhật mật khẩu
                  </button>
                </div>
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="content-card-modern">
                <div className="content-header-modern">
                  <div>
                    <h4 className="content-title">Lịch sử dịch vụ</h4>
                    <p className="content-subtitle">Xem lại các dịch vụ đã sử dụng</p>
                  </div>
                </div>
                <div className="text-center py-5">
                  <FontAwesomeIcon icon={faHistory} size="4x" className="text-muted mb-3" />
                  <p className="text-muted mb-4">Chức năng đang được phát triển...</p>
                  <button className="btn-modern btn-primary-modern" onClick={() => navigate('/customer/bookings')}>
                    <FontAwesomeIcon icon={faHistory} className="me-2" />
                    Xem lịch sử
                  </button>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="content-card-modern">
                <div className="content-header-modern">
                  <div>
                    <h4 className="content-title">Cài đặt tài khoản</h4>
                    <p className="content-subtitle">Tùy chỉnh cài đặt và thông báo</p>
                  </div>
                </div>
                <div className="settings-section-modern">
                  <h5 className="mb-4 fw-semibold">Thông báo</h5>
                  <div className="form-check-modern mb-3">
                    <input className="form-check-input-modern" type="checkbox" id="emailNotif" defaultChecked />
                    <label className="form-check-label-modern" htmlFor="emailNotif">
                      <strong>Thông báo qua email</strong>
                      <small className="d-block text-muted">Nhận thông báo về đơn hàng và cập nhật qua email</small>
                    </label>
                  </div>
                  <div className="form-check-modern mb-3">
                    <input className="form-check-input-modern" type="checkbox" id="smsNotif" />
                    <label className="form-check-label-modern" htmlFor="smsNotif">
                      <strong>Thông báo qua SMS</strong>
                      <small className="d-block text-muted">Nhận thông báo quan trọng qua tin nhắn SMS</small>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .account-management-container {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding-bottom: 3rem;
        }
        
        .page-header-modern {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%);
          backdrop-filter: blur(10px);
          border-bottom: none;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        
        .sidebar-modern {
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
          overflow: hidden;
          position: sticky;
          top: 20px;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .sidebar-modern:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 50px rgba(0,0,0,0.2);
        }
        
        .user-summary-modern {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2.5rem 1.5rem;
          color: white;
        }
        
        .profile-image-container-modern {
          position: relative;
        }
        
        .profile-avatar-img {
          width: 120px;
          height: 120px;
          object-fit: cover;
          border-radius: 50%;
          border: 4px solid rgba(255,255,255,0.3);
          box-shadow: 0 8px 25px rgba(0,0,0,0.3);
          display: block;
        }
        
        .profile-avatar-placeholder {
          width: 120px;
          height: 120px;
          background: rgba(255,255,255,0.2);
          backdrop-filter: blur(10px);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          color: white;
          font-weight: bold;
          border: 4px solid rgba(255,255,255,0.3);
          box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        }
        
        .edit-photo-btn-modern {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: 3px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(0,0,0,0.3);
          transition: all 0.3s ease;
        }
        
        .edit-photo-btn-modern:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(0,0,0,0.4);
        }
        
        .badge-modern {
          display: inline-block;
          padding: 0.4rem 1rem;
          background: rgba(255,255,255,0.2);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 500;
          color: white;
          border: 1px solid rgba(255,255,255,0.3);
        }
        
        .nav-modern {
          padding: 1rem 0;
        }
        
        .nav-link-modern {
          width: 100%;
          padding: 1rem 1.5rem;
          border: none;
          background: transparent;
          color: #6c757d;
          text-align: left;
          display: flex;
          align-items: center;
          transition: all 0.3s ease;
          position: relative;
          font-weight: 500;
        }
        
        .nav-link-modern:hover {
          background: linear-gradient(90deg, rgba(102, 126, 234, 0.1) 0%, transparent 100%);
          color: #667eea;
          transform: translateX(8px);
        }
        
        .nav-link-modern.active {
          background: linear-gradient(90deg, rgba(102, 126, 234, 0.15) 0%, transparent 100%);
          color: #667eea;
          font-weight: 600;
        }
        
        .nav-link-modern.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 0 4px 4px 0;
        }
        
        .nav-icon {
          width: 20px;
          margin-right: 12px;
          font-size: 1.1rem;
        }
        
        .content-card-modern {
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 2.5rem;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
          min-height: 500px;
          transition: all 0.3s ease;
        }
        
        .content-card-modern:hover {
          box-shadow: 0 15px 50px rgba(0,0,0,0.2);
          transform: translateY(-2px);
        }
        
        .content-header-modern {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 2px solid #f0f0f0;
        }
        
        .content-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #2d3748;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .content-subtitle {
          color: #718096;
          font-size: 0.95rem;
          margin: 0;
        }
        
        .btn-modern {
          padding: 0.75rem 2rem;
          border-radius: 12px;
          font-weight: 600;
          border: none;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .btn-primary-modern {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .btn-primary-modern:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        
        .btn-success-modern {
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
          color: white;
        }
        
        .btn-success-modern:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(72, 187, 120, 0.4);
        }
        
        .form-control:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
        }
        
        .form-control-lg {
          border-radius: 12px;
          border: 2px solid #e2e8f0;
          transition: all 0.3s ease;
        }
        
        .form-control-lg:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.15);
        }
        
        .alert {
          border-radius: 12px;
          border: none;
        }
        
        .security-section-modern {
          padding: 1.5rem 0;
        }
        
        .settings-section-modern {
          padding: 1.5rem 0;
        }
        
        .form-check-modern {
          padding: 1.25rem;
          background: #f7fafc;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
          transition: all 0.3s ease;
          display: flex;
          align-items: flex-start;
        }
        
        .form-check-modern:hover {
          border-color: #667eea;
          background: #f0f4ff;
        }
        
        .form-check-input-modern {
          width: 20px;
          height: 20px;
          margin-top: 2px;
          margin-right: 1rem;
          cursor: pointer;
          accent-color: #667eea;
        }
        
        .form-check-label-modern {
          flex: 1;
          cursor: pointer;
        }
        
        .addresses-list-modern {
          margin-top: 2rem;
        }
        
        .address-cards-modern {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .address-card-modern {
          background: #f7fafc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 1rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          transition: all 0.3s ease;
        }
        
        @media (min-width: 768px) {
          .address-card-modern {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }
        
        .address-card-modern:hover {
          border-color: #667eea;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.1);
          transform: translateY(-2px);
        }
        
        .address-card-header {
          display: flex;
          align-items: flex-start;
          flex: 1;
        }
        
        .address-icon-modern {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          margin-right: 1rem;
          flex-shrink: 0;
        }
        
        .address-info-modern {
          flex: 1;
        }
        
        .address-meta-modern {
          display: flex;
          align-items: center;
          margin-top: 0.5rem;
        }
        
        .badge-modern-small {
          padding: 0.25rem 0.75rem;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 500;
        }
        
        .badge-info-modern {
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
        }
        
        .badge-secondary-modern {
          background: #e2e8f0;
          color: #718096;
        }
        
        .address-card-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
        }
        
        @media (min-width: 768px) {
          .address-card-actions {
            justify-content: flex-start;
          }
        }
        
        .btn-action-modern {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .btn-edit-modern {
          background: rgba(255, 193, 7, 0.1);
          color: #ffc107;
        }
        
        .btn-edit-modern:hover {
          background: #ffc107;
          color: white;
          transform: scale(1.1);
        }
        
        .btn-delete-modern {
          background: rgba(220, 53, 69, 0.1);
          color: #dc3545;
        }
        
        .btn-delete-modern:hover {
          background: #dc3545;
          color: white;
          transform: scale(1.1);
        }
        
        .empty-state-modern {
          text-align: center;
          padding: 4rem 2rem;
        }
        
        .btn-outline-modern {
          background: transparent;
          border: 2px solid #cbd5e0;
          color: #718096;
        }
        
        .btn-outline-modern:hover {
          background: #f7fafc;
          border-color: #a0aec0;
          color: #4a5568;
        }
        
        /* Responsive Styles */
        .header-title-responsive {
          font-size: 1.75rem;
        }
        
        .header-subtitle-responsive {
          font-size: 0.9rem;
        }
        
        .user-name-responsive {
          font-size: 1.1rem;
        }
        
        .form-label-responsive {
          font-size: 0.9rem;
        }
        
        .form-control-responsive {
          font-size: 0.95rem;
          padding: 0.6rem 1rem;
        }
        
        .small-text-responsive {
          font-size: 0.8rem;
        }
        
        .btn-responsive {
          font-size: 0.9rem;
          padding: 0.6rem 1.25rem;
        }
        
        @media (min-width: 576px) {
          .header-title-responsive {
            font-size: 2rem;
          }
          
          .header-subtitle-responsive {
            font-size: 1rem;
          }
          
          .user-name-responsive {
            font-size: 1.25rem;
          }
          
          .form-label-responsive {
            font-size: 1rem;
          }
          
          .form-control-responsive {
            font-size: 1rem;
            padding: 0.75rem 1.25rem;
          }
          
          .btn-responsive {
            font-size: 1rem;
            padding: 0.75rem 2rem;
          }
        }
        
        @media (max-width: 991px) {
          .sidebar-modern {
            margin-bottom: 1.5rem;
            position: relative;
            top: 0;
          }
          
          .content-card-modern {
            padding: 1.5rem;
          }
          
          .content-header-modern {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }
          
          .content-title {
            font-size: 1.5rem;
          }
          
          .content-subtitle {
            font-size: 0.85rem;
          }
          
          .user-summary-modern {
            padding: 1.5rem 1rem;
          }
          
          .profile-avatar-img,
          .profile-avatar-placeholder {
            width: 80px;
            height: 80px;
            font-size: 2rem;
          }
          
          .edit-photo-btn-modern {
            width: 32px;
            height: 32px;
            font-size: 0.85rem;
          }
          
          .nav-link-modern {
            padding: 0.75rem 1rem;
            font-size: 0.9rem;
          }
          
          .nav-icon {
            width: 18px;
            font-size: 1rem;
          }
          
          .address-card-modern {
            padding: 1rem;
          }
          
          .address-icon-modern {
            width: 35px;
            height: 35px;
            font-size: 0.9rem;
          }
        }
        
        @media (max-width: 575px) {
          .account-management-container {
            padding-bottom: 2rem;
          }
          
          .page-header-modern {
            padding: 1rem 0;
          }
          
          .header-title-responsive {
            font-size: 1.5rem;
          }
          
          .header-subtitle-responsive {
            font-size: 0.85rem;
          }
          
          .content-card-modern {
            padding: 1rem;
            border-radius: 15px;
          }
          
          .content-title {
            font-size: 1.25rem;
          }
          
          .content-subtitle {
            font-size: 0.8rem;
          }
          
          .user-summary-modern {
            padding: 1.25rem 0.75rem;
          }
          
          .profile-avatar-img,
          .profile-avatar-placeholder {
            width: 70px;
            height: 70px;
            font-size: 1.75rem;
          }
          
          .edit-photo-btn-modern {
            width: 28px;
            height: 28px;
            font-size: 0.75rem;
          }
          
          .user-name-responsive {
            font-size: 1rem;
          }
          
          .nav-link-modern {
            padding: 0.6rem 0.75rem;
            font-size: 0.85rem;
          }
          
          .nav-link-modern span {
            font-size: 0.85rem;
          }
          
          .nav-icon {
            width: 16px;
            font-size: 0.9rem;
          }
          
          .btn-modern {
            width: 100%;
            justify-content: center;
            padding: 0.6rem 1rem;
            font-size: 0.9rem;
          }
          
          .address-card-modern {
            padding: 0.75rem;
          }
          
          .address-card-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }
          
          .address-icon-modern {
            width: 30px;
            height: 30px;
            font-size: 0.8rem;
          }
          
          .address-card-actions {
            width: 100%;
            justify-content: flex-end;
          }
          
          .btn-action-modern {
            width: 35px;
            height: 35px;
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  );
};

export default UserProfile;

