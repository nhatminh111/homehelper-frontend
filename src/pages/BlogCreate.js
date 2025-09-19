import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faBold, faItalic, faUnderline, faListUl, faListOl, faLink, faImage, faTrash, faPlus, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import blogService from '../services/blogService';
import { useAuth } from '../contexts/AuthContext';

const ToolbarButton = ({ icon, title, onClick }) => (
  <button type="button" className="btn btn-sm btn-outline-secondary mr-2" title={title} onClick={onClick}>
    <FontAwesomeIcon icon={icon} />
  </button>
);

const BlogCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const editorRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [linkBooking, setLinkBooking] = useState(false);
  const [relatedBookingId, setRelatedBookingId] = useState('');
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [photoUrls, setPhotoUrls] = useState([]);
  // Single service selection (default UX): service -> variant (optional)
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [desiredPrice, setDesiredPrice] = useState('');
  const [serviceNotes, setServiceNotes] = useState('');
  const [myBookings, setMyBookings] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [bookingVariantId, setBookingVariantId] = useState('');

  const execCmd = (cmd, value = null) => {
    document.execCommand(cmd, false, value);
    editorRef.current && editorRef.current.focus();
  };

  // Ensure Enter creates paragraphs in most browsers
  useEffect(() => {
    try {
      document.execCommand('defaultParagraphSeparator', false, 'p');
    } catch (_) {
      // no-op if unsupported
    }
  }, []);

  // Normalize content: if user typed plain text (no tags), wrap it in <p>...</p>
  const normalizeHtmlContent = (html) => {
    const trimmed = (html || '').trim();
    if (!trimmed) return '';
    const hasTag = /<[^>]+>/.test(trimmed);
    if (hasTag) return trimmed;
    // Replace consecutive spaces with &nbsp; to preserve minimal spacing in a paragraph
    const safe = trimmed.replace(/  /g, ' &nbsp;');
    return `<p>${safe}</p>`;
  };

  const insertLink = () => {
    const url = prompt('Enter URL');
    if (url) execCmd('createLink', url);
  };

  const insertImage = () => {
    const url = prompt('Enter image URL');
    if (url) execCmd('insertImage', url);
  };

  const addPhotoUrl = () => {
    const trimmed = photoUrlInput.trim();
    if (!trimmed) return;
    setPhotoUrls((prev) => [...prev, trimmed]);
    setPhotoUrlInput('');
  };

  const removePhotoUrl = (idx) => {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  // clear service selection
  const clearServiceSelection = () => {
    setSelectedServiceId('');
    setSelectedVariantId('');
    setDesiredPrice('');
    setServiceNotes('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

  const contentHtml = normalizeHtmlContent(editorRef.current ? editorRef.current.innerHTML : '');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!contentHtml || contentHtml === '<p><br></p>' || contentHtml === '<br>') {
      setError('Content is required');
      return;
    }
    if (!user) {
      setError('You must be logged in to create a post');
      return;
    }

    const payload = {
      title: title.trim(),
      content: contentHtml, // backend stores HTML as-is
      status: 'Pending',
      photo_urls: photoUrls.length ? photoUrls : null,
    };

    if (linkBooking && relatedBookingId.trim()) {
      payload.related_booking_id = parseInt(relatedBookingId, 10);
    }

    // Validation when linkBooking is enabled
    if (linkBooking) {
      if (!relatedBookingId) {
        setError('Please select a booking to link');
        return;
      }
    }

    // If a linked booking and a variant is chosen, force services to match booking's service + chosen variant
    if (linkBooking && relatedBookingId && bookingVariantId) {
      const booking = myBookings.find(b => String(b.booking_id) === String(relatedBookingId));
      if (booking && booking.service_id) {
        payload.services = [{
          service_id: parseInt(booking.service_id, 10),
          variant_id: parseInt(bookingVariantId, 10),
        }];
      }
    } else if (!linkBooking && selectedServiceId) {
      // Validate desired price range if variant selected
      if (selectedVariantId && desiredPrice !== '') {
        const service = allServices.find(s => String(s.service_id) === String(selectedServiceId));
        const variant = service?.variants?.find(v => String(v.variant_id) === String(selectedVariantId));
        if (variant) {
          const min = parseFloat(variant.price_min);
          const max = parseFloat(variant.price_max);
          const want = parseFloat(desiredPrice);
          if (isNaN(want) || want < min || want > max) {
            setError(`Desired price must be between ${min} and ${max} ${variant.unit || ''}`.trim());
            return;
          }
        }
      }
      // Default path: include selected service (+ optional variant/price/notes)
      payload.services = [{
        service_id: parseInt(selectedServiceId, 10),
        variant_id: selectedVariantId ? parseInt(selectedVariantId, 10) : null,
        desired_price: desiredPrice !== '' ? parseFloat(desiredPrice) : null,
        notes: serviceNotes || null,
      }];
    }

    try {
      setSubmitting(true);
      const res = await blogService.createPost(payload);
      if (res.success) {
        setSuccess('Post created successfully');
        // Redirect to detail or back to list
        const newId = res.data?.post_id;
        setTimeout(() => {
          if (newId) navigate(`/blog/${newId}`);
          else navigate('/blog');
        }, 500);
      } else {
        setError(res.message || 'Failed to create post');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Error creating post');
    } finally {
      setSubmitting(false);
    }
  };

  // Load selectable data: user's bookings and services
  useEffect(() => {
    const loadSelectors = async () => {
      try {
        const [bkRes, svRes] = await Promise.all([
          blogService.getMyBookings({ limit: 100 }),
          blogService.getAllServices(),
        ]);
        if (bkRes.success) setMyBookings(bkRes.data || []);
        if (svRes.success) setAllServices(svRes.data || []);
      } catch (e) {
        // Silently fail selectors
        console.warn('Failed to load selector data', e);
      }
    };
    loadSelectors();
  }, []);

  return (
    <>
      {/* Hero */}
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
                  <Link to="/blog">Blog <FontAwesomeIcon icon={faChevronRight} /></Link>
                </span>
                <span>Create Post</span>
              </p>
              <h1 className="mb-0 bread">Create a New Post</h1>
            </div>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="ftco-section">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="bg-white p-4 p-md-5 shadow-sm rounded">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="mb-0">Post details</h4>
                  <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
                    <FontAwesomeIcon icon={faArrowLeft} className="mr-1" /> Back
                  </button>
                </div>

                {error && (
                  <div className="alert alert-danger">{error}</div>
                )}
                {success && (
                  <div className="alert alert-success">{success}</div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Title<span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter a concise title"
                      maxLength={255}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Content (HTML)<span className="text-danger">*</span></label>
                    <div className="d-flex align-items-center mb-2">
                      <ToolbarButton icon={faBold} title="Bold" onClick={() => execCmd('bold')} />
                      <ToolbarButton icon={faItalic} title="Italic" onClick={() => execCmd('italic')} />
                      <ToolbarButton icon={faUnderline} title="Underline" onClick={() => execCmd('underline')} />
                      <ToolbarButton icon={faListUl} title="Bullet list" onClick={() => execCmd('insertUnorderedList')} />
                      <ToolbarButton icon={faListOl} title="Numbered list" onClick={() => execCmd('insertOrderedList')} />
                      <ToolbarButton icon={faLink} title="Insert link" onClick={insertLink} />
                      <ToolbarButton icon={faImage} title="Insert image" onClick={insertImage} />
                    </div>
                    <div
                      ref={editorRef}
                      className="form-control editor-content"
                      contentEditable
                      style={{ minHeight: 180, height: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                      data-placeholder="Write your post here..."
                      suppressContentEditableWarning
                    />
                    <small className="form-text text-muted">Your content will be saved as HTML.</small>
                  </div>

                  <div className="form-row">
                    <div className="form-group col-md-6">
                      <div className="custom-control custom-switch mt-4">
                        <input
                          type="checkbox"
                          className="custom-control-input"
                          id="toggleLinkBooking"
                          checked={linkBooking}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setLinkBooking(checked);
                            if (checked) {
                              // entering booking mode: clear manual service selection
                              clearServiceSelection();
                            } else {
                              // leaving booking mode: clear booking selection
                              setRelatedBookingId('');
                              setBookingVariantId('');
                            }
                          }}
                        />
                        <label className="custom-control-label" htmlFor="toggleLinkBooking">Link existing Booking</label>
                      </div>
                      <small className="form-text text-muted">Default: select Service → Variant. Toggle to link a specific booking instead.</small>
                    </div>
                    {linkBooking && (
                      <div className="form-group col-md-6">
                        <label>Booking<span className="text-danger">*</span></label>
                        <select
                          className="form-control"
                          value={relatedBookingId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRelatedBookingId(val);
                            // Auto-select booking's current variant if available
                            const booking = myBookings.find(b => String(b.booking_id) === String(val));
                            if (booking && booking.variant_id) {
                              setBookingVariantId(String(booking.variant_id));
                            } else {
                              setBookingVariantId('');
                            }
                          }}
                        >
                          <option value="">-- Select booking --</option>
                          {myBookings.map(b => (
                            <option key={b.booking_id} value={b.booking_id}>
                              #{b.booking_id} • {b.service_name || 'Service'}{b.variant_name ? ` - ${b.variant_name}` : ''} • {b.status}
                            </option>
                          ))}
                        </select>
                        <small className="form-text text-muted">When linked, the booking's service will be attached automatically. You may optionally choose a different variant of the same service.</small>
                      </div>
                    )}
                    {linkBooking && relatedBookingId && (() => {
                      const booking = myBookings.find(b => String(b.booking_id) === String(relatedBookingId));
                      const service = booking ? allServices.find(s => String(s.service_id) === String(booking.service_id)) : null;
                      const variants = service?.variants || [];
                      return (
                        <div className="form-group col-12">
                          <label>Variant for selected booking's service</label>
                            <select
                            className="form-control"
                            value={bookingVariantId}
                            onChange={(e) => setBookingVariantId(e.target.value)}
                            disabled={!variants.length}
                          >
                            <option value="">-- {variants.length ? 'Select variant (optional)' : 'No variants available'} --</option>
                            {variants.map(v => (
                              <option key={v.variant_id} value={v.variant_id}>
                                {v.variant_name} {v.unit ? `(${v.unit})` : ''}
                              </option>
                            ))}
                          </select>
                          <small className="form-text text-muted">Pick a variant to attach to this post; leave empty to use booking's current variant.</small>
                        </div>
                      );
                    })()}
                    <div className="form-group col-md-6">
                      <label>Add image URL</label>
                      <div className="input-group">
                        <input
                          type="url"
                          className="form-control"
                          value={photoUrlInput}
                          onChange={(e) => setPhotoUrlInput(e.target.value)}
                          placeholder="https://..."
                        />
                        <div className="input-group-append">
                          <button type="button" className="btn btn-outline-primary" onClick={addPhotoUrl}>
                            Add
                          </button>
                        </div>
                      </div>
                      {!!photoUrls.length && (
                        <ul className="list-group mt-2">
                          {photoUrls.map((url, idx) => (
                            <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                              <span className="text-truncate" style={{ maxWidth: '80%' }}>{url}</span>
                              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removePhotoUrl(idx)}>
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {!linkBooking && (
                    <div className="form-group">
                      <label>Service selection (default)</label>
                      <div className="border rounded p-3">
                        <div className="form-row">
                          <div className="form-group col-md-3">
                            <select
                              className="form-control"
                              value={selectedServiceId}
                              onChange={(e) => {
                                setSelectedServiceId(e.target.value);
                                setSelectedVariantId('');
                                setDesiredPrice('');
                                // Auto-select variant if service has exactly one variant
                                const service = allServices.find(s => String(s.service_id) === String(e.target.value));
                                const variants = service?.variants || [];
                                if (variants.length === 1) {
                                  setSelectedVariantId(String(variants[0].variant_id));
                                }
                              }}
                            >
                              <option value="">-- Select service --</option>
                              {allServices.map(s => (
                                <option key={s.service_id} value={s.service_id}>{s.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group col-12 col-md-6">
                            <select
                              className="form-control"
                              value={selectedVariantId}
                              onChange={(e) => {
                                setSelectedVariantId(e.target.value);
                                setDesiredPrice('');
                              }}
                              disabled={!selectedServiceId}
                            >
                              <option value="">-- Variant (optional) --</option>
                              {(() => {
                                const service = allServices.find(s => String(s.service_id) === String(selectedServiceId));
                                const variants = service?.variants || [];
                                return variants.map(v => (
                                  <option key={v.variant_id} value={v.variant_id}>{v.variant_name} {v.unit ? `(${v.unit})` : ''}</option>
                                ));
                              })()}
                            </select>
                          </div>
                          <div className="form-group col-md-3">
                            <input
                              type="number"
                              step="0.01"
                              className={`form-control ${(() => {
                                if (!selectedServiceId || !selectedVariantId || desiredPrice === '') return '';
                                const service = allServices.find(s => String(s.service_id) === String(selectedServiceId));
                                const variant = service?.variants?.find(v => String(v.variant_id) === String(selectedVariantId));
                                if (!variant) return '';
                                const min = parseFloat(variant.price_min);
                                const max = parseFloat(variant.price_max);
                                const want = parseFloat(desiredPrice);
                                if (isNaN(want)) return 'is-invalid';
                                return (want < min || want > max) ? 'is-invalid' : '';
                              })()}`}
                              placeholder="Desired price (optional)"
                              value={desiredPrice}
                              onChange={(e) => setDesiredPrice(e.target.value)}
                              disabled={!selectedVariantId}
                              {...(() => {
                                if (!selectedServiceId || !selectedVariantId) return {};
                                const service = allServices.find(s => String(s.service_id) === String(selectedServiceId));
                                const variant = service?.variants?.find(v => String(v.variant_id) === String(selectedVariantId));
                                if (!variant) return {};
                                const min = variant.price_min;
                                const max = variant.price_max;
                                return { min, max };
                              })()}
                            />
                            {(() => {
                              if (!selectedServiceId || !selectedVariantId) return null;
                              const service = allServices.find(s => String(s.service_id) === String(selectedServiceId));
                              const variant = service?.variants?.find(v => String(v.variant_id) === String(selectedVariantId));
                              if (!variant) return null;
                              const min = parseFloat(variant.price_min);
                              const max = parseFloat(variant.price_max);
                              const want = parseFloat(desiredPrice);
                              const out = desiredPrice !== '' && (isNaN(want) || want < min || want > max);
                              return (
                                <>
                                  <small className="form-text text-muted">
                                    Price range: {variant.price_min} - {variant.price_max}/{variant.unit || ''}
                                  </small>
                                  {out && (
                                    <div className="invalid-feedback d-block">
                                      Desired price must be between {variant.price_min} and {variant.price_max} {variant.unit || ''}
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group col-12">
                            <textarea
                              className="form-control"
                              rows={3}
                              placeholder="Notes (optional)"
                              value={serviceNotes}
                              onChange={(e) => setServiceNotes(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      <small className="form-text text-muted">Select a service and optionally a variant. You can leave this section empty if your post is more general.</small>
                    </div>
                  )}

                  <div className="d-flex justify-content-end">
                    <button type="button" className="btn btn-outline-secondary mr-2" onClick={() => navigate('/blog')} disabled={submitting}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting ? 'Creating...' : 'Create Post'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #6c757d;
        }
        /* Make editor auto-sized and avoid overflow */
        .editor-content.form-control {
          height: auto !important;
          min-height: 180px;
          max-height: none;
          overflow-y: visible;
          white-space: pre-wrap;
          word-break: break-word;
          overflow-wrap: anywhere;
        }
        .editor-content img { max-width: 100%; height: auto; }
        .editor-content a { word-break: break-all; }
      `}</style>
    </>
  );
};

export default BlogCreate;
