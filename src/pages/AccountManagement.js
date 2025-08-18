import React, { useState } from 'react';
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
  faClock
} from '@fortawesome/free-solid-svg-icons';

const AccountManagement = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [userType, setUserType] = useState('customer'); // 'customer' or 'tasker'

  const [profileData, setProfileData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main Street, Downtown, NY 10001',
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
    { id: 'security', label: 'Security', icon: faLock },
    { id: 'certifications', label: 'Certifications', icon: faCertificate },
    { id: 'points', label: 'Points & Rewards', icon: faStar },
    { id: 'history', label: 'History', icon: faHistory },
    { id: 'settings', label: 'Settings', icon: faCog }
  ];

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    setIsEditing(false);
    // Here you would typically save to backend
    console.log('Profile updated:', profileData);
  };

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
            <div className="sidebar bg-white rounded shadow-sm">
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
                  <label>Address</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profileData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={!isEditing}
                  />
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
        
        .sidebar {
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
      `}</style>
    </div>
  );
};

export default AccountManagement;
