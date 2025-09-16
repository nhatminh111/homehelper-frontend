import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter, faFacebook, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { faMapMarkerAlt, faPhone, faPaperPlane } from '@fortawesome/free-solid-svg-icons';

const Footer = () => {
  return (
    <footer className="footer ftco-section">
      <div className="container">
        <div className="row">
          <div className="col-md-6 col-lg-3 mb-4 mb-md-0">
            <h2 className="footer-heading">Cleaning Company ddđ</h2>
            <p>
              A small river named Duden flows by their place and supplies it with the necessary regelialia. 
              It is a paradisematic country, in which roasted parts of sentences fly into your mouth.
            </p>
            <ul className="ftco-footer-social list-unstyled float-md-left float-lft mt-4">
              <li className="ftco-animate">
                <a href="#"><FontAwesomeIcon icon={faTwitter} /></a>
              </li>
              <li className="ftco-animate">
                <a href="#"><FontAwesomeIcon icon={faFacebook} /></a>
              </li>
              <li className="ftco-animate">
                <a href="#"><FontAwesomeIcon icon={faInstagram} /></a>
              </li>
            </ul>
          </div>
          <div className="col-md-6 col-lg-3 mb-4 mb-md-0">
            <h2 className="footer-heading">Latest News</h2>
            <div className="block-21 mb-4 d-flex">
              <a className="img mr-4 rounded" style={{ backgroundImage: "url('/images/image_1.jpg')" }}></a>
              <div className="text">
                <h3 className="heading">
                  <a href="#">Even the all-powerful Pointing has no control about</a>
                </h3>
                <div className="meta">
                  <div><a href="#"><span className="icon-calendar"></span> Mar. 04, 2020</a></div>
                  <div><a href="#"><span className="icon-person"></span> Admin</a></div>
                  <div><a href="#"><span className="icon-chat"></span> 19</a></div>
                </div>
              </div>
            </div>
            <div className="block-21 mb-4 d-flex">
              <a className="img mr-4 rounded" style={{ backgroundImage: "url('/images/image_2.jpg')" }}></a>
              <div className="text">
                <h3 className="heading">
                  <a href="#">Even the all-powerful Pointing has no control about</a>
                </h3>
                <div className="meta">
                  <div><a href="#"><span className="icon-calendar"></span> Mar. 04, 2020</a></div>
                  <div><a href="#"><span className="icon-person"></span> Admin</a></div>
                  <div><a href="#"><span className="icon-chat"></span> 19</a></div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6 col-lg-3 pl-lg-5 mb-4 mb-md-0">
            <h2 className="footer-heading">Quick Links</h2>
            <ul className="list-unstyled">
              <li><Link to="/" className="py-1 d-block">Home</Link></li>
              <li><Link to="/about" className="py-1 d-block">About</Link></li>
              <li><Link to="/services" className="py-1 d-block">Services</Link></li>
              <li><Link to="/portfolio" className="py-1 d-block">Works</Link></li>
              <li><Link to="/blog" className="py-1 d-block">Blog</Link></li>
              <li><Link to="/contact" className="py-1 d-block">Contact</Link></li>
            </ul>
          </div>
          <div className="col-md-6 col-lg-3 mb-4 mb-md-0">
            <h2 className="footer-heading">Have a Questions?</h2>
            <div className="block-23 mb-3">
              <ul>
                <li>
                  <FontAwesomeIcon icon={faMapMarkerAlt} />
                  <span className="text">203 Fake St. Mountain View, San Francisco, California, USA</span>
                </li>
                <li>
                  <a href="tel:+23923929210">
                    <FontAwesomeIcon icon={faPhone} />
                    <span className="text">+2 392 3929 210</span>
                  </a>
                </li>
                <li>
                  <a href="mailto:info@yourdomain.com">
                    <FontAwesomeIcon icon={faPaperPlane} />
                    <span className="text">info@yourdomain.com</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="row mt-5">
          <div className="col-md-12 text-center">
            <p className="copyright">
              Copyright &copy;{new Date().getFullYear()} All rights reserved | This template is made with{' '}
              <i className="fa fa-heart" aria-hidden="true"></i> by{' '}
              <a href="https://colorlib.com" target="_blank" rel="noopener noreferrer">Colorlib.com</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 