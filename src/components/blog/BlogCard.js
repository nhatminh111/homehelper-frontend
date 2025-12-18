import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbsUp, faComment, faHeart, faEye, faTag } from '@fortawesome/free-solid-svg-icons';
import './BlogCard.css';


const BlogCard = ({ post, onLikeToggle, user }) => {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);

  const formatNumber = (num) => {
    num = Number(num) || 0;
    if (num >= 1000000) {
      return Math.round(num / 1000000) + 'M';
    } else if (num >= 1000) {
      return Math.round(num / 1000) + 'K';
    }
    return num.toString();
  };

  // Handle like button click
  const handleLikeClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert('Please login to like posts');
      return;
    }

    const newLikedState = !isLiked;
    const newLikesCount = newLikedState ? likesCount + 1 : likesCount - 1;

    // Optimistic update
    setIsLiked(newLikedState);
    setLikesCount(newLikesCount);

    // Call API
    if (onLikeToggle) {
      onLikeToggle(post.post_id);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get excerpt from content
  const getExcerpt = (content, maxLength = 150) => {
    if (!content) return '';
    const text = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Get featured image
  const getFeaturedImage = () => {
    if (post.photo_urls && post.photo_urls.length > 0) {
      return post.photo_urls[0];
    }
    return '/images/image_1.jpg'; // Default image
  };

  return (
    <div className="blog-card">
      <div className="blog-image-container">
        <div className="blog-image" style={{ backgroundImage: `url(${getFeaturedImage()})` }}></div>
        <div className="blog-meta">
          <div className="author-avatar">
            <img src={post.author_avatar_url || "/images/person_1.jpg"} alt={post.author_name} /> 
          </div>
          <div className="meta-text">
            <div className="author">Posted by {post.author_name}</div>
            <div className="date">{formatDate(post.post_date)}</div>
          </div>
        </div>

      </div>
      <div className="blog-content">
        <h3 className="blog-title">
          <Link to={`/blog/${post.post_id}`}>{post.title}</Link>
        </h3>
        <p className="blog-description">{getExcerpt(post.content)}</p>

        {/* Services Tags */}
        {post.services && post.services.length > 0 && (
          <div className="services-tags">
            {post.services.slice(0, 3).map((service, index) => (
              <span key={index} className="service-tag">
                <FontAwesomeIcon icon={faTag} className="mr-1" />
                {service.service_name}
              </span>
            ))}
            {post.services.length > 3 && (
              <span className="service-tag more">
                +{post.services.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
      <div className="blog-footer">
        <div className="interaction-stats">
          <button className={`stat-item likes-section${isLiked ? ' liked' : ''}`} type="button" onClick={handleLikeClick}>
            <span className="like-icon"><FontAwesomeIcon icon={faThumbsUp} /></span> <span className="stat-count">{formatNumber(likesCount)}</span>
          </button>
          <span className="stat-item comment-section">
            <span className="comment-icon"><FontAwesomeIcon icon={faComment} /></span> <span className="stat-count">{post.comments_count || 0}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default BlogCard;

