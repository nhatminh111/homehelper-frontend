import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft,
  faStar,
  faMapMarkerAlt,
  faClock,
  faUser,
  faAward,
  faCheckCircle,
  faPhone,
  faComments,
  faCalendar,
  faDollarSign,
  faGlobe,
  faThumbsUp,
  faEye
} from '@fortawesome/free-solid-svg-icons';

const TaskerProfile = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for the tasker
  const tasker = {
    id: id,
    name: 'Sarah Johnson',
    avatar: '/images/person_1.jpg',
    verified: true,
    rating: 4.9,
    reviews: 124,
    jobsDone: 340,
    successRate: 98,
    hourlyRate: 25,
    location: 'Downtown, 2.3 km away',
    experience: '5 years experience',
    availability: 'Available Now',
    responseTime: '1hr Response Time',
    awards: 5,
    languages: ['English', 'Spanish', 'French'],
    specializations: ['Deep Cleaning', 'Kitchen Cleaning', 'Bathroom Sanitization', 'Window Cleaning'],
    description: 'Professional cleaner with expertise in deep cleaning, kitchen sanitization, and eco-friendly cleaning methods. Committed to delivering exceptional results and building long-term relationships with clients.',
    reviews: [
      {
        id: 1,
        name: 'Emily Chen',
        verified: true,
        rating: 5,
        date: '2025-01-15',
        service: 'Deep Cleaning',
        text: 'Sarah did an amazing job with our deep cleaning. The kitchen looks brand new and she was very professional throughout the entire process.',
        image: '/images/work-1.jpg',
        helpful: 12
      },
      {
        id: 2,
        name: 'Michael Rodriguez',
        verified: true,
        rating: 5,
        date: '2025-01-12',
        service: 'Bathroom Cleaning',
        text: 'Excellent bathroom cleaning service. Sarah was thorough and used eco-friendly products as requested. Highly recommend!',
        image: null,
        helpful: 8
      },
      {
        id: 3,
        name: 'Lisa Thompson',
        verified: true,
        rating: 4,
        date: '2025-01-10',
        service: 'House Cleaning',
        text: 'Very good house cleaning service. Sarah was punctual and did a thorough job. Would book again.',
        image: null,
        helpful: 5
      },
      {
        id: 4,
        name: 'David Park',
        verified: true,
        rating: 5,
        date: '2025-01-08',
        service: 'Kitchen Cleaning',
        text: 'Outstanding kitchen cleaning! Sarah went above and beyond. The before and after photos speak for themselves.',
        image: '/images/work-2.jpg',
        helpful: 15
      }
    ],
    ratingBreakdown: {
      5: 98,
      4: 20,
      3: 4,
      2: 2,
      1: 0
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: faEye },
    { id: 'reviews', label: 'Reviews', icon: faStar },
    { id: 'videos', label: 'Videos', icon: faEye },
    { id: 'skills', label: 'Skills', icon: faAward },
    { id: 'achievements', label: 'Achievements', icon: faCheckCircle }
  ];

  return (
    <div className="tasker-profile-container">
      {/* Header Banner */}
      <div className="profile-banner" style={{ backgroundImage: "url('/images/bg_3.jpg')" }}>
        <div className="overlay"></div>
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="banner-content text-white">
                <Link to="/tasker-search" className="back-link text-white">
                  <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                  Back to Search
                </Link>
                <h1 className="company-name text-center">CLEANINGCOMPANY</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-4">
        <div className="row">
          {/* Left Column - Profile Summary */}
          <div className="col-lg-8">
            {/* Profile Summary Card */}
            <div className="profile-summary bg-white rounded shadow-sm p-4 mb-4">
              <div className="row align-items-center">
                <div className="col-md-3 text-center">
                  <div className="profile-avatar mb-3">
                    <img src={tasker.avatar} alt={tasker.name} className="rounded-circle" />
                  </div>
                </div>
                <div className="col-md-6">
                  <h3 className="mb-1">{tasker.name}</h3>
                  {tasker.verified && (
                    <span className="badge badge-success mb-2">Verified Professional</span>
                  )}
                  <div className="rating-section mb-2">
                    <FontAwesomeIcon icon={faStar} className="text-warning mr-1" />
                    <span className="font-weight-bold">{tasker.rating}</span>
                    <span className="text-muted ml-1">({tasker.reviews} reviews)</span>
                  </div>
                  <div className="stats-row mb-3">
                    <span className="stat-item">
                      <strong>{tasker.jobsDone}</strong> Jobs Done
                    </span>
                    <span className="stat-item">
                      <strong>{tasker.successRate}%</strong> Success Rate
                    </span>
                  </div>
                  <div className="action-buttons">
                    <button className="btn btn-primary mr-2">
                      Book Now - ${tasker.hourlyRate}/hr
                    </button>
                    <button className="btn btn-outline-primary">
                      <FontAwesomeIcon icon={faComments} className="mr-1" />
                      Start Chat
                    </button>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="profile-details">
                    <p className="mb-2">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" />
                      {tasker.location}
                    </p>
                    <p className="mb-2">
                      <FontAwesomeIcon icon={faClock} className="mr-2" />
                      {tasker.experience}
                    </p>
                    <p className="mb-2">
                      <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                      {tasker.availability}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tasker Details */}
            <div className="tasker-details bg-white rounded shadow-sm p-4 mb-4">
              <h5 className="mb-3">About {tasker.name}</h5>
              <p className="mb-3">{tasker.description}</p>
              
              <div className="specializations mb-3">
                <h6>Specializations</h6>
                <div className="specialization-tags">
                  {tasker.specializations.map((spec, index) => (
                    <span key={index} className="badge badge-primary mr-2 mb-2">{spec}</span>
                  ))}
                </div>
              </div>

              <div className="languages mb-3">
                <h6>Languages</h6>
                <div className="language-tags">
                  {tasker.languages.map((lang, index) => (
                    <span key={index} className="badge badge-light mr-2 mb-2">
                      <FontAwesomeIcon icon={faGlobe} className="mr-1" />
                      {lang}
                    </span>
                  ))}
                </div>
              </div>

              <div className="metrics-row">
                <div className="metric-card">
                  <h6>{tasker.responseTime}</h6>
                </div>
                <div className="metric-card">
                  <h6>{tasker.experience}</h6>
                </div>
                <div className="metric-card">
                  <h6>{tasker.awards} Awards Won</h6>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="reviews-section bg-white rounded shadow-sm p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Reviews</h5>
                <div className="tab-navigation">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-outline-primary'} mr-2`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <FontAwesomeIcon icon={tab.icon} className="mr-1" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {activeTab === 'reviews' && (
                <div className="reviews-content">
                  <div className="row">
                    <div className="col-md-4">
                      <div className="rating-overview">
                        <div className="overall-rating text-center mb-3">
                          <h2 className="text-primary mb-0">{tasker.rating}</h2>
                          <div className="stars mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <FontAwesomeIcon 
                                key={star} 
                                icon={faStar} 
                                className={star <= tasker.rating ? 'text-warning' : 'text-muted'} 
                              />
                            ))}
                          </div>
                          <p className="text-muted">Based on {tasker.reviews} reviews</p>
                        </div>
                        
                        <div className="rating-breakdown">
                          {Object.entries(tasker.ratingBreakdown).reverse().map(([rating, count]) => (
                            <div key={rating} className="rating-bar d-flex align-items-center mb-2">
                              <span className="rating-label mr-2">{rating}★</span>
                              <div className="progress flex-grow-1 mr-2" style={{ height: '8px' }}>
                                <div 
                                  className="progress-bar bg-warning" 
                                  style={{ width: `${(count / tasker.reviews) * 100}%` }}
                                ></div>
                              </div>
                              <span className="rating-count">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-8">
                      <div className="reviews-list">
                        {tasker.reviews.map((review) => (
                          <div key={review.id} className="review-item border-bottom pb-3 mb-3">
                            <div className="review-header d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <h6 className="mb-1">{review.name}</h6>
                                {review.verified && (
                                  <span className="badge badge-success badge-sm">Verified</span>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="stars mb-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <FontAwesomeIcon 
                                      key={star} 
                                      icon={faStar} 
                                      className={star <= review.rating ? 'text-warning' : 'text-muted'} 
                                      size="sm"
                                    />
                                  ))}
                                </div>
                                <small className="text-muted">{review.date}</small>
                              </div>
                            </div>
                            <p className="mb-2">
                              <strong>Service:</strong> {review.service}
                            </p>
                            <p className="mb-2">{review.text}</p>
                            {review.image && (
                              <div className="review-image mb-2">
                                <img src={review.image} alt="Review" className="img-fluid rounded" style={{ maxWidth: '200px' }} />
                              </div>
                            )}
                            <div className="review-footer">
                              <button className="btn btn-sm btn-outline-secondary">
                                <FontAwesomeIcon icon={faThumbsUp} className="mr-1" />
                                Helpful ({review.helpful})
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'videos' && (
                <div className="videos-content">
                  <p className="text-muted">Video content would be displayed here</p>
                </div>
              )}

              {activeTab === 'skills' && (
                <div className="skills-content">
                  <div className="row">
                    {tasker.specializations.map((skill, index) => (
                      <div key={index} className="col-md-6 mb-3">
                        <div className="skill-card border rounded p-3">
                          <h6>{skill}</h6>
                          <div className="progress mb-2" style={{ height: '8px' }}>
                            <div className="progress-bar bg-primary" style={{ width: `${85 + Math.random() * 15}%` }}></div>
                          </div>
                          <small className="text-muted">Expert level</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'achievements' && (
                <div className="achievements-content">
                  <div className="row">
                    {[
                      { title: 'Top Performer', description: 'Consistently high ratings', icon: faAward },
                      { title: 'Quick Response', description: 'Fast response times', icon: faClock },
                      { title: 'Eco-Friendly', description: 'Green cleaning certified', icon: faCheckCircle },
                      { title: 'Customer Favorite', description: 'Most booked tasker', icon: faStar }
                    ].map((achievement, index) => (
                      <div key={index} className="col-md-6 mb-3">
                        <div className="achievement-card border rounded p-3 text-center">
                          <FontAwesomeIcon icon={achievement.icon} className="text-primary mb-2" size="2x" />
                          <h6>{achievement.title}</h6>
                          <small className="text-muted">{achievement.description}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Booking & Contact */}
          <div className="col-lg-4">
            <div className="booking-sidebar">
              <div className="booking-card bg-white rounded shadow-sm p-4 mb-4">
                <h5 className="mb-3">Book {tasker.name}</h5>
                <div className="price-display mb-3">
                  <h3 className="text-primary mb-0">${tasker.hourlyRate}/hr</h3>
                  <small className="text-muted">Starting rate</small>
                </div>
                
                <div className="availability-info mb-3">
                  <p className="mb-2">
                    <FontAwesomeIcon icon={faClock} className="mr-2 text-success" />
                    {tasker.availability}
                  </p>
                  <p className="mb-2">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" />
                    {tasker.location}
                  </p>
                </div>

                <button className="btn btn-primary btn-lg w-100 mb-3">
                  <FontAwesomeIcon icon={faCalendar} className="mr-2" />
                  Book Now
                </button>
                
                <button className="btn btn-outline-primary w-100 mb-3">
                  <FontAwesomeIcon icon={faComments} className="mr-2" />
                  Start Chat
                </button>

                <button className="btn btn-outline-secondary w-100">
                  <FontAwesomeIcon icon={faPhone} className="mr-2" />
                  Call Now
                </button>
              </div>

              <div className="contact-card bg-white rounded shadow-sm p-4">
                <h6 className="mb-3">Contact Information</h6>
                <div className="contact-item mb-2">
                  <FontAwesomeIcon icon={faPhone} className="mr-2 text-muted" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="contact-item mb-2">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-muted" />
                  <span>Downtown Area</span>
                </div>
                <div className="contact-item">
                  <FontAwesomeIcon icon={faClock} className="mr-2 text-muted" />
                  <span>Available 7 days/week</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .tasker-profile-container {
          background-color: #f8f9fa;
          min-height: 100vh;
        }
        
        .profile-banner {
          background-size: cover;
          background-position: center;
          padding: 60px 0;
          position: relative;
        }
        
        .overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
        }
        
        .banner-content {
          position: relative;
          z-index: 1;
        }
        
        .back-link {
          text-decoration: none;
          font-weight: 500;
        }
        
        .company-name {
          font-size: 2rem;
          font-weight: bold;
          margin-top: 20px;
        }
        
        .profile-avatar img {
          width: 120px;
          height: 120px;
          object-fit: cover;
        }
        
        .stats-row {
          display: flex;
          gap: 20px;
        }
        
        .stat-item {
          background-color: #f8f9fa;
          padding: 8px 12px;
          border-radius: 20px;
          font-size: 0.9rem;
        }
        
        .metrics-row {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
        }
        
        .metric-card {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          flex: 1;
          min-width: 120px;
        }
        
        .specialization-tags .badge,
        .language-tags .badge {
          font-size: 0.8rem;
          padding: 6px 12px;
        }
        
        .rating-bar {
          font-size: 0.9rem;
        }
        
        .rating-label {
          min-width: 30px;
        }
        
        .rating-count {
          min-width: 30px;
          text-align: right;
        }
        
        .review-item:last-child {
          border-bottom: none !important;
        }
        
        .skill-card,
        .achievement-card {
          transition: transform 0.2s;
        }
        
        .skill-card:hover,
        .achievement-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .booking-sidebar {
          position: sticky;
          top: 20px;
        }
        
        .price-display {
          text-align: center;
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 8px;
        }
        
        .contact-item {
          display: flex;
          align-items: center;
        }
      `}</style>
    </div>
  );
};

export default TaskerProfile;
