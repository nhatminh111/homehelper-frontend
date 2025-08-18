import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faFilter, 
  faEye, 
  faCheck, 
  faTimes,
  faUser,
  faCalendar,
  faTag,
  faChevronDown,
  faChevronUp,
  faBell,
  faCog
} from '@fortawesome/free-solid-svg-icons';

const ContentManagement = () => {
  const [activeTab, setActiveTab] = useState('post');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState(3);
  const [expandedCategories, setExpandedCategories] = useState({
    'General House Cleaning': true,
    'Deep Cleaning': false,
    'Window & Glass Cleaning': false,
    'Kitchen Cleaning': false,
    'Bathroom Cleaning': false,
    'Laundry & Ironing': false,
    'Garden & Outdoor Cleaning': false,
    'Furniture Cleaning': false
  });

  const categories = {
    'General House Cleaning': {
      'Sweeping': 574,
      'Vacuuming': 568,
      'Dusting': 568,
      'Mopping': 568
    },
    'Deep Cleaning': {},
    'Window & Glass Cleaning': {},
    'Kitchen Cleaning': {},
    'Bathroom Cleaning': {},
    'Laundry & Ironing': {},
    'Garden & Outdoor Cleaning': {},
    'Furniture Cleaning': {}
  };

  const posts = [
    {
      id: 1,
      title: 'How to Clean a Sofa Without Using Water',
      category: 'FURNITURE CLEANING',
      date: '13/08/2025',
      author: 'Thanh Hieu',
      status: 'PENDING',
      image: '/images/work-1.jpg'
    },
    {
      id: 2,
      title: 'How to Eliminate Fridge Odors with Just a Lemon',
      category: 'KITCHEN CLEANING',
      date: '13/08/2025',
      author: 'Thanh Hieu',
      status: 'PENDING',
      image: '/images/work-2.jpg'
    },
    {
      id: 3,
      title: 'Natural Ways to Eliminate Bathroom Odors',
      category: 'BATHROOM CLEANING',
      date: '13/08/2025',
      author: 'Thanh Hieu',
      status: 'PENDING',
      image: '/images/work-3.jpg'
    },
    {
      id: 4,
      title: 'Safe Outdoor Glass Cleaning Tips',
      category: 'WINDOW & GLASS CLEANING',
      date: '13/08/2025',
      author: 'Thanh Hieu',
      status: 'PENDING',
      image: '/images/work-4.jpg'
    },
    {
      id: 5,
      title: 'Laundry Sorting Tips to Protect Your Fabrics',
      category: 'LAUNDRY & IRONING',
      date: '13/08/2025',
      author: 'Thanh Hieu',
      status: 'PENDING',
      image: '/images/work-5.jpg'
    },
    {
      id: 6,
      title: 'Easy Lawn Care for Beginners',
      category: 'GARDEN & OUTDOOR CLEANING',
      date: '13/08/2025',
      author: 'Thanh Hieu',
      status: 'PENDING',
      image: '/images/work-6.jpg'
    }
  ];

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  return (
    <div className="content-management-container">
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
                <FontAwesomeIcon icon={faSearch} className="mr-3 text-muted" />
                <FontAwesomeIcon icon={faBell} className="mr-3 text-muted" />
                <div className="user-avatar">
                  <FontAwesomeIcon icon={faUser} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="container-fluid py-2">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb bg-transparent px-0">
            <li className="breadcrumb-item"><a href="#">Home</a></li>
            <li className="breadcrumb-item"><a href="#">Post</a></li>
            <li className="breadcrumb-item active" aria-current="page">Post Details</li>
          </ol>
        </nav>
      </div>

      {/* Main Content */}
      <div className="container-fluid py-4">
        <div className="row">
          {/* Left Sidebar - Filters */}
          <div className="col-lg-3">
            <div className="filters-sidebar bg-white rounded shadow-sm p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Filters</h5>
                <button className="btn btn-outline-primary btn-sm">
                  <FontAwesomeIcon icon={faFilter} className="mr-1" />
                  Filter ({activeFilters})
                </button>
              </div>

              {/* Category Filter */}
              <div className="filter-section mb-4">
                <h6>CATEGORY</h6>
                {Object.entries(categories).map(([category, subcategories]) => (
                  <div key={category} className="category-item">
                    <div 
                      className="category-header d-flex justify-content-between align-items-center"
                      onClick={() => toggleCategory(category)}
                    >
                      <span>{category}</span>
                      <FontAwesomeIcon 
                        icon={expandedCategories[category] ? faChevronUp : faChevronDown} 
                        className="text-muted"
                      />
                    </div>
                    {expandedCategories[category] && Object.keys(subcategories).length > 0 && (
                      <div className="subcategories ml-3 mt-2">
                        {Object.entries(subcategories).map(([subcategory, count]) => (
                          <div key={subcategory} className="subcategory-item d-flex justify-content-between align-items-center">
                            <span>{subcategory}</span>
                            <span className="badge badge-light">{count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Status Filter */}
              <div className="filter-section mb-4">
                <h6>STATUS</h6>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="pending" defaultChecked />
                  <label className="form-check-label d-flex justify-content-between" htmlFor="pending">
                    Pending
                    <span className="badge badge-warning">1345</span>
                  </label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="approved" />
                  <label className="form-check-label d-flex justify-content-between" htmlFor="approved">
                    Approved
                    <span className="badge badge-success">1345</span>
                  </label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="rejected" />
                  <label className="form-check-label d-flex justify-content-between" htmlFor="rejected">
                    Rejected
                    <span className="badge badge-danger">1345</span>
                  </label>
                </div>
              </div>

              {/* Submission Date Filter */}
              <div className="filter-section mb-4">
                <h6>SUBMISSION DATE</h6>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="today" defaultChecked />
                  <label className="form-check-label d-flex justify-content-between" htmlFor="today">
                    Today
                    <span className="badge badge-info">1345</span>
                  </label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="thisWeek" />
                  <label className="form-check-label d-flex justify-content-between" htmlFor="thisWeek">
                    This week
                    <span className="badge badge-info">1345</span>
                  </label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="thisMonth" />
                  <label className="form-check-label d-flex justify-content-between" htmlFor="thisMonth">
                    This month
                    <span className="badge badge-info">1345</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Posts Grid */}
          <div className="col-lg-9">
            {/* Search Bar */}
            <div className="search-bar-container bg-white rounded shadow-sm p-3 mb-4">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search"
                />
                <div className="input-group-append">
                  <button className="btn btn-outline-secondary">
                    <FontAwesomeIcon icon={faSearch} />
                  </button>
                </div>
              </div>
            </div>

            {/* Posts Grid */}
            <div className="posts-grid">
              <div className="row">
                {posts.map((post) => (
                  <div key={post.id} className="col-md-6 col-lg-4 mb-4">
                    <div className="post-card bg-white rounded shadow-sm h-100">
                      <div className="post-image">
                        <img src={post.image} alt={post.title} className="img-fluid rounded-top" />
                        <div className="post-category">
                          <span className="badge badge-primary">{post.category}</span>
                        </div>
                      </div>
                      <div className="post-content p-3">
                        <h6 className="post-title mb-2">{post.title}</h6>
                        <div className="post-meta mb-3">
                          <div className="d-flex align-items-center mb-1">
                            <FontAwesomeIcon icon={faUser} className="mr-2 text-muted" />
                            <small className="text-muted">Posted by {post.author}</small>
                          </div>
                          <div className="d-flex align-items-center">
                            <FontAwesomeIcon icon={faCalendar} className="mr-2 text-muted" />
                            <small className="text-muted">{post.date}</small>
                          </div>
                        </div>
                        <div className="post-status d-flex justify-content-between align-items-center">
                          <span className={`badge badge-${post.status === 'PENDING' ? 'warning' : post.status === 'APPROVED' ? 'success' : 'danger'}`}>
                            {post.status}
                          </span>
                          <div className="post-actions">
                            <button className="btn btn-sm btn-outline-primary mr-1">
                              <FontAwesomeIcon icon={faEye} />
                            </button>
                            <button className="btn btn-sm btn-success mr-1">
                              <FontAwesomeIcon icon={faCheck} />
                            </button>
                            <button className="btn btn-sm btn-danger">
                              <FontAwesomeIcon icon={faTimes} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            <div className="pagination-container d-flex justify-content-center mt-4">
              <nav aria-label="Posts pagination">
                <ul className="pagination">
                  <li className="page-item">
                    <a className="page-link" href="#" aria-label="Previous">
                      <span aria-hidden="true">&laquo;</span>
                    </a>
                  </li>
                  <li className="page-item">
                    <a className="page-link" href="#">01</a>
                  </li>
                  <li className="page-item active">
                    <a className="page-link" href="#">02</a>
                  </li>
                  <li className="page-item">
                    <a className="page-link" href="#">03</a>
                  </li>
                  <li className="page-item">
                    <a className="page-link" href="#">04</a>
                  </li>
                  <li className="page-item">
                    <a className="page-link" href="#">05</a>
                  </li>
                  <li className="page-item">
                    <a className="page-link" href="#" aria-label="Next">
                      <span aria-hidden="true">&raquo;</span>
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .content-management-container {
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
        
        .filters-sidebar {
          position: sticky;
          top: 20px;
        }
        
        .filter-section {
          border-bottom: 1px solid #e9ecef;
          padding-bottom: 1rem;
        }
        
        .filter-section:last-child {
          border-bottom: none;
        }
        
        .category-header {
          cursor: pointer;
          padding: 8px 0;
          font-weight: 500;
        }
        
        .category-header:hover {
          background-color: #f8f9fa;
          border-radius: 4px;
          padding: 8px;
          margin: 0 -8px;
        }
        
        .subcategory-item {
          padding: 4px 0;
          font-size: 0.9rem;
        }
        
        .post-card {
          transition: transform 0.2s;
          overflow: hidden;
        }
        
        .post-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .post-image {
          position: relative;
          height: 200px;
          overflow: hidden;
        }
        
        .post-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .post-category {
          position: absolute;
          top: 10px;
          left: 10px;
        }
        
        .post-title {
          font-size: 1rem;
          line-height: 1.4;
          height: 2.8rem;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        
        .post-meta {
          font-size: 0.85rem;
        }
        
        .post-actions {
          display: flex;
          gap: 4px;
        }
        
        .post-actions .btn {
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
        }
        
        .breadcrumb {
          margin-bottom: 0;
        }
        
        .breadcrumb-item a {
          color: #007bff;
          text-decoration: none;
        }
        
        .breadcrumb-item.active {
          color: #6c757d;
        }
      `}</style>
    </div>
  );
};

export default ContentManagement;
