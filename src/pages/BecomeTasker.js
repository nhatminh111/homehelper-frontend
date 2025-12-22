import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomToastContainer, showToast } from '../components/common/CustomToast';
import serviceService from '../services/serviceService';
import { formatVND } from '../utils/formatVND';
import { checkVerifiedCCCD, getCCCDStatus } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
// Use same base URL strategy as api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Helper fetch with auth header (supports multiple token storage keys)
const authFetch = async (url, options = {}) => {
  let token = null;
  try {
    token = localStorage.getItem('token')
      || localStorage.getItem('accessToken')
      || localStorage.getItem('authToken')
      || localStorage.getItem('jwt');
    if (!token) {
      const userRaw = localStorage.getItem('user');
      if (userRaw) {
        const user = JSON.parse(userRaw);
        token = user?.token || user?.accessToken || user?.authToken || null;
      }
    }
  } catch (_) { /* ignore */ }
  const headers = options.headers ? { ...options.headers } : {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  // Default JSON accept for API endpoints
  if (!headers['Accept']) headers['Accept'] = 'application/json';
  return fetch(url, { ...options, headers });
};

// Helper to read auth token (same sources as authFetch) and decode JWT payload to get user id
const getAuthToken = () => {
  try {
    let t = localStorage.getItem('token')
      || localStorage.getItem('accessToken')
      || localStorage.getItem('authToken')
      || localStorage.getItem('jwt');
    if (!t) {
      const raw = localStorage.getItem('user');
      if (raw) {
        const u = JSON.parse(raw);
        t = u?.token || u?.accessToken || u?.authToken || null;
      }
    }
    return t;
  } catch { return null; }
};

const decodeJwt = (token) => {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    let payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed for base64 decoding
    const padding = (4 - payload.length % 4) % 4;
    payload = payload + '='.repeat(padding);
    const json = JSON.parse(decodeURIComponent(escape(window.atob(payload))));
    return json;
  } catch (e) {
    console.warn('Failed to decode JWT:', e.message);
    return null;
  }
};

// --- Name comparison helpers for holder vs account name ---
const normalizeName = (s) => {
  try {
    return (s || '')
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove diacritics
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  } catch { return (s || '').toString().toLowerCase().trim(); }
};
const tokenizeName = (s) => normalizeName(s).split(' ').filter(Boolean);
const compareNames = (a, b) => {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return { match: false, score: 0, reason: 'empty' };
  if (na === nb) return { match: true, score: 1, reason: 'exact' };
  if (na.includes(nb) || nb.includes(na)) return { match: true, score: 0.9, reason: 'substring' };
  const ta = new Set(tokenizeName(a));
  const tb = new Set(tokenizeName(b));
  const inter = [...ta].filter(t => tb.has(t)).length;
  const union = new Set([...ta, ...tb]).size;
  const score = union ? inter / union : 0;
  return { match: score >= 0.6, score, reason: 'jaccard' };
};

