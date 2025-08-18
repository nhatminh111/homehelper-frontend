import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, 
  faUsers, 
  faDollarSign, 
  faStar,
  faExclamationTriangle,
  faCheck,
  faTimes,
  faEye,
  faEdit,
  faTrash,
  faDownload,
  faPrint,
  faFilter,
  faSearch,
  faCalendar,
  faClock,
  faMapMarkerAlt,
  faUser,
  faCog,
  faTools,
  faShieldAlt,
  faHistory,
  faFileAlt,
  faChartBar,
  faTachometerAlt,
  faBell,
  faWrench,
  faPlus
} from '@fortawesome/free-solid-svg-icons';

const SystemManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedReport, setSelectedReport] = useState(null);

  const systemStats = {
    totalUsers: 15420,
    activeTaskers: 1245,
    totalRevenue: 125000,
    averageRating: 4.8,
    completionRate: 96.5,
    responseTime: '1.2hr',
    pendingIssues: 23,
    systemUptime: 99.9
  };

  const recentIssues = [
    {
      id: 1,
      type: 'Payment',
      description: 'Payment processing delay for user #12345',
      priority: 'high',
      status: 'in_progress',
      date: '2025-01-15',
      assignedTo: 'Admin Team'
    },
    {
      id: 2,
      type: 'GPS',
      description: 'Location tracking not working for tasker #678',
      priority: 'medium',
      status: 'open',
      date: '2025-01-14',
      assignedTo: 'Tech Team'
    },
    {
      id: 3,
      type: 'Group Chat',
      description: 'Group chat messages not syncing properly',
      priority: 'low',
      status: 'resolved',
      date: '2025-01-13',
      assignedTo: 'Dev Team'
    }
  ];

  const reports = [
    {
      id: 1,
      name: 'Monthly Revenue Report',
      type: 'Financial',
      date: '2025-01-15',
      status: 'completed',
      size: '2.3 MB'
    },
    {
      id: 2,
      name: 'User Activity Report',
      type: 'Analytics',
      date: '2025-01-14',
      status: 'completed',
      size: '1.8 MB'
    },
    {
      id: 3,
      name: 'Tasker Performance Report',
      type: 'Performance',
      date: '2025-01-13',
      status: 'pending',
      size: '3.1 MB'
    }
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'danger';
      case 'in_progress': return 'warning';
      case 'resolved': return 'success';
      case 'completed': return 'success';
      case 'pending': return 'warning';
      default: return 'secondary';
    }
  };

  return (
    <div className="system-management-container">
      {/* Header */}
      <div className="page-header bg-white shadow-sm">
        <div className="container">
          <div className="row align-items-center py-4">
            <div className="col-md-6">
              <h1 className="mb-0">
                <FontAwesomeIcon icon={faCog} className="text-primary mr-2" />
                System Management
              </h1>
              <p className="text-muted mb-0">Admin dashboard for system monitoring and management</p>
            </div>
            <div className="col-md-6 text-right">
              <button className="btn btn-primary mr-2">
                <FontAwesomeIcon icon={faDownload} className="mr-2" />
                Export Data
              </button>
              <button className="btn btn-outline-secondary">
                <FontAwesomeIcon icon={faCog} className="mr-2" />
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-4">
        {/* System Overview Cards */}
        <div className="system-overview mb-4">
          <div className="row">
            <div className="col-md-3 mb-3">
              <div className="stat-card bg-primary text-white rounded p-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className="mb-1">{systemStats.totalUsers.toLocaleString()}</h4>
                    <p className="mb-0">Total Users</p>
                  </div>
                  <FontAwesomeIcon icon={faUsers} size="2x" />
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="stat-card bg-success text-white rounded p-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className="mb-1">{systemStats.activeTaskers.toLocaleString()}</h4>
                    <p className="mb-0">Active Taskers</p>
                  </div>
                  <FontAwesomeIcon icon={faUser} size="2x" />
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="stat-card bg-warning text-white rounded p-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className="mb-1">${systemStats.totalRevenue.toLocaleString()}</h4>
                    <p className="mb-0">Total Revenue</p>
                  </div>
                  <FontAwesomeIcon icon={faDollarSign} size="2x" />
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="stat-card bg-info text-white rounded p-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className="mb-1">{systemStats.averageRating}</h4>
                    <p className="mb-0">Avg Rating</p>
                  </div>
                  <FontAwesomeIcon icon={faStar} size="2x" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          {/* Left Column - Main Content */}
          <div className="col-lg-8">
            {/* Tabs */}
            <div className="tabs-section bg-white rounded shadow-sm mb-4">
              <ul className="nav nav-tabs" id="systemTabs" role="tablist">
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                  >
                    <FontAwesomeIcon icon={faTachometerAlt} className="mr-2" />
                    Overview
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'issues' ? 'active' : ''}`}
                    onClick={() => setActiveTab('issues')}
                  >
                    <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                    Issues
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reports')}
                  >
                    <FontAwesomeIcon icon={faFileAlt} className="mr-2" />
                    Reports
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'analytics' ? 'active' : ''}`}
                    onClick={() => setActiveTab('analytics')}
                  >
                    <FontAwesomeIcon icon={faChartBar} className="mr-2" />
                    Analytics
                  </button>
                </li>
              </ul>

              <div className="tab-content p-4">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="overview-content">
                    <h5 className="mb-4">System Performance Overview</h5>
                    
                    <div className="row mb-4">
                      <div className="col-md-6">
                        <div className="performance-card border rounded p-3 mb-3">
                          <h6>Service Completion Rate</h6>
                          <div className="progress mb-2" style={{ height: '20px' }}>
                            <div className="progress-bar bg-success" style={{ width: `${systemStats.completionRate}%` }}>
                              {systemStats.completionRate}%
                            </div>
                          </div>
                          <small className="text-muted">Target: 95%</small>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="performance-card border rounded p-3 mb-3">
                          <h6>System Uptime</h6>
                          <div className="progress mb-2" style={{ height: '20px' }}>
                            <div className="progress-bar bg-info" style={{ width: `${systemStats.systemUptime}%` }}>
                              {systemStats.systemUptime}%
                            </div>
                          </div>
                          <small className="text-muted">Target: 99.9%</small>
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="metric-card border rounded p-3">
                          <h6>Average Response Time</h6>
                          <h4 className="text-primary">{systemStats.responseTime}</h4>
                          <small className="text-muted">Target: &lt; 2 hours</small>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="metric-card border rounded p-3">
                          <h6>Pending Issues</h6>
                          <h4 className="text-warning">{systemStats.pendingIssues}</h4>
                          <small className="text-muted">Requires attention</small>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Issues Tab */}
                {activeTab === 'issues' && (
                  <div className="issues-content">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5>System Issues</h5>
                      <button className="btn btn-primary btn-sm">
                        <FontAwesomeIcon icon={faPlus} className="mr-1" />
                        Create Issue
                      </button>
                    </div>

                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Type</th>
                            <th>Description</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Assigned To</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentIssues.map((issue) => (
                            <tr key={issue.id}>
                              <td>
                                <span className="badge badge-secondary">{issue.type}</span>
                              </td>
                              <td>{issue.description}</td>
                              <td>
                                <span className={`badge badge-${getPriorityColor(issue.priority)}`}>
                                  {issue.priority.toUpperCase()}
                                </span>
                              </td>
                              <td>
                                <span className={`badge badge-${getStatusColor(issue.status)}`}>
                                  {issue.status.replace('_', ' ').toUpperCase()}
                                </span>
                              </td>
                              <td>{issue.date}</td>
                              <td>{issue.assignedTo}</td>
                              <td>
                                <button className="btn btn-sm btn-outline-primary mr-1">
                                  <FontAwesomeIcon icon={faEye} />
                                </button>
                                <button className="btn btn-sm btn-outline-warning mr-1">
                                  <FontAwesomeIcon icon={faEdit} />
                                </button>
                                <button className="btn btn-sm btn-outline-success">
                                  <FontAwesomeIcon icon={faCheck} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Reports Tab */}
                {activeTab === 'reports' && (
                  <div className="reports-content">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5>System Reports</h5>
                      <button className="btn btn-primary btn-sm">
                        <FontAwesomeIcon icon={faFileAlt} className="mr-1" />
                        Generate Report
                      </button>
                    </div>

                    <div className="reports-list">
                      {reports.map((report) => (
                        <div key={report.id} className="report-card border rounded p-3 mb-3">
                          <div className="row align-items-center">
                            <div className="col-md-4">
                              <h6 className="mb-1">{report.name}</h6>
                              <p className="text-muted mb-0">{report.type}</p>
                            </div>
                            <div className="col-md-2">
                              <small className="text-muted">{report.date}</small>
                            </div>
                            <div className="col-md-2">
                              <span className={`badge badge-${getStatusColor(report.status)}`}>
                                {report.status.toUpperCase()}
                              </span>
                            </div>
                            <div className="col-md-2">
                              <small className="text-muted">{report.size}</small>
                            </div>
                            <div className="col-md-2 text-right">
                              <button className="btn btn-sm btn-outline-primary mr-1">
                                <FontAwesomeIcon icon={faEye} />
                              </button>
                              <button className="btn btn-sm btn-outline-secondary mr-1">
                                <FontAwesomeIcon icon={faDownload} />
                              </button>
                              <button className="btn btn-sm btn-outline-info">
                                <FontAwesomeIcon icon={faPrint} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                  <div className="analytics-content">
                    <h5 className="mb-4">System Analytics</h5>
                    
                    <div className="row">
                      <div className="col-md-6">
                        <div className="chart-container bg-light rounded p-3 mb-3">
                          <h6>User Growth</h6>
                          <div className="chart-placeholder d-flex align-items-center justify-content-center" style={{ height: '200px' }}>
                            <div className="text-center">
                              <FontAwesomeIcon icon={faChartLine} size="3x" className="text-muted mb-3" />
                              <p className="text-muted">User growth chart would be displayed here</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="chart-container bg-light rounded p-3 mb-3">
                          <h6>Revenue Trends</h6>
                          <div className="chart-placeholder d-flex align-items-center justify-content-center" style={{ height: '200px' }}>
                            <div className="text-center">
                              <FontAwesomeIcon icon={faChartBar} size="3x" className="text-muted mb-3" />
                              <p className="text-muted">Revenue trends chart would be displayed here</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions & System Status */}
          <div className="col-lg-4">
            {/* System Status */}
            <div className="system-status bg-white rounded shadow-sm p-4 mb-4">
              <h6 className="mb-3">
                <FontAwesomeIcon icon={faShieldAlt} className="mr-2" />
                System Status
              </h6>
              <div className="status-item d-flex justify-content-between align-items-center mb-2">
                <span>Database</span>
                <span className="badge badge-success">Online</span>
              </div>
              <div className="status-item d-flex justify-content-between align-items-center mb-2">
                <span>Payment Gateway</span>
                <span className="badge badge-success">Online</span>
              </div>
              <div className="status-item d-flex justify-content-between align-items-center mb-2">
                <span>GPS Services</span>
                <span className="badge badge-warning">Warning</span>
              </div>
              <div className="status-item d-flex justify-content-between align-items-center mb-2">
                <span>Email Service</span>
                <span className="badge badge-success">Online</span>
              </div>
              <div className="status-item d-flex justify-content-between align-items-center">
                <span>Chat System</span>
                <span className="badge badge-success">Online</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions bg-white rounded shadow-sm p-4 mb-4">
              <h6 className="mb-3">
                <FontAwesomeIcon icon={faTools} className="mr-2" />
                Quick Actions
              </h6>
              <button className="btn btn-primary btn-block mb-2">
                <FontAwesomeIcon icon={faWrench} className="mr-2" />
                System Maintenance
              </button>
              <button className="btn btn-outline-primary btn-block mb-2">
                <FontAwesomeIcon icon={faDownload} className="mr-2" />
                Backup Database
              </button>
              <button className="btn btn-outline-warning btn-block mb-2">
                <FontAwesomeIcon icon={faBell} className="mr-2" />
                Send Notifications
              </button>
              <button className="btn btn-outline-info btn-block">
                <FontAwesomeIcon icon={faHistory} className="mr-2" />
                View Logs
              </button>
            </div>

            {/* Recent Activity */}
            <div className="recent-activity bg-white rounded shadow-sm p-4">
              <h6 className="mb-3">
                <FontAwesomeIcon icon={faHistory} className="mr-2" />
                Recent Activity
              </h6>
              <div className="activity-item d-flex align-items-center mb-2">
                <div className="activity-icon bg-success text-white rounded-circle mr-2" style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>
                  <FontAwesomeIcon icon={faCheck} />
                </div>
                <div>
                  <small className="font-weight-bold">System backup completed</small>
                  <br />
                  <small className="text-muted">2 hours ago</small>
                </div>
              </div>
              <div className="activity-item d-flex align-items-center mb-2">
                <div className="activity-icon bg-warning text-white rounded-circle mr-2" style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                </div>
                <div>
                  <small className="font-weight-bold">Payment issue resolved</small>
                  <br />
                  <small className="text-muted">4 hours ago</small>
                </div>
              </div>
              <div className="activity-item d-flex align-items-center">
                <div className="activity-icon bg-info text-white rounded-circle mr-2" style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>
                  <FontAwesomeIcon icon={faUser} />
                </div>
                <div>
                  <small className="font-weight-bold">New tasker registered</small>
                  <br />
                  <small className="text-muted">6 hours ago</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .system-management-container {
          background-color: #f8f9fa;
          min-height: 100vh;
        }
        
        .page-header {
          border-bottom: 1px solid #e9ecef;
        }
        
        .stat-card {
          transition: transform 0.2s;
        }
        
        .stat-card:hover {
          transform: translateY(-2px);
        }
        
        .performance-card,
        .metric-card {
          transition: transform 0.2s;
        }
        
        .performance-card:hover,
        .metric-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .report-card {
          transition: transform 0.2s;
        }
        
        .report-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .chart-placeholder {
          background-color: #f8f9fa;
          border: 2px dashed #dee2e6;
        }
        
        .status-item {
          font-size: 0.9rem;
        }
        
        .activity-item {
          font-size: 0.85rem;
        }
        
        .activity-icon {
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
};

export default SystemManagement;
