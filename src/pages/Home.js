<<<<<<< HEAD
import React, { useEffect, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faStar,
  faCheckCircle,
  faMapMarkerAlt,
  faUser,
  faCommentDots,
  faEye,
  faComments,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
=======
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faStar, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
>>>>>>> f7d84bc98da8d00686ffbb6d735ecfadf325aff3

const Home = () => {
  const [services, setServices] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [taskers, setTaskers] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3001/api/services/servicebasic")
      .then((res) => res.json())
      .then((resData) => {
        setServices(resData.data || []); // <-- lấy data bên trong
      })
      .catch((err) => console.error("Error loading services:", err));
  }, []);

  const handleSearch = async () => {
    try {
      const res = await fetch(
        `http://localhost:3001/api/tasker?search=${searchName}&serviceId=${selectedService}`
      );

      if (!res.ok)
        throw new Error(`Network response was not ok: ${res.status}`);

      const result = await res.json();
      // Lấy mảng taskers thực sự từ data.data
      setTaskers(Array.isArray(result.data) ? result.data : []);
      console.log("Taskers fetched:", result.data);
    } catch (err) {
      console.error("Error loading taskers:", err);
      setTaskers([]); // tránh crash
    }
  };

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    service: "",
    date: "",
    time: "",
    message: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // Handle form submission here
  };

  const cleaners = [
<<<<<<< HEAD
    {
      id: 1,
      name: "Professional Cleaner 1",
      img: "/images/image_4.jpg",
      rating: 5.0,
      reviews: 120,
    },
    {
      id: 2,
      name: "Professional Cleaner 2",
      img: "/images/image_2.jpg",
      rating: 5.0,
      reviews: 120,
    },
    {
      id: 3,
      name: "Professional Cleaner 3",
      img: "/images/image_3.jpg",
      rating: 5.0,
      reviews: 120,
    },
=======
    { id: 1, name: 'Professional Cleaner 1', img: '/images/image_4.jpg', rating: 5.0, reviews: 120 },
    { id: 2, name: 'Professional Cleaner 2', img: '/images/image_2.jpg', rating: 5.0, reviews: 120 },
    { id: 3, name: 'Professional Cleaner 3', img: '/images/image_3.jpg', rating: 5.0, reviews: 120 }
>>>>>>> f7d84bc98da8d00686ffbb6d735ecfadf325aff3
  ];

  const testimonials = [
    {
      id: 1,
<<<<<<< HEAD
      name: "Sarah Johnson",
      quote:
        "Excellent service! My house has never been cleaner. The team was professional and thorough.",
    },
    {
      id: 2,
      name: "Mike Chen",
      quote:
        "Reliable and trustworthy. I've been using their services for over a year and couldn't be happier.",
    },
    {
      id: 3,
      name: "Lisa Brown",
      quote:
        "Amazing attention to detail. They clean areas I never even thought about. Highly recommended!",
    },
  ];

  const news = [
    {
      id: 1,
      tag: "Tips",
      title: "10 Tips to keep your kitchen spotless",
      date: "March 15, 2024",
      img: "/images/work-1.jpg",
    },
    {
      id: 2,
      tag: "Guide",
      title: "Eco-friendly cleaning products guide",
      date: "March 12, 2024",
      img: "/images/work-2.jpg",
    },
    {
      id: 3,
      tag: "Seasonal",
      title: "Spring cleaning checklist for 2024",
      date: "March 10, 2024",
      img: "/images/work-3.jpg",
    },
  ];

  const tiers = [
    {
      name: "Bronze",
      points: "100 Points",
      features: [
        "5% service discount",
        "Priority booking",
        "Monthly cleaning tips",
        "24/7 support",
      ],
    },
    {
      name: "Silver",
      points: "500 Points",
      features: [
        "10% service discount",
        "Free deep cleaning",
        "Premium supplies upgrade",
        "24/7 support",
      ],
      popular: true,
    },
    {
      name: "Gold",
      points: "1,000 Points",
      features: [
        "15% service discount",
        "Free monthly service",
        "All premium supplies",
        "Emergency cleaning",
      ],
    },
    {
      name: "Platinum",
      points: "2,000 Points",
      features: [
        "20% service discount",
        "VIP treatment",
        "Custom service packages",
        "Personal cleaner assigned",
      ],
    },
=======
      name: 'Sarah Johnson',
      quote: 'Excellent service! My house has never been cleaner. The team was professional and thorough.',
    },
    {
      id: 2,
      name: 'Mike Chen',
      quote: "Reliable and trustworthy. I've been using their services for over a year and couldn't be happier.",
    },
    {
      id: 3,
      name: 'Lisa Brown',
      quote: 'Amazing attention to detail. They clean areas I never even thought about. Highly recommended!',
    }
  ];

  const news = [
    { id: 1, tag: 'Tips', title: '10 Tips to keep your kitchen spotless', date: 'March 15, 2024', img: '/images/work-1.jpg' },
    { id: 2, tag: 'Guide', title: 'Eco-friendly cleaning products guide', date: 'March 12, 2024', img: '/images/work-2.jpg' },
    { id: 3, tag: 'Seasonal', title: 'Spring cleaning checklist for 2024', date: 'March 10, 2024', img: '/images/work-3.jpg' }
  ];

  const tiers = [
    { name: 'Bronze', points: '100 Points', features: ['5% service discount', 'Priority booking', 'Monthly cleaning tips', '24/7 support'] },
    { name: 'Silver', points: '500 Points', features: ['10% service discount', 'Free deep cleaning', 'Premium supplies upgrade', '24/7 support'], popular: true },
    { name: 'Gold', points: '1,000 Points', features: ['15% service discount', 'Free monthly service', 'All premium supplies', 'Emergency cleaning'] },
    { name: 'Platinum', points: '2,000 Points', features: ['20% service discount', 'VIP treatment', 'Custom service packages', 'Personal cleaner assigned'] }
>>>>>>> f7d84bc98da8d00686ffbb6d735ecfadf325aff3
  ];

  return (
    <>
      <section className="container py-5">
        <div className="row align-items-center">
          <div className="col-lg-6 mb-4 mb-lg-0">
<<<<<<< HEAD
            <h1 className="display-4 font-weight-bold mb-3">
              We do the dirty work, so you don't have to
            </h1>
            <p className="lead text-muted mb-4">
              Professional cleaning services for your home and office. Trusted
              by thousands of customers.
            </p>
            <a href="#search" className="btn btn-primary btn-lg">
              Book Now
            </a>
          </div>
          <div className="col-lg-6">
            <img
              src="/images/bg_3.jpg"
              alt="cleaners"
              className="img-fluid rounded shadow"
            />
=======
            <h1 className="display-4 font-weight-bold mb-3">We do the dirty work, so you don't have to</h1>
            <p className="lead text-muted mb-4">Professional cleaning services for your home and office. Trusted by thousands of customers.</p>
            <a href="#search" className="btn btn-primary btn-lg">Book Now</a>
          </div>
          <div className="col-lg-6">
            <img src="/images/bg_3.jpg" alt="cleaners" className="img-fluid rounded shadow" />
          </div>
        </div>
      </section>

      <section id="search" className="py-5 text-center">
        <div className="container">
          <h2 className="h1 mb-3">Find Professional Cleaners Near You</h2>
          <p className="text-muted mb-4">Advanced Search</p>
          <div className="row justify-content-center">
            <div className="col-lg-12">
              <div className="input-group input-group-lg d-flex align-items-center">
                <input className="form-control form-control-lg" placeholder="Search by cleaner name or service type..."/>
                <select className="form-select form-select-lg">
                  <option value="">Select Service</option>
                  <option>Home</option>
                  <option>Office</option>
                </select>
                <button className="btn btn-primary btn-lg">Search</button>
              </div>
            </div>
>>>>>>> f7d84bc98da8d00686ffbb6d735ecfadf325aff3
          </div>
        </div>
      </section>

<<<<<<< HEAD
      <section id="search" className="py-5 text-center">
        <div className="container">
          <h2 className="h1 mb-3">Find Professional Cleaners Near You</h2>
          <p className="text-muted mb-4">Advanced Search</p>
          <div className="row justify-content-center">
            <div className="col-lg-12">
              <div className="input-group input-group-lg d-flex align-items-center">
                <input
                  className="form-control form-control-lg"
                  placeholder="Search by cleaner name..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                />
                <select
                  className="form-select form-select-lg"
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                >
                  <option value="">Select Service</option>
                  {services.map((s) => (
                    <option key={s.service_id} value={s.service_id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleSearch}
                >
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Hiển thị kết quả taskers */}
          <div className="row mt-5">
            {taskers.map((t) => (
              <div key={t.tasker_id} className="col-md-6 col-lg-4 mb-4">
                <div className="card h-100 shadow-sm border rounded-3 p-3">
                  <div className="d-flex align-items-center mb-2">
                    <img
                      src={t.profileImage || "/default-avatar.png"}
                      alt={t.name}
                      className="rounded-circle me-3"
                      style={{ width: 50, height: 50, objectFit: "cover" }}
                    />
                    <div>
                      <h5 className="mb-0 d-flex align-items-center">
                        {t.name}
                        {t.verified && (
                          <span className="badge bg-info text-white ms-2">
                            Verified
                          </span>
                        )}
                      </h5>
                      <div className="text-warning d-flex align-items-center">
                        {[...Array(5)].map((_, i) => (
                          <FontAwesomeIcon
                            key={i}
                            icon={faStar}
                            color={
                              i < Math.round(t.rating || 0) ? "#ffd700" : "#ccc"
                            }
                            className="me-1"
                          />
                        ))}
                        <span className="text-muted ms-2">
                          {(t.rating || 0).toFixed(1)} ({t.reviewsCount || 0}{" "}
                          reviews)
                        </span>
                      </div>
                    </div>
                  </div>

                  {t.location && t.distance && (
                    <p className="text-muted mb-1">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="me-1" />
                      {t.location} • {t.distance} km away
                    </p>
                  )}

                  <h5 className="text-primary">
                    {t.rate ? `$${t.rate}/hr` : "Rate: N/A"}
                  </h5>
                  <p className="text-muted mb-2">
                    {t.experience ? `${t.experience} years experience` : ""}
                  </p>

                  {t.tags?.length > 0 && (
                    <div className="mb-2">
                      {t.tags.map((tag) => (
                        <span
                          key={tag}
                          className="badge bg-light text-dark me-2 mb-1"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mb-2">
                    {t.completedJobs !== undefined && (
                      <p className="mb-1">
                        <strong>Completed Jobs:</strong> {t.completedJobs}
                      </p>
                    )}
                    {t.languages?.length > 0 && (
                      <p className="mb-1">
                        <strong>Languages:</strong> {t.languages.join(", ")}
                      </p>
                    )}
                    <p className="text-muted small">
                      Usually responds within 1 hour
                    </p>
                  </div>

                  {/* Dịch vụ và variants */}
                  {t.services?.length > 0 && (
                    <div className="mt-3">
                      <h6>Dịch vụ cung cấp:</h6>
                      {t.services.map((s) => (
                        <div key={s.service_id} className="mb-2">
                          <strong>{s.name}</strong>
                          <ul className="ps-3 mb-0">
                            {s.variants?.length > 0 ? (
                              s.variants.map((v) => (
                                <li key={v.variant_id}>
                                  {v.variant_name} ({v.price_min}-{v.price_max}{" "}
                                  {v.unit})
                                </li>
                              ))
                            ) : (
                              <li>Không có gói dịch vụ cụ thể</li>
                            )}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="d-flex gap-2 mb-3">
                    <span className="badge bg-success">Top Rated</span>
                    <span className="badge bg-success">Quick Response</span>
                  </div>

                  <div className="col-12 mt-3">
                    <div className="d-flex justify-content-end">
                      <Link
                        to={`/tasker-profile/${t.tasker_id}`}
                        className="btn btn-outline-primary btn-sm mr-2"
                      >
                        <FontAwesomeIcon icon={faEye} className="mr-1" />
                        View Profile
                      </Link>
                      <button className="btn btn-outline-secondary btn-sm mr-2">
                        <FontAwesomeIcon icon={faComments} className="mr-1" />
                        Start Chat
                      </button>
                      <button className="btn btn-primary btn-sm">
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-5">
        <div className="row align-items-center">
          <div className="col-lg-6 mb-4 mb-lg-0">
            <img
              src="/images/about.jpg"
              alt="about"
              className="img-fluid rounded shadow"
            />
          </div>
          <div className="col-lg-6">
            <h2 className="display-5 mb-3">Let's make you fresher than ever</h2>
            <p className="text-muted mb-4">
              Our professional cleaning team uses eco-friendly products and
              advanced techniques to ensure your space is spotless.
            </p>
            <div className="d-flex justify-content-between">
              <div>
                <h3 className="text-primary">45</h3>
                <small className="text-muted">Years Experience</small>
              </div>
              <div>
                <h3 className="text-primary">2,342</h3>
                <small className="text-muted">Happy Customers</small>
              </div>
              <div>
                <h3 className="text-primary">30+</h3>
                <small className="text-muted">Service Areas</small>
=======
      <section className="container py-5">
        <div className="row align-items-center">
          <div className="col-lg-6 mb-4 mb-lg-0">
            <img src="/images/about.jpg" alt="about" className="img-fluid rounded shadow" />
          </div>
          <div className="col-lg-6">
            <h2 className="display-5 mb-3">Let's make you fresher than ever</h2>
            <p className="text-muted mb-4">Our professional cleaning team uses eco-friendly products and advanced techniques to ensure your space is spotless.</p>
            <div className="d-flex justify-content-between">
              <div><h3 className="text-primary">45</h3><small className="text-muted">Years Experience</small></div>
              <div><h3 className="text-primary">2,342</h3><small className="text-muted">Happy Customers</small></div>
              <div><h3 className="text-primary">30+</h3><small className="text-muted">Service Areas</small></div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5" style={{background:'#f6f8ff'}}>
        <div className="container">
          <h2 className="h1 text-center mb-2">Top 3 Professional Cleaners</h2>
          <p className="text-center text-muted mb-5">Meet our highest-rated cleaning professionals</p>
          <div className="row">
            {cleaners.map((c) => (
              <div key={c.id} className="col-md-6 col-lg-4 mb-4">
                <div className="card h-100 shadow-sm border-0">
                  <div className="position-relative">
                    <img src={c.img} className="card-img-top" alt={c.name} />
                    <span className="badge badge-warning position-absolute" style={{ top: 12, left: 12, background: '#ffd84d', color: '#1b1c24', padding: '6px 10px', borderRadius: 20, fontWeight: 600 }}>Top Rated</span>
                  </div>
                  <div className="card-body">
                    <h5 className="card-title mb-2">{c.name}</h5>
                    <div className="mb-2" style={{ color: '#f5b100' }}>
                      {[...Array(5)].map((_, i) => (
                        <FontAwesomeIcon key={i} icon={faStar} className="mr-1" />
                      ))}
                      <span className="text-muted ml-2">{c.rating.toFixed(1)} ({c.reviews} reviews)</span>
                    </div>
                    <p className="text-muted">Experienced in residential and commercial cleaning with eco-friendly products.</p>
                    <button className="btn btn-primary btn-block">Book Now</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-5" style={{background:'#0c1730'}}>
        <div className="container">
          <h2 className="text-white text-center mb-2">Happy Customers</h2>
          <p className="text-center text-light-50 mb-4" style={{opacity:.8}}>See what our customers say about our services</p>
          <div className="row">
            {testimonials.map((t) => (
              <div key={t.id} className="col-md-4 mb-3">
                <div className="p-4 rounded shadow-sm" style={{background:'#2b5cff', color:'#fff'}}>
                  <div className="mb-3" style={{ color: '#ffea75' }}>
                    {[...Array(5)].map((_, i) => (
                      <FontAwesomeIcon key={i} icon={faStar} className="mr-1" />
                    ))}
                  </div>
                  <p className="mb-4">"{t.quote}"</p>
                  <div className="d-flex align-items-center">
                    <div className="ml-2">
                      <strong>{t.name}</strong>
                      <div className="small" style={{opacity:.9}}>Verified Customer</div>
                    </div>
                  </div>
                </div>
>>>>>>> f7d84bc98da8d00686ffbb6d735ecfadf325aff3
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <h2 className="h1 text-center mb-2">Latest News</h2>
          <p className="text-center text-muted mb-5">Stay updated with our latest tips and news</p>
          <div className="row">
            {news.map((n) => (
              <div key={n.id} className="col-md-6 col-lg-4 mb-4">
                <div className="card h-100 shadow-sm border-0">
                  <img src={n.img} className="card-img-top" alt={n.title} />
                  <div className="card-body">
                    <span className="badge badge-light mb-2" style={{background:'#eef2ff', color:'#1b2a4b', borderRadius: 20, padding: '6px 12px'}}>{n.tag}</span>
                    <h5 className="card-title">{n.title}</h5>
                    <p className="text-muted">{n.date}</p>
                    <button className="btn btn-outline-primary">Read More</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-5" style={{background:'#2b5cff'}}>
        <div className="container text-center text-white">
          <h2 className="mb-3">Together we will explore new things</h2>
          <p className="mb-4">Ready to experience the best cleaning service? Get started today!</p>
          <button className="btn btn-warning btn-lg">Get Started Now</button>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <h2 className="h1 text-center mb-2">Loyalty Rewards Program</h2>
          <p className="text-center text-muted mb-5">Earn points with every service and unlock exclusive member benefits</p>
          <div className="row">
            {tiers.map((t) => (
              <div key={t.name} className="col-md-6 col-lg-3 mb-4 d-flex">
                <div className={`card shadow-sm border-0 w-100 ${t.popular ? 'position-relative' : ''}`} style={{ boxShadow: t.popular ? '0 0 0 3px #ffe58f inset' : undefined }}>
                  {t.popular && (
                    <div className="position-absolute" style={{ top: -12, left: '50%', transform: 'translateX(-50%)' }}>
                      <span className="badge badge-warning" style={{ background: '#ffd84d', color: '#1b1c24', padding: '6px 12px', borderRadius: 20, fontWeight: 700 }}>Most Popular</span>
                    </div>
                  )}
                  <div className="card-body text-center">
                    <h5 className="mb-2">{t.name}</h5>
                    <h3 className="text-primary mb-4" style={{ fontWeight: 700 }}>{t.points}</h3>
                    <ul className="list-unstyled text-left mb-4">
                      {t.features.map((f, idx) => (
                        <li key={idx} className="mb-2">
                          <FontAwesomeIcon icon={faCheckCircle} className="text-success mr-2" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <button className={`btn ${t.popular ? 'btn-warning' : 'btn-primary'}`}>Unlock Rewards</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-5" style={{ background: "#f6f8ff" }}>
        <div className="container">
          <h2 className="h1 text-center mb-2">Top 3 Professional Cleaners</h2>
          <p className="text-center text-muted mb-5">
            Meet our highest-rated cleaning professionals
          </p>
          <div className="row">
            {cleaners.map((c) => (
              <div key={c.id} className="col-md-6 col-lg-4 mb-4">
                <div className="card h-100 shadow-sm border-0">
                  <div className="position-relative">
                    <img src={c.img} className="card-img-top" alt={c.name} />
                    <span
                      className="badge badge-warning position-absolute"
                      style={{
                        top: 12,
                        left: 12,
                        background: "#ffd84d",
                        color: "#1b1c24",
                        padding: "6px 10px",
                        borderRadius: 20,
                        fontWeight: 600,
                      }}
                    >
                      Top Rated
                    </span>
                  </div>
                  <div className="card-body">
                    <h5 className="card-title mb-2">{c.name}</h5>
                    <div className="mb-2" style={{ color: "#f5b100" }}>
                      {[...Array(5)].map((_, i) => (
                        <FontAwesomeIcon
                          key={i}
                          icon={faStar}
                          className="mr-1"
                        />
                      ))}
                      <span className="text-muted ml-2">
                        {c.rating.toFixed(1)} ({c.reviews} reviews)
                      </span>
                    </div>
                    <p className="text-muted">
                      Experienced in residential and commercial cleaning with
                      eco-friendly products.
                    </p>
                    <button className="btn btn-primary btn-block">
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-5" style={{ background: "#0c1730" }}>
        <div className="container">
          <h2 className="text-white text-center mb-2">Happy Customers</h2>
          <p
            className="text-center text-light-50 mb-4"
            style={{ opacity: 0.8 }}
          >
            See what our customers say about our services
          </p>
          <div className="row">
            {testimonials.map((t) => (
              <div key={t.id} className="col-md-4 mb-3">
                <div
                  className="p-4 rounded shadow-sm"
                  style={{ background: "#2b5cff", color: "#fff" }}
                >
                  <div className="mb-3" style={{ color: "#ffea75" }}>
                    {[...Array(5)].map((_, i) => (
                      <FontAwesomeIcon key={i} icon={faStar} className="mr-1" />
                    ))}
                  </div>
                  <p className="mb-4">"{t.quote}"</p>
                  <div className="d-flex align-items-center">
                    <div className="ml-2">
                      <strong>{t.name}</strong>
                      <div className="small" style={{ opacity: 0.9 }}>
                        Verified Customer
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <h2 className="h1 text-center mb-2">Latest News</h2>
          <p className="text-center text-muted mb-5">
            Stay updated with our latest tips and news
          </p>
          <div className="row">
            {news.map((n) => (
              <div key={n.id} className="col-md-6 col-lg-4 mb-4">
                <div className="card h-100 shadow-sm border-0">
                  <img src={n.img} className="card-img-top" alt={n.title} />
                  <div className="card-body">
                    <span
                      className="badge badge-light mb-2"
                      style={{
                        background: "#eef2ff",
                        color: "#1b2a4b",
                        borderRadius: 20,
                        padding: "6px 12px",
                      }}
                    >
                      {n.tag}
                    </span>
                    <h5 className="card-title">{n.title}</h5>
                    <p className="text-muted">{n.date}</p>
                    <button className="btn btn-outline-primary">
                      Read More
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-5" style={{ background: "#2b5cff" }}>
        <div className="container text-center text-white">
          <h2 className="mb-3">Together we will explore new things</h2>
          <p className="mb-4">
            Ready to experience the best cleaning service? Get started today!
          </p>
          <button className="btn btn-warning btn-lg">Get Started Now</button>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <h2 className="h1 text-center mb-2">Loyalty Rewards Program</h2>
          <p className="text-center text-muted mb-5">
            Earn points with every service and unlock exclusive member benefits
          </p>
          <div className="row">
            {tiers.map((t) => (
              <div key={t.name} className="col-md-6 col-lg-3 mb-4 d-flex">
                <div
                  className={`card shadow-sm border-0 w-100 ${
                    t.popular ? "position-relative" : ""
                  }`}
                  style={{
                    boxShadow: t.popular
                      ? "0 0 0 3px #ffe58f inset"
                      : undefined,
                  }}
                >
                  {t.popular && (
                    <div
                      className="position-absolute"
                      style={{
                        top: -12,
                        left: "50%",
                        transform: "translateX(-50%)",
                      }}
                    >
                      <span
                        className="badge badge-warning"
                        style={{
                          background: "#ffd84d",
                          color: "#1b1c24",
                          padding: "6px 12px",
                          borderRadius: 20,
                          fontWeight: 700,
                        }}
                      >
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="card-body text-center">
                    <h5 className="mb-2">{t.name}</h5>
                    <h3
                      className="text-primary mb-4"
                      style={{ fontWeight: 700 }}
                    >
                      {t.points}
                    </h3>
                    <ul className="list-unstyled text-left mb-4">
                      {t.features.map((f, idx) => (
                        <li key={idx} className="mb-2">
                          <FontAwesomeIcon
                            icon={faCheckCircle}
                            className="text-success mr-2"
                          />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      className={`btn ${
                        t.popular ? "btn-warning" : "btn-primary"
                      }`}
                    >
                      Unlock Rewards
                    </button>
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

export default Home;
