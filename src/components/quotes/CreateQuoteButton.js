import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import QuoteService from '../../services/quoteService';
import TaskerService from '../../services/taskerService';

const currencyVND = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(n || 0));

export default function CreateQuoteButton({ postId, services = [] }) {
  const { isTasker, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [variantId, setVariantId] = useState('');
  const [price, setPrice] = useState('');
  const [proposal, setProposal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [myQuote, setMyQuote] = useState(null);
  const [eligibleVariantIds, setEligibleVariantIds] = useState(new Set());
  const [eligibilityChecked, setEligibilityChecked] = useState(false);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);

  // Flatten variants from services
  const variants = useMemo(() => {
    const arr = [];
    services.forEach((s) => {
      if (s && s.variant_id) {
        arr.push({
          variant_id: s.variant_id,
          variant_name: s.variant_name || s.name,
          service_name: s.name,
          price_min: s.price_min,
          price_max: s.price_max,
          specific_price: s.specific_price,
          desired_price: s.desired_price,
          unit: s.unit,
        });
      }
    });
    return arr;
  }, [services]);

  // Filter only variants the current tasker actually registered (eligibility)
  const eligibleVariants = useMemo(() => {
    if (!eligibilityChecked) return [];
    return variants.filter(v => eligibleVariantIds.has(v.variant_id));
  }, [variants, eligibleVariantIds, eligibilityChecked]);

  const selectedVariant = useMemo(
    () => eligibleVariants.find((v) => String(v.variant_id) === String(variantId)) || null,
    [eligibleVariants, variantId]
  );
  const hasSingleVariant = eligibleVariants.length === 1;
  // Check eligibility by intersecting registered variants with post variants (single request)
  useEffect(() => {
    if (!isTasker() || !user?.user_id || !services.length) return;
    let cancelled = false;
    setEligibilityLoading(true);
    (async () => {
      try {
        // Collect variant ids from blog services (support fallback keys)
        const blogVariantIds = [...new Set(services.map(s => s.variant_id || s.service_variant_id || s.variantId).filter(Boolean))];
        if (blogVariantIds.length === 0) {
          if (!cancelled) {
            setEligibleVariantIds(new Set());
            setEligibilityChecked(true);
          }
          return;
        }
        // Fetch registered variants for current tasker
        const reg = await TaskerService.getRegisteredVariants(user.user_id);
        const registeredIds = Array.isArray(reg?.data) ? reg.data.map(v => parseInt(v,10)).filter(Number.isFinite) : [];
        const eligible = blogVariantIds.filter(id => registeredIds.includes(parseInt(id,10)));
        if (!cancelled) {
          setEligibleVariantIds(new Set(eligible.map(e => parseInt(e,10))));
          setEligibilityChecked(true);
        }
      } catch (err) {
        if (!cancelled) {
          setEligibleVariantIds(new Set());
          setEligibilityChecked(true);
        }
      } finally {
        if (!cancelled) setEligibilityLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isTasker, user?.user_id, services]);

  // Live validation message for price
  const priceError = useMemo(() => {
    if (!selectedVariant) return null;
    const num = Number(price);
    if (!num || num <= 0) return null;
    const { price_min, price_max, specific_price } = selectedVariant;
    if (price_min != null && price_max != null) {
      const min = Number(price_min);
      const max = Number(price_max);
      if (num < min || num > max) return `Giá phải nằm trong khoảng ${currencyVND(min)} - ${currencyVND(max)}.`;
    } else if (specific_price != null) {
      const sp = Number(specific_price);
      if (num !== sp) return `Giá phải bằng ${currencyVND(sp)}.`;
    }
    return null;
  }, [selectedVariant, price]);

  const setQuickPrice = (type) => {
    if (!selectedVariant) return;
    const { price_min, price_max, desired_price, specific_price } = selectedVariant;
    let val = '';
    switch (type) {
      case 'desired':
        val = desired_price ?? '';
        break;
      case 'min':
        val = price_min ?? specific_price ?? '';
        break;
      case 'mid':
        if (price_min != null && price_max != null) val = (Number(price_min) + Number(price_max)) / 2;
        else if (specific_price != null) val = specific_price;
        break;
      case 'max':
        val = price_max ?? specific_price ?? '';
        break;
      default:
        break;
    }
    if (val !== '') setPrice(String(Math.round(Number(val))));
  };

  // Fetch my latest quote for this post (Tasker)
  useEffect(() => {
    if (!isTasker() || !postId) return;
    (async () => {
      try {
        const res = await QuoteService.getMyQuoteForPost(postId);
        if (res.success) setMyQuote(res.data);
      } catch (_) {}
    })();
  }, [postId, isTasker]);

  // Auto-select the only variant when modal opens
  useEffect(() => {
    if (open && hasSingleVariant) setVariantId(String(variants[0].variant_id));
  }, [open, hasSingleVariant, variants]);

  // Lock body scroll while modal is open (before any early return)
  useEffect(() => {
    if (open) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [open]);

  if (!isTasker()) return null;

  const canOpen = (!myQuote || myQuote.status === 'Đã từ chối') && eligibleVariants.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!variantId) {
      setError('Vui lòng chọn dịch vụ/nhóm');
      return;
    }
    const priceNum = Number(price);
    if (!priceNum || priceNum <= 0) {
      setError('Giá đề xuất không hợp lệ');
      return;
    }
    if (priceError) {
      setError(priceError);
      return;
    }

    try {
      setSubmitting(true);
      const resp = await QuoteService.createQuote({
        post_id: Number(postId),
        variant_id: Number(variantId),
        proposed_price: priceNum,
        proposal: proposal?.trim() || '',
      });
      if (resp.success) {
        const mine = await QuoteService.getMyQuoteForPost(postId);
        if (mine.success) setMyQuote(mine.data);
        setOpen(false);
        setVariantId('');
        setPrice('');
        setProposal('');
      } else {
        setError(resp.message || 'Không thể tạo báo giá');
      }
    } catch (err) {
      setError(err.message || 'Không thể tạo báo giá');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-3">
      {!open && (
        eligibilityLoading ? (
          <span className="text-muted">Đang kiểm tra dịch vụ...</span>
        ) : eligibleVariants.length === 0 ? (
          <div className="badge rounded-pill text-bg-danger" style={{ whiteSpace: 'nowrap' }}>
            Bạn chưa đăng ký dịch vụ tương ứng
          </div>
        ) : canOpen ? (
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            Gửi báo giá
          </button>
        ) : (
          myQuote && (
            <div
              className="badge rounded-pill text-bg-light text-muted"
              style={{ display: 'inline-block', fontWeight: 400, whiteSpace: 'nowrap' }}
              title="Bạn đã gửi báo giá"
            >
              Đã gửi: {currencyVND(myQuote.proposed_price)} · {myQuote.status}
            </div>
          )
        )
      )}

      {open &&
        createPortal(
          <>
            <div
              className="modal fade show"
              style={{ display: 'block', position: 'fixed', inset: 0, zIndex: 1050, overflowY: 'auto' }}
              role="dialog"
              aria-modal="true"
              onClick={(e) => {
                if (e.target === e.currentTarget) setOpen(false);
              }}
            >
              <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Tạo báo giá</h5>
                    <button type="button" className="btn-close" onClick={() => setOpen(false)} />
                  </div>
                  <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                      {error && <div className="alert alert-danger py-2">{error}</div>}
                      <div className="mb-3">
                        <label className="form-label">Dịch vụ/Nhóm</label>
                        {hasSingleVariant ? (
                          <input className="form-control" value={`${eligibleVariants[0].service_name} · ${eligibleVariants[0].variant_name}`} disabled />
                        ) : (
                          <select className="form-select" value={variantId} onChange={(e) => setVariantId(e.target.value)} required>
                            <option value="">-- Chọn --</option>
                            {eligibleVariants.map((v) => (
                              <option key={v.variant_id} value={v.variant_id}>
                                {v.service_name} · {v.variant_name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Giá đề xuất (VND){selectedVariant?.unit ? ` / ${selectedVariant.unit}` : ''}</label>
                        <input
                          type="number"
                          className={`form-control ${priceError ? 'is-invalid' : ''}`}
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          onWheel={(e) => e.currentTarget.blur()}
                          required
                        />
                        {priceError && <div className="invalid-feedback d-block">{priceError}</div>}
                        {selectedVariant && (
                          <div className="form-text mt-1">
                            {selectedVariant.desired_price != null && (
                              <span className="me-3">
                                Giá mong muốn: <strong>{currencyVND(selectedVariant.desired_price)}</strong>
                              </span>
                            )}
                            {selectedVariant.price_min != null && selectedVariant.price_max != null ? (
                              <span>
                                Khoảng giá: <strong>{currencyVND(selectedVariant.price_min)} - {currencyVND(selectedVariant.price_max)}</strong>
                              </span>
                            ) : selectedVariant.specific_price != null ? (
                              <span>
                                Giá tham chiếu: <strong>{currencyVND(selectedVariant.specific_price)}</strong>
                              </span>
                            ) : null}
                          </div>
                        )}
                      </div>
                      {selectedVariant && (
                        <div className="mb-3 d-flex flex-wrap gap-2">
                          {selectedVariant.desired_price != null && (
                            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setQuickPrice('desired')}>
                              = Giá mong muốn
                            </button>
                          )}
                          {selectedVariant.price_min != null && (
                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setQuickPrice('min')}>
                              = Min
                            </button>
                          )}
                          {(selectedVariant.price_min != null && selectedVariant.price_max != null) || selectedVariant.specific_price != null ? (
                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setQuickPrice('mid')}>
                              = Trung bình
                            </button>
                          ) : null}
                          {selectedVariant.price_max != null && (
                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setQuickPrice('max')}>
                              = Max
                            </button>
                          )}
                        </div>
                      )}
                      <div className="mb-3">
                        <textarea
                          className="form-control"
                          rows={4}
                          value={proposal}
                          onChange={(e) => setProposal(e.target.value)}
                          placeholder="Mô tả ngắn gọn kinh nghiệm, cách làm việc, phạm vi công việc..."
                        />
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
                        Hủy
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={submitting || !!priceError}>
                        {submitting ? 'Đang gửi...' : 'Gửi báo giá'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
            <div
              className="modal-backdrop fade show"
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}
              onClick={() => setOpen(false)}
            />
          </>,
          document.body
        )}
    </div>
  );
}