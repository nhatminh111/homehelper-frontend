import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faPlay } from '@fortawesome/free-solid-svg-icons';
import blogService from '../services/blogService';

const Services = () => {
  // Load from DB Services table (fields: name, description)
  const [services, setServices] = useState([]);
  const [svcLoading, setSvcLoading] = useState(true);
  const [svcError, setSvcError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setSvcLoading(true);
        const res = await blogService.getAllServices();
        const list = res?.data ?? res; // blogService returns {success,data} in this project
        const items = Array.isArray(list) ? list : Array.isArray(list?.items) ? list.items : [];
        // Map to minimal fields needed
        const mapped = items.map((s) => ({
          id: s.service_id ?? s.id,
          name: s.name,
          description: s.description,
        }));
        if (alive) setServices(mapped);
      } catch (e) {
        if (alive) setSvcError('Không thể tải danh sách dịch vụ.');
      } finally {
        if (alive) setSvcLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

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
                <span>Dịch vụ <FontAwesomeIcon icon={faChevronRight} /></span>
              </p>
              <h1 className="mb-0 bread">Dịch vụ</h1>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="ftco-section">
        <div className="container">
          <div className="row justify-content-center pb-5 mb-3">
            <div className="col-md-7 heading-section text-center ftco-animate">
              <span className="subheading">Dịch Vụ</span>
              <h2>Nhanh chóng – Hiệu quả – Chuyên nghiệp</h2>
            </div>
          </div>
          {svcLoading && <div className="text-center">Đang tải dịch vụ...</div>}
          {svcError && <div className="alert alert-danger">{svcError}</div>}
          {!svcLoading && !svcError && (
            <div className="row">
              {services.map((service, index) => (
                <div key={service.id ?? index} className="col-md-6 col-lg-4 services ftco-animate">
                  <Link to={`/services/${service.id ?? service.service_id}`} className="d-block d-flex text-decoration-none text-reset">
                    <div className="icon d-flex justify-content-center align-items-center">
                      {/* DB only supplies name/description; use a default icon */}
                      <span className="flaticon-cleaning"></span>
                    </div>
                    <div className="media-body pl-3">
                      <h3 className="heading">{service.name}</h3>
                      <p>{service.description}</p>
                      <p className="btn-custom">Xem bảng giá</p>
                    </div>
                  </Link>
                </div>
              ))}
              {services.length === 0 && (
                <div className="col-12 text-center text-muted">Chưa có dịch vụ nào.</div>
              )}
            </div>
          )}
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

      {/* Pricing moved to ServiceDetails */}
    </>
  );
};

export default Services; 