import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faTrash, faArrowLeft, faPlus } from '@fortawesome/free-solid-svg-icons';
import blogService from '../services/blogService';
import { useAuth } from '../contexts/AuthContext';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import '../css/blogCreate.css';

const ToolbarButton = ({ icon, title, onClick }) => (
  <button type="button" className="btn btn-sm btn-outline-secondary mr-2" title={title} onClick={onClick}>
    <FontAwesomeIcon icon={icon} />
  </button>
);

function BlogCreate() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const { user } = useAuth();
  const isEdit = !!editId;

  const editorWrapperRef = useRef(null);
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const fileInputRef = useRef(null);
  const [contentHtml, setContentHtml] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [linkBooking, setLinkBooking] = useState(false);
  const [relatedBookingId, setRelatedBookingId] = useState('');
  const [photoUrls, setPhotoUrls] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  // Single service selection (default UX): service -> variant (optional)
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [desiredPrice, setDesiredPrice] = useState('');
  const [serviceNotes, setServiceNotes] = useState('');
  const [myBookings, setMyBookings] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [bookingVariantId, setBookingVariantId] = useState('');

  const normalizeHtmlContent = (html) => {
    const trimmed = (html || '').trim();
    if (!trimmed) return '';
    const hasTag = /<[^>]+>/.test(trimmed);
    if (hasTag) return trimmed;
    const safe = trimmed.replace(/  /g, ' &nbsp;');
    return `<p>${safe}</p>`;
  };
  // Initialize Quill editor
  useEffect(() => {
    if (!editorRef.current) return;
    if (quillRef.current) return; // already initialized

    // Remove any stray toolbars from previous HMR/StrictMode cycles within our wrapper
    try {
      const wrapper = editorWrapperRef.current || editorRef.current.parentElement;
      if (wrapper) {
        wrapper.querySelectorAll('.ql-toolbar').forEach((el) => el.remove());
      }
    } catch (_) {}

    const toolbarOptions = [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['clean'],
    ];

    const quill = new Quill(editorRef.current, {
      theme: 'snow',
      placeholder: 'Write your post here...',
      modules: {
        toolbar: toolbarOptions,
        clipboard: { matchVisual: false },
      },
    });

    // Custom image handler
    const toolbar = quill.getModule('toolbar');
    toolbar.addHandler('image', () => {
      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', 'image/*');
      input.click();
      input.onchange = async () => {
        const file = input.files && input.files[0];
        if (!file) return;
        try {
          setUploadingImages(true);
          const res = await blogService.uploadPostImages([file]);
          const url = res?.data?.urls?.[0];
          if (url) {
            const range = quill.getSelection(true) || { index: quill.getLength(), length: 0 };
            quill.insertEmbed(range.index, 'image', url, 'user');
            setPhotoUrls((prev) => [...prev, url]);
          }
        } catch (err) {
          setUploadError(err.message || 'Failed to upload image');
        } finally {
          setUploadingImages(false);
        }
      };
    });

    // Sync HTML state
    const update = () => setContentHtml(quill.root.innerHTML);
    quill.on('text-change', update);
    // initial content if any
    if (contentHtml) quill.root.innerHTML = contentHtml;

    quillRef.current = quill;
    return () => {
      quill.off('text-change', update);
      quillRef.current = null;
      try {
        const wrapper = editorWrapperRef.current || editorRef.current?.parentElement;
        if (wrapper) {
          wrapper.querySelectorAll('.ql-toolbar').forEach((el) => el.remove());
        }
        if (editorRef.current) {
          // Reset editor node to a clean state
          editorRef.current.innerHTML = '';
          editorRef.current.className = '';
          editorRef.current.removeAttribute('data-gramm');
          editorRef.current.removeAttribute('contenteditable');
        }
      } catch (_) {}
    };
  }, []);

  // Reflect preloaded content into Quill (for edit mode)
  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;
    if (typeof contentHtml === 'string' && contentHtml) {
      const current = quill.root.innerHTML;
      if (current !== contentHtml) quill.root.innerHTML = contentHtml;
    }
  }, [contentHtml]);


  const removePhotoUrl = (idx) => {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadFiles = async (files) => {
    const arr = Array.from(files || []).filter(f => f && f.type && f.type.startsWith('image/'));
    if (!arr.length) return;
    setUploadError(null);
    setUploadingImages(true);
    try {
      const res = await blogService.uploadPostImages(arr);
      if (res.success) {
        const urls = res.data?.urls || [];
        if (urls.length) setPhotoUrls((prev) => [...prev, ...urls]);
      } else {
        setUploadError(res.message || 'Failed to upload images');
      }
    } catch (err) {
      setUploadError(err.response?.data?.message || err.message || 'Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleFilesSelected = async (e) => {
    await uploadFiles(e.target?.files || []);
    // Reset input so the same file selection can trigger onChange again
    if (e.target) e.target.value = '';
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

    const normalized = normalizeHtmlContent(contentHtml);

    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!normalized || normalized === '<p><br></p>' || normalized === '<br>') {
      setError('Content is required');
      return;
    }
    if (!user) {
      setError('You must be logged in to create a post');
      return;
    }

    const payload = {
      title: title.trim(),
      content: normalized, // backend stores HTML as-is
      photo_urls: photoUrls.length ? photoUrls : null,
    };
    // Reset status to Pending on both create and edit for re-approval
    payload.status = 'Pending';

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
      const res = isEdit ? await blogService.updatePost(editId, payload) : await blogService.createPost(payload);
      if (res.success) {
        setSuccess(isEdit ? 'Post updated successfully' : 'Post created successfully');
        // Redirect to detail or back to list
        const newId = isEdit ? editId : res.data?.post_id;
        setTimeout(() => {
          if (newId) navigate(`/blog/${newId}`);
          else navigate('/blog');
        }, 400);
      } else {
        setError(res.message || (isEdit ? 'Failed to update post' : 'Failed to create post'));
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || (isEdit ? 'Error updating post' : 'Error creating post'));
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

  // Load existing post for edit
  useEffect(() => {
    const loadExisting = async () => {
      if (!isEdit) return;
      try {
        const res = await blogService.getPostById(editId);
        const post = res?.data;
        if (!post) return;
        setTitle(post.title || '');
        setContentHtml(post.content || '');
        setPhotoUrls(Array.isArray(post.photo_urls) ? post.photo_urls : []);

        // Preload service selection if available
        try {
          const svcRes = await blogService.getPostServices(editId);
          const services = svcRes?.data || [];
          const svc = services.length ? services[0] : null;
          if (post.related_booking_id) {
            setLinkBooking(true);
            setRelatedBookingId(String(post.related_booking_id));
            if (svc?.variant_id) setBookingVariantId(String(svc.variant_id));
          } else if (svc) {
            if (svc.service_id) setSelectedServiceId(String(svc.service_id));
            if (svc.variant_id) setSelectedVariantId(String(svc.variant_id));
            if (svc.desired_price != null) setDesiredPrice(String(svc.desired_price));
            if (svc.notes) setServiceNotes(svc.notes);
          }
        } catch (_) {}
      } catch (e) {
        console.warn('Failed to load existing post', e);
      }
    };
    loadExisting();
  }, [isEdit, editId]);

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
                <span>{isEdit ? 'Edit Post' : 'Create Post'}</span>
              </p>
              <h1 className="mb-0 bread">{isEdit ? 'Edit Post' : 'Create a New Post'}</h1>
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
                  <h4 className="mb-0">{isEdit ? 'Edit details' : 'Post details'}</h4>
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
                    <label>Content<span className="text-danger">*</span></label>
                    <div className="quill-wrapper" ref={editorWrapperRef}>
                      <div ref={editorRef} />
                    </div>
                  </div>

                  {/* Images: full width, above Service selection */}
                  <div className="form-group">
                    <label>Images</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                      onChange={handleFilesSelected}
                    />
                    <div className="image-uploader">
                      <div
                        className={`upload-tile ${uploadingImages ? 'is-uploading' : ''}`}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
                        onDrop={(e) => { e.preventDefault(); uploadFiles(e.dataTransfer?.files || []); }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                        aria-label="Add images"
                      >
                        <FontAwesomeIcon icon={faPlus} size="lg" />
                      </div>
                      <div className="image-grid">
                        {photoUrls.map((url, idx) => (
                          <div key={idx} className="image-item">
                            <img src={url} alt={`uploaded-${idx}`} />
                            <button type="button" className="remove-btn" onClick={() => removePhotoUrl(idx)} aria-label="Remove image">
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    {uploadingImages && (
                      <div className="mt-2 text-info">Uploading images...</div>
                    )}
                    {uploadError && (
                      <div className="mt-2 text-danger">{uploadError}</div>
                    )}
                  </div>

                  {!linkBooking && (
                    <div className="form-group">
                      <label>Service selection</label>
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
                              <option value="">-- Variant --</option>
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
                              placeholder="Desired price"
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
                    </div>
                  )}

                  {/* Link existing booking: moved below Service section */}
                  <div className="form-group">
                    <div className="custom-control custom-switch">
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
                  </div>

                  {linkBooking && (
                    <div className="form-group">
                      <label>Booking<span className="text-danger">*</span></label>
                      <select
                        className="form-control"
                        value={relatedBookingId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRelatedBookingId(val);
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
                    </div>
                  )}

                  {linkBooking && relatedBookingId && (() => {
                    const booking = myBookings.find(b => String(b.booking_id) === String(relatedBookingId));
                    const service = booking ? allServices.find(s => String(s.service_id) === String(booking.service_id)) : null;
                    const variants = service?.variants || [];
                    return (
                      <div className="form-group">
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
                      </div>
                    );
                  })()}

                  <div className="d-flex justify-content-end">
                    <button type="button" className="btn btn-outline-secondary mr-2" onClick={() => navigate(isEdit ? `/blog/${editId}` : '/blog')} disabled={submitting}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Post' : 'Create Post')}
                    </button>
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

export default BlogCreate;
