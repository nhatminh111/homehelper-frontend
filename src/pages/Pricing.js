import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';

const Pricing = () => {
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
                <span>Pricing <FontAwesomeIcon icon={faChevronRight} /></span>
              </p>
              <h1 className="mb-0 bread">Pricing Plans</h1>
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

export default Pricing; 