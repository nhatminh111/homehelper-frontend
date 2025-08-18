import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';

const Portfolio = () => {
  const portfolioItems = [
    { id: 1, image: '/images/work-1.jpg', title: 'Office Cleaning', category: 'Commercial' },
    { id: 2, image: '/images/work-2.jpg', title: 'Home Cleaning', category: 'Residential' },
    { id: 3, image: '/images/work-3.jpg', title: 'Carpet Cleaning', category: 'Specialized' },
    { id: 4, image: '/images/work-4.jpg', title: 'Window Cleaning', category: 'Exterior' },
    { id: 5, image: '/images/work-5.jpg', title: 'Kitchen Cleaning', category: 'Residential' },
    { id: 6, image: '/images/work-6.jpg', title: 'Pool Cleaning', category: 'Specialized' },
    { id: 7, image: '/images/work-7.jpg', title: 'Garden Maintenance', category: 'Exterior' },
    { id: 8, image: '/images/work-8.jpg', title: 'Deep Cleaning', category: 'Residential' }
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
                <span>Portfolio <FontAwesomeIcon icon={faChevronRight} /></span>
              </p>
              <h1 className="mb-0 bread">Our Portfolio</h1>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section className="ftco-section">
        <div className="container">
          <div className="row justify-content-center pb-5 mb-3">
            <div className="col-md-7 heading-section text-center ftco-animate">
              <span className="subheading">Portfolio</span>
              <h2>Our Recent Work</h2>
            </div>
          </div>
          <div className="row">
            {portfolioItems.map((item) => (
              <div key={item.id} className="col-md-6 col-lg-3 ftco-animate">
                <div className="work mb-4">
                  <div className="work-img" style={{ backgroundImage: `url(${item.image})` }}>
                    <div className="overlay"></div>
                  </div>
                  <div className="text p-4">
                    <h3><a href="#">{item.title}</a></h3>
                    <p>{item.category}</p>
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

export default Portfolio; 