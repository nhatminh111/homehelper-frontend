import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faPlay } from '@fortawesome/free-solid-svg-icons';

const Services = () => {
  const services = [
    {
      icon: 'flaticon-workplace',
      title: 'Office Cleaning',
      description: 'Even the all-powerful Pointing has no control about the blind texts it is an almost unorthographic.'
    },
    {
      icon: 'flaticon-pool',
      title: 'Pool Cleaning',
      description: 'Even the all-powerful Pointing has no control about the blind texts it is an almost unorthographic.'
    },
    {
      icon: 'flaticon-rug',
      title: 'Carpet Cleaning',
      description: 'Even the all-powerful Pointing has no control about the blind texts it is an almost unorthographic.'
    },
    {
      icon: 'flaticon-kitchen',
      title: 'Kitchen Cleaning',
      description: 'Even the all-powerful Pointing has no control about the blind texts it is an almost unorthographic.'
    },
    {
      icon: 'flaticon-garden',
      title: 'Garden Cleaning',
      description: 'Even the all-powerful Pointing has no control about the blind texts it is an almost unorthographic.'
    },
    {
      icon: 'flaticon-balcony',
      title: 'Window Cleaning',
      description: 'Even the all-powerful Pointing has no control about the blind texts it is an almost unorthographic.'
    }
  ];

  const pricingPlans = [
    {
      icon: 'flaticon-sprayer',
      title: 'Starter',
      price: '49',
      features: [
        'Bedrooms cleaning',
        'Vacuuming',
        'Bathroom cleaning',
        'Mirrow cleaning',
        'Livingroom cleaning'
      ]
    },
    {
      icon: 'flaticon-vacuum-cleaner',
      title: 'Standard',
      price: '79',
      features: [
        'Bedrooms cleaning',
        'Vacuuming',
        'Bathroom cleaning',
        'Mirrow cleaning',
        'Livingroom cleaning'
      ],
      active: true
    },
    {
      icon: 'flaticon-tap',
      title: 'Premium',
      price: '109',
      features: [
        'Bedrooms cleaning',
        'Vacuuming',
        'Bathroom cleaning',
        'Mirrow cleaning',
        'Livingroom cleaning'
      ]
    },
    {
      icon: 'flaticon-cleaning',
      title: 'Platinum',
      price: '159',
      features: [
        'Bedrooms cleaning',
        'Vacuuming',
        'Bathroom cleaning',
        'Mirrow cleaning',
        'Livingroom cleaning'
      ]
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
                <span>Services <FontAwesomeIcon icon={faChevronRight} /></span>
              </p>
              <h1 className="mb-0 bread">Services</h1>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="ftco-section">
        <div className="container">
          <div className="row justify-content-center pb-5 mb-3">
            <div className="col-md-7 heading-section text-center ftco-animate">
              <span className="subheading">Services</span>
              <h2>How We Works</h2>
            </div>
          </div>
          <div className="row">
            {services.map((service, index) => (
              <div key={index} className="col-md-6 col-lg-4 services ftco-animate">
                <div className="d-block d-flex">
                  <div className="icon d-flex justify-content-center align-items-center">
                    <span className={service.icon}></span>
                  </div>
                  <div className="media-body pl-3">
                    <h3 className="heading">{service.title}</h3>
                    <p>{service.description}</p>
                    <p><a href="#" className="btn-custom">Read more</a></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="ftco-section ftco-intro" style={{ backgroundImage: "url('/images/bg_3.jpg')" }} data-stellar-background-ratio="0.5">
        <div className="overlay"></div>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-8 text-center">
              <h2>Together we will explore new things</h2>
              <a href="#" className="icon-video d-flex align-items-center justify-content-center">
                <FontAwesomeIcon icon={faPlay} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="ftco-section bg-light">
        <div className="container">
          <div className="row justify-content-center pb-5 mb-3">
            <div className="col-md-7 heading-section text-center ftco-animate">
              <span className="subheading mb-3">Price &amp; Plans</span>
              <h2>Choose Your Perfect Plans</h2>
            </div>
          </div>
          <div className="row">
            {pricingPlans.map((plan, index) => (
              <div key={index} className="col-md-6 col-lg-3 ftco-animate">
                <div className={`block-7 ${plan.active ? 'active' : ''}`}>
                  <div className="text-center">
                    <div className="icon d-flex align-items-center justify-content-center">
                      <span className={`fa ${plan.icon}`}></span>
                    </div>
                    <h4 className="heading-2">{plan.title}</h4>
                    <span className="price">
                      <sup>$</sup> <span className="number">{plan.price}</span>
                    </span>
                    <ul className="pricing-text mb-5">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex}>
                          <span className="fa fa-check mr-2"></span>{feature}
                        </li>
                      ))}
                    </ul>
                    <a href="#" className="btn btn-primary px-4 py-3">Get Started</a>
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

export default Services; 