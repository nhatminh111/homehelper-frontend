import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faStar, 
  faMapMarkerAlt, 
  faClock,
  faHeart,
  faHeartBroken,
  faEye,
  faEdit,
  faTrash,
  faCheck,
  faTimes,
  faFilter,
  faSearch,
  faCalendar,
  faDollarSign,
  faAward,
  faGlobe,
  faPhone,
  faEnvelope,
  faPlus,
  faUserPlus,
  faShieldAlt,
  faCertificate
} from '@fortawesome/free-solid-svg-icons';

const TaskerManagement = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTasker, setSelectedTasker] = useState(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [favorites, setFavorites] = useState([1, 3]); // IDs of favorited taskers

  const taskers = [
    {
      id: 1,
      name: 'Sarah Johnson',
      avatar: '/images/person_1.jpg',
      rating: 4.9,
      reviews: 124,
      hourlyRate: 25,
      location: 'Downtown, 2.3 km away',
      experience: '5 years',
      availability: 'Available Now',
      verified: true,
      languages: ['English', 'Spanish'],
      services: ['House Cleaning', 'Kitchen Cleaning', 'Deep Cleaning'],
      specializations: ['Eco-friendly cleaning', 'Pet-friendly homes'],
      certifications: ['Professional Cleaning', 'Eco-Friendly Certified'],
      totalJobs: 340,
      successRate: 98,
      responseTime: '1hr',
      isFavorite: true
    },
    {
      id: 2,
      name: 'Maria Rodriguez',
      avatar: '/images/person_2.jpg',
      rating: 4.8,
      reviews: 89,
      hourlyRate: 22,
      location: 'Uptown, 1.8 km away',
      experience: '3 years',
      availability: 'Available in 2 hours',
      verified: true,
      languages: ['English', 'German'],
      services: ['Deep Cleaning', 'Office Cleaning'],
      specializations: ['Commercial cleaning', 'Move-in/out cleaning'],
      certifications: ['Commercial Cleaning', 'Safety Certified'],
      totalJobs: 156,
      successRate: 95,
      responseTime: '2hr',
      isFavorite: false
    },
    {
      id: 3,
      name: 'Jennifer Chen',
      avatar: '/images/person_3.jpg',
      rating: 4.7,
      reviews: 67,
      hourlyRate: 28,
      location: 'Midtown, 3.5 km away',
      experience: '4 years',
      availability: 'Available Now',
      verified: true,
      languages: ['English', 'French'],
      services: ['Window Cleaning', 'Carpet Cleaning'],
      specializations: ['High-rise windows', 'Delicate fabrics'],
      certifications: ['Window Cleaning Specialist', 'Carpet Care'],
      totalJobs: 203,
      successRate: 97,
      responseTime: '1.5hr',
      isFavorite: true
    },
    {
      id: 4,
      name: 'Lisa Thompson',
      avatar: '/images/person_4.jpg',
      rating: 4.6,
      reviews: 45,
      hourlyRate: 24,
      location: 'Suburbs, 4.2 km away',
      experience: '2 years',
      availability: 'Available tomorrow',
      verified: false,
      languages: ['English'],
      services: ['House Cleaning', 'Bathroom Cleaning'],
      specializations: ['Regular maintenance', 'Small apartments'],
      certifications: ['Basic Cleaning'],
      totalJobs: 78,
      successRate: 92,
      responseTime: '3hr',
      isFavorite: false
    }
  ];

  const toggleFavorite = (taskerId) => {
    setFavorites(prev => 
      prev.includes(taskerId) 
        ? prev.filter(id => id !== taskerId)
        : [...prev, taskerId]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'success';
      case 'pending': return 'warning';
      case 'suspended': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <div className="tasker-management-container">
      {/* Header */}
      <div className="page-header bg-white shadow-sm">
        <div className="container">
          <div className="row align-items-center py-4">
            <div className="col-md-6">
              <h1 className="mb-0">Tasker Management</h1>
              <p className="text-muted mb-0">Browse, manage, and interact with cleaning professionals</p>
            </div>
            <div className="col-md-6 text-right">
              <button 
                className="btn btn-primary"
                onClick={() => setShowRegistration(true)}
              >
                <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                Register as Tasker
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-4">
        {/* Filters and Search */}
        <div className="filters-section bg-white rounded shadow-sm p-3 mb-4">
          <div className="row align-items-center">
            <div className="col-md-4">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search taskers..."
                />
                <div className="input-group-append">
                  <button className="btn btn-outline-secondary">
                    <FontAwesomeIcon icon={faSearch} />
                  </button>
                </div>
              </div>
            </div>
            <div className="col-md-8">
              <div className="d-flex justify-content-end">
                <div className="btn-group mr-2" role="group">
                  <button
                    type="button"
                    className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setActiveTab('all')}
                  >
                    All Taskers
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${activeTab === 'favorites' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setActiveTab('favorites')}
                  >
                    <FontAwesomeIcon icon={faHeart} className="mr-1" />
                    Favorites
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${activeTab === 'verified' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setActiveTab('verified')}
                  >
                    <FontAwesomeIcon icon={faShieldAlt} className="mr-1" />
                    Verified
                  </button>
                </div>
                <button className="btn btn-outline-secondary btn-sm">
                  <FontAwesomeIcon icon={faFilter} className="mr-1" />
                  Filter
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Taskers Grid */}
        <div className="taskers-grid">
          <div className="row">
            {taskers
              .filter(tasker => {
                if (activeTab === 'favorites') return favorites.includes(tasker.id);
                if (activeTab === 'verified') return tasker.verified;
                return true;
              })
              .map((tasker) => (
                <div key={tasker.id} className="col-lg-6 col-xl-4 mb-4">
                  <div className="tasker-card bg-white rounded shadow-sm h-100">
                    <div className="tasker-header p-4 border-bottom">
                      <div className="d-flex align-items-center">
                        <div className="tasker-avatar mr-3">
                          <img 
                            src={tasker.avatar} 
                            alt={tasker.name} 
                            className="rounded-circle"
                            style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                          />
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 className="mb-1">{tasker.name}</h6>
                              <div className="d-flex align-items-center mb-1">
                                <FontAwesomeIcon icon={faStar} className="text-warning mr-1" />
                                <span className="font-weight-bold">{tasker.rating}</span>
                                <span className="text-muted ml-1">({tasker.reviews})</span>
                              </div>
                              <p className="text-muted mb-0">
                                <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1" />
                                {tasker.location}
                              </p>
                            </div>
                            <div className="text-right">
                              <button
                                className="btn btn-sm btn-link p-0"
                                onClick={() => toggleFavorite(tasker.id)}
                              >
                                <FontAwesomeIcon 
                                  icon={favorites.includes(tasker.id) ? faHeart : faHeartBroken} 
                                  className={favorites.includes(tasker.id) ? 'text-danger' : 'text-muted'}
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="tasker-body p-4">
                      <div className="tasker-stats mb-3">
                        <div className="row text-center">
                          <div className="col-4">
                            <div className="stat-item">
                              <h6 className="text-primary mb-1">${tasker.hourlyRate}</h6>
                              <small className="text-muted">per hour</small>
                            </div>
                          </div>
                          <div className="col-4">
                            <div className="stat-item">
                              <h6 className="text-success mb-1">{tasker.totalJobs}</h6>
                              <small className="text-muted">jobs</small>
                            </div>
                          </div>
                          <div className="col-4">
                            <div className="stat-item">
                              <h6 className="text-info mb-1">{tasker.successRate}%</h6>
                              <small className="text-muted">success</small>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="tasker-info mb-3">
                        <div className="info-item mb-2">
                          <small className="text-muted">Experience:</small>
                          <span className="ml-2">{tasker.experience}</span>
                        </div>
                        <div className="info-item mb-2">
                          <small className="text-muted">Availability:</small>
                          <span className="ml-2 text-success">{tasker.availability}</span>
                        </div>
                        <div className="info-item mb-2">
                          <small className="text-muted">Response Time:</small>
                          <span className="ml-2">{tasker.responseTime}</span>
                        </div>
                      </div>

                      <div className="tasker-services mb-3">
                        <h6 className="mb-2">Services</h6>
                        <div className="service-tags">
                          {tasker.services.slice(0, 3).map((service, index) => (
                            <span key={index} className="badge badge-light mr-1 mb-1">{service}</span>
                          ))}
                          {tasker.services.length > 3 && (
                            <span className="badge badge-secondary">+{tasker.services.length - 3} more</span>
                          )}
                        </div>
                      </div>

                      <div className="tasker-languages mb-3">
                        <h6 className="mb-2">Languages</h6>
                        <div className="language-tags">
                          {tasker.languages.map((language, index) => (
                            <span key={index} className="badge badge-outline-primary mr-1 mb-1">
                              <FontAwesomeIcon icon={faGlobe} className="mr-1" />
                              {language}
                            </span>
                          ))}
                        </div>
                      </div>

                      {tasker.verified && (
                        <div className="verification-badge mb-3">
                          <span className="badge badge-success">
                            <FontAwesomeIcon icon={faShieldAlt} className="mr-1" />
                            Verified Professional
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="tasker-footer p-4 border-top">
                      <div className="row">
                        <div className="col-6">
                          <button 
                            className="btn btn-outline-primary btn-sm w-100"
                            onClick={() => setSelectedTasker(tasker)}
                          >
                            <FontAwesomeIcon icon={faEye} className="mr-1" />
                            View Profile
                          </button>
                        </div>
                        <div className="col-6">
                          <button className="btn btn-primary btn-sm w-100">
                            <FontAwesomeIcon icon={faCalendar} className="mr-1" />
                            Book Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Tasker Detail Modal */}
      {selectedTasker && (
        <div className="modal-overlay">
          <div className="modal-content bg-white rounded shadow-lg p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5>Tasker Profile</h5>
              <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setSelectedTasker(null)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="tasker-details">
              <div className="row mb-4">
                <div className="col-md-4 text-center">
                  <img 
                    src={selectedTasker.avatar} 
                    alt={selectedTasker.name} 
                    className="rounded-circle mb-3"
                    style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                  />
                  <h5>{selectedTasker.name}</h5>
                  <div className="rating-section mb-2">
                    <FontAwesomeIcon icon={faStar} className="text-warning" />
                    <span className="font-weight-bold ml-1">{selectedTasker.rating}</span>
                    <span className="text-muted ml-1">({selectedTasker.reviews} reviews)</span>
                  </div>
                  {selectedTasker.verified && (
                    <span className="badge badge-success">
                      <FontAwesomeIcon icon={faShieldAlt} className="mr-1" />
                      Verified
                    </span>
                  )}
                </div>
                <div className="col-md-8">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="detail-item mb-2">
                        <strong>Location:</strong> {selectedTasker.location}
                      </div>
                      <div className="detail-item mb-2">
                        <strong>Experience:</strong> {selectedTasker.experience}
                      </div>
                      <div className="detail-item mb-2">
                        <strong>Hourly Rate:</strong> ${selectedTasker.hourlyRate}
                      </div>
                      <div className="detail-item mb-2">
                        <strong>Total Jobs:</strong> {selectedTasker.totalJobs}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="detail-item mb-2">
                        <strong>Success Rate:</strong> {selectedTasker.successRate}%
                      </div>
                      <div className="detail-item mb-2">
                        <strong>Response Time:</strong> {selectedTasker.responseTime}
                      </div>
                      <div className="detail-item mb-2">
                        <strong>Availability:</strong> {selectedTasker.availability}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-md-6">
                  <h6>Services Offered</h6>
                  <div className="service-list">
                    {selectedTasker.services.map((service, index) => (
                      <div key={index} className="service-item d-flex align-items-center mb-2">
                        <FontAwesomeIcon icon={faCheck} className="text-success mr-2" />
                        {service}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="col-md-6">
                  <h6>Specializations</h6>
                  <div className="specialization-list">
                    {selectedTasker.specializations.map((spec, index) => (
                      <span key={index} className="badge badge-info mr-2 mb-2">{spec}</span>
                    ))}
                  </div>
                  
                  <h6 className="mt-3">Certifications</h6>
                  <div className="certification-list">
                    {selectedTasker.certifications.map((cert, index) => (
                      <div key={index} className="certification-item d-flex align-items-center mb-2">
                        <FontAwesomeIcon icon={faCertificate} className="text-primary mr-2" />
                        {cert}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="tasker-actions text-center">
                <button className="btn btn-primary btn-lg mr-3">
                  <FontAwesomeIcon icon={faCalendar} className="mr-2" />
                  Book Now
                </button>
                <button className="btn btn-outline-primary btn-lg mr-3">
                  <FontAwesomeIcon icon={faPhone} className="mr-2" />
                  Call
                </button>
                <button className="btn btn-outline-secondary btn-lg">
                  <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                  Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {showRegistration && (
        <div className="modal-overlay">
          <div className="modal-content bg-white rounded shadow-lg p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5>Register as Tasker</h5>
              <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setShowRegistration(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <form>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label>First Name</label>
                    <input type="text" className="form-control" required />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label>Last Name</label>
                    <input type="text" className="form-control" required />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label>Email</label>
                    <input type="email" className="form-control" required />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label>Phone</label>
                    <input type="tel" className="form-control" required />
                  </div>
                </div>
              </div>

              <div className="form-group mb-3">
                <label>Address</label>
                <input type="text" className="form-control" required />
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label>Experience Level</label>
                    <select className="form-control" required>
                      <option>Beginner (0-1 years)</option>
                      <option>Intermediate (1-3 years)</option>
                      <option>Experienced (3-5 years)</option>
                      <option>Expert (5+ years)</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label>Hourly Rate</label>
                    <input type="number" className="form-control" placeholder="$" required />
                  </div>
                </div>
              </div>

              <div className="form-group mb-3">
                <label>Services You Offer</label>
                <div className="row">
                  {['House Cleaning', 'Kitchen Cleaning', 'Bathroom Cleaning', 'Window Cleaning', 'Deep Cleaning', 'Carpet Cleaning'].map((service) => (
                    <div key={service} className="col-md-6">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id={service} />
                        <label className="form-check-label" htmlFor={service}>
                          {service}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group mb-3">
                <label>Languages Spoken</label>
                <input type="text" className="form-control" placeholder="e.g., English, Spanish, French" />
              </div>

              <div className="form-group mb-3">
                <label>Bio</label>
                <textarea className="form-control" rows="3" placeholder="Tell us about your experience and approach to cleaning..."></textarea>
              </div>

              <div className="text-right">
                <button 
                  type="button" 
                  className="btn btn-secondary mr-2"
                  onClick={() => setShowRegistration(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                  Register as Tasker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .tasker-management-container {
          background-color: #f8f9fa;
          min-height: 100vh;
        }
        
        .page-header {
          border-bottom: 1px solid #e9ecef;
        }
        
        .tasker-card {
          transition: transform 0.2s;
        }
        
        .tasker-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1050;
        }
        
        .modal-content {
          max-width: 900px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }
        
        .stat-item {
          text-align: center;
        }
        
        .service-tags .badge,
        .language-tags .badge {
          font-size: 0.8rem;
        }
        
        .detail-item {
          font-size: 0.9rem;
        }
        
        .service-item,
        .certification-item {
          font-size: 0.9rem;
        }
        
        .specialization-list .badge {
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
};

export default TaskerManagement;
