import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

const Home = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    service: '',
    date: '',
    time: '',
    message: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission here
  };

  return (
    <>
      {/* Hero Section */}
      <div className="hero-wrap js-fullheight" style={{ backgroundImage: "url('/images/bg_1.jpg')" }} data-stellar-background-ratio="0.5">
        <div className="overlay"></div>
        <div className="container">
          <div className="row no-gutters slider-text js-fullheight align-items-center justify-content-start" data-scrollax-parent="true">
            <div className="col-md-6 ftco-animate">
              <h2 className="subheading">Leave the house cleaning chores to us</h2>
              <h1 className="mb-4">Let us do the dirty work, so you don't have to.</h1>
              <p>
                <a href="#appointment" className="btn btn-primary mr-md-4 py-2 px-4">
                  Learn more <span className="ion-ios-arrow-forward"></span>
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Section */}
      <section id="appointment" className="ftco-appointment ftco-section ftco-no-pt ftco-no-pb">
        <div className="overlay"></div>
        <div className="container">
          <div className="row d-md-flex justify-content-center">
            <div className="col-md-12">
              <div className="wrap-appointment bg-white d-md-flex pl-md-4 pb-5 pb-md-0">
                <form onSubmit={handleSubmit} className="appointment w-100">
                  <div className="row justify-content-center">
                    <div className="col-12 col-md d-flex align-items-center pt-4 pt-md-0">
                      <div className="form-group py-md-4 py-2 px-4 px-md-0">
                        <label htmlFor="name">Name</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Your Name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-12 col-md d-flex align-items-center">
                      <div className="form-group py-md-4 py-2 px-4 px-md-0">
                        <label htmlFor="phone">Phone number</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Phone number"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-12 col-md d-flex align-items-center">
                      <div className="form-group py-md-4 py-2 px-4 px-md-0">
                        <label htmlFor="service">Select Services</label>
                        <div className="form-field">
                          <div className="select-wrap">
                            <div className="icon">
                              <FontAwesomeIcon icon={faChevronDown} />
                            </div>
                            <select
                              name="service"
                              className="form-control"
                              value={formData.service}
                              onChange={handleInputChange}
                              required
                            >
                              <option value="">Select a service</option>
                              <option value="office-cleaning">Office Cleaning</option>
                              <option value="pool-cleaning">Pool Cleaning</option>
                              <option value="carpet-cleaning">Carpet Cleaning</option>
                              <option value="kitchen-cleaning">Kitchen Cleaning</option>
                              <option value="garden-cleaning">Garden Cleaning</option>
                              <option value="window-cleaning">Window Cleaning</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-md d-flex align-items-center">
                      <div className="form-group py-md-4 py-2 px-4 px-md-0">
                        <label htmlFor="date">Date</label>
                        <input
                          type="date"
                          className="form-control"
                          name="date"
                          value={formData.date}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-12 col-md d-flex align-items-center">
                      <div className="form-group py-md-4 py-2 px-4 px-md-0">
                        <label htmlFor="time">Time</label>
                        <input
                          type="time"
                          className="form-control"
                          name="time"
                          value={formData.time}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-12 col-md d-flex align-items-center">
                      <div className="form-group py-md-4 py-2 px-4 px-md-0">
                        <label htmlFor="message">Message</label>
                        <textarea
                          name="message"
                          className="form-control"
                          placeholder="Message"
                          rows="3"
                          value={formData.message}
                          onChange={handleInputChange}
                        ></textarea>
                      </div>
                    </div>
                    <div className="col-12 col-md d-flex align-items-center">
                      <div className="form-group py-md-4 py-2 px-4 px-md-0">
                        <button type="submit" className="btn btn-primary py-3 px-4">
                          Book Appointment
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home; 