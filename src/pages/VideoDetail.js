import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay, faStar, faHeart, faPhone, faShare, faFlag, faEllipsisH, faCircleCheck, faEye,
  faCommentAlt
} from '@fortawesome/free-solid-svg-icons';

import '../css/videoDetail.css'

const VideoDetail = () => {
  const video = {
    image: '/images/image_1.jpg',
    title: 'Ultimate Home Cleaning Guide - 10 Pro Tips for a House',
    timeAgo: '3 days ago',
    author: 'CleanExpert Mike',
    rating: 4.2,
    views: '1,247',
    description: 'In this comprehensive video, I\'ll share 10 professional cleaning tips that will transform your home cleaning routine. From scientific organization methods to tackling stubborn stains, these proven techniques will help you achieve a spotless home efficiently.',
    tips: [
      'High-quality microfiber cloths',
      'Eco-friendly all-purpose cleaning solution',
      'Color-coded storage containers',
      'High-power vacuum cleaner & smart mop system',
    ],
    relatedVideos: [
      {
        title: 'How to Organize Your Wardrobe like a CleanExpert Mike',
        duration: '15:23',
        views: '1.8M Likes',
        thumbnail: '/images/image_1.jpg',
      },
      {
        title: 'Professional Kitchen Cleaning Secrets - CleanExpert Mike',
        duration: '15:23',
        views: '950k Likes',
        thumbnail: '/images/image_1.jpg',
      },
      {
        title: 'Bathroom Deep Clean: Complete Guide - CleanExpert Mike',
        duration: '15:23',
        views: '1.2M Likes',
        thumbnail: '/images/image_1.jpg',
      },
      {
        title: 'Home Office Organization Tips - CleanExpert Mike',
        duration: '15:23',
        views: '2M Likes',
        thumbnail: '/images/image_1.jpg',
      },
    ],
    comments: [
      {
        author: 'Sarah Johnson',
        timeAgo: '2 hours ago',
        text: 'This video is incredibly helpful! My house has never been cleaner. Thank you for the amazing tips!',
        likes: 24,
        replies: 1,
      },
      {
        author: 'David Chen',
        timeAgo: '5 hours ago',
        text: 'The bathroom cleaning hack is genius! Tried it immediately and the results are amazing 🌟',
        likes: 18,
        replies: 0,
      },
      {
        author: 'Emma Wilson',
        timeAgo: '1 day ago',
        text: 'Could you please share more tips about organizing closets? I\'m struggling with that part.',
        likes: 12,
        replies: 2,
      },
    ],
  };

  return (
    <div className="video-detail-page">
      {/* Hero Section */}
        <section className="hero-wrap hero-wrap-2" style={{ backgroundImage: "url('/images/bg_2.jpg')" }} data-stellar-background-ratio="0.5">
            {/* <div className="overlay"></div>
            <div className="container">
                <div className="row no-gutters slider-text align-items-end">
                  <div className="col-md-9 ftco-animate pb-5">
                    <p className="breadcrumbs mb-2">
                      <span className="mr-2">
                        <Link to="/">Home <FontAwesomeIcon icon={faChevronRight} /></Link>
                      </span> 
                      <span>Video</span>
                    </p>
                    <h1 className="mb-0 bread">Video</h1>
                  </div>
                </div>
            </div> */}
        </section>

      {/* Video Detail Section */}
      <section className="ftco-section bg-light">
        <div className="container">
            <div className="content-grid">
            {/* LEFT: DETAIL */}
            <div className="detail-card">
                {/* Hero thumbnail */}
                <div className="thumb-hero">
                    <img src={video.image} alt={video.title} className="video-thumbnail" />
                    <button className="play-btn" aria-label="Play video">
                    <FontAwesomeIcon icon={faPlay} />
                    </button>
                </div>

                {/* Title + time */}
                <div className="title-box">
                    <h2 className="detail-title">{video.title}</h2>
                    <p className="detail-time">{video.timeAgo}</p>
                </div>

                {/* Author bar */}
                <div className="author-box">
                    <div className="author-bar">
                        <img src="/images/bg_1.jpg" alt={video.author} className="author-avatar" />
                        <div className="author-meta">
                        <div className="author-name">
                            {video.author} <FontAwesomeIcon icon={faCircleCheck} className="verified" />
                        </div>
                        <div className="author-rating">
                            <FontAwesomeIcon icon={faStar} className="star" /> {video.rating} Stars
                        </div>
                        </div>

                        <div className="author-actions">
                        <button className="btn-ghost">
                            <FontAwesomeIcon icon={faHeart} /> <span>Favorite</span>
                        </button>
                        <button className="btn-outline-blue">
                            <FontAwesomeIcon icon={faPhone} /> <span>Book Session</span>
                        </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="footer-box">
                    <div className="detail-footer">
                        <span className="df-item">
                        <FontAwesomeIcon icon={faHeart} /> {video.views}
                        </span>
                        <button className="df-link">
                        <FontAwesomeIcon icon={faShare} /> Share
                        </button>
                        <button className="df-link">
                        <FontAwesomeIcon icon={faFlag} /> Report
                        </button>
                        <button className="df-more">
                        <FontAwesomeIcon icon={faEllipsisH} />
                        </button>
                    </div>
                </div>

                {/* Desc Box */}
                <div className="desc-box">
                    <div className="tags-row">
                        {(video.tags || ['Cleaning','Home Organization','Pro Tips','Lifestyle']).map((t, i) => (
                        <span key={i} className="tag-chip">{t}</span>
                        ))}
                    </div>

                    <p className="video-desc">{video.description}</p>

                    <div className="tips-panel">
                        <div className="tips-title">🧰 Tools You’ll Need:</div>
                        <ul className="tips-list">
                        {video.tips.map((tip, i) => <li key={i}>{tip}</li>)}
                        </ul>
                    </div>
                </div>

                {/* ===== Comments BOX ===== */}
                <div className="comments-box">
                    <div className="comments-head">
                        <span className="cmt-icon">💬</span>
                        <button className="sort-btn">Sort by Top</button>
                    </div>

                    <div className="comment-input">
                        <div className="comment-top">
                            <div className="avatar circle">U</div>
                            <textarea placeholder="Add a comment..." />
                        </div>
                        
                        <div className="input-actions">
                            <span className="note">💡 Be respectful and constructive</span>
                            <div className="btns">
                            <button className="btn-cancel">Cancel</button>
                            <button className="btn-comment-disabled">Comment</button>
                            </div>
                        </div>
                    </div>


                    {video.comments.map((c, i) => (
                        <div key={i} className="comment-item">
                            <div className="avatar circle">{c.author.split(' ').map(s=>s[0]).join('').slice(0,2)}</div>
                            <div className="cmt-body">
                                <div className="cmt-head">
                                    <span className="name">{c.author}</span>
                                    <span className="time">{c.timeAgo}</span>
                                </div>
                                <p className="cmt-text">{c.text}</p>
                                <div className="cmt-actions">
                                  <span>❤️ {c.likes}</span>
                                  <button className="reply-btn">
                                    <FontAwesomeIcon icon={faCommentAlt} className="reply-icon" /> Reply
                                  </button>
                                  {c.replies > 0 && (
                                    <button className="view-replies-btn">
                                      View {c.replies} repl{c.replies>1 ? 'ies':'y'}
                                    </button>
                                  )}
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="load-more-wrap">
                        <button className="btn-outline-blue">Load More Comments</button>
                    </div>
                </div>
            </div>

            {/* RIGHT: RELATED */}
            <aside className="related-card">
                <h3 className="related-title-head">Related Videos</h3>
                {video.relatedVideos.map((rv, i) => (
                <div key={i} className="related-video">
                    <div className="related-thumb-wrap">
                    <img src={rv.thumbnail} alt={rv.title} className="related-thumbnail" />
                    <span className="related-duration">{rv.duration}</span>
                    </div>
                    <div className="related-info">
                    <h4 className="rv-title">{rv.title}</h4>
                    <p className="rv-author">{video.author}</p>
                    <p className="rv-likes">✩ {rv.views}</p>
                    </div>
                </div>
                ))}
            </aside>
            </div>
        </div>
      </section>
    </div>
  );
};

export default VideoDetail;
