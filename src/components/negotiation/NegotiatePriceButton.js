import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConversationService from '../../services/conversationService';

export default function NegotiatePriceButton({
  peerId,
  quoteId,
  bookingId = null,
  toChatPath = '/chat',
  label = 'Thương lượng giá',
  className = 'btn btn-outline-secondary',
  size = 'sm',
  openFinalizeOnOpen = false,
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    if (loading) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (quoteId) params.set('quoteId', String(quoteId));
    if (bookingId) params.set('bookingId', String(bookingId));
    params.set('negotiation', '1');
    if (openFinalizeOnOpen && bookingId) params.set('openFinalize', '1');

    try {
      let conversationId = null;
      if (peerId) {
        // Server returns existing direct conversation if already created
        const conversation = await ConversationService.createDirectConversation(peerId);
        conversationId = conversation?.conversation_id ?? null;
      }

      if (conversationId) {
        params.set('conversationId', String(conversationId));
      } else if (peerId) {
        // Fallback: let Chat resolve by peer
        params.set('peer', String(peerId));
      }
      navigate(`${toChatPath}?${params.toString()}`);
    } catch (e) {
      // On error, fallback to peer-based navigation so Chat can resolve/create
      if (peerId) params.set('peer', String(peerId));
      navigate(`${toChatPath}?${params.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className={`${className} btn-${size}`} onClick={onClick} type="button" disabled={loading} aria-busy={loading}>
      {loading ? 'Đang mở chat…' : `💬 ${label}`}
    </button>
  );
}
