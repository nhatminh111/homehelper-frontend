import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';

const About = () => {
  return (
    <>
      {/* Hero Section */}
      <section className="hero-wrap hero-wrap-2" style={{ backgroundImage: "url('/images/home.jpg')" }} data-stellar-background-ratio="0.5">
        <div className="overlay"></div>
        <div className="container">
          <div className="row no-gutters slider-text align-items-end">
            <div className="col-md-9 ftco-animate pb-5">
              <p className="breadcrumbs mb-2">
                <span className="mr-2">
                  <Link to="/">Home <FontAwesomeIcon icon={faChevronRight} /></Link>
                </span> 
                <span>About <FontAwesomeIcon icon={faChevronRight} /></span>
              </p>
              <h1 className="mb-0 bread">About Us</h1>
            </div>
          </div>
        </div>
      </section>

      {/* About Content */}
      <section className="ftco-section">
        <div className="container">
          <div className="row justify-content-center pb-5 mb-3">
            <div className="col-md-7 heading-section text-center ftco-animate">
              <span className="subheading">About Us</span>
              <h2>Professional Cleaning Services</h2>
            </div>
          </div>
          <div className="row">
            <div className="col-md-6">
              <img src="/images/about.jpg" alt="About Us" className="img-fluid" />
            </div>
            <div className="col-md-6">
              <h3>Your Trusted Cleaning Partnerdffff</h3>
              <p>
                We are a professional cleaning company dedicated to providing high-quality cleaning services 
                for homes and businesses. With years of experience and a team of trained professionals, 
                we ensure your space is spotless and comfortable.
              </p>
              <p>
                Our commitment to excellence and attention to detail sets us apart from the competition. 
                We use eco-friendly cleaning products and modern equipment to deliver outstanding results 
                while protecting your health and the environment.
              </p>
              <div className="row mt-4">
                <div className="col-6">
                  <div className="text-center">
                    <h4>500+</h4>
                    <p>Happy Clients</p>
                  </div>
                </div>
                <div className="col-6">
                  <div className="text-center">
                    <h4>1000+</h4>
                    <p>Projects Completed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default About; 