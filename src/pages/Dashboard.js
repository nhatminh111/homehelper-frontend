import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faUser, 
  faCalendar, 
  faCreditCard, 
  faStar, 
  faVideo, 
  faFileAlt, 
  faCog,
  faBell,
  faChartLine,
  faCheckCircle,
  faClock,
  faMapMarkerAlt,
  faPhone,
  faEnvelope
} from '@fortawesome/free-solid-svg-icons';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  const recentTasks = [
    {
      id: 1,
      title: 'House Cleaning',
      tasker: 'Sarah Johnson',
      date: '2025-01-15',
      status: 'completed',
      rating: 4.9,
      amount: 75
    },
    {
      id: 2,
      title: 'Kitchen Deep Cleaning',
      tasker: 'Maria Rodriguez',
      date: '2025-01-20',
      status: 'scheduled',
      rating: null,
      amount: 120
    },
    {
      id: 3,
      title: 'Window Cleaning',
      tasker: 'Jennifer Chen',
      date: '2025-01-18',
      status: 'in-progress',
      rating: null,
      amount: 60
    }
  ];

  const stats = [
    { title: 'Total Tasks', value: '24', icon: faCalendar, color: 'primary' },
    { title: 'Completed', value: '18', icon: faCheckCircle, color: 'success' },
    { title: 'Total Spent', value: '$1,250', icon: faCreditCard, color: 'warning' },
    { title: 'Average Rating', value: '4.8', icon: faStar, color: 'info' }
  ];

  const quickActions = [
    { title: 'Book New Service', icon: faCalendar, link: '/tasker-search', color: 'primary' },
    { title: 'View Tasks', icon: faCheckCircle, link: '/tasks', color: 'success' },
    { title: 'Make Payment', icon: faCreditCard, link: '/payment', color: 'warning' },
    { title: 'Rate Tasker', icon: faStar, link: '/ratings', color: 'info' },
    { title: 'Upload Video', icon: faVideo, link: '/video-upload', color: 'secondary' },
    { title: 'Read Posts', icon: faFileAlt, link: '/content', color: 'dark' }
  ];

  return (
    <div className="dashboard-container">
      {/* Top Navigation Bar */}
      <div className="dashboard-header bg-white shadow-sm">
        <div className="container-fluid">
          <div className="row align-items-center py-3">
            <div className="col-md-4">
              <div className="search-container">
                <FontAwesomeIcon icon={faSearch} className="search-icon" />
                <input
                  type="text"
                  className="form-control search-input"
                  placeholder="What do you want to learn..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
              <ul className="nav nav-pills justify-content-center">
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setActiveTab('dashboard')}
                  >
                    Dashboard
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'post' ? 'active' : ''}`}
                    onClick={() => setActiveTab('post')}
                  >
                    Post
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'certificate' ? 'active' : ''}`}
                    onClick={() => setActiveTab('certificate')}
                  >
                    Certificate
                  </button>
                </li>
              </ul>
            </div>
            <div className="col-md-4 text-right">
              <div className="d-flex align-items-center justify-content-end">
                <FontAwesomeIcon icon={faBell} className="mr-3 text-muted" />
                <div className="user-avatar">
                  <FontAwesomeIcon icon={faUser} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-fluid py-4">
        <div className="row">
          {/* Left Sidebar - Quick Stats */}
          <div className="col-md-3">
            <div className="stats-cards">
              {stats.map((stat, index) => (
                <div key={index} className={`stat-card bg-${stat.color} text-white mb-3`}>
                  <div className="d-flex align-items-center">
                    <FontAwesomeIcon icon={stat.icon} className="stat-icon" />
                    <div className="stat-content">
                      <h4 className="mb-0">{stat.value}</h4>
                      <small>{stat.title}</small>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="quick-actions bg-white rounded shadow-sm p-3">
              <h6 className="mb-3">Quick Actions</h6>
              <div className="row">
                {quickActions.map((action, index) => (
                  <div key={index} className="col-6 mb-2">
                    <Link to={action.link} className={`btn btn-${action.color} btn-sm w-100`}>
                      <FontAwesomeIcon icon={action.icon} className="mr-1" />
                      {action.title}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="col-md-9">
            {/* Welcome Section */}
            <div className="welcome-section bg-white rounded shadow-sm p-4 mb-4">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <h2>Welcome back, John!</h2>
                  <p className="text-muted mb-0">Here's what's happening with your cleaning services today.</p>
                </div>
                <div className="col-md-4 text-right">
                  <div className="emergency-contact">
                    <h6 className="text-danger mb-1">Emergency Cases</h6>
                    <p className="mb-0">
                      <FontAwesomeIcon icon={faPhone} className="mr-2" />
                      (+01) 123 456 7890
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Tasks */}
            <div className="recent-tasks bg-white rounded shadow-sm p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Recent Tasks</h5>
                <Link to="/tasks" className="btn btn-outline-primary btn-sm">View All</Link>
              </div>
              
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Tasker</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Rating</th>
                      <th>Amount</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTasks.map((task) => (
                      <tr key={task.id}>
                        <td>
                          <strong>{task.title}</strong>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="tasker-avatar mr-2">
                              <FontAwesomeIcon icon={faUser} />
                            </div>
                            {task.tasker}
                          </div>
                        </td>
                        <td>{task.date}</td>
                        <td>
                          <span className={`badge badge-${task.status === 'completed' ? 'success' : task.status === 'scheduled' ? 'info' : 'warning'}`}>
                            {task.status}
                          </span>
                        </td>
                        <td>
                          {task.rating ? (
                            <div className="d-flex align-items-center">
                              <FontAwesomeIcon icon={faStar} className="text-warning mr-1" />
                              {task.rating}
                            </div>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>${task.amount}</td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button className="btn btn-outline-primary">View</button>
                            {task.status === 'completed' && !task.rating && (
                              <button className="btn btn-outline-success">Rate</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Featured Taskers */}
            <div className="featured-taskers bg-white rounded shadow-sm p-4">
              <h5 className="mb-3">Top Taskers Near You</h5>
              <div className="row">
                {[
                  { name: 'Sarah Johnson', rating: 4.9, distance: '1.2 km', services: ['House Cleaning', 'Kitchen Cleaning'], rate: 25, verified: true },
                  { name: 'Maria Rodriguez', rating: 4.8, distance: '2.1 km', services: ['Deep Cleaning', 'Office Cleaning'], rate: 22, verified: true },
                  { name: 'Jennifer Chen', rating: 4.7, distance: '3.5 km', services: ['Window Cleaning', 'Carpet Cleaning'], rate: 28, verified: true }
                ].map((tasker, index) => (
                  <div key={index} className="col-md-4 mb-3">
                    <div className="tasker-card border rounded p-3">
                      <div className="d-flex align-items-center mb-2">
                        <div className="tasker-avatar mr-3">
                          <FontAwesomeIcon icon={faUser} />
                        </div>
                        <div>
                          <h6 className="mb-0">{tasker.name}</h6>
                          <div className="d-flex align-items-center">
                            <FontAwesomeIcon icon={faStar} className="text-warning mr-1" />
                            <span className="mr-2">{tasker.rating}</span>
                            {tasker.verified && (
                              <span className="badge badge-success">Verified</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="tasker-details">
                        <p className="mb-1">
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1" />
                          {tasker.distance} away
                        </p>
                        <p className="mb-1">
                          <strong>${tasker.rate}/hr</strong>
                        </p>
                        <div className="services-tags">
                          {tasker.services.map((service, idx) => (
                            <span key={idx} className="badge badge-light mr-1">{service}</span>
                          ))}
                        </div>
                      </div>
                      <div className="mt-3">
                        <Link to={`/tasker-profile/${index + 1}`} className="btn btn-outline-primary btn-sm mr-2">
                          View Profile
                        </Link>
                        <button className="btn btn-primary btn-sm">Book Now</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .dashboard-container {
          background-color: #f8f9fa;
          min-height: 100vh;
        }
        
        .dashboard-header {
          border-bottom: 1px solid #e9ecef;
        }
        
        .search-container {
          position: relative;
        }
        
        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
        }
        
        .search-input {
          padding-left: 35px;
        }
        
        .user-avatar {
          width: 40px;
          height: 40px;
          background-color: #007bff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .stat-card {
          border-radius: 10px;
          padding: 1rem;
        }
        
        .stat-icon {
          font-size: 2rem;
          margin-right: 1rem;
        }
        
        .tasker-avatar {
          width: 30px;
          height: 30px;
          background-color: #e9ecef;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6c757d;
        }
        
        .tasker-card {
          transition: transform 0.2s;
        }
        
        .tasker-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .services-tags {
          margin-top: 0.5rem;
        }
        
        .emergency-contact {
          background-color: #f8f9fa;
          padding: 1rem;
          border-radius: 8px;
          border-left: 4px solid #dc3545;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
