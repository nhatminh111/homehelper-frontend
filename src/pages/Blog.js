import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faHeart, faComment, faEye, faSearch, faFilter, faSort, faPlus } from '@fortawesome/free-solid-svg-icons';
import Pagination from '../components/blog/Pagination';
import BlogCard from '../components/blog/BlogCard';
import blogService from '../services/blogService';
import { useAuth } from '../contexts/AuthContext';

const Blog = () => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('post_date');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({});

  const postsPerPage = 6;

  // Fetch posts from API
  const fetchPosts = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: postsPerPage,
        search: searchQuery,
        sortBy,
        sortOrder
      };

      const response = await blogService.getPosts(params);
      
      if (response.success) {
        setPosts(response.data);
        setPagination(response.pagination);
      } else {
        setError('Failed to fetch posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Error loading posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await blogService.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPosts(1);
  };

  // Handle sort change
  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(newSortBy);
      setSortOrder('DESC');
    }
    setCurrentPage(1);
    fetchPosts(1);
  };

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    fetchPosts(pageNumber);
  };

  // Handle like toggle
  const handleLikeToggle = async (postId) => {
    if (!user) {
      alert('Please login to like posts');
      return;
    }

    try {
      const response = await blogService.toggleLikePost(postId, user.user_id);
      if (response.success) {
        // Update local state
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.post_id === postId 
              ? { 
                  ...post, 
                  likes: response.liked ? post.likes + 1 : post.likes - 1,
                  isLiked: response.liked 
                }
              : post
          )
        );
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      alert('Error updating like. Please try again.');
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchPosts(currentPage);
    fetchStats();
  }, [currentPage, sortBy, sortOrder]);

  // Load posts when search query changes
  useEffect(() => {
    if (searchQuery === '') {
      fetchPosts(currentPage);
    }
  }, [searchQuery]);

  return (
    <>
      {/* Hero Section */}
      <section className="hero-wrap hero-wrap-2" style={{ backgroundImage: "url('/images/bg_2.jpg')" }} data-stellar-background-ratio="0.5">
        <div className="overlay"></div>
        <div className="container">
          <div className="row no-gutters slider-text align-items-end">
            <div className="col-md-9 ftco-animate pb-5">
              <p className="breadcrumbs mb-2">
                <span className="mr-2">
                  <Link to="/">Home <FontAwesomeIcon icon={faChevronRight} /></Link>
                </span> 
                <span>Blog <FontAwesomeIcon icon={faChevronRight} /></span>
              </p>
              <h1 className="mb-0 bread">Community Posts</h1>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="ftco-section">
        <div className="container">
          <div className="row justify-content-center pb-5 mb-3">
            <div className="col-md-7 heading-section text-center ftco-animate">
              <span className="subheading">Community</span>
              <h2>Latest Posts & Discussions</h2>
              <p>Share your experiences, ask questions, and connect with our community</p>
            </div>
          </div>
          
          {/* Stats Section */}
          {stats && Object.keys(stats).length > 0 && (
            <div className="row mb-4">
              <div className="col-md-12">
                <div className="stats-container bg-light p-4 rounded">
                  <div className="row text-center">
                    <div className="col-md-3">
                      <div className="stat-item">
                        <FontAwesomeIcon icon={faEye} className="text-primary mb-2" size="2x" />
                        <h4 className="mb-1">{stats.totalPosts || 0}</h4>
                        <p className="mb-0">Total Posts</p>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="stat-item">
                        <FontAwesomeIcon icon={faHeart} className="text-danger mb-2" size="2x" />
                        <h4 className="mb-1">{stats.totalLikes || 0}</h4>
                        <p className="mb-0">Total Likes</p>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="stat-item">
                        <FontAwesomeIcon icon={faComment} className="text-info mb-2" size="2x" />
                        <h4 className="mb-1">{stats.totalComments || 0}</h4>
                        <p className="mb-0">Total Comments</p>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="stat-item">
                        <FontAwesomeIcon icon={faFilter} className="text-success mb-2" size="2x" />
                        <h4 className="mb-1">{stats.uniqueServicesRequested || 0}</h4>
                        <p className="mb-0">Services Requested</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filter Section */}
          <div className="row mb-4">
            <div className="col-md-12">
              <div className="search-filter-container bg-white p-4 rounded shadow-sm">
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <form onSubmit={handleSearch} className="d-flex">
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search posts..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="input-group-append">
                          <button type="submit" className="btn btn-primary">
                            <FontAwesomeIcon icon={faSearch} />
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                  <div className="col-md-4 text-right">
                    <div className="d-flex justify-content-end align-items-center">
                      <button
                        className="btn btn-outline-secondary mr-2"
                        onClick={() => setShowFilters(!showFilters)}
                      >
                        <FontAwesomeIcon icon={faFilter} className="mr-1" />
                        Filters
                      </button>
                      {user && (
                        <Link to="/blog/create" className="btn btn-primary">
                          <FontAwesomeIcon icon={faPlus} className="mr-1" />
                          New Post
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Filter Options */}
                {showFilters && (
                  <div className="row mt-3">
                    <div className="col-md-12">
                      <div className="filter-options">
                        <div className="d-flex align-items-center">
                          <span className="mr-3">Sort by:</span>
                          <div className="btn-group" role="group">
                            <button
                              type="button"
                              className={`btn btn-sm ${sortBy === 'post_date' ? 'btn-primary' : 'btn-outline-primary'}`}
                              onClick={() => handleSortChange('post_date')}
                            >
                              <FontAwesomeIcon icon={faSort} className="mr-1" />
                              Date {sortBy === 'post_date' && (sortOrder === 'ASC' ? '↑' : '↓')}
                            </button>
                            <button
                              type="button"
                              className={`btn btn-sm ${sortBy === 'likes' ? 'btn-primary' : 'btn-outline-primary'}`}
                              onClick={() => handleSortChange('likes')}
                            >
                              <FontAwesomeIcon icon={faHeart} className="mr-1" />
                              Likes {sortBy === 'likes' && (sortOrder === 'ASC' ? '↑' : '↓')}
                            </button>
                            <button
                              type="button"
                              className={`btn btn-sm ${sortBy === 'comments_count' ? 'btn-primary' : 'btn-outline-primary'}`}
                              onClick={() => handleSortChange('comments_count')}
                            >
                              <FontAwesomeIcon icon={faComment} className="mr-1" />
                              Comments {sortBy === 'comments_count' && (sortOrder === 'ASC' ? '↑' : '↓')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="row">
              <div className="col-md-12 text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
                <p className="mt-2">Loading posts...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="row">
              <div className="col-md-12">
                <div className="alert alert-danger" role="alert">
                  {error}
                  <button 
                    className="btn btn-sm btn-outline-danger ml-2"
                    onClick={() => fetchPosts(currentPage)}
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Posts Grid */}
          {!loading && !error && (
            <div className="row">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <div key={post.post_id} className="col-md-4 ftco-animate mb-4">
                    <BlogCard 
                      post={post} 
                      onLikeToggle={handleLikeToggle}
                      user={user}
                    />
                  </div>
                ))
              ) : (
                <div className="col-md-12 text-center">
                  <div className="no-posts-container py-5">
                    <FontAwesomeIcon icon={faSearch} size="3x" className="text-muted mb-3" />
                    <h4>No posts found</h4>
                    <p className="text-muted">
                      {searchQuery ? 'Try adjusting your search terms' : 'Be the first to share a post!'}
                    </p>
                    {user && !searchQuery && (
                      <Link to="/blog/create" className="btn btn-primary">
                        <FontAwesomeIcon icon={faPlus} className="mr-1" />
                        Create First Post
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && posts.length > 0 && pagination.totalPages > 1 && (
          <Pagination 
            currentPage={currentPage}
              totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            showPrevNext={true}
            size="default"
          />
          )}
        </div>
      </section>

      <style jsx>{`
        .stats-container {
          border: 1px solid #e9ecef;
        }
        
        .stat-item h4 {
          color: #333;
          font-weight: bold;
        }
        
        .search-filter-container {
          border: 1px solid #e9ecef;
        }
        
        .filter-options {
          border-top: 1px solid #e9ecef;
          padding-top: 15px;
        }
        
        .no-posts-container {
          background-color: #f8f9fa;
          border-radius: 10px;
          border: 2px dashed #dee2e6;
        }
        
        .btn-group .btn {
          margin-right: 5px;
        }
        
        .btn-group .btn:last-child {
          margin-right: 0;
        }
      `}</style>
    </>
  );
};

export default Blog; 