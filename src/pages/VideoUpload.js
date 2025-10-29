import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faUser, 
  faCalendar, 
  faPlay, 
  faCheck, 
  faTimes,
  faStar,
  faTag,
  faLightbulb,
  faArrowRight,
  faBell,
  faEye,
  faVideo,
  faFileAlt,
  faCog,
  faThumbsUp,
  faClock,
  faGlobe,
  faAward
} from '@fortawesome/free-solid-svg-icons';

const VideoUpload = () => {
  const [activeTab, setActiveTab] = useState('post');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeContentTab, setActiveContentTab] = useState('overview');

  const videoData = {
    title: 'How to Clean a Sofa Without Using Water',
    hashtags: ['#SofaCleaning', '#NoWaterCleaning', '#HomeTips', '#FurnitureCare'],
    author: 'Thanh Hieu',
    date: '13/08/2025',
    status: 'PENDING APPROVAL',
    videoDuration: '4:35',
    resolution: '1080p',
    courseLevel: 'Beginner and Intermediate',
    language: 'English',
    subtitleLanguage: 'Vietnamese',
    categories: ['FURNITURE CLEANING', 'SOFA CLEANING'],
    description: 'In this video, I demonstrate an effective and eco-friendly method to clean a fabric sofa without using any water. This technique is perfect for preventing mold growth, avoiding long drying times, and protecting delicate upholstery materials. I\'ll guide you step-by-step through the process, starting with removing loose dust and debris, then applying baking soda to neutralize odors and lift stains. You will also learn how to gently brush the fabric to restore its texture and maintain its original color. This method is safe for most fabric sofas, especially those in humid environments where moisture can easily cause damage. By following these instructions, you can refresh your sofa, extend its lifespan, and keep it looking and smelling fresh — all without a single drop of water.',
    keyTips: [
      'Vacuum the sofa thoroughly to remove loose dust and crumbs.',
      'Use a soft brush to loosen dirt and restore fabric texture.',
      'Avoid harsh chemicals that could discolor or damage the fabric.',
      'Sprinkle baking soda evenly and leave for 15-20 minutes to absorb odors.',
      'For stubborn stains, use a dry upholstery cleaner or cornstarch paste.'
    ],
    suitableFor: [
      'People living in humid areas who want to prevent mold.',
      'Busy homeowners who want a quick, no-dry-time solution.',
      'Renters who need temporary but effective sofa care.'
    ]
  };

<<<<<<< Updated upstream
  const tabs = [
    { id: 'overview', label: 'Overview', icon: faEye },
    { id: 'images', label: 'Images', icon: faFileAlt }
  ];
