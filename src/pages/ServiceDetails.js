import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import blogService from '../services/blogService';
import servicesIntro from '../content/servicesIntro';
import '../css/ServiceDetails.css';
// Create a slug from Vietnamese names for matching intro by name
const slugify = (str = '') => {
  try {
    return String(str)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove diacritics
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  } catch {
    return '';
  }
};

const formatCurrency = (value) => {
  if (value == null) return '';
  try {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value));
  } catch {
    return String(value);
  }
};

const ServiceDetails = () => {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [variantTaskers, setVariantTaskers] = useState({}); // { variant_id: [taskers] }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await blogService.getServiceById(id);
        const data = res?.data ?? res;
        if (alive) setService(data || null);

        // Fetch taskers for each variant (in parallel)
        if (data?.variants && Array.isArray(data.variants)) {
          const tasks = data.variants.map(async (v) => {
            try {
              const tr = await blogService.getTaskersByVariant(v.variant_id);
              const list = tr?.data ?? tr;
              console.log('Taskers for variant', v.variant_id, list);
              return { id: v.variant_id, taskers: Array.isArray(list) ? list : [] };
            } catch {
              return { id: v.variant_id, taskers: [] };
            }
          });
          const results = await Promise.all(tasks);
          if (alive) {
            const map = {};
            results.forEach((r) => { map[r.id] = r.taskers; });
            setVariantTaskers(map);
          }
        }
      } catch (e) {
        if (alive) setError('Không thể tải chi tiết dịch vụ.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  return (
    <>
      <section className="hero-wrap hero-wrap-2" style={{ backgroundImage: "url('/images/bg_2.jpg')" }} data-stellar-background-ratio="0.5">
        <div className="overlay"></div>
        <div className="container">
          <div className="row no-gutters slider-text align-items-end">
            <div className="col-md-9 ftco-animate pb-5">
              <p className="breadcrumbs mb-2">
                <span className="mr-2">
                  <Link to="/">Home <FontAwesomeIcon icon={faChevronRight} /></Link>
                </span>
                <span className="mr-2">
                  <Link to="/services">Dịch vụ <FontAwesomeIcon icon={faChevronRight} /></Link>
                </span>
                <span>Chi tiết</span>
              </p>
              <h1 className="mb-0 bread">Chi tiết Dịch vụ</h1>
            </div>
          </div>
        </div>
      </section>

      <section className="ftco-section bg-light">
        <div className="container">
          {loading && <div className="text-center">Đang tải chi tiết dịch vụ...</div>}
          {error && <div className="alert alert-danger">{error}</div>}
          {!loading && !error && service && (
            <>
              {/* Heading chung */}
              <div className="row justify-content-center pb-4 mb-3">
                <div className="col-md-10 heading-section text-center ftco-animate">
                  <span className="subheading">{service.name}</span>
                  <h2>Thông tin & Bảng giá</h2>
                  {service.description && <p className="mt-3">{service.description}</p>}
                </div>
              </div>

              {/* Static Intro Section (non-DB) formatted */}
              {(() => {
                const idKey = String(service.service_id ?? service.id ?? '').trim();
                const nameSlug = slugify(service.name);
                const content = (idKey && servicesIntro[idKey])
                  ? servicesIntro[idKey]
                  : (nameSlug && servicesIntro[nameSlug])
                    ? servicesIntro[nameSlug]
                    : servicesIntro.default || {};

                return (
                  <>
                    {/* Hero: text left, image right */}
                    <div className="row align-items-center mb-5">
                      <div className="col-md-6 ftco-animate">
                        <h3 className="mb-2 fw-bold">{content.hero?.title || service.name}</h3>
                        {content.hero?.des && <p className="mb-2 text-muted">{content.hero?.des}</p>}
                        {content.hero?.ctaText && (
                          <button type="button" className="btn btn-success mt-2">
                            {content.hero?.ctaText}
                          </button>
                        )}
                      </div>
                      <div className="col-md-6 ftco-animate text-center">
                        {content.hero?.image && (
                          <img
                            src={content.hero?.image}
                            alt={content.hero?.title || service.name}
                            className="img-fluid img-equal"
                          />
                        )}
                      </div>
                    </div>

                    {/* Intro: image left, text right */}
                    <div className="row align-items-center mb-5">
                      <div className="col-md-6 order-2 order-md-1 ftco-animate text-center">
                        {content.intro?.image && (
                          <img
                            src={content.intro?.image}
                            alt={content.intro?.title || 'Giới Thiệu'}
                            className="img-fluid img-equal"
                          />
                        )}
                      </div>
                      <div className="col-md-6 order-1 order-md-2 ftco-animate">
                        <h3 className="mb-3 fw-bold">{content.intro?.title || 'Giới Thiệu'}</h3>
                        {Array.isArray(content.intro?.text) &&
                          content.intro?.text.map((t, i) => <p key={i}>{t}</p>)}
                      </div>
                    </div>

                    {/* Reasons: text left, image right */}
                    <div className="row align-items-center mb-5">
                      <div className="col-md-6 ftco-animate">
                        <h3 className="mb-3 fw-bold">{content.reasons?.title || 'Lý do nên chọn'}</h3>
                        {Array.isArray(content.reasons?.items) && content.reasons.items.length > 0 ? (
                          <ul className="list-unstyled ps-3">
                            {content.reasons?.items.map((r, i) => (
                              <li key={i} className="mb-2">• {r}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted">Nội dung sẽ được cập nhật.</p>
                        )}
                      </div>
                      <div className="col-md-6 ftco-animate text-center">
                        {content.reasons?.image && (
                          <img
                            src={content.reasons?.image}
                            alt="reason"
                            className="img-fluid img-equal"
                          />
                        )}
                      </div>
                    </div>

                  </>
                );
              })()}

              {/* Pricing section title */}
              <div className="row justify-content-center">
                <div className="col-md-10">
                  <h3 className="sd-section-title">Bảng giá dịch vụ</h3>
                </div>
              </div>

              <div className="row sd-price-grid">
                {Array.isArray(service.variants) && service.variants.length > 0 ? (
                  service.variants.map((v) => {
                    return (
                      <div key={v.variant_id} className="col-md-6 col-lg-3 ftco-animate">
                        <div className={`sd-price-card ${v.featured ? 'active' : ''}`}>
                          <div className="text-center">
                            <div className="icon d-flex align-items-center justify-content-center">
                              <span className="fa flaticon-cleaning"></span>
                            </div>
                            <h4 className="heading-2 sd-price-card__title">{v.variant_name || 'Gói dịch vụ'}</h4>
                            <span className="price">
                              <span className="number">{formatCurrency(
                                v?.specific_price ?? v?.price_min ?? v?.price_max ?? 0
                              ).replace(/\s?₫/, '')}.000₫</span>
                              {v.unit && <span className="ml-1" style={{ fontSize: 14 }}>/ {v.unit}</span>}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-12 text-center text-muted">Chưa có biến thể dịch vụ nào.</div>
                )}
              </div>

              {/* Taskers by variant */}
              {Array.isArray(service.variants) && service.variants.length > 0 && (
                <div className="mt-4">
                  <h4 className="sd-section-title" style={{ fontSize: 22 }}>Tasker phù hợp</h4>
                  {service.variants.map((v) => {
                    const list = variantTaskers[v.variant_id] || [];
                    return (
                      <div key={`variant-taskers-${v.variant_id}`} className="mb-4">
                        <h5 className="mb-2" style={{ fontWeight: 700 }}>{v.variant_name || 'Gói dịch vụ'}</h5>
                        {list.length > 0 ? (
                          <div className="row">
                            {list.map((t) => (
                              <div key={t.tasker_id} className="col-md-6 col-lg-4 mb-4">
                                <Link
                                  to={`/tasker-profile/${t.tasker_id}`}
                                  className="text-decoration-none"
                                  style={{ color: 'inherit' }}
                                >
                                  <div className="card h-100 border-0 shadow-sm rounded-3 hover-shadow tasker-card">
                                    <div className="card-body d-flex flex-column">
                                      {/* Avatar + Name + Rating */}
                                      <div className="d-flex justify-content-between align-items-center mb-2">
                                        <div className="d-flex align-items-center">
                                          <div className="tasker-avatar me-2">
                                            {t.name?.charAt(0) || "?"}
                                          </div>
                                          <div>
                                            <h6 className="mb-0 fw-bold">{t.name}</h6>
                                            <small className="text-muted">{t.email}</small>
                                          </div>
                                        </div>
                                        <span className="tasker-rating-badge">
                                          {t.rating?.toFixed ? t.rating.toFixed(1) : t.rating}/5
                                        </span>
                                      </div>

                                      {/* Introduce / lĩnh vực */}
                                      {t.Introduce && (
                                        <p className="mt-2 mb-2 tasker-intro" style={{ fontSize: 13 }}>
                                          <i className="bi bi-briefcase me-1"></i> Lĩnh vực: {t.Introduce}
                                        </p>
                                      )}

                                      {/* Review count */}
                                      <div className="mt-auto pt-2 border-top tasker-meta">
                                        <i className="bi bi-chat-dots me-1"></i>
                                        Đánh giá:{" "}
                                        {t.reviewsCount && t.reviewsCount > 0
                                          ? t.reviewsCount
                                          : "Chưa có đánh giá"}
                                      </div>
                                    </div>
                                  </div>
                                </Link>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-muted">Chưa có tasker phù hợp.</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
};

export default ServiceDetails;
