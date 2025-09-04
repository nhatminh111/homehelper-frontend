import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faCircleCheck, faPhone } from '@fortawesome/free-solid-svg-icons';
import '../css/video.css'

const Video = () => {
  const videos = [
    {
      title: 'Office Cleaning 500m² - International Standard Process',
      duration: '15:30',
      views: '2,340 views',
      timeAgo: 'Now',
      rating: 4.6,
      price: '$100 - $200',
      thumbnail: '/images/image_1.jpg',
      likes: '2.340',
      expert: 'Office Clean Pro',
      expertAvatar: '/images/avatars/office-clean-pro.jpg',
      verified: true
    },
    {
      title: 'Post-Construction Cleanup - 5-Step International Standard',
      duration: '15:30',
      views: '78,920 views',
      timeAgo: '2 days ago',
      rating: 4.8,
      price: '$250 - $300',
      thumbnail: '/images/image_2.jpg',
      likes: '2.340',
      expert: 'Construction Clean',
      expertAvatar: '/images/avatars/office-clean-pro.jpg',
      verified: true
    },
    {
      title: 'Professional Apartment Cleaning - Guide - Complete A to Z Tutorial',
      duration: '12:45',
      views: '25,420 views',
      timeAgo: '3 days ago',
      rating: 4.9,
      price: '$50 - $80',
      thumbnail: '/images/image_3.jpg',
      likes: '2.340',
      expert: 'Cleaning Company Pro',
      expertAvatar: '/images/avatars/office-clean-pro.jpg',
      verified: true
    },
    {
      title: 'Professional Kitchen Cleaning - Secrets to Clean Every Corner',
      duration: '8:32',
      views: '89,340 views',
      timeAgo: '1 week ago',
      rating: 4.7,
      price: '$30 - $50',
      thumbnail: '/images/image_4.jpg',
      likes: '2.340',
      expert: 'Kitchen Clean Master',
      expertAvatar: '/images/avatars/office-clean-pro.jpg',
      verified: true
    },
    {
      title: 'Industrial Factory Cleaning 14001 Standards - Full Process',
      duration: '18:45',
      views: '156,780 views',
      timeAgo: '1 week ago',
      rating: 4.9,
      price: 'Contact us',
      thumbnail: '/images/image_5.jpg',
      likes: '2.340',
      expert: 'Industrial Clean Pro',
      expertAvatar: '/images/avatars/office-clean-pro.jpg',
      verified: true
    },
    {
      title: 'Effective Bathroom Cleaning - Remove Stubborn Stains in 30',
      duration: '6:15',
      views: '67,890 views',
      timeAgo: '2 weeks ago',
      rating: 4.5,
      price: '$20 - $40',
      thumbnail: '/images/image_6.jpg',
      likes: '2.340',
      expert: 'Bathroom Expert',
      expertAvatar: '/images/avatars/office-clean-pro.jpg',
      verified: true
    },
    {
      title: 'High-Rise Window Cleaning - Safe and Effective Methods',
      duration: '9:20',
      views: '45,670 views',
      timeAgo: '3 weeks ago',
      rating: 4.4,
      price: '$80 - $150',
      thumbnail: '/images/image_1.jpg',
      likes: '2.340',
      expert: 'High Rise Cleaning',
      expertAvatar: '/images/avatars/office-clean-pro.jpg',
      verified: true
    },
    {
      title: 'Carpet and Sofa Cleaning - Modern Cleaning Technology',
      duration: '11:45',
      views: '92,150 views',
      timeAgo: '1 month ago',
      rating: 4.6,
      price: '$40 - $70',
      thumbnail: '/images/image_2.jpg',
      likes: '2.340',
      expert: 'Furniture Care Pro',
      expertAvatar: '/images/avatars/office-clean-pro.jpg',
      verified: true
    },
  ];

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
                <span>Video</span>
              </p>
              <h1 className="mb-0 bread">Video</h1>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="ftco-section bg-light">
        <div className="container">
          <div className="row justify-content-center pb-5 mb-3">
            <div className="col-md-7 heading-section text-center ftco-animate">
              <h2 className="mb-4">Professional Cleaning Videos</h2>
            </div>
          </div>
          <div className="row align-items-center mb-4">
            <div className="col-md-6">
              <div className="input-group">
                <input type="text" className="form-control" placeholder="Search videos..." />
              </div>
            </div>
            <div className="col-md-6 text-right">
              <button className="btn btn-outline-primary mr-2 btn-no-transform">Latest</button>
              <button className="btn btn-outline-primary mr-2 btn-no-transform">Most Popular</button>
              <button className="btn btn-outline-primary btn-no-transform">Oldest</button>
            </div>
          </div>
          <div className="row">
            {videos.map((video, index) => (
              <div key={index} className="col-md-3 col-sm-6 mb-4 ftco-animate">
                <div className="video-card">
                    {/* Thumbnail */}
                    <div className="thumbnail-wrap">
                        <img src={video.thumbnail} alt={video.title} className="img-fluid" />
                        <span className="duration">{video.duration}</span>
                    </div>

                    {/* Title */}
                    <h4 className="video-title">{video.title}</h4>

                    {/* Expert row */}
                    <div className="expert-row">
                        <img src={video.expertAvatar || "/images/avatars/default.png"} className="expert-avatar" alt={video.expert} />
                        <span className="expert-name">{video.expert}</span>
                        {video.verified && (
                        <FontAwesomeIcon icon={faCircleCheck} className="expert-verified" />
                        )}
                    </div>

                    {/* Stats row */}
                    <div className="stats-row">
                        <span>👁 {video.views}</span>
                        <span> • {video.timeAgo}</span>
                    </div>

                    <div className="rating-price-row">
                        <div className="rating">⭐ {video.rating}</div>
                        <div className="price">{video.price}</div>
                    </div>

                    {/* Likes + button */}
                    <div className="action-row">
                        <span className="likes">❤️ {video.likes} likes</span>
                        <a href="#" className="btn btn-outline-primary-1 btn-sm btn-no-transform">
                            <FontAwesomeIcon icon={faPhone} className="mr-2" />
                            Book Now
                        </a>
                    </div>
                </div>
              </div>
            ))}
          </div>
          <div className="row">
            <div className="col-md-12 text-center">
              <button className="btn btn-outline-primary btn-no-transform">Load More Videos</button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Video;