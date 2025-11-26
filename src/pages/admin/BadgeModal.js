import React from 'react';
import { badgesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function BadgeModal({ tasker, onClose }) {
  const { token } = useAuth();
  const [allBadges, setAllBadges] = React.useState([]);
  const [userBadges, setUserBadges] = React.useState([]);

  React.useEffect(() => {
    let mounted = true;
    // Load all badges via API client (returns { data })
    badgesAPI
      .list(token)
      .then((res) => {
        if (!mounted) return;
        const list = (res && res.data) || [];
        setAllBadges(list);
      })
      .catch(() => mounted && setAllBadges([]));

    // Fallback: use badges from tasker summary (no earned_at)
    const fromSummary = Array.isArray(tasker.badges) ? tasker.badges : [];
    if (mounted) setUserBadges(fromSummary);

    return () => {
      mounted = false;
    };
  }, [tasker.tasker_id, token, tasker.badges]);

  // Build earned map (badge_id -> earned_at|null)
  const earnedMap = React.useMemo(() => {
    const map = {};
    (userBadges || []).forEach((b) => {
      map[b.badge_id] = b.earned_at || null;
    });
    return map;
  }, [userBadges]);

  const earnedSet = React.useMemo(() => new Set((userBadges || []).map(b => b.badge_id)), [userBadges]);
  const totalBadges = allBadges.length;
  const earnedCount = earnedSet.size;

  // Only earned badges list (normalized shape) for rendering
  const earnedBadges = React.useMemo(() => {
    return (userBadges || []).map((b) => ({
      badge_id: b.badge_id,
      name: b.name || b.badge_name || '',
      icon_url: b.icon_url,
      earned_at: b.earned_at || null,
    }));
  }, [userBadges]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
        <div
        className="modal-dialog modal-dialog-centered"
        style={{ maxWidth: 900, width: '90%', margin: 'auto', pointerEvents: 'none' }}
        >
        <div
            style={{
            background: '#ffffff',
            padding: 20,
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            width: '100%',
            pointerEvents: 'auto', 
            }}
            onClick={e => e.stopPropagation()}
        >
          <div className="modal-header" style={{ background: '#f6f7fb', borderBottom: 0 }}>
            <div className="d-flex align-items-center gap-3 w-100">
              <div>
                <div className="fw-bold" style={{ fontSize: 20 }}>{tasker.name}</div>
                <div className="text-muted" style={{ fontSize: 15 }}>Đã đạt: <span className="fw-semibold text-primary">{earnedCount}</span> / {totalBadges} huy hiệu</div>
              </div>
              <button type="button" className="btn-close ms-auto" aria-label="Đóng" onClick={onClose} />
            </div>
          </div>
          <div className="modal-body" style={{ background: '#fff', minHeight: 120 }}>
            {earnedBadges.length === 0 ? (
              <div className="text-center text-muted py-3">Chưa đạt huy hiệu nào</div>
            ) : (
              <div className="row g-3">
                {earnedBadges.map(badge => {
                  const earned = badge.earned_at ?? earnedMap[badge.badge_id];
                  return (
                    <div key={badge.badge_id} className="col-4 d-flex flex-column align-items-center text-center">
                      <img
                        src={badge.icon_url}
                        alt={badge.name}
                        style={{ width: 72, height: 72, borderRadius: 16, background: '#fff', border: '2.5px solid #4caf50', display: 'block' }}
                      />
                      <div className="fw-semibold mt-2" style={{ fontSize: 14, textAlign: 'center' }}>{badge.name}</div>
                      {earned && (
                        <div className="text-muted small" style={{ textAlign: 'center' }}>
                          <i className="bi bi-clock me-1" />
                          {new Date(earned).toLocaleDateString('vi-VN')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}