=======
  // Xử lý tìm kiếm và lọc trạng thái
  const filteredVideos = videos.filter(
    (video) =>
      (statusFilter === 'All' || video.status === statusFilter) &&
      (video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.expert.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Xử lý sắp xếp
  const sortedVideos = [...filteredVideos].sort((a, b) => {
    const dateA = new Date(a.uploaded_at);
    const dateB = new Date(b.uploaded_at);
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  // Xử lý phân trang
  const indexOfLastVideo = currentPage * videosPerPage;
  const indexOfFirstVideo = indexOfLastVideo - videosPerPage;
  const currentVideos = sortedVideos.slice(indexOfFirstVideo, indexOfLastVideo);
  const totalPages = Math.ceil(sortedVideos.length / videosPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleOpenModal = (videoId, action) => {
    setModal({ show: true, videoId, action });
  };

  const handleCloseModal = () => {
    setModal({ show: false, videoId: null, action: null });
  };

  const handleConfirmAction = async () => {
    const { videoId, action } = modal;
    try {
      if (action === 'Delete') {
      await VideoService.deleteVideoByStaff(videoId); 
      setVideos(videos.filter((video) => video.video_id !== videoId));
        toast.success('Xóa nội dung thành công!', {
          position: 'top-right',
          autoClose: 3000,
          className: 'minimal-toast',
        });
      } else {
        await VideoService.updateVideoStatus(videoId, action);
        setVideos(videos.filter((video) => video.video_id !== videoId));
        toast.success(`Nội dung đã được ${action === 'Approved' ? 'chấp thuận' : 'loại bỏ'} thành công!`, {
          position: 'top-right',
          autoClose: 3000,
          className: 'minimal-toast',
        });
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message, {
        position: 'top-right',
        autoClose: 3000,
        className: 'minimal-toast',
      });
    } finally {
      handleCloseModal();
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (e) => {
    setSortOrder(e.target.value);
    setCurrentPage(1);
  };
>>>>>>> Stashed changes

  return (
    <div className="video-upload-container">
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
          {/* Left Column - Video Content */}
          <div className="col-lg-8">
            {/* Post Header */}
            <div className="post-header bg-white rounded shadow-sm p-4 mb-4">
              <h2 className="mb-2">{videoData.title}</h2>
              <div className="hashtags mb-3">
                {videoData.hashtags.map((tag, index) => (
                  <span key={index} className="badge badge-light mr-2">{tag}</span>
                ))}
              </div>
              <div className="post-meta d-flex align-items-center">
                <div className="author-info d-flex align-items-center mr-4">
                  <div className="author-avatar mr-2">
                    <FontAwesomeIcon icon={faUser} />
                  </div>
                  <span>Created by: {videoData.author}</span>
                </div>
                <div className="date-info">
                  <FontAwesomeIcon icon={faCalendar} className="mr-1" />
                  {videoData.date}
                </div>
              </div>
            </div>

            {/* Video Player Section */}
            <div className="video-player-section bg-white rounded shadow-sm p-4 mb-4">
              <div className="video-container position-relative">
                <div className="video-placeholder" style={{ 
                  backgroundImage: "url('/images/work-1.jpg')",
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  height: '400px',
                  borderRadius: '8px',
                  position: 'relative'
                }}>
                  <div className="video-overlay d-flex align-items-center justify-content-center">
                    <div className="play-button">
                      <FontAwesomeIcon icon={faPlay} size="3x" className="text-white" />
                    </div>
                    <div className="amazing-results-badge">
                      <span className="badge badge-warning">Amazing Results</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Tabs */}
              <div className="content-tabs mt-4">
                <ul className="nav nav-tabs">
                  {tabs.map((tab) => (
                    <li key={tab.id} className="nav-item">
                      <button
                        className={`nav-link ${activeContentTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveContentTab(tab.id)}
                      >
                        <FontAwesomeIcon icon={tab.icon} className="mr-1" />
                        {tab.label}
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="tab-content mt-3">
                  {activeContentTab === 'overview' && (
                    <div className="overview-content">
                      <h5>Description</h5>
                      <p className="mb-4">{videoData.description}</p>

                      <h5>
                        <FontAwesomeIcon icon={faLightbulb} className="mr-2 text-warning" />
                        Key Tips & Steps
                      </h5>
                      <ul className="key-tips-list mb-4">
                        {videoData.keyTips.map((tip, index) => (
                          <li key={index} className="d-flex align-items-start">
                            <FontAwesomeIcon icon={faCheck} className="text-success mr-2 mt-1" />
                            {tip}
                          </li>
                        ))}
                      </ul>

                      <h5>Suitable For</h5>
                      <ul className="suitable-for-list">
                        {videoData.suitableFor.map((item, index) => (
                          <li key={index} className="d-flex align-items-start">
                            <FontAwesomeIcon icon={faArrowRight} className="text-danger mr-2 mt-1" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {activeContentTab === 'images' && (
                    <div className="images-content">
                      <p className="text-muted">Additional images would be displayed here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Approval Panel */}
          <div className="col-lg-4">
            <div className="approval-sidebar">
              {/* Status Card */}
              <div className="status-card bg-warning text-white rounded shadow-sm p-4 mb-4">
                <h5 className="mb-0 text-center">{videoData.status}</h5>
              </div>

              {/* Video Details */}
              <div className="video-details bg-white rounded shadow-sm p-4 mb-4">
                <h6 className="mb-3">Video Details</h6>
                <div className="detail-item mb-2">
                  <strong>Video duration:</strong> {videoData.videoDuration} {videoData.resolution}
                </div>
                <div className="detail-item mb-2">
                  <strong>Course Level:</strong> {videoData.courseLevel}
                </div>
                <div className="detail-item mb-2">
                  <strong>Language:</strong> {videoData.language}
                </div>
                <div className="detail-item mb-3">
                  <strong>Subtitle Language:</strong> {videoData.subtitleLanguage}
                </div>

                <div className="categories-section">
                  <h6 className="mb-2">Categories</h6>
                  <div className="category-tags">
                    {videoData.categories.map((category, index) => (
                      <span key={index} className="badge badge-primary mr-2 mb-2">{category}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="action-buttons bg-white rounded shadow-sm p-4">
                <h6 className="mb-3">Actions</h6>
                <button className="btn btn-primary btn-lg w-100 mb-3">
                  <FontAwesomeIcon icon={faCheck} className="mr-2" />
                  Approve
                </button>
                <button className="btn btn-outline-danger btn-lg w-100">
                  <FontAwesomeIcon icon={faTimes} className="mr-2" />
                  Reject
                </button>
              </div>

              {/* Upload New Video */}
              <div className="upload-section bg-white rounded shadow-sm p-4 mt-4">
                <h6 className="mb-3">Upload New Video</h6>
                <div className="upload-area border-dashed border rounded p-4 text-center">
                  <FontAwesomeIcon icon={faVideo} size="3x" className="text-muted mb-3" />
                  <h6>Drop video file here</h6>
                  <p className="text-muted mb-3">or click to browse</p>
                  <button className="btn btn-outline-primary">
                    Choose File
                  </button>
                </div>
                <div className="upload-info mt-3">
                  <small className="text-muted">
                    Supported formats: MP4, AVI, MOV<br />
                    Max file size: 500MB
                  </small>
                </div>
              </div>

              {/* Video Guidelines */}
              <div className="guidelines bg-white rounded shadow-sm p-4 mt-4">
                <h6 className="mb-3">Video Guidelines</h6>
                <ul className="guidelines-list">
                  <li>Videos should be clear and well-lit</li>
                  <li>Audio should be clear and audible</li>
                  <li>Content should be educational and helpful</li>
                  <li>Videos should be between 2-10 minutes</li>
                  <li>No inappropriate or offensive content</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .video-upload-container {
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
        
        .author-avatar {
          width: 30px;
          height: 30px;
          background-color: #e9ecef;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6c757d;
        }
        
        .video-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
        }
        
        .play-button {
          cursor: pointer;
          transition: transform 0.2s;
        }
        
        .play-button:hover {
          transform: scale(1.1);
        }
        
        .amazing-results-badge {
          position: absolute;
          top: 20px;
          left: 20px;
        }
        
        .key-tips-list,
        .suitable-for-list {
          list-style: none;
          padding-left: 0;
        }
        
        .key-tips-list li,
        .suitable-for-list li {
          margin-bottom: 0.5rem;
        }
        
        .approval-sidebar {
          position: sticky;
          top: 20px;
        }
        
        .detail-item {
          font-size: 0.9rem;
        }
        
        .category-tags .badge {
          font-size: 0.8rem;
          padding: 6px 12px;
        }
        
        .upload-area {
          border: 2px dashed #dee2e6;
          transition: border-color 0.2s;
        }
        
        .upload-area:hover {
          border-color: #007bff;
        }
        
        .guidelines-list {
          list-style: none;
          padding-left: 0;
          font-size: 0.9rem;
        }
        
        .guidelines-list li {
          margin-bottom: 0.5rem;
          padding-left: 1rem;
          position: relative;
        }
        
        .guidelines-list li:before {
          content: "•";
          position: absolute;
          left: 0;
          color: #007bff;
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
        
        .nav-tabs .nav-link {
          border: none;
          border-bottom: 2px solid transparent;
          color: #6c757d;
        }
        
        .nav-tabs .nav-link.active {
          border-bottom-color: #007bff;
          color: #007bff;
          background: none;
        }
      `}</style>
    </div>
  );
};

export default VideoUpload;