const BecomeTasker = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [introduce, setIntroduce] = useState('');
  const [services, setServices] = useState([]); // full list with variants
  const [selectedServiceId, setSelectedServiceId] = useState('');
  // Removed serviceSearch per refinement
  const [selectedVariants, setSelectedVariants] = useState([]); // variant_id list
  // Certificates per service: { [service_id]: [{ cert_name, cert_public_id, delivery_type, _signed_url, _signed_expiry, issued_by, issued_date, service_id, needsSigned }] }
  const [serviceCerts, setServiceCerts] = useState({});
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitState, setSubmitState] = useState({ done: false, error: null });
  const [zoomImage, setZoomImage] = useState(null);
  const [extracting, setExtracting] = useState(null); // { service_id, idx }
  const [introVideo, setIntroVideo] = useState(null); // { video_url, public_id, title, description }
  const [videoUploading, setVideoUploading] = useState(false);
  // Current user/account name (for holder comparison)
  const [accountName, setAccountName] = useState('');
  // Hide form if user already is a Tasker
  const [isTaskerAccount, setIsTaskerAccount] = useState(null); // null: unknown, true/false: known
  const [currentUserId, setCurrentUserId] = useState(null);
  const [tokenUserId, setTokenUserId] = useState(null);
  // Check CCCD verification status
  const [checkingCCCD, setCheckingCCCD] = useState(true);
  const [cccdVerified, setCccdVerified] = useState(false);

  useEffect(() => {
    // Try to get user info from localStorage (assuming auth stores user object JSON under 'user')
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj && obj.name) setAccountName(obj.name);
        const uid = obj?.user_id || obj?.userId || obj?.id;
        if (uid) setCurrentUserId(uid);
      }
    } catch (e) { /* silent */ }
  }, []);

  // Normalize CCCD status string to handle encoding issues and multiple languages
  const normalizeCCCDStatus = (status) => {
    if (!status) return '';
    // Handle encoding issues: "Ðã xác minh" -> "Đã xác minh"
    let normalized = status.toString().replace(/Ð/g, 'Đ').trim();
    // Normalize Vietnamese status to English equivalents for easier comparison
    normalized = normalized
      .replace(/chờ xử lý/gi, 'pending')
      .replace(/chờ duyệt/gi, 'pending')
      .replace(/đang chờ duyệt/gi, 'pending')
      .replace(/đã xác minh/gi, 'verified')
      .replace(/da xac minh/gi, 'verified')
      .replace(/bị từ chối/gi, 'rejected')
      .replace(/từ chối/gi, 'rejected')
      .replace(/tu choi/gi, 'rejected')
      .replace(/chưa gửi cccd/gi, 'notsubmitted')
      .replace(/chua gui cccd/gi, 'notsubmitted');
    return normalized.toLowerCase();
  };

  // Check CCCD verification status before allowing access
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Check if user is authenticated
        if (!isAuthenticated()) {
          setCheckingCCCD(false);
          return;
        }

        // Get token
        const token = getAuthToken();
        if (!token) {
          setCheckingCCCD(false);
          return;
        }

        // EARLY CHECK: Check from user context first (faster, no API call needed)
        const userCccdStatus = user?.cccd_status || '';
        console.log('[BecomeTasker] 🔍 Early check - User context cccd_status:', userCccdStatus);
        
        if (userCccdStatus) {
          const earlyStatusNormalized = normalizeCCCDStatus(userCccdStatus);
          const isEarlyVerified = earlyStatusNormalized === 'verified';
          const isEarlyPending = earlyStatusNormalized === 'pending';
          const isEarlyRejected = earlyStatusNormalized === 'rejected';
          const isEarlyNotSubmitted = earlyStatusNormalized === 'notsubmitted' || !userCccdStatus;
          
          // Block immediately if status is NOT verified
          if (isEarlyPending || isEarlyRejected || isEarlyNotSubmitted || !isEarlyVerified) {
            console.log('[BecomeTasker] 🚫 EARLY BLOCK from user context:', {
              userCccdStatus,
              earlyStatusNormalized,
              isEarlyPending,
              isEarlyRejected,
              isEarlyNotSubmitted,
              isEarlyVerified
            });
            
            if (!cancelled) {
              setCccdVerified(false);
              setCheckingCCCD(false);
              
              if (isEarlyPending) {
                showToast.warning('CCCD của bạn đang chờ duyệt. Vui lòng đợi admin duyệt trước khi đăng ký làm Tasker.');
              } else if (isEarlyRejected) {
                showToast.warning('CCCD của bạn đã bị từ chối. Vui lòng xác minh lại CCCD trước khi đăng ký làm Tasker.');
              } else {
                showToast.warning('Vui lòng xác minh CCCD trước khi đăng ký làm Tasker');
              }
              
              navigate('/cccd', { replace: true });
            }
            return; // Exit early, don't call API
          }
          
          // If early check passes (verified), still verify with API for double-check
          console.log('[BecomeTasker] ✅ Early check passed, verifying with API...');
        }

        // Check CCCD verification status - must be Verified (approved), not just submitted
        // FALLBACK: Also check from user context if available
        
        let verifiedRes, statusRes;
        try {
          [verifiedRes, statusRes] = await Promise.all([
            checkVerifiedCCCD(token),
            getCCCDStatus(token)
          ]);
        } catch (apiError) {
          console.error('[BecomeTasker] Error fetching CCCD status:', apiError);
          // If API fails, fallback to user context
          if (userCccdStatus) {
            const fallbackStatusNormalized = normalizeCCCDStatus(userCccdStatus);
            const isFallbackVerified = fallbackStatusNormalized === 'verified';
            const isFallbackPending = fallbackStatusNormalized === 'pending';
            const isFallbackRejected = fallbackStatusNormalized === 'rejected';
            const isFallbackNotSubmitted = fallbackStatusNormalized === 'notsubmitted' || !userCccdStatus;
            
            const fallbackIsVerified = !isFallbackNotSubmitted && 
                                      !isFallbackPending && 
                                      !isFallbackRejected && 
                                      isFallbackVerified;
            
            console.log('[BecomeTasker] Using fallback check from user context:', {
              userCccdStatus,
              fallbackStatusNormalized,
              fallbackIsVerified
            });
            
            if (!cancelled) {
              setCccdVerified(fallbackIsVerified);
              setCheckingCCCD(false);
              if (!fallbackIsVerified) {
                if (isFallbackPending) {
                  showToast.warning('CCCD của bạn đang chờ duyệt. Vui lòng đợi admin duyệt trước khi đăng ký làm Tasker.');
                } else {
                  showToast.warning('Vui lòng xác minh CCCD trước khi đăng ký làm Tasker');
                }
                navigate('/cccd', { replace: true });
              }
            }
            return;
          }
          
          // If no fallback, treat as not verified
          if (!cancelled) {
            setCccdVerified(false);
            setCheckingCCCD(false);
            showToast.warning('Vui lòng xác minh CCCD trước khi đăng ký làm Tasker');
            navigate('/cccd', { replace: true });
          }
          return;
        }
        
        // Get status data - handle different response structures
        // Backend returns: { success: true, data: { status: '...', ... } }
        const statusData = statusRes?.data || statusRes || {};
        const cccdStatusRaw = statusData.status || statusData.verification_status || userCccdStatus || '';
        const cccdStatusNormalized = normalizeCCCDStatus(cccdStatusRaw);
        
        // Also check hasVerified flag
        // Backend returns: { success: true, data: { hasVerified: true/false, ... } }
        const hasVerifiedFlag = verifiedRes?.data?.hasVerified || verifiedRes?.hasVerified || false;
        
        // STRICT CHECK: Only allow if status is explicitly 'Verified' (approved by admin)
        // Block in ALL other cases:
        // - No CCCD submitted (status is 'NotSubmitted' or empty/null/undefined) -> BLOCK
        // - Status is Pending (waiting for approval) -> BLOCK
        // - Status is Rejected -> BLOCK
        // - Status is anything other than Verified -> BLOCK
        // - hasVerified flag is false -> BLOCK
        // Only allow if BOTH: status is Verified AND hasVerified flag is true
        
        // Check if status is explicitly 'Verified' (case-insensitive, handle encoding)
        // After normalization, should be 'verified'
        const isStatusVerified = cccdStatusNormalized === 'verified';
        
        // Block if status is 'NotSubmitted' (user hasn't submitted CCCD)
        // After normalization, should be 'notsubmitted'
        const isNotSubmitted = cccdStatusNormalized === 'notsubmitted' || 
                               !cccdStatusRaw || 
                               cccdStatusRaw === '';
        
        // Block if status is 'Pending' (waiting for approval)
        // After normalization, should be 'pending'
        const isPending = cccdStatusNormalized === 'pending';
        
        // Block if status is 'Rejected'
        // After normalization, should be 'rejected'
        const isRejected = cccdStatusNormalized === 'rejected';
        
        // Must have BOTH conditions: status is Verified AND hasVerified flag is true
        // Block ALL other cases: NotSubmitted, Pending, Rejected, or anything else
        // Only allow if BOTH: status is Verified AND hasVerified flag is true
        const isVerified = !isNotSubmitted && 
                          !isPending && 
                          !isRejected && 
                          isStatusVerified === true && 
                          hasVerifiedFlag === true;
        
        // Debug log to help troubleshoot - ALWAYS log
        console.log('[BecomeTasker] 🔍 CCCD Check Debug:', {
          'userCccdStatus_from_context': userCccdStatus,
          'statusRes_full': statusRes,
          'verifiedRes_full': verifiedRes,
          'statusData': statusData,
          'cccdStatusRaw': cccdStatusRaw,
          'cccdStatusNormalized': cccdStatusNormalized,
          'isNotSubmitted': isNotSubmitted,
          'isPending': isPending,
          'isRejected': isRejected,
          'isStatusVerified': isStatusVerified,
          'hasVerifiedFlag': hasVerifiedFlag,
          'isVerified': isVerified,
          'willBlock': !isVerified,
          'willAllow': isVerified
        });

        if (!cancelled) {
          // CRITICAL: Set verified state FIRST before any navigation
          setCccdVerified(isVerified);
          setCheckingCCCD(false);

          // If not verified/approved, redirect to /cccd page
          if (!isVerified) {
            console.log('[BecomeTasker] ❌ BLOCKING ACCESS - CCCD not verified', {
              status: cccdStatusNormalized,
              hasVerified: hasVerifiedFlag,
              isNotSubmitted,
              isStatusVerified
            });
            
            // Show appropriate message based on status
            if (isNotSubmitted) {
              showToast.warning('Vui lòng xác minh CCCD trước khi đăng ký làm Tasker');
            } else if (isPending) {
              showToast.warning('CCCD của bạn đang chờ duyệt. Vui lòng đợi admin duyệt trước khi đăng ký làm Tasker.');
            } else if (isRejected) {
              showToast.warning('CCCD của bạn đã bị từ chối. Vui lòng xác minh lại CCCD trước khi đăng ký làm Tasker.');
            } else {
              showToast.warning('Vui lòng xác minh CCCD trước khi đăng ký làm Tasker');
            }
            
            // Navigate immediately - this will cause component to unmount
            navigate('/cccd', { replace: true });
            // No return needed - navigate will handle unmounting
          } else {
            console.log('[BecomeTasker] ✅ ALLOWING ACCESS - CCCD verified', {
              status: cccdStatusNormalized,
              hasVerified: hasVerifiedFlag
            });
          }
        }
      } catch (error) {
        console.error('Error checking CCCD status:', error);
        if (!cancelled) {
          setCheckingCCCD(false);
          // On error, still redirect to be safe
          showToast.error('Không thể kiểm tra trạng thái CCCD. Vui lòng thử lại.');
          navigate('/cccd', { replace: true });
        }
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, navigate]);

  // Check Tasker/app status: hide form if user is already Tasker OR has application Pending/Approved
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Prefer user identity from JWT to avoid mismatches with localStorage user object
        const token = getAuthToken();
        const decoded = token ? decodeJwt(token) : null;
        const idFromToken = decoded?.userId || decoded?.user_id || decoded?.id || null;
        if (idFromToken && idFromToken !== currentUserId) {
          setCurrentUserId(idFromToken);
        }
        setTokenUserId(idFromToken || null);
        const effectiveUserId = idFromToken || currentUserId;
        if (!effectiveUserId) { setIsTaskerAccount(false); return; }
        // 1) Check if already Tasker (only hide when response is OK and payload indicates found) – use effectiveUserId from token when available
        let alreadyTasker = false;
        try {
          const resTasker = await fetch(`${API_BASE_URL}/tasker/${effectiveUserId}`);
          if (resTasker.ok) {
            const jt = await resTasker.json().catch(() => null);
            if (jt && (jt.success === true) && jt.data) {
              alreadyTasker = true;
            }
          }
        } catch (_) { /* ignore and continue to my-status */ }
        if (!cancelled && alreadyTasker) { setIsTaskerAccount(true); return; }
        // 2) Else check latest application status
        const resMy = await authFetch(`${API_BASE_URL}/tasker/application/my-status`);
        const jsonMy = await resMy.json().catch(() => null);
        if (!cancelled) {
          const st = jsonMy?.data?.status;
          // Hide form when status is Pending or Approved; show when Rejected or no application
          const hide = st === 'Pending' || st === 'Approved';
          setIsTaskerAccount(!!hide);
          if (process.env.NODE_ENV !== 'production') {
            console.log('[BecomeTasker] tokenUserId=', idFromToken, 'currentUserId=', currentUserId, 'my-status=', jsonMy);
          }
        }
      } catch (_) {
        if (!cancelled) setIsTaskerAccount(false);
      }
    })();
    return () => { cancelled = true; };
  }, [currentUserId]);

  // Fetch services + variants
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await serviceService.getAll();
        if (!cancelled) setServices(list);
      } catch (e) {
        console.error('Load services failed', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // NEW: Reset variants & certificates when switching the focused service in dropdown
  const handleChangeService = (newServiceId) => {
    setSelectedServiceId(newServiceId);
    if (!newServiceId) {
      // If cleared selection, also clear variants/certs entirely
      setSelectedVariants([]);
      setServiceCerts({});
      return;
    }
    // Keep certificates only for services that still have selected variants (none right now after reset)
    setSelectedVariants([]);
    setServiceCerts(prev => {
      // Optionally retain certs of other services already committed? Requirement says reset below -> clear all
      return {};
    });
  };

  const toggleVariant = (variantId) => {
    setSelectedVariants(prev => prev.includes(variantId)
      ? prev.filter(v => v !== variantId)
      : [...prev, variantId]);
  };

  const currentService = services.find(s => String(s.service_id) === String(selectedServiceId));
  const filteredServices = services; // no search filter now

  const groupedSelected = services
    .map(s => {
      const variants = (s.variants || []).filter(v => selectedVariants.includes(v.variant_id));
      if (!variants.length) return null;
      return { service: s, variants };
    })
    .filter(Boolean);

  // Services (ids) that are selected via variants and require certificate
  const requiredServiceIds = useMemo(() => {
    const ids = new Set();
    groupedSelected.forEach(group => {
      if (group.service.requires_certificate) ids.add(group.service.service_id);
    });
    return Array.from(ids);
  }, [groupedSelected]);

  const hasMissingRequired = requiredServiceIds.some(sid => !serviceCerts[sid] || serviceCerts[sid].length === 0);
  const videoInvalid = !introVideo || !introVideo.video_url || !introVideo.public_id || !(introVideo.title && introVideo.title.trim()) || !(introVideo.description && introVideo.description.trim());

  // Certificate manipulation (manual add removed; only file upload permitted)

  const updateServiceCertField = (service_id, idx, field, value) => {
    setServiceCerts(prev => ({
      ...prev,
      [service_id]: (prev[service_id] || []).map((c, i) => i === idx ? { ...c, [field]: value } : c)
    }));
  };

  const removeServiceCert = (service_id, idx) => {
    setServiceCerts(prev => ({
      ...prev,
      [service_id]: (prev[service_id] || []).filter((_, i) => i !== idx)
    }));
  };

  // ---- Authenticated certificate signed URL management ----
  const fetchSignedCertificateUrl = useCallback(async (cert_id) => {
    if (!cert_id) return null;
    try {
      const res = await authFetch(`${API_BASE_URL}/tasker/certifications/${cert_id}/signed-url`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed signed URL');
      return json.data; // { url, expiresAt }
    } catch (e) {
      console.warn('fetchSignedCertificateUrl error', e.message);
      return null;
    }
  }, []);

  // Also allow fetching a signed URL when we only have cert_public_id (new BE route)
  const fetchSignedCertificateUrlByPublicId = useCallback(async (public_id) => {
    if (!public_id) return null;
    try {
      const url = `${API_BASE_URL}/tasker/certifications/signed-url?public_id=${encodeURIComponent(public_id)}`;
      const res = await authFetch(url);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed signed URL by public_id');
      return json.data; // { url, expiresAt }
    } catch (e) {
      console.warn('fetchSignedCertificateUrlByPublicId error', e.message);
      return null;
    }
  }, []);

  const refreshSignedUrl = useCallback(async (service_id, idx) => {
    const list = serviceCerts[service_id] || [];
    const cert = list[idx];
    if (!cert || cert.delivery_type !== 'authenticated' || (!cert.cert_id && !cert.cert_public_id)) return;
    // Prefer fetching by cert_id; fallback to public_id
    const signed = cert.cert_id
      ? await fetchSignedCertificateUrl(cert.cert_id)
      : await fetchSignedCertificateUrlByPublicId(cert.cert_public_id);
    if (signed && signed.url) {
      let expiresAtMs = undefined;
      if (typeof signed.expiresAt === 'string') {
        const parsed = Date.parse(signed.expiresAt);
        expiresAtMs = isNaN(parsed) ? undefined : parsed;
      } else if (typeof signed.expiresAt === 'number') {
        // Some backends return seconds; convert to ms if it looks like seconds
        expiresAtMs = signed.expiresAt < 1e12 ? signed.expiresAt * 1000 : signed.expiresAt;
      }
      setServiceCerts(prev => ({
        ...prev,
        [service_id]: (prev[service_id] || []).map((c, i) => i === idx ? { ...c, _signed_url: signed.url, _signed_expiry: expiresAtMs } : c)
      }));
    }
  }, [serviceCerts, fetchSignedCertificateUrl, fetchSignedCertificateUrlByPublicId]);

  // Periodically refresh about-to-expire URLs (within 30s)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      Object.entries(serviceCerts).forEach(([sid, list]) => {
        list.forEach((c, idx) => {
          if (c.delivery_type === 'authenticated') {
            const exp = (typeof c._signed_expiry === 'number') ? c._signed_expiry : (c._signed_expiry ? Date.parse(c._signed_expiry) : undefined);
            if ((c.cert_id || c.cert_public_id) && exp && exp - now < 30000) {
              refreshSignedUrl(sid, idx);
            }
          }
        });
      });
    }, 15000);
    return () => clearInterval(interval);
  }, [serviceCerts, refreshSignedUrl]);

  // Initial fetch for any persisted authenticated certs lacking signed URL
  useEffect(() => {
    Object.entries(serviceCerts).forEach(([sid, list]) => {
      list.forEach((c, idx) => {
        if (c.delivery_type === 'authenticated' && (c.cert_id || c.cert_public_id) && !c._signed_url) {
          refreshSignedUrl(sid, idx);
        }
      });
    });
  }, [serviceCerts, refreshSignedUrl]);

  // Helper: check if certificate code exists anywhere in the system
  const checkCertCodeExists = async (certCode) => {
    if (!certCode) {
      console.log('[CertCheck] Không có mã chứng chỉ để kiểm tra');
      return false;
    }
    try {
      console.log(`[CertCheck] Kiểm tra mã chứng chỉ: ${certCode}`);
      const res = await authFetch(`${API_BASE_URL}/tasker/certifications/check-code?code=${encodeURIComponent(certCode)}`);
      const json = await res.json();
      console.log('[CertCheck] Kết quả API:', json);
      return json.exists === true;
    } catch (err) {
      console.error('[CertCheck] Lỗi khi kiểm tra mã chứng chỉ:', err);
      return false;
    }
  };

  const handleCertFileUpload = async (service_id, files) => {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      const form = new FormData();
      Array.from(files).forEach(f => form.append('cert_files', f));
      // Use absolute URL to avoid dev server (3000) relative proxy confusion
      const res = await authFetch(`${API_BASE_URL}/tasker/certifications/upload`, { method: 'POST', body: form });
      const text = await res.text();
      let json;
      try { json = JSON.parse(text); } catch (_) {
        throw new Error(text.startsWith('<!DOCTYPE') ? 'Server trả về HTML (có thể sai URL hoặc 404). Kiểm tra endpoint /api/tasker/certifications/upload.' : text);
      }
      if (!res.ok || !json.success) throw new Error(json.message || 'Upload thất bại');
      const uploadedFiles = json.data?.files || [];
      const createdCerts = [];
      // Track existing codes in current state to prevent duplicates within this session
      const existingCodes = new Set(
        Object.values(serviceCerts)
          .flat()
          .map(c => (c.parsed_certificate_code || '').toString().trim().toLowerCase())
          .filter(Boolean)
      );
      for (const f of uploadedFiles) {
        try {
          // First, try to extract certificate code from file info if available
          let certCode = f.certificate_code || f.cert_code || '';
          // If not available, will be extracted by AI after creation
          // Try to check duplicate before creating cert
          if (certCode) {
            const exists = await checkCertCodeExists(certCode);
            if (exists) {
              console.warn(`[CertCheck] Phát hiện mã chứng chỉ trùng: ${certCode}. Bỏ qua file.`);
              showToast.error(`Mã chứng chỉ '${certCode}' đã tồn tại. Không thể upload chứng chỉ trùng lặp.`);
              continue; // Skip this file
            } else {
              console.log(`[CertCheck] Mã chứng chỉ chưa tồn tại: ${certCode}. Tiếp tục upload.`);
            }
          } else {
            console.log('[CertCheck] Không tìm thấy mã chứng chỉ trong file upload, bỏ qua kiểm tra trùng.');
          }
          const createRes = await authFetch(`${API_BASE_URL}/tasker/certifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              service_id,
              cert_name: f.original,
              // Do not send direct URL for authenticated uploads
              ...(f.delivery_type === 'authenticated' ? {} : { cert_file_url: f.url }),
              cert_public_id: f.public_id,
              delivery_type: f.delivery_type,
              variant_ids: selectedVariants
            })
          });
          const createJson = await createRes.json();
          // If backend returns duplicate error, show message
          if (createRes.status === 409 && createJson.duplicate) {
            showToast.error(`Mã chứng chỉ đã tồn tại trong hệ thống. Không thể upload chứng chỉ trùng lặp.`);
            continue;
          }
          if (!createRes.ok || !createJson.success) throw new Error(createJson.message || 'Upload thất bại');
          // Fallback: if ai_status Extracted but parsed_* missing, try parse raw_ai JSON locally to enrich
          if (createJson?.data) {
            const d = createJson.data;
            console.log('[AI][upload-summary]', {
              cert_file_url: d.cert_file_url,
              ai_status: d.ai_status,
              ai_confidence: d.ai_confidence,
              parsed_cert_name: d.parsed_cert_name,
              parsed_issued_by: d.parsed_issued_by,
              parsed_issued_date: d.parsed_issued_date,
              parsed_holder_name: d.parsed_holder_name,
              parsed_grade_or_level: d.parsed_grade_or_level,
              parsed_certificate_code: d.parsed_certificate_code,
              ai_detected_service: d.ai_detected_service,
              has_raw_ai: !!d.raw_ai
            });
            if (d.ai_status === 'Extracted') {
              const needsEnrich = !d.parsed_holder_name || !d.parsed_grade_or_level || !d.parsed_certificate_code;
              if (needsEnrich && d.raw_ai) {
                try {
                  const raw = d.raw_ai;
                  let jsonText = raw;
                  const first = raw.indexOf('{');
                  const last = raw.lastIndexOf('}');
                  if (first !== -1 && last !== -1 && last > first) {
                    jsonText = raw.substring(first, last + 1);
                  }
                  const parsedObj = JSON.parse(jsonText);
                  if (parsedObj) {
                    d.parsed_holder_name = d.parsed_holder_name || parsedObj.holder_name || null;
                    d.parsed_grade_or_level = d.parsed_grade_or_level || parsedObj.level_or_grade || null;
                    d.parsed_certificate_code = d.parsed_certificate_code || parsedObj.certificate_code || null;
                    console.log('[AI][upload-enrich-fallback] Applied parsed fields from raw_ai JSON');
                  }
                } catch (e) {
                  console.warn('[AI][upload-enrich-fallback] Failed to parse raw_ai JSON', e.message);
                }
              }
            }
          }
          // Sau khi backend trả về, kiểm tra trùng mã với toàn hệ thống
          const d = createJson.data;
          const code = (d?.parsed_certificate_code || '').toString().trim();
          let isDuplicateGlobal = false;
          if (code) {
            const existsGlobal = await checkCertCodeExists(code);
            if (existsGlobal) {
              console.warn(`[CertCheck] Mã chứng chỉ '${code}' đã tồn tại trong hệ thống (kiểm tra sau upload). Không thêm vào danh sách.`);
              showToast.error(`Mã chứng chỉ '${code}' đã tồn tại. Không thể thêm chứng chỉ trùng lặp.`);
              isDuplicateGlobal = true;
            }
          }
          // Prevent adding duplicate code within this session
          const codeLower = code.toLowerCase();
          if (codeLower && existingCodes.has(codeLower)) {
            showToast.warning(`Mã '${code}' đã có trong danh sách hiện tại. Bỏ qua tệp này.`);
            continue;
          }
          if (codeLower) existingCodes.add(codeLower);
          if (!isDuplicateGlobal) {
            createdCerts.push(d);
          }
        } catch (inner) {
          showToast.error(inner.message);
        }
      }
      setServiceCerts(prev => ({
        ...prev,
        [service_id]: [...(prev[service_id] || []), ...createdCerts]
      }));
    } catch (e) {
      showToast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const runAIExtraction = async (service_id, idx) => {
    try {
      setExtracting({ service_id, idx });
      const cert = (serviceCerts[service_id] || [])[idx];
      if (!cert) { showToast.error('Thiếu dữ liệu chứng chỉ.'); setExtracting(null); return; }
      if (!cert.cert_id) {
        const createRes = await authFetch(`${API_BASE_URL}/tasker/certifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id,
            cert_name: cert.cert_name || 'Chứng chỉ',
            // backend will handle signed URL generation when authenticated
            cert_public_id: cert.cert_public_id,
            delivery_type: cert.delivery_type,
            issued_by: cert.issued_by || '',
            issued_date: cert.issued_date || '',
            variant_ids: selectedVariants
          })
        });
        const createJson = await createRes.json();
        console.log('[AI][rerun-ephemeral] response', createJson); // debug
        if (createRes.status === 409 && createJson.duplicate) {
          showToast.error('Chứng chỉ trùng đã tồn tại: ' + createJson.message);
          return;
        }
        if (createRes.status === 400 && (createJson.service_mismatch || createJson.service_content_mismatch || createJson.ai_service_mismatch)) {
          showToast.error(createJson.message || 'Chứng chỉ không thuộc dịch vụ hoặc nội dung không phù hợp.');
          return;
        }
        if (!createRes.ok || !createJson.success) throw new Error(createJson.message || 'AI extract failed');
        const row = createJson.data;
        setServiceCerts(prev => ({
          ...prev,
          [service_id]: prev[service_id].map((c, i) => i === idx ? {
            ...c,
            cert_id: row.cert_id || c.cert_id,
            cert_name: row.parsed_cert_name || row.cert_name || c.cert_name,
            issued_by: row.parsed_issued_by || row.issued_by || c.issued_by,
            issued_date: row.parsed_issued_date || row.issued_date || c.issued_date,
            holder_name: row.parsed_holder_name || c.holder_name || '',
            ai_confidence: row.ai_confidence,
            ai_status: row.ai_status,
            needs_review: row.needs_review,
            validation: row.validation || c.validation,
            parsed_cert_name: row.parsed_cert_name,
            parsed_issued_by: row.parsed_issued_by,
            parsed_issued_date: row.parsed_issued_date,
            parsed_holder_name: row.parsed_holder_name,
            parsed_grade_or_level: row.parsed_grade_or_level,
            parsed_certificate_code: row.parsed_certificate_code,
            extracted_payload: row.extracted_payload || row.raw_ai,
            ai_detected_service: row.validation?.ai_detected_service || row.ai_detected_service,
            ai_service_match: row.validation?.ai_service_match,
            ai_service_score: row.validation?.ai_service_score
          } : c)
        }));
        return;
      }
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/tasker/certifications/${cert.cert_id}/extract-ai`, { method: 'POST', headers: { 'Authorization': token ? `Bearer ${token}` : '' } });
      const json = await res.json();
      console.log('[AI][rerun-persisted] response', json); // debug
      if (!res.ok || !json.success) throw new Error(json.message || 'AI extract failed');
      const updated = json.data;
      setServiceCerts(prev => ({
        ...prev,
        [service_id]: prev[service_id].map((c, i) => i === idx ? {
          ...c,
          cert_name: updated.parsed_cert_name || c.cert_name,
          issued_by: updated.parsed_issued_by || c.issued_by,
          issued_date: updated.parsed_issued_date || c.issued_date,
          holder_name: updated.parsed_holder_name || c.holder_name || '',
          cert_public_id: updated.cert_public_id || c.cert_public_id,
          delivery_type: updated.delivery_type || c.delivery_type,
          ai_confidence: updated.ai_confidence,
          ai_status: updated.ai_status,
          needs_review: updated.needs_review,
          parsed_cert_name: updated.parsed_cert_name,
          parsed_issued_by: updated.parsed_issued_by,
          parsed_issued_date: updated.parsed_issued_date,
          parsed_holder_name: updated.parsed_holder_name,
          parsed_grade_or_level: updated.parsed_grade_or_level,
          parsed_certificate_code: updated.parsed_certificate_code,
          extracted_payload: updated.extracted_payload,
          ai_detected_service: updated.ai_detected_service,
          ai_service_match: updated.ai_service_match,
          ai_service_score: updated.ai_service_score
        } : c)
      }));
    } catch (e) {
      showToast.error(e.message);
    }
    finally {
      setExtracting(null);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitState({ done: false, error: null });
    try {
      const certifications = Object.values(serviceCerts)
        .flat()
        // Accept either direct URL (legacy) or authenticated via public_id
        .filter(c => c.cert_name && (c.cert_public_id || c.cert_file_url))
        .map(c => ({
          cert_id: c.cert_id,
          cert_name: c.cert_name,
          cert_file_url: (c.delivery_type === 'authenticated' || c.needsSigned) ? null : c.cert_file_url,
          cert_public_id: c.cert_public_id,
          delivery_type: c.delivery_type,
          issued_by: c.issued_by,
          issued_date: c.issued_date,
          service_id: c.service_id,
          ai_confidence: c.ai_confidence,
          ai_status: c.ai_status,
          needs_review: c.needs_review,
          holder_name: c.holder_name || c.parsed_holder_name,
          parsed_cert_name: c.parsed_cert_name,
          parsed_issued_by: c.parsed_issued_by,
          parsed_issued_date: c.parsed_issued_date,
          parsed_holder_name: c.holder_name || c.parsed_holder_name,
          parsed_grade_or_level: c.parsed_grade_or_level,
          parsed_certificate_code: c.parsed_certificate_code,
          extracted_payload: c.extracted_payload,
          ai_detected_service: c.ai_detected_service,
          ai_service_match: c.ai_service_match,
          ai_service_score: c.ai_service_score,
          holder_mismatch: (() => {
            const inferredHolder = (c.holder_name || c.parsed_holder_name || '').trim();
            if (!inferredHolder || !accountName) return false;
            const cmp = compareNames(inferredHolder, accountName);
            return !cmp.match;
          })(),
          holder_authorization_confirmed: !!c.holder_authorization_confirmed
        }));
      // Client side validation for required services
      if (requiredServiceIds.length && hasMissingRequired) {
        throw new Error('Vui lòng thêm ít nhất 1 chứng chỉ cho tất cả dịch vụ yêu cầu.');
      }
      // Confirmation if any holder mismatch
      const anyHolderMismatch = certifications.some(c => c.holder_mismatch);
      const unconfirmedMismatch = certifications.some(c => c.holder_mismatch && !c.holder_authorization_confirmed);
      if (unconfirmedMismatch) {
        throw new Error('Bạn phải xác nhận quyền sở hữu/ủy quyền cho các chứng chỉ có holder khác tên tài khoản.');
      }
      if (anyHolderMismatch) {
        // Show info toast instead of blocking confirm dialog
        showToast.info('Một số chứng chỉ có holder khác tên tài khoản. Đang gửi đơn...');
      }
      const body = { introduce, variant_ids: selectedVariants, certifications };
      if (introVideo && introVideo.video_url) {
        body.introduction_video = {
          video_url: introVideo.video_url,
          public_id: introVideo.public_id,
          title: introVideo.title || 'Video giới thiệu',
          description: introVideo.description || ''
        };
      }
      const res = await authFetch(`${API_BASE_URL}/tasker/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Upgrade failed');
      setSubmitState({ done: true, error: null });
      // Hide the form immediately without refresh
      setIsTaskerAccount(true);
    } catch (err) {
      setSubmitState({ done: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking CCCD
  if (checkingCCCD) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">Đang kiểm tra trạng thái xác minh CCCD...</p>
          </div>
        </div>
      </div>
    );
  }

  // If not verified, don't show the form (will be redirected)
  if (!cccdVerified) {
    return null;
  }

  return (
    <>
      <CustomToastContainer />
      {isTaskerAccount === null ? null : isTaskerAccount ? (
        <div className="container py-4">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="bg-white rounded shadow-sm p-4">
                <h3 className="mb-3">{submitState.done ? 'Gửi đơn thành công' : 'Bạn không thể nộp thêm đơn'}</h3>
                {submitState.done ? (
                  <div className="alert alert-success mb-2">
                    Đơn đăng ký của bạn đã được gửi và đang ở trạng thái <strong>Chờ xử lí</strong>. Bạn sẽ nhận thông báo sau khi Staff xử lý.
                  </div>
                ) : (
                  <div className="alert alert-info mb-2">
                    Mỗi tài khoản chỉ được nộp 1 đơn. Đơn mới sẽ chỉ được phép khi đơn trước đó hoàn tất.
                  </div>
                )}
                <div className="d-flex gap-2">
                  <a className="btn btn-outline-primary btn-sm" href="/">Về trang chủ</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="container py-4">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="bg-white rounded shadow-sm p-4">
                <h3 className="mb-3">Đăng ký trở thành Tasker</h3>
                <p className="text-muted mb-4">Chọn dịch vụ bạn có thể cung cấp và thêm chứng chỉ (nếu có).</p>

                {submitState.done && <div className="alert alert-success d-none">Gửi đơn thành công.</div>}
                {submitState.error && <div className="alert alert-danger d-none">{submitState.error}</div>}

                <form onSubmit={submit}>
                  <div className="form-group mb-3">
                    <label className="fw-semibold">Giới thiệu bản thân <span className="text-danger">*</span></label>
                    <textarea className="form-control" rows={3} value={introduce} onChange={(e) => setIntroduce(e.target.value)} required />
                  </div>

                  <div className="mb-4">
                    <h5 className="d-flex align-items-center gap-2">Dịch vụ <span className="text-danger">*</span></h5>
                    {services.length === 0 && <div className="text-muted small">Đang tải dịch vụ...</div>}
                    {services.length > 0 && (
                      <>
                        <div className="row g-2 mb-2">
                          <div className="col-md-12">
                            <select
                              className="form-select form-select-sm"
                              value={selectedServiceId}
                              onChange={e => handleChangeService(e.target.value)}
                            >
                              <option value="">-- Chọn dịch vụ --</option>
                              {filteredServices.map(s => (
                                <option key={s.service_id} value={s.service_id}>{s.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {currentService && (
                          <div className="border rounded p-2 mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <strong>{currentService.name}</strong>
                              <small className="text-muted">{(currentService.variants || []).length} lựa chọn</small>
                            </div>
                            <div className="row">
                              {(currentService.variants || []).map(v => {
                                const checked = selectedVariants.includes(v.variant_id);
                                return (
                                  <div key={v.variant_id} className="col-md-4 col-sm-6 mb-2">
                                    <div className={`form-check small h-100 p-2 rounded border ${checked ? 'bg-light border-primary' : 'border-light'}`}>
                                      <input type="checkbox" className="form-check-input" style={{ display: 'none' }} id={`variant-${v.variant_id}`} checked={checked} onChange={() => toggleVariant(v.variant_id)} />
                                      <label htmlFor={`variant-${v.variant_id}`} className="form-check-label">
                                        <span className="fw-semibold d-block">{v.variant_name}</span>
                                        {v.price_min && v.price_max && (
                                          <span className="text-muted">{formatVND(v.price_min)} - {formatVND(v.price_max)}/{v.unit}</span>
                                        )}
                                      </label>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            {currentService.variants && currentService.variants.length === 0 && (
                              <div className="text-muted small">Dịch vụ này chưa có biến thể.</div>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {groupedSelected.length > 0 && (
                      <div className="mt-3">
                        <h6 className="fw-semibold mb-2">Đã chọn:</h6>
                        {groupedSelected.map(group => (
                          <div key={group.service.service_id} className="mb-2">
                            <div className="small fw-semibold mb-1">{group.service.name}</div>
                            <div className="d-flex flex-wrap gap-2">
                              {group.variants.map(v => (
                                <span key={v.variant_id} className="badge text-bg-light border position-relative pe-4">
                                  {v.variant_name}
                                  <button
                                    type="button"
                                    className="btn-close btn-close-sm position-absolute top-50 translate-middle-y end-0 me-1"
                                    aria-label="Remove"
                                    onClick={() => setSelectedVariants(prev => prev.filter(id => id !== v.variant_id))}
                                    style={{ fontSize: '0.5rem' }}
                                  />
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                        <div className="mt-2 d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => setSelectedVariants([])}
                          >Xóa tất cả</button>
                          {currentService && (currentService.variants || []).some(v => !selectedVariants.includes(v.variant_id)) && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => {
                                const currentIds = (currentService.variants || []).map(v => v.variant_id);
                                setSelectedVariants(prev => Array.from(new Set([...prev, ...currentIds])));
                              }}
                            >Chọn tất cả biến thể dịch vụ này</button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <h5>Chứng chỉ theo dịch vụ</h5>
                    {requiredServiceIds.length === 0 && (
                      <p className="text-muted small mb-2">Không có dịch vụ bắt buộc chứng chỉ trong các lựa chọn hiện tại. Bạn vẫn có thể thêm chứng chỉ tùy chọn bên dưới cho bất kỳ dịch vụ nào.</p>
                    )}
                    {groupedSelected.map(group => (
                      <div key={group.service.service_id} className="border rounded p-3 mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div>
                            <strong>{group.service.name}</strong>{' '}
                            {group.service.requires_certificate && <span className="badge bg-danger ms-1">Bắt buộc chứng chỉ</span>}
                          </div>
                          <div className="d-flex gap-2">
                            <label className="btn btn-sm btn-outline-primary mb-0">
                              {uploading ? 'Đang tải...' : 'Upload file'}
                              <input type="file" multiple hidden onChange={(e) => { handleCertFileUpload(group.service.service_id, e.target.files); e.target.value = ''; }} />
                            </label>
                          </div>
                        </div>
                        {(serviceCerts[group.service.service_id] || []).length === 0 && (
                          <div className="text-muted small mb-2">Chưa có chứng chỉ. Vui lòng upload file chứng chỉ.</div>
                        )}
                        {(serviceCerts[group.service.service_id] || []).map((c, idx) => {
                          const warnHolder = c.validation && c.validation.holder_name_match === false;
                          const aiDetected = c.ai_detected_service;
                          const aiServiceMismatch = c.ai_service_match === false || c.ai_service_mismatch;
                          const inferredHolder = (c.holder_name || c.parsed_holder_name || '').trim();
                          const nameCmp = compareNames(inferredHolder, accountName);
                          const holderMismatch = !!(inferredHolder && accountName && !nameCmp.match);
                          return (
                            <div key={idx} className={`position-relative border rounded p-3 mb-3 bg-light-subtle ${warnHolder || holderMismatch ? 'border-warning' : ''} ${c.error_type ? 'border-danger' : ''} ${extracting && extracting.service_id === group.service.service_id && extracting.idx === idx ? 'opacity-50' : ''}`}>
                              {extracting && extracting.service_id === group.service.service_id && extracting.idx === idx && (
                                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center" style={{ backdropFilter: 'blur(2px)', zIndex: 20, background: 'rgba(255,255,255,0.65)' }}>
                                  <div className="spinner-border text-primary mb-2" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
                                    <span className="visually-hidden">Loading...</span>
                                  </div>
                                </div>
                              )}
                              {c.error_type && (
                                <div className="alert alert-danger py-1 mb-2 small">
                                  {c.error_message || 'Lỗi xác thực chứng chỉ'}
                                </div>
                              )}

                              <div className="mb-2">
                                <label className="form-label form-label-sm mb-1">Tên bằng cấp / chứng chỉ <span className="text-danger">*</span></label>
                                <textarea rows={3} className="form-control form-control-sm" style={{ resize: 'vertical' }} placeholder="VD: Chứng chỉ đào tạo – Chăm sóc người cao tuổi (Elderly Care)" value={c.cert_name} onChange={(e) => updateServiceCertField(group.service.service_id, idx, 'cert_name', e.target.value)} />
                              </div>

                              {/* Combined row: Image | Issuer | Code | Date */}
                              <div className="row g-2 mb-2 align-items-start">
                                <div className="col-md-4">
                                  <label className="form-label form-label-sm mb-1">Ảnh chứng chỉ</label>
                                  {(c.cert_file_url || (c.delivery_type === 'authenticated' && c._signed_url)) ? (
                                    <div className="position-relative border rounded p-1 bg-white">
                                      {(/\.(pdf)(\?|$)/i).test((c.delivery_type === 'authenticated' && c._signed_url) ? c._signed_url : c.cert_file_url || '') ? (
                                        <div className="small text-muted text-center" style={{ minHeight: '120px' }}>
                                          <a href={(c.delivery_type === 'authenticated' && c._signed_url) ? c._signed_url : c.cert_file_url} target="_blank" rel="noreferrer">Xem file PDF</a>
                                        </div>
                                      ) : (
                                        <img
                                          src={(c.delivery_type === 'authenticated' && c._signed_url) ? c._signed_url : c.cert_file_url}
                                          alt="cert"
                                          className="img-fluid d-block mx-auto hover-shadow"
                                          style={{ maxHeight: '140px', objectFit: 'contain', cursor: 'zoom-in' }}
                                          onClick={() => setZoomImage((c.delivery_type === 'authenticated' && c._signed_url) ? c._signed_url : c.cert_file_url)}
                                          onError={() => {
                                            if (c.delivery_type === 'authenticated' && (c.cert_id || c.cert_public_id)) {
                                              refreshSignedUrl(group.service.service_id, idx);
                                            }
                                          }}
                                        />
                                      )}
                                    </div>
                                  ) : (
                                    <div className="border rounded p-2 text-center small bg-light">
                                      <em>Chưa có file</em>
                                    </div>
                                  )}
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label form-label-sm mb-1">Tên đơn vị cấp chứng chỉ <span className="text-danger">*</span></label>
                                  <textarea rows={2} className="form-control form-control-sm" style={{ resize: 'vertical' }} placeholder="Trường / Tổ chức cấp" value={c.issued_by} onChange={(e) => updateServiceCertField(group.service.service_id, idx, 'issued_by', e.target.value)} />
                                  <label className="form-label form-label-sm mb-1 mt-2">Tên trên chứng chỉ (Holder) <span className="text-danger">*</span></label>
                                  <input type="text" className="form-control form-control-sm" placeholder="Tên người được cấp" value={c.holder_name || c.parsed_holder_name || ''} onChange={(e) => updateServiceCertField(group.service.service_id, idx, 'holder_name', e.target.value)} />
                                </div>
                                <div className="col-md-2">
                                  <label className="form-label form-label-sm mb-1">Mã chứng chỉ <span className="text-danger">*</span></label>
                                  <input type="text" className="form-control form-control-sm" placeholder="Mã" value={c.parsed_certificate_code || ''} onChange={(e) => updateServiceCertField(group.service.service_id, idx, 'parsed_certificate_code', e.target.value)} />
                                </div>
                                <div className="col-md-2">
                                  <label className="form-label form-label-sm mb-1">Ngày cấp <span className="text-danger">*</span></label>
                                  <input type="date" className="form-control form-control-sm" value={c.issued_date} onChange={(e) => updateServiceCertField(group.service.service_id, idx, 'issued_date', e.target.value)} />
                                </div>
                              </div>
                              {/* Action buttons bottom-right */}
                              <div className="d-flex justify-content-end gap-2 mb-2">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-secondary position-relative"
                                  style={{ minWidth: '42px' }}
                                  title="Chạy lại AI"
                                  disabled={extracting && extracting.service_id === group.service.service_id && extracting.idx === idx}
                                  onClick={() => runAIExtraction(group.service.service_id, idx)}
                                >
                                  <span
                                    className="d-inline-block"
                                    style={extracting && extracting.service_id === group.service.service_id && extracting.idx === idx ? { animation: 'spin 1s linear infinite' } : {}}
                                  >⟳</span>
                                </button>
                                <button type="button" className="btn btn-sm btn-outline-danger" title="Xóa chứng chỉ" onClick={() => removeServiceCert(group.service.service_id, idx)}>&times;</button>
                              </div>
                              {/* {c.ai_confidence !== undefined && (
                            <div className="small text-muted d-flex flex-wrap gap-3">
                              <span>Trạng thái: <strong>{c.ai_status || 'N/A'}</strong></span>
                              <span>Độ tin cậy: {c.ai_confidence ?? '—'} {c.needs_review ? <span className="text-warning">(cần xem lại)</span> : null}</span>
                            </div>
                          )} */}
                              {warnHolder && (
                                <div className="alert alert-warning mt-2 py-1 mb-0 small">
                                  Tên trên chứng chỉ khác tên tài khoản. Vui lòng kiểm tra lại .
                                </div>
                              )}
                              {!warnHolder && holderMismatch && (
                                <div className="alert alert-warning mt-2 py-1 mb-0 small">
                                  Tên trên chứng chỉ khác tên tài khoản: <strong>{inferredHolder}</strong> ≠ <strong>{accountName}</strong>.
                                </div>
                              )}
                              {holderMismatch && (
                                <div className="form-check mt-2 small">
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id={`auth-confirm-${group.service.service_id}-${idx}`}
                                    checked={!!c.holder_authorization_confirmed}
                                    onChange={(e) => updateServiceCertField(group.service.service_id, idx, 'holder_authorization_confirmed', e.target.checked)}
                                  />
                                  <label className="form-check-label" htmlFor={`auth-confirm-${group.service.service_id}-${idx}`}>
                                    Tôi xác nhận tôi là chủ sở hữu hoặc được ủy quyền sử dụng chứng chỉ này.
                                  </label>
                                </div>
                              )}
                              {aiServiceMismatch && !c.error_type && (
                                <div className="alert alert-danger mt-2 py-1 mb-0 small">
                                  AI phát hiện dịch vụ khác với lựa chọn hiện tại. Hãy kiểm tra lại chứng chỉ hoặc đổi dịch vụ tương ứng.
                                </div>
                              )}
                              {c.service_content_mismatch && (
                                <div className="alert alert-danger mt-2 py-1 mb-0 small">
                                  Nội dung chứng chỉ không khớp dịch vụ đã chọn.
                                </div>
                              )}
                            </div>
                          )
                        })}
                        {group.service.requires_certificate && (!serviceCerts[group.service.service_id] || serviceCerts[group.service.service_id].length === 0) && (
                          <div className="text-danger small">Cần ít nhất 1 chứng chỉ cho dịch vụ này.</div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mb-4">
                    <h5>Video giới thiệu <span className="text-danger">*</span></h5>
                    {!introVideo && (
                      <div className="border rounded p-3 text-center bg-light">
                        <p className="small text-muted mb-2">Tải lên 1 video giới thiệu kỹ năng làm việc của bạn.</p>
                        <label className="btn btn-sm btn-outline-primary mb-0">
                          {videoUploading ? 'Đang tải...' : 'Chọn video'}
                          <input type="file" hidden accept="video/*" onChange={async (e) => {
                            if (!e.target.files || !e.target.files[0]) return;
                            const file = e.target.files[0];
                            setVideoUploading(true);
                            try {
                              const form = new FormData();
                              form.append('video', file);
                              const resp = await authFetch(`${API_BASE_URL}/tasker/application/video-upload`, { method: 'POST', body: form });
                              const data = await resp.json();
                              if (!resp.ok || !data.success) throw new Error(data.message || 'Upload video thất bại');
                              setIntroVideo({
                                video_url: data.data.video_url,
                                public_id: data.data.public_id,
                                title: '',
                                description: ''
                              });
                            } catch (err) {
                              showToast.error(err.message);
                            } finally {
                              setVideoUploading(false);
                              e.target.value = '';
                            }
                          }} />
                        </label>
                      </div>
                    )}
                    {introVideo && (
                      <div className="border rounded p-3 position-relative">
                        <button type="button" className="btn-close position-absolute end-0 top-0 m-2" onClick={() => setIntroVideo(null)} />
                        <div className="row g-3">
                          <div className="col-md-6">
                            <div className="ratio ratio-16x9 bg-dark rounded overflow-hidden">
                              <video controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} src={introVideo.video_url} />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-2">
                              <label className="form-label form-label-sm mb-1">Tiêu đề video <span className="text-danger">*</span></label>
                              <input type="text" className={`form-control form-control-sm ${introVideo.title && introVideo.title.trim() ? '' : 'is-invalid'}`} placeholder="VD: Giới thiệu kỹ năng và kinh nghiệm" value={introVideo.title} onChange={(e) => setIntroVideo(v => ({ ...v, title: e.target.value }))} />
                              {(!introVideo.title || !introVideo.title.trim()) && (
                                <div className="invalid-feedback">Vui lòng nhập tiêu đề video.</div>
                              )}
                            </div>
                            <div className="mb-2">
                              <label className="form-label form-label-sm mb-1">Mô tả <span className="text-danger">*</span></label>
                              <textarea rows={3} className={`form-control form-control-sm ${introVideo.description && introVideo.description.trim() ? '' : 'is-invalid'}`} placeholder="Mô tả ngắn về kinh nghiệm, phong cách làm việc..." value={introVideo.description} onChange={(e) => setIntroVideo(v => ({ ...v, description: e.target.value }))} />
                              {(!introVideo.description || !introVideo.description.trim()) && (
                                <div className="invalid-feedback">Vui lòng nhập mô tả video.</div>
                              )}
                            </div>
                          </div>
                        </div>
                        {videoInvalid && (
                          <div className="alert alert-warning mt-2 py-1 mb-0 small">Vui lòng điền đầy đủ tiêu đề và mô tả cho video.</div>
                        )}
                      </div>
                    )}
                  </div>

                  {hasMissingRequired && (
                    <div className="alert alert-warning py-2">Còn thiếu chứng chỉ ở một số dịch vụ bắt buộc.</div>
                  )}

                  <button disabled={loading || uploading || videoUploading || videoInvalid || (requiredServiceIds.length && hasMissingRequired)} type="submit" className="btn btn-primary">
                    {loading ? 'Đang gửi...' : uploading ? 'Đang upload...' : 'Gửi đăng ký'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      {zoomImage && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-75" style={{ zIndex: 1050 }} onClick={() => setZoomImage(null)}>
          <div className="position-relative p-2 bg-white rounded shadow" onClick={e => e.stopPropagation()} style={{ maxWidth: '90%', maxHeight: '90%' }}>
            <button type="button" className="btn-close position-absolute end-0 top-0 m-2" onClick={() => setZoomImage(null)} />
            <img src={zoomImage} alt="zoom" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
          </div>
        </div>
      )}
      <style>{`@keyframes spin {from {transform: rotate(0deg);} to {transform: rotate(360deg);}}`}</style>
    </>
  );
};

export default BecomeTasker;



