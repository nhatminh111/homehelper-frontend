import api from './api';

/**
 * Create a free-negotiation session id from backend.
 * - If `seed` is provided, BE returns a deterministic sessionId derived from the seed.
 * - Otherwise a random URL-safe sessionId is generated.
 *
 * @param {Object} options
 * @param {string} [options.seed]         Optional deterministic seed (e.g., `${meId}-${peerId}-${postId}`)
 * @param {string} [options.prefix='sess'] Optional id prefix
 * @returns {Promise<{success: boolean, sessionId?: string, message?: string}>}
 */
export async function createSessionId({ seed, prefix = 'sess' } = {}) {
  try {
    const res = await api.post('/negotiations/session', { seed, prefix });
    return res.data;
  } catch (error) {
    console.error('Failed to create sessionId:', error);
    return { success: false, message: error.response?.data?.message || 'Không thể tạo sessionId' };
  }
}

/**
 * Helper to build a stable seed from a pair of user ids and optional context id (like postId).
 * Using sorted pair ensures both sides generate the same seed.
 */
export function buildPairSeed(meUserId, peerUserId, contextId) {
  const a = String(meUserId ?? '');
  const b = String(peerUserId ?? '');
  const pair = [a, b].sort().join('-');
  return contextId != null ? `${pair}-${contextId}` : pair;
}

export default {
  createSessionId,
  buildPairSeed,
};
