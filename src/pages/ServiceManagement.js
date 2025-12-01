import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faEdit, 
  faTrash, 
  faSearch,
  faTimes,
  faCheck,
  faSpinner,
  faCertificate,
  faInfoCircle,
  faLayerGroup,
  faList,
  faSync
} from '@fortawesome/free-solid-svg-icons';
import serviceService from '../services/serviceService';

const ServiceManagement = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    requires_certificate: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [modalAnimation, setModalAnimation] = useState('fadeIn'); // 'fadeIn' or 'fadeOut'
  // Variant UI state
  const [expandedServiceId, setExpandedServiceId] = useState(null);
  const [variantForm, setVariantForm] = useState({
    variant_id: null,
    service_id: null,
    variant_name: '',
    pricing_type: 'Theo giờ',
    price_min: '',
    price_max: '',
    unit: ''
  });
  const [variantSubmitting, setVariantSubmitting] = useState(false);
  const [variantError, setVariantError] = useState(null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [variantModalTitle, setVariantModalTitle] = useState('Thêm biến thể mới');
  const [showVariantsModal, setShowVariantsModal] = useState(false);
  const [serviceForVariants, setServiceForVariants] = useState(null);

  // Load services
  useEffect(() => {
    loadServices();
  }, []);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27 && showModal && !submitting) {
        setModalAnimation('fadeOut');
        setTimeout(() => {
          setShowModal(false);
          setEditingService(null);
          setFormData({
            name: '',
            description: '',
            requires_certificate: false
          });
          setModalAnimation('fadeIn');
        }, 300);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showModal, submitting]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
      setModalAnimation('fadeIn');
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  const loadServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await serviceService.getAll();
      setServices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading services:', err);
      setError('Không thể tải danh sách dịch vụ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Filter services
  const filteredServices = services.filter(service => {
    const query = searchQuery.toLowerCase();
    return (
      service.name?.toLowerCase().includes(query) ||
      service.description?.toLowerCase().includes(query)
    );
  });

  // Calculate stats
  const stats = {
    total: services.length,
    withCert: services.filter(s => s.requires_certificate === true || s.requires_certificate === 1 || s.requires_certificate === '1').length,
    withVariants: services.filter(s => s.variants?.length > 0).length
  };

  // Open modal for create/edit
  const openModal = (service = null) => {
    if (service) {
      setEditingService(service);
      const requiresCert = service.requires_certificate === true || 
                          service.requires_certificate === 1 || 
                          service.requires_certificate === '1';
      setFormData({
        name: service.name || '',
        description: service.description || '',
        requires_certificate: requiresCert
      });
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        description: '',
        requires_certificate: false
      });
    }
    setModalAnimation('fadeIn');
    setShowModal(true);
  };

  // Close modal with animation
  const closeModal = () => {
    if (submitting) return;
    setModalAnimation('fadeOut');
    setTimeout(() => {
      setShowModal(false);
      setEditingService(null);
      setFormData({
        name: '',
        description: '',
        requires_certificate: false
      });
      setModalAnimation('fadeIn');
    }, 300);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Tên dịch vụ là bắt buộc');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        requires_certificate: !!formData.requires_certificate
      };

      if (editingService) {
        await serviceService.update(editingService.service_id, submitData);
      } else {
        await serviceService.create(submitData);
      }

      await loadServices();
      closeModal();
    } catch (err) {
      console.error('Error saving service:', err);
      setError(
        err.response?.data?.message || 
        `Không thể ${editingService ? 'cập nhật' : 'tạo'} dịch vụ. Vui lòng thử lại.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (serviceId) => {
    try {
      setError(null);
      await serviceService.delete(serviceId);
      await loadServices();
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting service:', err);
      setError(
        err.response?.data?.message || 
        'Không thể xóa dịch vụ. Có thể dịch vụ này đang được sử dụng.'
      );
      setDeleteConfirm(null);
    }
  };

  // ===== Variants handlers =====
  const openVariantsModal = async (service) => {
    try {
      // get basic service info
      const fresh = await serviceService.getById(service.service_id);
      // get variants via dedicated endpoint (includes specific_price reliably)
      const variants = await serviceService.listVariants(service.service_id);
      setServiceForVariants({ ...(fresh || service), variants: Array.isArray(variants) ? variants : [] });
    } catch (e) {
      try {
        const variants = await serviceService.listVariants(service.service_id);
        setServiceForVariants({ ...service, variants: Array.isArray(variants) ? variants : [] });
      } catch {
        setServiceForVariants({ ...service, variants: service.variants || [] });
      }
    }
    setShowVariantsModal(true);
  };

  const openVariantForm = (service, variant) => {
    setVariantError(null);
    setVariantForm({
      variant_id: variant?.variant_id || null,
      service_id: service.service_id,
      variant_name: variant?.variant_name || '',
      pricing_type: variant?.pricing_type || 'Theo giờ',
      price_min: variant?.price_min ?? '',
      price_max: variant?.price_max ?? '',
      unit: variant?.unit || ''
    });
    setVariantModalTitle(variant ? 'Chỉnh sửa biến thể' : 'Thêm biến thể mới');
    setShowVariantModal(true);
  };

  const resetVariantForm = () => {
    setVariantForm({
      variant_id: null,
      service_id: null,
      variant_name: '',
      pricing_type: 'Theo giờ',
      price_min: '',
      price_max: '',
      unit: ''
    });
    setShowVariantModal(false);
  };

  const unitByPricingType = (t) => {
    switch (t) {
      case 'Theo giờ': return 'Giờ';
      case 'Theo ngày': return 'Ngày';
      case 'Theo tuần': return 'Tuần';
      case 'Theo tháng': return 'Tháng';
      case 'Theo chiếc': return 'Chiếc';
      case 'Theo m²': return 'm²';
      default: return '';
    }
  };

  const onChangePricingType = (value) => {
    const suggested = unitByPricingType(value);
    setVariantForm(v => ({
      ...v,
      pricing_type: value,
      unit: suggested || v.unit
    }));
  };

  const saveVariant = async () => {
    if (!variantForm.service_id || !variantForm.variant_name.trim()) {
      setVariantError('Tên biến thể là bắt buộc');
      return;
    }
    setVariantSubmitting(true);
    setVariantError(null);
    try {
      const payload = {
        variant_name: variantForm.variant_name.trim(),
        pricing_type: variantForm.pricing_type,
        price_min: variantForm.price_min !== '' ? Number(variantForm.price_min) : null,
        price_max: variantForm.price_max !== '' ? Number(variantForm.price_max) : null,
        unit: variantForm.unit || null
      };
      if (variantForm.variant_id) {
        await serviceService.updateVariant(variantForm.variant_id, payload);
      } else {
        await serviceService.createVariant(variantForm.service_id, payload);
      }
      // refresh the expanded service
      const fresh = await serviceService.getById(variantForm.service_id);
      setServices(prev => prev.map(s => s.service_id === variantForm.service_id ? fresh : s));
      // refresh modal list
      try {
        const variants = await serviceService.listVariants(variantForm.service_id);
        setServiceForVariants(prev => prev && prev.service_id === variantForm.service_id ? { ...prev, variants } : prev);
      } catch {}
      resetVariantForm();
      setShowVariantModal(false);
    } catch (err) {
      console.error('Variant save error', err);
      setVariantError(err.response?.data?.message || 'Không thể lưu biến thể');
    } finally {
      setVariantSubmitting(false);
    }
  };

  const deleteVariant = async (service, variantId) => {
    try {
      await serviceService.deleteVariant(variantId);
      const fresh = await serviceService.getById(service.service_id);
      setServices(prev => prev.map(s => s.service_id === service.service_id ? fresh : s));
      // refresh modal list if open for this service
      try {
        const variants = await serviceService.listVariants(service.service_id);
        setServiceForVariants(prev => (prev && prev.service_id === service.service_id ? { ...prev, variants } : prev));
      } catch {
        setServiceForVariants(prev => (prev && prev.service_id === service.service_id ? fresh : prev));
      }
    } catch (err) {
      setVariantError(err.response?.data?.message || 'Không thể xóa biến thể. Có thể đang được tham chiếu.');
    }
  };

  return (
    <div className="service-management-container" style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header with Gradient */}
      <div 
        className="page-header text-white"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '3rem 0',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}
      >
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h1 className="mb-2" style={{ fontSize: '2.5rem', fontWeight: '700' }}>
                Quản Lý Dịch Vụ
              </h1>
              <p className="mb-0" style={{ fontSize: '1.1rem', opacity: 0.9 }}>
                Tạo, chỉnh sửa và quản lý các dịch vụ của hệ thống
              </p>
            </div>
            <div className="col-md-4 text-right">
              <button 
                className="btn btn-light btn-lg shadow-sm"
                onClick={() => openModal()}
                style={{
                  borderRadius: '50px',
                  padding: '0.75rem 2rem',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                }}
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Thêm Dịch Vụ Mới
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container" style={{ marginTop: '-2rem', paddingBottom: '3rem' }}>
        {/* Stats Cards */}
        <div className="row mb-4">
          <div className="col-md-4 mb-3">
            <div 
              className="card border-0 shadow-sm h-100"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: '15px',
                transition: 'transform 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-uppercase mb-2" style={{ opacity: 0.9, fontSize: '0.85rem' }}>
                      Tổng Số Dịch Vụ
                    </h6>
                    <h2 className="mb-0" style={{ fontSize: '2.5rem', fontWeight: '700' }}>
                      {stats.total}
                    </h2>
                  </div>
                  <div 
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem'
                    }}
                  >
                    <FontAwesomeIcon icon={faList} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div 
              className="card border-0 shadow-sm h-100"
              style={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                borderRadius: '15px',
                transition: 'transform 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-uppercase mb-2" style={{ opacity: 0.9, fontSize: '0.85rem' }}>
                      Yêu Cầu Chứng Chỉ
                    </h6>
                    <h2 className="mb-0" style={{ fontSize: '2.5rem', fontWeight: '700' }}>
                      {stats.withCert}
                    </h2>
                  </div>
                  <div 
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem'
                    }}
                  >
                    <FontAwesomeIcon icon={faCertificate} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div 
              className="card border-0 shadow-sm h-100"
              style={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
                borderRadius: '15px',
                transition: 'transform 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-uppercase mb-2" style={{ opacity: 0.9, fontSize: '0.85rem' }}>
                      Có Variants
                    </h6>
                    <h2 className="mb-0" style={{ fontSize: '2.5rem', fontWeight: '700' }}>
                      {stats.withVariants}
                    </h2>
                  </div>
                  <div 
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem'
                    }}
                  >
                    <FontAwesomeIcon icon={faLayerGroup} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and View Toggle */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '15px' }}>
          <div className="card-body p-4">
            <div className="row align-items-center">
              <div className="col-md-8">
                <div className="input-group input-group-lg">
                  <div className="input-group-prepend">
                    <span 
                      className="input-group-text border-0"
                      style={{ 
                        background: '#f8f9fa',
                        borderTopLeftRadius: '50px',
                        borderBottomLeftRadius: '50px'
                      }}
                    >
                      <FontAwesomeIcon icon={faSearch} className="text-muted" />
                    </span>
                  </div>
                  <input
                    type="text"
                    className="form-control border-0"
                    style={{ 
                      background: '#f8f9fa',
                      borderTopRightRadius: '50px',
                      borderBottomRightRadius: '50px'
                    }}
                    placeholder="Tìm kiếm dịch vụ theo tên hoặc mô tả..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-4 text-right mt-3 mt-md-0">
                <div className="btn-group shadow-sm" role="group">
                  <button
                    type="button"
                    className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-light'}`}
                    onClick={() => setViewMode('grid')}
                    style={{ borderRadius: '50px 0 0 50px' }}
                  >
                    <FontAwesomeIcon icon={faLayerGroup} />
                  </button>
                  <button
                    type="button"
                    className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-light'}`}
                    onClick={() => setViewMode('list')}
                    style={{ borderRadius: '0 50px 50px 0' }}
                  >
                    <FontAwesomeIcon icon={faList} />
                  </button>
                </div>
                <button
                  className="btn btn-light ml-2 shadow-sm"
                  onClick={loadServices}
                  title="Làm mới"
                  style={{ borderRadius: '50px' }}
                >
                  <FontAwesomeIcon icon={faSync} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div 
            className="alert alert-danger alert-dismissible fade show shadow-sm border-0"
            role="alert"
            style={{ borderRadius: '15px' }}
          >
            <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
            {error}
            <button 
              type="button" 
              className="close" 
              onClick={() => setError(null)}
            >
              <span>&times;</span>
            </button>
          </div>
        )}

        {/* Variant Error Message */}
        {variantError && (
          <div 
            className="alert alert-warning alert-dismissible fade show shadow-sm border-0"
            role="alert"
            style={{ borderRadius: '15px' }}
          >
            <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
            {variantError}
            <button 
              type="button" 
              className="close" 
              onClick={() => setVariantError(null)}
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
        )}

        {/* Services Content */}
        {loading ? (
          <div className="text-center py-5">
            <FontAwesomeIcon icon={faSpinner} spin className="fa-3x text-primary mb-3" />
            <p className="text-muted" style={{ fontSize: '1.1rem' }}>Đang tải dịch vụ...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="card border-0 shadow-sm text-center py-5" style={{ borderRadius: '15px' }}>
            <div className="card-body">
              <FontAwesomeIcon icon={faInfoCircle} className="fa-4x text-muted mb-3" />
              <h4 className="text-muted mb-2">
                {searchQuery ? 'Không tìm thấy dịch vụ nào' : 'Chưa có dịch vụ nào'}
              </h4>
              <p className="text-muted">
                {searchQuery 
                  ? 'Thử tìm kiếm với từ khóa khác' 
                  : 'Bắt đầu bằng cách tạo dịch vụ mới'}
              </p>
              {!searchQuery && (
                <button 
                  className="btn btn-primary mt-3"
                  onClick={() => openModal()}
                  style={{ borderRadius: '50px', padding: '0.75rem 2rem' }}
                >
                  <FontAwesomeIcon icon={faPlus} className="mr-2" />
                  Tạo Dịch Vụ Đầu Tiên
                </button>
              )}
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View
          <div className="row">
            {filteredServices.map((service) => {
              const requiresCert = service.requires_certificate === true || 
                                  service.requires_certificate === 1 || 
                                  service.requires_certificate === '1';
              return (
                <div key={service.service_id} className="col-md-6 col-lg-4 mb-4">
                  <div 
                    className="card border-0 shadow-sm h-100"
                    style={{
                      borderRadius: '15px',
                      transition: 'all 0.3s ease',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)';
                      e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                    }}
                  >
                    <div 
                      className="card-header border-0 text-white"
                      style={{
                        background: requiresCert 
                          ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        padding: '1.5rem'
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h5 className="mb-1" style={{ fontWeight: '700' }}>
                            {service.name}
                          </h5>
                          <small style={{ opacity: 0.9 }}>ID: #{service.service_id}</small>
                        </div>
                        {requiresCert && (
                          <span 
                            className="badge"
                            style={{ 
                              fontSize: '0.75rem', 
                              padding: '0.5rem 0.75rem',
                              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                              color: '#000',
                              fontWeight: '700',
                              border: '2px solid rgba(255, 255, 255, 0.5)',
                              boxShadow: '0 4px 12px rgba(255, 215, 0, 0.4)',
                              textShadow: 'none'
                            }}
                          >
                            <FontAwesomeIcon icon={faCertificate} className="mr-1" />
                            Chứng chỉ
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="card-body p-4">
                      <p 
                        className="text-muted mb-3"
                        style={{ 
                          fontSize: '0.9rem',
                          minHeight: '60px',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {service.description || 'Không có mô tả'}
                      </p>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <small className="text-muted d-block">Variants</small>
                          <span 
                            className="badge badge-info"
                            style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                          >
                            {service.variants?.length || 0}
                          </span>
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-outline-primary btn-sm flex-fill"
                          onClick={() => openModal(service)}
                          style={{ borderRadius: '50px' }}
                        >
                          <FontAwesomeIcon icon={faEdit} className="mr-1" />
                          Sửa
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm flex-fill"
                          onClick={() => setDeleteConfirm(service)}
                          style={{ borderRadius: '50px' }}
                        >
                          <FontAwesomeIcon icon={faTrash} className="mr-1" />
                          Xóa
                        </button>
                      </div>
                      <div className="mt-3">
                        <div className="d-flex align-items-center justify-content-between">
                          <button
                            className="btn btn-sm btn-light"
                            onClick={() => openVariantsModal(service)}
                            style={{ borderRadius: '10px' }}
                          >
                            <FontAwesomeIcon icon={faLayerGroup} className="mr-1" />
                            Quản lý biến thể
                          </button>
                        </div>

                        {/* Inline variant list removed; managed via popup */}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // List View
          <div className="card border-0 shadow-sm" style={{ borderRadius: '15px', overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead style={{ background: '#f8f9fa' }}>
                  <tr>
                    <th style={{ borderTop: 'none', padding: '1.25rem', fontWeight: '600' }}>ID</th>
                    <th style={{ borderTop: 'none', padding: '1.25rem', fontWeight: '600' }}>Tên Dịch Vụ</th>
                    <th style={{ borderTop: 'none', padding: '1.25rem', fontWeight: '600' }}>Mô Tả</th>
                    <th style={{ borderTop: 'none', padding: '1.25rem', fontWeight: '600' }}>Chứng Chỉ</th>
                    <th style={{ borderTop: 'none', padding: '1.25rem', fontWeight: '600' }}>Variants</th>
                    <th style={{ borderTop: 'none', padding: '1.25rem', fontWeight: '600', width: '150px' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.map((service) => {
                    const requiresCert = service.requires_certificate === true || 
                                        service.requires_certificate === 1 || 
                                        service.requires_certificate === '1';
                    return (
                      <tr 
                        key={service.service_id}
                        style={{ transition: 'background 0.2s ease' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                      >
                        <td style={{ padding: '1.25rem', verticalAlign: 'middle' }}>
                          <span className="badge badge-secondary">#{service.service_id}</span>
                        </td>
                        <td style={{ padding: '1.25rem', verticalAlign: 'middle' }}>
                          <strong style={{ fontSize: '1rem' }}>{service.name}</strong>
                        </td>
                        <td style={{ padding: '1.25rem', verticalAlign: 'middle' }}>
                          <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                            {service.description || 'Không có mô tả'}
                          </span>
                        </td>
                        <td style={{ padding: '1.25rem', verticalAlign: 'middle' }}>
                          {requiresCert ? (
                            <span 
                              className="badge"
                              style={{
                                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                color: 'white',
                                padding: '0.5rem 0.75rem'
                              }}
                            >
                              <FontAwesomeIcon icon={faCertificate} className="mr-1" />
                              Có
                            </span>
                          ) : (
                            <span className="badge badge-secondary" style={{ padding: '0.5rem 0.75rem' }}>
                              Không
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '1.25rem', verticalAlign: 'middle' }}>
                          <span 
                            className="badge badge-info"
                            style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}
                          >
                            {service.variants?.length || 0}
                          </span>
                        </td>
                        <td style={{ padding: '1.25rem', verticalAlign: 'middle' }}>
                          <div className="btn-group" role="group">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => openModal(service)}
                              title="Chỉnh sửa"
                              style={{ borderRadius: '50px 0 0 50px' }}
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => setDeleteConfirm(service)}
                              title="Xóa"
                              style={{ borderRadius: '0 50px 50px 0' }}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal Popup */}
      {showModal && (
        <>
          <style>{`
            @keyframes modalFadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes modalSlideUp {
              from {
                transform: translateY(30px) scale(0.95);
                opacity: 0;
              }
              to {
                transform: translateY(0) scale(1);
                opacity: 1;
              }
            }
            .modal-popup-wrapper {
              animation: modalFadeIn 0.3s ease;
            }
            .modal-popup-box {
              animation: modalSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
          `}</style>
          <div 
            className="modal-popup-wrapper"
            style={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !submitting) closeModal();
            }}
          >
            <div 
              className="modal-popup-box"
              style={{ 
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
            <div 
              className=" border-0 shadow-lg"
              style={{ 
                borderRadius: '20px', 
                overflow: 'hidden',
                background: 'white',
                width: '90% !important',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}
            >
              <div 
                className="modal-header text-white border-0"
                style={{
                  background: editingService
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  padding: '1.5rem 2rem'
                }}
              >
                <h5 className="modal-title mb-0" style={{ fontWeight: '700', fontSize: '1.5rem' }}>
                  {editingService ? 'Chỉnh Sửa Dịch Vụ' : 'Thêm Dịch Vụ Mới'}
                </h5>
                <button
                  type="button"
                  className="close text-white"
                  onClick={closeModal}
                  disabled={submitting}
                  style={{ fontSize: '1.5rem', opacity: 0.9 }}
                >
                  <span>&times;</span>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="form-group">
                    <label htmlFor="name" className="font-weight-bold mb-2">
                      Tên Dịch Vụ <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      disabled={submitting}
                      style={{ borderRadius: '10px', border: '2px solid #e9ecef' }}
                      placeholder="Nhập tên dịch vụ..."
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="description" className="font-weight-bold mb-2">
                      Mô Tả
                    </label>
                    <textarea
                      className="form-control"
                      id="description"
                      rows="4"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      disabled={submitting}
                      style={{ borderRadius: '10px', border: '2px solid #e9ecef' }}
                      placeholder="Nhập mô tả cho dịch vụ..."
                    />
                  </div>
                  <div className="form-group">
                    <div className="d-flex align-items-center">
                      <div className="custom-control custom-switch mr-3">
                        <input
                          type="checkbox"
                          className="custom-control-input"
                          id="requires_certificate"
                          checked={!!formData.requires_certificate}
                          onChange={(e) => {
                            setFormData({ 
                              ...formData, 
                              requires_certificate: e.target.checked 
                            });
                          }}
                          disabled={submitting}
                        />
                        <label 
                          className="custom-control-label"
                          htmlFor="requires_certificate"
                          style={{ cursor: submitting ? 'not-allowed' : 'pointer' }}
                        />
                      </div>
                      <label 
                        htmlFor="requires_certificate"
                        className="font-weight-bold mb-0"
                        style={{ 
                          cursor: submitting ? 'not-allowed' : 'pointer',
                          fontSize: '1rem',
                          userSelect: 'none'
                        }}
                      >
                        <FontAwesomeIcon icon={faCertificate} className="mr-2 text-warning" />
                        Yêu cầu chứng chỉ
                      </label>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 p-4" style={{ background: '#f8f9fa' }}>
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={closeModal}
                    disabled={submitting}
                    style={{ borderRadius: '50px', padding: '0.75rem 2rem', fontWeight: '600' }}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                    style={{ 
                      borderRadius: '50px', 
                      padding: '0.75rem 2rem', 
                      fontWeight: '600',
                      background: editingService
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      border: 'none'
                    }}
                  >
                    {submitting ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={editingService ? faEdit : faCheck} className="mr-2" />
                        {editingService ? 'Cập Nhật' : 'Tạo Mới'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal Popup */}
      {deleteConfirm && (
        <div 
          className="modal-popup-wrapper"
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            animation: 'modalFadeIn 0.3s ease'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteConfirm(null);
          }}
        >
          <div 
            className="modal-popup-box"
            style={{ 
              maxWidth: '500px',
              width: '100%',
              animation: 'modalSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="modal-content border-0 shadow-lg"
              style={{ 
                borderRadius: '20px', 
                overflow: 'hidden',
                background: 'white',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}
            >
              <div 
                className="modal-header text-white border-0"
                style={{
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  padding: '1.5rem 2rem'
                }}
              >
                <h5 className="modal-title mb-0" style={{ fontWeight: '700', fontSize: '1.5rem' }}>
                  Xác Nhận Xóa
                </h5>
                <button
                  type="button"
                  className="close text-white"
                  onClick={() => setDeleteConfirm(null)}
                  style={{ fontSize: '1.5rem', opacity: 0.9 }}
                >
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body p-4">
                <p className="mb-3" style={{ fontSize: '1.1rem' }}>
                  Bạn có chắc chắn muốn xóa dịch vụ <strong>"{deleteConfirm.name}"</strong>?
                </p>
                {deleteConfirm.variants?.length > 0 && (
                  <div 
                    className="alert alert-warning border-0"
                    style={{ borderRadius: '10px' }}
                  >
                    <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
                    Dịch vụ này có {deleteConfirm.variants.length} variant(s). 
                    Vui lòng xóa các variant trước khi xóa dịch vụ.
                  </div>
                )}
              </div>
              <div className="modal-footer border-0 p-4" style={{ background: '#f8f9fa' }}>
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setDeleteConfirm(null)}
                  style={{ borderRadius: '50px', padding: '0.75rem 2rem', fontWeight: '600' }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleDelete(deleteConfirm.service_id)}
                  disabled={deleteConfirm.variants?.length > 0}
                  style={{ 
                    borderRadius: '50px', 
                    padding: '0.75rem 2rem', 
                    fontWeight: '600',
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    border: 'none',
                    opacity: deleteConfirm.variants?.length > 0 ? 0.5 : 1
                  }}
                >
                  <FontAwesomeIcon icon={faTrash} className="mr-2" />
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>

        )}

        {/* (Removed duplicate variants management block; variants now integrated into grid cards) */}

        {/* Variants List Modal */}
        {showVariantsModal && (
          <>
            <style>{`
              @keyframes vlistFadeIn { from { opacity: 0; } to { opacity: 1; } }
              @keyframes vlistSlideUp { from { transform: translateY(18px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
              .vlist-backdrop { animation: vlistFadeIn 0.15s ease; }
              .vlist-box { animation: vlistSlideUp 0.2s ease; }
            `}</style>
            <div
              className="vlist-backdrop"
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.55)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9998,
                padding: 20
              }}
              onClick={(e) => { if (e.target === e.currentTarget) setShowVariantsModal(false); }}
            >
              <div
                className="vlist-box"
                style={{
                  width: '100%',
                  maxWidth: 860,
                  background: '#fff',
                  borderRadius: 16,
                  overflow: 'hidden',
                  boxShadow: '0 18px 48px rgba(0,0,0,0.35)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="text-white"
                  style={{
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    padding: '1.1rem 1.5rem'
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-0" style={{ fontWeight: 700 }}>{serviceForVariants?.name || 'Biến thể'}</h5>
                      <small style={{ opacity: 0.95 }}>Quản lý biến thể dịch vụ #{serviceForVariants?.service_id}</small>
                    </div>
                    <button className="close text-white" style={{ opacity: 0.9 }} onClick={() => setShowVariantsModal(false)}>
                      <span>&times;</span>
                    </button>
                  </div>
                </div>
                <div className="p-3 p-md-4">
                  <div 
                    className="table-responsive border rounded"
                    style={{ background: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                  >
                    <table className="table table-sm mb-0">
                      <thead>
                        <tr>
                          <th style={{ borderTop: 'none', padding: '0.75rem' }}>Tên biến thể</th>
                          <th style={{ borderTop: 'none', padding: '0.75rem' }}>Loại giá</th>
                          <th style={{ borderTop: 'none', padding: '0.75rem' }}>Min</th>
                          <th style={{ borderTop: 'none', padding: '0.75rem' }}>Max</th>
                          <th style={{ borderTop: 'none', padding: '0.75rem' }}>Đơn vị</th>
                          <th style={{ borderTop: 'none', padding: '0.75rem', width: 160 }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(serviceForVariants?.variants || []).map(v => (
                          <tr key={v.variant_id}>
                            <td style={{ verticalAlign: 'middle' }}><strong>{v.variant_name}</strong></td>
                            <td style={{ verticalAlign: 'middle' }}><span className="badge badge-info" style={{ fontSize: '0.8rem' }}>{v.pricing_type}</span></td>
                            <td style={{ verticalAlign: 'middle' }}>{v.price_min ?? '—'}</td>
                            <td style={{ verticalAlign: 'middle' }}>{v.price_max ?? '—'}</td>
                            <td style={{ verticalAlign: 'middle' }}>{v.unit || '—'}</td>
                            <td style={{ verticalAlign: 'middle' }}>
                              <div className="btn-group btn-group-sm" role="group">
                                <button className="btn btn-outline-primary" onClick={() => openVariantForm(serviceForVariants, v)} title="Sửa">
                                  <FontAwesomeIcon icon={faEdit} />
                                </button>
                                <button className="btn btn-outline-danger" onClick={() => deleteVariant(serviceForVariants, v.variant_id)} title="Xóa">
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {(!serviceForVariants?.variants || serviceForVariants.variants.length === 0) && (
                          <tr>
                            <td colSpan="7" className="text-center text-muted" style={{ padding: '1rem' }}>Chưa có biến thể</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-right mt-3">
                    <button className="btn btn-primary" style={{ borderRadius: 10 }} onClick={() => openVariantForm(serviceForVariants, null)}>
                      <FontAwesomeIcon icon={faPlus} className="mr-1" />
                      Thêm biến thể
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        {/* Variant Create/Edit Modal */}
        {showVariantModal && (
          <>
            <style>{`
              @keyframes vmFadeIn { from { opacity: 0; } to { opacity: 1; } }
              @keyframes vmSlideUp {
                from { transform: translateY(24px) scale(0.98); opacity: 0; }
                to { transform: translateY(0) scale(1); opacity: 1; }
              }
              .vm-backdrop { animation: vmFadeIn 0.2s ease; }
              .vm-box { animation: vmSlideUp 0.25s ease; }
            `}</style>
            <div
              className="vm-backdrop"
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
                padding: 20
              }}
              onClick={(e) => { if (e.target === e.currentTarget && !variantSubmitting) setShowVariantModal(false); }}
            >
              <div
                className="vm-box"
                style={{
                  width: '100%',
                  maxWidth: 720,
                  background: '#fff',
                  borderRadius: 16,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
                  overflow: 'hidden'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="text-white"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '1.25rem 1.75rem'
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0" style={{ fontWeight: 700 }}>{variantModalTitle}</h5>
                    <button className="close text-white" style={{ opacity: 0.85 }} onClick={() => setShowVariantModal(false)} disabled={variantSubmitting}>
                      <span>&times;</span>
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  {variantError && (
                    <div className="alert alert-warning border-0" style={{ borderRadius: 10 }}>
                      <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
                      {variantError}
                    </div>
                  )}
                  <div className="form-row">
                    <div className="form-group col-md-8">
                      <label>Tên biến thể</label>
                      <input
                        className="form-control"
                        style={{ borderRadius: 10 }}
                        placeholder="Ví dụ: Nấu ăn 2-3 người, 2-3 món"
                        value={variantForm.variant_name}
                        onChange={e => setVariantForm({ ...variantForm, variant_name: e.target.value })}
                        disabled={variantSubmitting}
                      />
                    </div>
                    <div className="form-group col-md-4">
                      <label>Loại giá</label>
                      <select
                        className="form-control"
                        style={{ borderRadius: 10 }}
                        value={variantForm.pricing_type}
                        onChange={e => onChangePricingType(e.target.value)}
                        disabled={variantSubmitting}
                      >
                        <option>Theo giờ</option>
                        <option>Theo ngày</option>
                        <option>Theo tuần</option>
                        <option>Theo tháng</option>
                        <option>Theo chiếc</option>
                        <option>Theo m²</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group col-md-3">
                      <label>Min</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control"
                        style={{ borderRadius: 10 }}
                        placeholder="VD: 140"
                        value={variantForm.price_min}
                        onChange={e => setVariantForm({ ...variantForm, price_min: e.target.value })}
                        disabled={variantSubmitting}
                      />
                    </div>
                    <div className="form-group col-md-3">
                      <label>Max</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control"
                        style={{ borderRadius: 10 }}
                        placeholder="VD: 180"
                        value={variantForm.price_max}
                        onChange={e => setVariantForm({ ...variantForm, price_max: e.target.value })}
                        disabled={variantSubmitting}
                      />
                    </div>
                    <div className="form-group col-md-6">
                      <label>Đơn vị</label>
                      <input
                        className="form-control"
                        style={{ borderRadius: 10 }}
                        placeholder="Giờ/Ngày/Chiếc..."
                        value={variantForm.unit}
                        onChange={e => setVariantForm({ ...variantForm, unit: e.target.value })}
                        disabled={variantSubmitting}
                      />
                    </div>
                  </div>
                  <small className="text-muted d-block mb-3">Điền Min–Max cho khoảng giá. Đơn vị sẽ gợi ý theo Loại giá.</small>
                  <div className="d-flex justify-content-end">
                    <button className="btn btn-light mr-2" onClick={() => setShowVariantModal(false)} disabled={variantSubmitting} style={{ borderRadius: 10 }}>
                      Hủy
                    </button>
                    <button className="btn btn-primary" onClick={saveVariant} disabled={variantSubmitting} style={{ borderRadius: 10 }}>
                      {variantSubmitting ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> : <FontAwesomeIcon icon={faCheck} className="mr-2" />}
                      Lưu
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
  );
};

export default ServiceManagement;

// ===== Variant Modal (rendered after default export in same file for simplicity) =====
// Note: We append modal JSX at end of component return above:
