import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faStar, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

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

  const cleaners = [
    { id: 1, name: 'Professional Cleaner 1', img: '/images/image_4.jpg', rating: 5.0, reviews: 120 },
    { id: 2, name: 'Professional Cleaner 2', img: '/images/image_2.jpg', rating: 5.0, reviews: 120 },
    { id: 3, name: 'Professional Cleaner 3', img: '/images/image_3.jpg', rating: 5.0, reviews: 120 }
  ];

  const testimonials = [
    {
      id: 1,
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
  ];

  return (
    <>
      <section className="container py-5">
        <div className="row align-items-center">
          <div className="col-lg-6 mb-4 mb-lg-0">
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
          </div>
        </div>
      </section>

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
    </>
  );
};

export default Home; 