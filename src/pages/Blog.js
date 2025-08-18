import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';

const Blog = () => {
  const blogPosts = [
    {
      id: 1,
      image: '/images/image_1.jpg',
      title: 'Even the all-powerful Pointing has no control about',
      date: 'Mar. 04, 2020',
      author: 'Admin',
      comments: 19
    },
    {
      id: 2,
      image: '/images/image_2.jpg',
      title: 'Even the all-powerful Pointing has no control about',
      date: 'Mar. 04, 2020',
      author: 'Admin',
      comments: 19
    },
    {
      id: 3,
      image: '/images/image_3.jpg',
      title: 'Even the all-powerful Pointing has no control about',
      date: 'Mar. 04, 2020',
      author: 'Admin',
      comments: 19
    }
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
                <span>Blog <FontAwesomeIcon icon={faChevronRight} /></span>
              </p>
              <h1 className="mb-0 bread">Blog</h1>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="ftco-section">
        <div className="container">
          <div className="row justify-content-center pb-5 mb-3">
            <div className="col-md-7 heading-section text-center ftco-animate">
              <span className="subheading">Blog</span>
              <h2>Latest News & Updates</h2>
            </div>
          </div>
          <div className="row">
            {blogPosts.map((post) => (
              <div key={post.id} className="col-md-4 ftco-animate">
                <div className="block-21 mb-4 d-flex">
                  <a className="img mr-4 rounded" style={{ backgroundImage: `url(${post.image})` }}></a>
                  <div className="text">
                    <h3 className="heading">
                      <a href="#">{post.title}</a>
                    </h3>
                    <div className="meta">
                      <div><a href="#"><span className="icon-calendar"></span> {post.date}</a></div>
                      <div><a href="#"><span className="icon-person"></span> {post.author}</a></div>
                      <div><a href="#"><span className="icon-chat"></span> {post.comments}</a></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Blog; 