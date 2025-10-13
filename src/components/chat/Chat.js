import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams} from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useChat } from '../../hooks/useChat';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import ChatHeader from './ChatHeader';
import './Chat.css';
import QuoteService from '../../services/quoteService';

const Chat = () => {
  const [searchParams] = useSearchParams();
  const initialConversationId = searchParams.get("conversationId");
  const peerParam = searchParams.get('peer');
  const quoteIdParam = searchParams.get('quoteId');
  const sessionParam = searchParams.get('session');
  const negotiationParam = searchParams.get('negotiation');
  const [negotiationOpen, setNegotiationOpen] = useState(negotiationParam === '1' && (!!quoteIdParam || !!sessionParam));
  const [sessionId, setSessionId] = useState(sessionParam || null);
  const [quoteDetails, setQuoteDetails] = useState(null);
  const [negPrice, setNegPrice] = useState('');
  const [negError, setNegError] = useState(null);
  const [negSubmitting, setNegSubmitting] = useState(false);
  const [ackBanner, setAckBanner] = useState(null);
  // Removed chat-triggered renegotiation; negotiation opens only via Quotes or backend state
  const {
    conversations,
    currentConversation,
    messages,
    loading,
    error,
    hasMoreMessages,
    typingUsers,
    sendingMessage,
    isConnected,
    loadConversations,
    loadMoreMessages,
    sendTextMessage,
    sendFileMessage,
    updateMessage,
    deleteMessage,
    markAsRead,
    handleTyping,
    switchConversation,
    createConversation,
    
    getTypingUsers,
    isUserOnline
  } = useChat(initialConversationId);
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { isConnected: socketConnected } = useSocket();
  // Prevent redundant switch/navigate by tracking last selected convId
  const lastSelectedConvIdRef = useRef(null);
  // Persist negotiation context per conversation
  const negotiationContextsRef = useRef(new Map());
  // Keep sessionId synced from URL
  useEffect(() => {
    const s = searchParams.get('session');
    setSessionId(s || null);
  }, [searchParams]);
  // Validate the quote participants match current conversation participants
  const quoteMatchesConversation = (qd, conv) => {
    if (!qd || !conv?.participants?.length) return false;
    const ids = new Set(
      conv.participants
        .map(p => (p?.user_id ?? p?.userId))
        .filter(id => id != null)
        .map(id => String(id))
    );
    return ids.has(String(qd.customer_id)) && ids.has(String(qd.tasker_id));
  };
  const isNegotiationContextValid = useMemo(
    () => quoteMatchesConversation(quoteDetails, currentConversation),
    [quoteDetails, currentConversation]
  );
  // Build pseudo quote-like details for session mode (direct chat only)
  const buildSessionDetails = (sid) => {
    if (!sid || !currentConversation || String(currentConversation.type) !== 'direct') return null;
    const myId = user?.user_id || user?.userId;
    if (!Array.isArray(currentConversation.participants) || !myId) return null;
    const other = currentConversation.participants.find(p => String(p.user_id ?? p.userId) !== String(myId));
    const otherId = other?.user_id ?? other?.userId;
    if (!otherId) return null;
    const openerIsMe = negotiationParam === '1';
    const customer_id = openerIsMe ? myId : otherId;
    const tasker_id = openerIsMe ? otherId : myId;
    return {
      quote_id: `session:${sid}`,
      customer_id,
      tasker_id,
      proposed_price: null,
      status: null,
      variant_name: `Thương lượng tự do (#${sid})`,
      unit: null,
      price_min: null,
      price_max: null,
    };
  };

  // Initialize/refresh session pseudo details when sessionId is present
  useEffect(() => {
    if (!sessionId) return;
    const details = buildSessionDetails(sessionId);
    if (details) {
      if (!quoteDetails || String(quoteDetails.quote_id) !== String(details.quote_id)) {
        setQuoteDetails(details);
        setNegPrice('');
      }
    }
  }, [sessionId, currentConversation?.conversation_id, user?.user_id, user?.userId]);
  useEffect(() => {
    const convId = initialConversationId && !Number.isNaN(parseInt(initialConversationId, 10))
      ? parseInt(initialConversationId, 10)
      : null;
    if (!convId) return;

    const authed = (typeof isAuthenticated === 'function') ? isAuthenticated() : !!isAuthenticated;
    if (authLoading) return; // wait until auth resolved

    // Only switch if different from last
    if (authed && lastSelectedConvIdRef.current !== convId) {
      lastSelectedConvIdRef.current = convId;
      handleConversationSelect(convId, { preserveNegotiationParams: true, replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConversationId, authLoading, isAuthenticated, socketConnected]);

  // Khi conversations đã load xong mà currentConversation chưa có, tự động chọn lại theo URL
  useEffect(() => {
    const convId = initialConversationId && !Number.isNaN(parseInt(initialConversationId, 10))
      ? parseInt(initialConversationId, 10)
      : null;
    if (!convId) return;
    if (authLoading) return;

    // Nếu chưa có conversations thì load
    if (conversations.length === 0 && !loading) {
      loadConversations();
      return;
    }

    const found = conversations.find(c => c.conversation_id === convId);
    if (found) {
      if (!currentConversation || currentConversation.conversation_id !== convId) {
        if (lastSelectedConvIdRef.current !== convId) {
          lastSelectedConvIdRef.current = convId;
          handleConversationSelect(convId, { preserveNegotiationParams: true, replace: true });
        }
      }
    } else {
      // Nếu không tìm thấy trong list, thử fetch riêng
      if (lastSelectedConvIdRef.current !== convId) {
        lastSelectedConvIdRef.current = convId;
        switchConversation(convId).catch(err => {
          console.error('[Chat.js] Cannot load conversation from URL', err);
        });
      }
    }
  }, [conversations, currentConversation, initialConversationId, loading, authLoading]);

  // If URL has ?peer=<userId> and no conversationId, auto create/get the direct conversation then navigate
  useEffect(() => {
    if (authLoading) return;
    const hasConvId = initialConversationId && !Number.isNaN(parseInt(initialConversationId, 10));
    if (hasConvId) return;
    if (!peerParam) return;
    const peerIdNum = parseInt(peerParam, 10);
    if (Number.isNaN(peerIdNum) || peerIdNum <= 0) return;

    let cancelled = false;
    (async () => {
      try {
        // Use hook's createConversation to leverage server-side idempotency: returns existing direct convo if exists
        const conversation = await createConversation('direct', [peerIdNum], null);
        if (cancelled || !conversation?.conversation_id) return;

        // Switch to this conversation
        if (lastSelectedConvIdRef.current !== conversation.conversation_id) {
          lastSelectedConvIdRef.current = conversation.conversation_id;
          await switchConversation(conversation.conversation_id);
        }

        // Preserve existing query params (quoteId, negotiation, bookingId, openFinalize, etc.) and set conversationId
        const params = new URLSearchParams(searchParams);
        params.set('conversationId', String(conversation.conversation_id));
        navigate(`/chat?${params.toString()}`, { replace: true });
      } catch (e) {
        console.error('[Chat] Failed to resolve/create direct conversation for peer:', peerParam, e);
      }
    })();

    return () => { cancelled = true; };
  }, [peerParam, initialConversationId, authLoading, createConversation, switchConversation, navigate, searchParams]);

  // Load quote details for negotiation if quoteId present
  useEffect(() => {
    const loadQuote = async () => {
      if (!quoteIdParam) { setQuoteDetails(null); return; }
      try {
        const res = await QuoteService.getQuoteDetails(quoteIdParam);
        if (res.success) {
          // Only update if different to avoid loops
          if (!quoteDetails || String(quoteDetails.quote_id) !== String(res.data.quote_id)) {
            setQuoteDetails(res.data);
            setNegPrice(String(res.data?.proposed_price ?? ''));
          } else {
            // Keep price in sync even if same quote
            setNegPrice(String(res.data?.proposed_price ?? ''));
          }
          // If quote context is active, drop any leftover session param to avoid mixed contexts
          const sessionInUrl = searchParams.get('session');
          if (sessionInUrl) {
            setSessionId(null);
            const params = new URLSearchParams(searchParams);
            params.delete('session');
            if (currentConversation?.conversation_id) params.set('conversationId', String(currentConversation.conversation_id));
            navigate(`/chat?${params.toString()}`, { replace: true });
          }
        }
      } catch (e) {
        console.error('[Chat] load quote details error', e);
      }
    };
    loadQuote();
  }, [quoteIdParam, searchParams, currentConversation?.conversation_id, navigate]);

  // Try to auto-detect a pending quote with any peer in this conversation to enable negotiation bar (Tasker-focused)
  useEffect(() => {
    const tryLoadPendingQuote = async () => {
      if (sessionId) return; // session mode: don't auto-detect quotes
      // If URL already specifies a quoteId, do not auto-detect/override
      if (quoteIdParam) return;
      if (!currentConversation) return;
      // Build candidate peers: URL peer first (if valid), then all other participants
      const candidates = [];
      if (peerParam) {
        const n = parseInt(peerParam, 10);
        if (!Number.isNaN(n)) candidates.push(n);
      }
      // If no peer is provided in URL, a direct conversation has exactly one "other"; otherwise skip
      const selfIdStr = String(user?.user_id || user?.userId || '');
      if (Array.isArray(currentConversation.participants)) {
        for (const p of currentConversation.participants) {
          const pid = p?.user_id ?? p?.userId;
          if (pid != null && String(pid) !== selfIdStr && !candidates.includes(Number(pid))) {
            candidates.push(Number(pid));
          }
        }
      }
      if (candidates.length === 0) return;
      for (const peerUserId of candidates) {
        try {
          const res = await QuoteService.getLatestPendingWithPeer(peerUserId);
          if (res?.success && res.data) {
            setQuoteDetails(res.data);
            setNegPrice(String(res.data?.proposed_price ?? ''));
            const viewerId = user?.user_id || user?.userId;
            const isViewerTasker = viewerId && String(res.data.tasker_id) === String(viewerId);
            setNegotiationOpen(Boolean(isViewerTasker && quoteMatchesConversation(res.data, currentConversation)));
            // Ensure URL reflects the detected pending quoteId to avoid later overrides for Tasker
            if (isViewerTasker && quoteMatchesConversation(res.data, currentConversation)) {
              const params = new URLSearchParams(searchParams);
              if (params.get('quoteId') !== String(res.data.quote_id)) {
                params.set('quoteId', String(res.data.quote_id));
                if (currentConversation?.conversation_id) {
                  params.set('conversationId', String(currentConversation.conversation_id));
                }
                navigate(`/chat?${params.toString()}`, { replace: true });
              }
            }
            break; // stop after first match
          }
        } catch (_) {
          // try next candidate
        }
      }
    };
    tryLoadPendingQuote();
  }, [sessionId, quoteIdParam, quoteDetails?.status, peerParam, currentConversation, user, searchParams, navigate]);

  // Derive quoteId from latest negotiation messages in this conversation (safe without URL flag)
  useEffect(() => {
    const tryDeriveQuoteFromMessages = async () => {
      // If session is active, do not override
      if (sessionId) return;
      // If URL already specifies a quote id, keep it
      if (quoteIdParam) return;
      // If we already have a pending quote in context, don't override from messages (prevents flicker/override)
      if (quoteDetails?.quote_id && String(quoteDetails?.status || '') === 'Chờ xử lý') return;
      if (!messages || messages.length === 0) return;
      // Prefer last ACK then last REQ (support sessionId as well)
      let derivedQuoteId = null;
      let derivedSessionId = null;
      let derivedKind = null; // 'ACK' | 'REQ'
      for (let i = messages.length - 1; i >= 0; i--) {
        const m = messages[i];
        if (!m?.content || typeof m.content !== 'string') continue;
        if (m.content.startsWith('[NEG_ACK]')) {
          try {
            const payload = JSON.parse(m.content.substring(9));
            if (payload.sessionId) { derivedSessionId = payload.sessionId; derivedKind = 'ACK'; break; }
            derivedQuoteId = payload.quoteId; derivedKind = 'ACK'; break;
          } catch(_) {}
        }
      }
      if (!derivedQuoteId && !derivedSessionId) {
        for (let i = messages.length - 1; i >= 0; i--) {
          const m = messages[i];
          if (!m?.content || typeof m.content !== 'string') continue;
          if (m.content.startsWith('[NEG_REQ]')) {
            try {
              const payload = JSON.parse(m.content.substring(9));
              if (payload.sessionId) { derivedSessionId = payload.sessionId; derivedKind = 'REQ'; break; }
              derivedQuoteId = payload.quoteId; derivedKind = 'REQ'; break;
            } catch(_) {}
          }
        }
      }
      if (derivedSessionId) {
        // Initialize session mode based on messages
        const sid = String(derivedSessionId);
        setSessionId(sid);
        const details = buildSessionDetails(sid);
        if (details) {
          setQuoteDetails(details);
          setNegPrice('');
          const params = new URLSearchParams(searchParams);
          if (currentConversation?.conversation_id) params.set('conversationId', String(currentConversation.conversation_id));
          params.set('session', sid);
          navigate(`/chat?${params.toString()}`, { replace: true });
        }
        return;
      }
      if (!derivedQuoteId) return;
      if (quoteDetails?.quote_id && String(quoteDetails.quote_id) === String(derivedQuoteId)) {
        // Already have details for this quote; do not force open here to avoid loops on ACK
        return;
      }
      try {
        const res = await QuoteService.getQuoteDetails(derivedQuoteId);
        if (res?.success && res.data) {
          setQuoteDetails(res.data);
          setNegPrice(String(res.data?.proposed_price ?? ''));
          // Do not auto-open on ACK to prevent toggle loops with the auto-hide-after-ACK effect.
          // A separate effect will auto-open for Tasker when a pending REQ exists.
        }
      } catch (_) {}
    };
    tryDeriveQuoteFromMessages();
  }, [sessionId, quoteIdParam, messages, currentConversation, quoteDetails?.quote_id, quoteDetails?.status, searchParams, navigate]);

  // Persist current conversation's negotiation context whenever it changes
  useEffect(() => {
    const convId = currentConversation?.conversation_id;
    if (!convId) return;
    const isPending = String(quoteDetails?.status || '') === 'Chờ xử lý';
    if ((isPending || negotiationOpen) && isNegotiationContextValid) {
      negotiationContextsRef.current.set(String(convId), {
        quoteDetails,
        negPrice,
        negotiationOpen,
        ackBanner
      });
    } else {
      negotiationContextsRef.current.delete(String(convId));
    }
  }, [currentConversation?.conversation_id, isNegotiationContextValid, quoteDetails?.status, quoteDetails?.quote_id, negotiationOpen, negPrice, ackBanner]);

  const currencyVND = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(n || 0));
  const myUserId = user?.user_id || user?.userId;
  const isCustomer = !!(quoteDetails && myUserId && String(quoteDetails.customer_id) === String(myUserId));
  const isTasker = !!(quoteDetails && myUserId && String(quoteDetails.tasker_id) === String(myUserId));

  // Derive the most recent pending negotiation quoteId from messages (latest [NEG_REQ] without a later [NEG_ACK]/[NEG_REJ])
  const activePendingQuoteId = useMemo(() => {
    if (!Array.isArray(messages) || messages.length === 0) return null;
    const closed = new Set(); // quotes that have been ACKed or REJected later
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      const c = m?.content;
      if (!c || typeof c !== 'string') continue;
      if (c.startsWith('[NEG_ACK]')) {
        try {
          const payload = JSON.parse(c.substring(9));
          if (payload?.quoteId != null) closed.add(String(payload.quoteId));
        } catch(_) {}
      } else if (c.startsWith('[NEG_REJ]')) {
        try {
          const payload = JSON.parse(c.substring(9));
          if (payload?.quoteId != null) closed.add(String(payload.quoteId));
        } catch(_) {}
      } else if (c.startsWith('[NEG_REQ]')) {
        try {
          const payload = JSON.parse(c.substring(9));
          const qid = payload?.quoteId != null ? String(payload.quoteId) : null;
          if (qid && !closed.has(qid)) return payload.quoteId; // Found latest REQ that hasn't been closed later
        } catch(_) {}
      }
    }
    return null;
  }, [messages]);

  // Align quoteDetails to the active pending quote if current quote is different or not pending
  useEffect(() => {
    const alignToActivePending = async () => {
      if (!activePendingQuoteId) return;
      const currId = quoteDetails?.quote_id ? String(quoteDetails.quote_id) : null;
      const isCurrPending = String(quoteDetails?.status || '') === 'Chờ xử lý';
      // If current quote is already the active pending, do nothing
      if (currId === String(activePendingQuoteId) && isCurrPending) return;
      // If URL points to a different quote but current quote is pending, keep current (don't flip)
      if (quoteIdParam && String(quoteIdParam) !== String(activePendingQuoteId) && isCurrPending) return;
      try {
        const res = await QuoteService.getQuoteDetails(activePendingQuoteId);
        if (res?.success && res.data) {
          setQuoteDetails(res.data);
          setNegPrice(String(res.data?.proposed_price ?? ''));
          // If viewer is Tasker, update URL to align when we switched to a different pending quote
          if (isTasker && currentConversation?.conversation_id) {
            const params = new URLSearchParams(searchParams);
            params.set('quoteId', String(activePendingQuoteId));
            params.set('conversationId', String(currentConversation.conversation_id));
            navigate(`/chat?${params.toString()}`, { replace: true });
          }
        }
      } catch (_) {}
    };
    alignToActivePending();
  }, [activePendingQuoteId, quoteDetails?.quote_id, quoteDetails?.status, quoteIdParam, isTasker, currentConversation?.conversation_id, searchParams, navigate]);

  // Parse negotiation messages to detect pending request and acknowledgements
  const negotiationState = useMemo(() => {
    if (!messages || !(quoteDetails?.quote_id || sessionId)) return { pending: null, pendingMsg: null, ack: null, ackMsg: null, ackIdx: -1, rej: null, rejMsg: null, rejIdx: -1 };
    let lastReq = null, lastReqIdx = -1, lastReqMsg = null;
    let lastAck = null, lastAckIdx = -1, lastAckMsg = null;
    let lastRej = null, lastRejIdx = -1, lastRejMsg = null;
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      if (!m?.content || typeof m.content !== 'string') continue;
      const c = m.content;
      if (c.startsWith('[NEG_REQ]')) {
        try {
          const payload = JSON.parse(c.substring(9));
          const match = sessionId ? String(payload.sessionId) === String(sessionId) : String(payload.quoteId) === String(quoteDetails.quote_id);
          if (match) { lastReq = payload; lastReqIdx = i; lastReqMsg = m; }
        } catch(_) {}
      } else if (c.startsWith('[NEG_ACK]')) {
        try {
          const payload = JSON.parse(c.substring(9));
          const match = sessionId ? String(payload.sessionId) === String(sessionId) : String(payload.quoteId) === String(quoteDetails.quote_id);
          if (match) { lastAck = payload; lastAckIdx = i; lastAckMsg = m; }
        } catch(_) {}
      } else if (c.startsWith('[NEG_REJ]')) {
        try {
          const payload = JSON.parse(c.substring(9));
          const match = sessionId ? String(payload.sessionId) === String(sessionId) : String(payload.quoteId) === String(quoteDetails.quote_id);
          if (match) { lastRej = payload; lastRejIdx = i; lastRejMsg = m; }
        } catch(_) {}
      }
    }
    // Determine state by order: if there's a REQ after ACK/REJ, it's pending; if ACK after REQ, it's accepted; if REJ after REQ, it's rejected (no pending)
    if (lastReqIdx > -1) {
      if (lastAckIdx > lastReqIdx) {
        return { pending: null, pendingMsg: null, ack: lastAck, ackMsg: lastAckMsg, ackIdx: lastAckIdx, rej: lastRej, rejMsg: lastRejMsg, rejIdx: lastRejIdx };
      }
      if (lastRejIdx > lastReqIdx) {
        return { pending: null, pendingMsg: null, ack: null, ackMsg: null, ackIdx: -1, rej: lastRej, rejMsg: lastRejMsg, rejIdx: lastRejIdx };
      }
      return { pending: lastReq, pendingMsg: lastReqMsg, ack: null, ackMsg: null, ackIdx: -1, rej: lastRej, rejMsg: lastRejMsg, rejIdx: lastRejIdx };
    }
    return { pending: null, pendingMsg: null, ack: lastAck, ackMsg: lastAckMsg, ackIdx: lastAckIdx, rej: lastRej, rejMsg: lastRejMsg, rejIdx: lastRejIdx };
  }, [messages, quoteDetails?.quote_id, sessionId]);

  // Single source of truth for negotiation bar visibility to avoid toggle loops
  useEffect(() => {
    let desired = negotiationOpen;
    const hasPendingViaQuote = isNegotiationContextValid && String(quoteDetails?.status || '') === 'Chờ xử lý';
    const wantsToReopenFromQuotes = negotiationParam === '1' && isCustomer;
    const wantsTaskerOpenFromQuotes = negotiationParam === '1' && isTasker;
    if (!isNegotiationContextValid) {
      // Allow pre-open from Quotes while conversation/participants context is still resolving
      desired = negotiationParam === '1' && (isCustomer || isTasker) && !!quoteDetails;
    } else if (negotiationState.pending) {
      // Any pending request should show the bar for both sides
      desired = true;
    } else if (negotiationState.rej) {
      // Hide on REJ (no newer REQ)
      desired = false;
    } else if (wantsToReopenFromQuotes) {
      // Explicitly opened from Quotes by Customer, allow composing a new request even if previous ACK exists
      desired = true;
    } else if (wantsTaskerOpenFromQuotes) {
      // Tasker opened from Quotes: show the bar with hint even if not pending
      desired = true;
    } else if (negotiationState.ack) {
      // Hide on any ACK (no newer REQ) for both sides
      desired = false;
    } else if (hasPendingViaQuote && isTasker) {
      // Auto-open from backend pending only for Tasker side
      desired = true;
    } else {
      desired = false;
    }
    if (desired !== negotiationOpen) setNegotiationOpen(desired);
  }, [isNegotiationContextValid, negotiationState.pending, negotiationState.ack, negotiationState.rej, negotiationParam, negotiationOpen, quoteDetails?.status, isTasker, isCustomer]);

  useEffect(() => {
    if (isNegotiationContextValid && negotiationState.ack) {
      const price = negotiationState.ack.price;
      setAckBanner({ price });
    } else if (negotiationState.rej || !isNegotiationContextValid) {
      // Clear banner if rejected or context invalid
      setAckBanner(null);
    }
  }, [isNegotiationContextValid, negotiationState.ack, negotiationState.rej]);

  // After any ACK, hide the bar and strip negotiation=1 from URL,
  // except when Customer has just opened from Quotes to start a new negotiation (pre-REQ)
  useEffect(() => {
    if (!isNegotiationContextValid || !negotiationState.ack) return;
    const openedFromQuotesByCustomer = negotiationParam === '1' && isCustomer && !negotiationState.pending;
    if (openedFromQuotesByCustomer) return; // allow composing a new proposal despite previous ACK existing
    if (negotiationOpen) setNegotiationOpen(false);
    const params = new URLSearchParams(searchParams);
    if (params.get('negotiation') === '1') {
      params.delete('negotiation');
      if (currentConversation?.conversation_id) {
        params.set('conversationId', String(currentConversation.conversation_id));
      }
      navigate(`/chat?${params.toString()}`, { replace: true });
    }
  }, [isNegotiationContextValid, negotiationState.ack, negotiationState.pending, negotiationParam, isCustomer, negotiationOpen, currentConversation?.conversation_id, searchParams, navigate]);
  const validateNegPrice = () => {
    if (!quoteDetails) return null;
    const num = Number(negPrice);
    if (!num || num <= 0) return 'Giá không hợp lệ';
    const { price_min, price_max, specific_price } = quoteDetails;
    const min = price_min != null ? Number(price_min) : (specific_price != null ? Number(specific_price) : null);
    const max = price_max != null ? Number(price_max) : (specific_price != null ? Number(specific_price) : null);
    if (min != null && max != null) {
      if (num < min || num > max) return `Giá phải nằm trong khoảng ${currencyVND(min)} - ${currencyVND(max)}`;
    }
    return null;
  };

  const handleFinalizePrice = async () => {
    const err = validateNegPrice();
    setNegError(err);
    if (err) return;
    try {
      setNegSubmitting(true);
      const price = Number(negPrice);
      if (sessionId || isCustomer) {
        // Customer requests final price -> send negotiation request message; wait for tasker approval
        if (sessionId) {
          await sendTextMessage(`[NEG_REQ]${JSON.stringify({ sessionId: sessionId, price })}`);
        } else {
          await sendTextMessage(`[NEG_REQ]${JSON.stringify({ quoteId: quoteDetails.quote_id, price })}`);
        }
        setNegError(null);
        // Align URL to this quoteId for both sides by ensuring quoteId stays set
        // Strip negotiation flag from URL after sending REQ to prevent stale reopen and let ACK auto-hide later
        const params = new URLSearchParams(searchParams);
        if (sessionId) params.set('session', String(sessionId));
        else {
          params.set('quoteId', String(quoteDetails.quote_id));
          // Ensure no leftover session when switching to quote REQ
          if (params.get('session')) params.delete('session');
        }
        if (params.get('negotiation') === '1') params.delete('negotiation');
        if (currentConversation?.conversation_id) params.set('conversationId', String(currentConversation.conversation_id));
        navigate(`/chat?${params.toString()}`, { replace: true });
      }
    } catch (e) {
      setNegError(e.message || 'Không thể gửi yêu cầu chốt giá');
    } finally {
      setNegSubmitting(false);
    }
  };

  const handleApproveNegotiation = async () => {
    if (!negotiationState.pending || !isTasker) return;
    try {
      setNegSubmitting(true);
      const price = Number(negotiationState.pending.price);
      if (sessionId) {
        await sendTextMessage(`[NEG_ACK]${JSON.stringify({ sessionId: sessionId, price })}`);
      } else {
        const resp = await QuoteService.updateProposedPrice(quoteDetails.quote_id, price);
        if (!resp?.success) throw new Error(resp?.message || 'Không thể cập nhật báo giá');
        // Inform both sides and hide bar
        await sendTextMessage(`[NEG_ACK]${JSON.stringify({ quoteId: quoteDetails.quote_id, price })}`);
      }
      setNegotiationOpen(false);
      // Update local quote details to reflect accepted status and price
      setQuoteDetails({ ...quoteDetails, proposed_price: price, status: 'Đã chấp nhận' });
      // Always strip negotiation flag after ACK to keep bar hidden
      const params = new URLSearchParams(searchParams);
      if (params.get('negotiation') === '1') {
        params.delete('negotiation');
        if (currentConversation?.conversation_id) {
          params.set('conversationId', String(currentConversation.conversation_id));
        }
        navigate(`/chat?${params.toString()}`, { replace: true });
      }
    } catch (e) {
      setNegError(e.message || 'Không thể xác nhận chốt giá');
    } finally {
      setNegSubmitting(false);
    }
  };

  const handleRejectNegotiation = async () => {
    if (!negotiationState.pending || !isTasker) return;
    try {
      if (sessionId) {
        await sendTextMessage(`[NEG_REJ]${JSON.stringify({ sessionId: sessionId, price: negotiationState.pending.price })}`);
      } else {
        await sendTextMessage(`[NEG_REJ]${JSON.stringify({ quoteId: quoteDetails.quote_id, price: negotiationState.pending.price })}`);
      }
    } catch (_) {}
  };

  const [showConversationList, setShowConversationList] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);

  // Hide system negotiation messages from UI
  const visibleMessages = useMemo(() => {
    if (!messages) return [];
    const list = [];
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      const c = m?.content;
      if (!c || typeof c !== 'string' || (!c.startsWith('[NEG_REQ]') && !c.startsWith('[NEG_ACK]') && !c.startsWith('[NEG_REJ]'))) {
        list.push({ ...m, _origIndex: i });
      }
    }
    return list;
  }, [messages]);

  // Inject inline success pill as a synthetic message right after the ACK position
  const messagesForUI = useMemo(() => {
    if (!negotiationState.ack || !negotiationState.ackMsg || !isNegotiationContextValid) return visibleMessages;
    const insertAfterIdx = (() => {
      // find last visible message with original index <= ackIdx
      let pos = -1;
      for (let i = 0; i < visibleMessages.length; i++) {
        if (visibleMessages[i]._origIndex <= negotiationState.ackIdx) pos = i;
        else break;
      }
      return pos;
    })();
    const sysMsg = {
      message_id: `sys-ack-${quoteDetails.quote_id}-${new Date(negotiationState.ackMsg.created_at).getTime()}`,
      message_type: 'system_ack',
      created_at: negotiationState.ackMsg.created_at,
      content: '',
      system_ack: {
        price: negotiationState.ack.price,
        unit: quoteDetails?.unit || null
      }
    };
    const out = visibleMessages.slice();
    out.splice(insertAfterIdx + 1, 0, sysMsg);
    return out;
  }, [visibleMessages, negotiationState.ack, negotiationState.ackMsg, negotiationState.ackIdx, isNegotiationContextValid, quoteDetails?.quote_id, quoteDetails?.unit]);

  // Handle window resize for mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setShowConversationList(false);
      } else {
        setShowConversationList(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      conv.title?.toLowerCase().includes(query) ||
      conv.participants?.some(p => 
        p.name?.toLowerCase().includes(query) ||
        p.email?.toLowerCase().includes(query)
      )
    );
  });

  const handleSendMessage = async (content, replyToMessageId = null) => {
    try {
      await sendTextMessage(content, replyToMessageId);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleSendFile = async (file, content = '') => {
    try {
      await sendFileMessage(file, content);
    } catch (error) {
      console.error('Failed to send file:', error);
    }
  };

  const handleConversationSelect = async (conversationId, options = {}) => {
    if (!conversationId || Number.isNaN(parseInt(conversationId, 10))) return;
    try {
      // Save context for current conversation before switching
      if (currentConversation?.conversation_id) {
        negotiationContextsRef.current.set(String(currentConversation.conversation_id), {
          quoteDetails,
          negPrice,
          negotiationOpen,
          ackBanner
        });
      }
      await switchConversation(conversationId);
      // Sync URL while preserving existing params (quoteId, negotiation, etc.)
      const params = new URLSearchParams(searchParams);
  const preserve = !!options.preserveNegotiationParams || negotiationParam === '1';
      const navReplace = !!options.replace;
      // When user manually switches conversations, drop negotiation-related params to avoid leaking bar
      if (!preserve) {
        params.delete('negotiation');
        params.delete('quoteId');
        params.delete('session');
        params.delete('bookingId');
        params.delete('openFinalize');
      }
      const isSameConversation = currentConversation?.conversation_id === conversationId;
      const hasExistingQuoteId = !!searchParams.get('quoteId');
      if (!preserve) {
        if (!isSameConversation && !hasExistingQuoteId) {
          params.delete('quoteId');
        }
        // On manual navigation (not preserve), drop negotiation flag
        params.delete('negotiation');
      }
      params.set('conversationId', String(conversationId));
      // Avoid mixed contexts: if both quoteId and session exist, prefer quote and drop session
      if (params.get('quoteId') && params.get('session')) {
        params.delete('session');
      }
      // If direct chat, include peer userId so negotiation can auto-discover
      const selfId = user?.user_id || user?.userId;
      const convObj = conversations.find(c => c.conversation_id === conversationId);
      if (convObj && String(convObj.type) === 'direct' && Array.isArray(convObj.participants) && selfId) {
        const other = convObj.participants.find(p => String(p.user_id) !== String(selfId));
        if (other?.user_id && !params.get('peer')) params.set('peer', String(other.user_id));
      } else if (!preserve) {
        params.delete('peer');
      }
      navigate(`/chat?${params.toString()}`, navReplace ? { replace: true } : undefined);
      if (window.innerWidth < 768) {
        setShowConversationList(false);
      }
    } catch (error) {
      console.error('Failed to switch conversation:', error);
    }
  };

  const handleCreateConversation = async (type, participants, title = null) => {
    try {
      const conversation = await createConversation(type, participants, title);
      await switchConversation(conversation.conversation_id);
      const params = new URLSearchParams(searchParams);
      // New conversation via modal is not a negotiation entry by default
      params.delete('negotiation');
  params.delete('quoteId');
  params.delete('session');
      params.delete('bookingId');
      params.delete('openFinalize');
      params.set('conversationId', String(conversation.conversation_id));
      if (type === 'direct' && participants?.length === 1) {
        params.set('peer', String(participants[0]));
      }
      navigate(`/chat?${params.toString()}`);
      setShowNewConversationModal(false);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleBackToConversations = () => {
    setShowConversationList(true);
  };
  // On conversation change, restore saved negotiation context if exists; otherwise clear (unless URL requests negotiation)
  const prevConvIdRef = useRef(null);
  useEffect(() => {
    const currId = currentConversation?.conversation_id;
    if (!currId) return;
    if (prevConvIdRef.current === currId) return;
    prevConvIdRef.current = currId;
    const saved = negotiationContextsRef.current.get(String(currId));
    if (saved && saved.quoteDetails?.quote_id) {
      setQuoteDetails(saved.quoteDetails);
      setNegPrice(saved.negPrice || '');
      setAckBanner(saved.ackBanner || null);
      setNegError(null);
    } else if (negotiationParam !== '1') {
      // no saved context and not explicitly negotiating via URL
      setNegotiationOpen(false);
      setQuoteDetails(null);
      setNegPrice('');
      setNegError(null);
      setAckBanner(null);
    }
  }, [currentConversation?.conversation_id]);

  if (loading && conversations.length === 0) {
    return (
      <div className="chat-container">
        <div className="chat-loading">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Đang tải cuộc trò chuyện...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">

      {/* Error Display */}
      {error && (
        <div className="chat-error">
          <div className="alert alert-danger" role="alert">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </div>
        </div>
      )}

      <div className="chat-layout">
        {/* Conversation List Sidebar */}
        {showConversationList && (
          <div className="conversation-sidebar">
            <ConversationList
              conversations={filteredConversations}
              currentConversation={currentConversation}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onConversationSelect={handleConversationSelect}
              onCreateConversation={() => setShowNewConversationModal(true)}
              onRefresh={loadConversations}
              loading={loading}
            />
          </div>
        )}

        {/* Chat Window */}
        <div className="chat-main">
          {currentConversation ? (
            <div className="chat-main-inner" style={{ position: 'relative' }}>
              <div className="chat-header-sticky">
                <ChatHeader
                  conversation={currentConversation}
                  onBack={handleBackToConversations}
                  onMenuClick={() => setShowConversationList(!showConversationList)}
                  isUserOnline={isUserOnline}
                />
              </div>
              {/* Inline system message handled via ChatWindow.afterMessagesInline */}
              {/* Negotiation Bar */}
              {(((negotiationOpen && quoteDetails) || (quoteDetails && negotiationState.rej && !negotiationState.pending && !negotiationState.ack))
                || (quoteDetails && negotiationParam === '1' && (isCustomer || isTasker))) && (
                <div className="p-2 border-bottom bg-light d-flex flex-wrap align-items-center gap-2">
                  <div className="me-2">
                    <div className="small text-muted">
                      Thương lượng giá cả cho dịch vụ: <strong>{quoteDetails.variant_name}</strong>
                    </div>
                    <div className="fw-semibold">
                      Giá hiện tại: {' '}
                      <strong>
                        {quoteDetails.proposed_price != null ?
                          currencyVND(quoteDetails.proposed_price) : 'Chưa có'}
                      </strong>
                      {quoteDetails.unit ? <span> / {quoteDetails.unit}</span> : null}
                    </div>
                    <div className="small text-muted">
                      {(() => {
                        const { price_min, price_max, specific_price, unit } = quoteDetails;
                        const min = price_min != null ? Number(price_min) : (specific_price != null ? Number(specific_price) : null);
                        const max = price_max != null ? Number(price_max) : (specific_price != null ? Number(specific_price) : null);
                        if (min != null && max != null) {
                          return (
                            <>
                              Khoảng giá: <strong>{currencyVND(min)} - {currencyVND(max)}</strong>
                              {unit ? <span> / {unit}</span> : null}
                            </>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2 ms-auto">
                    {/* Customer input when not pending */}
                    {(isCustomer && negotiationParam === '1' && !negotiationState.pending) || (isCustomer && !negotiationState.pending && !negotiationState.ack) ? (
                      <>
                        <input
                          type="number"
                          className={`form-control form-control-sm ${negError ? 'is-invalid' : ''}`}
                          style={{ width: 160 }}
                          value={negPrice}
                          placeholder="Giá đề xuất..."
                          onChange={(e) => setNegPrice(e.target.value)}
                          onWheel={(e) => e.currentTarget.blur()}
                          disabled={negSubmitting}
                        />
                        <button className="btn btn-sm btn-primary" disabled={negSubmitting} onClick={handleFinalizePrice}>
                          {negSubmitting ? 'Đang gửi...' : 'Chốt giá'}
                        </button>
                      </>
                    ) : null}
                    {/* Tasker approves/rejects when pending */}
                    {negotiationState.pending && isTasker && !negotiationState.ack && (
                      <div className="d-flex align-items-center gap-2">
                        <span className="small text-muted">Yêu cầu chốt: <strong>{currencyVND(negotiationState.pending.price)}</strong></span>
                        <button className="btn btn-sm btn-success" disabled={negSubmitting} onClick={handleApproveNegotiation}>Đồng ý</button>
                        <button className="btn btn-sm btn-outline-secondary" onClick={handleRejectNegotiation}>Từ chối</button>
                      </div>
                    )}
                    {/* Customer waiting when their REQ is pending */}
                    {negotiationState.pending && isCustomer && !negotiationState.ack && (
                      <span className="badge bg-warning text-dark">Đang chờ Tasker xác nhận...</span>
                    )}
                    {/* Rejected state hints */}
                    {!negotiationState.pending && negotiationState.rej && isTasker && (
                      <span className="small text-muted">Đã từ chối đề xuất. Chờ khách hàng đề xuất lại...</span>
                    )}
                    {!negotiationState.pending && negotiationState.rej && isCustomer && (
                      <span className="badge bg-secondary">Đề xuất trước đã bị từ chối. Bạn có thể nhập giá mới.</span>
                    )}
                    {/* Optional hint for Tasker when no pending */}
                    {isTasker && !negotiationState.pending && !negotiationState.ack && !negotiationState.rej && (
                      <span className="small text-muted">Chờ khách hàng đề xuất...</span>
                    )}
                    {/* Tasker open from Quotes but not pending: keep a neutral hint so bar is visible */}
                    {negotiationParam === '1' && isTasker && !negotiationState.pending && (
                      <span className="small text-muted">Đã mở từ báo giá. Chờ khách hàng đề xuất.</span>
                    )}
                  </div>
                  {negError && <div className="invalid-feedback d-block">{negError}</div>}
                </div>
              )}
              <ChatWindow
                conversation={currentConversation}
                messages={messagesForUI}
                typingUsers={getTypingUsers()}
                sendingMessage={sendingMessage}
                hasMoreMessages={hasMoreMessages}
                onSendMessage={handleSendMessage}
                onSendFile={handleSendFile}
                onUpdateMessage={updateMessage}
                onDeleteMessage={deleteMessage}
                onMarkAsRead={markAsRead}
                onTyping={handleTyping}
                onLoadMore={loadMoreMessages}
                
                isConnected={isConnected}
              />
            </div>
          ) : (
            <div className="chat-welcome">
              <div className="welcome-content">
                <i className="fas fa-comments fa-3x text-muted mb-3"></i>
                <h3>Chào mừng đến với HomeHelper Chat</h3>
                <p>Chọn một cuộc trò chuyện để bắt đầu hoặc tạo cuộc trò chuyện mới</p>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowNewConversationModal(true)}
                >
                  <i className="fas fa-plus me-2"></i>
                  Tạo cuộc trò chuyện mới
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Conversation Modal */}
      {showNewConversationModal && (
        <NewConversationModal
          onClose={() => setShowNewConversationModal(false)}
          onCreate={handleCreateConversation}
        />
      )}
    </div>
  );
};

// New Conversation Modal Component
const NewConversationModal = ({ onClose, onCreate }) => {
  const [type, setType] = useState('direct');
  const [title, setTitle] = useState('');
  const [participants, setParticipants] = useState([]);
  const [searchUser, setSearchUser] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const { default: userService } = await import('../../services/userService');
      const results = await userService.searchUsers(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search users:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddParticipant = (user) => {
    if (!participants.find(p => p.user_id === user.user_id)) {
      setParticipants([...participants, user]);
    }
    setSearchUser('');
    setSearchResults([]);
  };

  const handleRemoveParticipant = (userId) => {
    setParticipants(participants.filter(p => p.user_id !== userId));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === 'direct' && participants.length !== 1) {
      alert('Cuộc trò chuyện trực tiếp cần chính xác 1 người tham gia');
      return;
    }
    if (type === 'group' && participants.length < 1) {
      alert('Cuộc trò chuyện nhóm cần ít nhất 1 người tham gia');
      return;
    }
    if (type === 'group' && !title.trim()) {
      alert('Vui lòng nhập tên cuộc trò chuyện nhóm');
      return;
    }

    onCreate(type, participants.map(p => p.user_id), title.trim() || null);
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Tạo cuộc trò chuyện mới</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Conversation Type */}
              <div className="mb-3">
                <label className="form-label">Loại cuộc trò chuyện</label>
                <div className="btn-group w-100" role="group">
                  <input
                    type="radio"
                    className="btn-check"
                    name="type"
                    id="type-direct"
                    value="direct"
                    checked={type === 'direct'}
                    onChange={(e) => setType(e.target.value)}
                  />
                  <label className="btn btn-outline-primary" htmlFor="type-direct">
                    Trực tiếp
                  </label>
                  <input
                    type="radio"
                    className="btn-check"
                    name="type"
                    id="type-group"
                    value="group"
                    checked={type === 'group'}
                    onChange={(e) => setType(e.target.value)}
                  />
                  <label className="btn btn-outline-primary" htmlFor="type-group">
                    Nhóm
                  </label>
                </div>
              </div>

              {/* Group Title */}
              {type === 'group' && (
                <div className="mb-3">
                  <label htmlFor="title" className="form-label">Tên cuộc trò chuyện</label>
                  <input
                    type="text"
                    className="form-control"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nhập tên cuộc trò chuyện"
                    required
                  />
                </div>
              )}

              {/* User Search */}
              <div className="mb-3">
                <label htmlFor="searchUser" className="form-label">
                  {type === 'direct' ? 'Chọn người để trò chuyện' : 'Thêm thành viên'}
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="searchUser"
                  value={searchUser}
                  onChange={(e) => {
                    setSearchUser(e.target.value);
                    handleSearchUsers(e.target.value);
                  }}
                  placeholder="Tìm kiếm người dùng..."
                />
                
                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="search-results">
                    {searchResults.map(user => (
                      <div
                        key={user.user_id}
                        className="search-result-item"
                        onClick={() => handleAddParticipant(user)}
                      >
                        <div className="user-avatar">
                          <img src={user.avatar || '/default-avatar.png'} alt={user.name} />
                        </div>
                        <div className="user-info">
                          <div className="user-name">{user.name}</div>
                          <div className="user-email">{user.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Participants */}
              {participants.length > 0 && (
                <div className="mb-3">
                  <label className="form-label">Thành viên đã chọn</label>
                  <div className="selected-participants">
                    {participants.map(participant => (
                      <div key={participant.user_id} className="participant-tag">
                        <img
                          src={participant.avatar || '/default-avatar.png'}
                          alt={participant.name}
                          className="participant-avatar"
                        />
                        <span className="participant-name">{participant.name}</span>
                        <button
                          type="button"
                          className="btn-close btn-close-white"
                          onClick={() => handleRemoveParticipant(participant.user_id)}
                        ></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={participants.length === 0}
              >
                Tạo cuộc trò chuyện
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
