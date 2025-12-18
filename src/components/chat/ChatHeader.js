import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Chat.css';

const ChatHeader = ({
  conversation,
  onBack,
  onMenuClick,
  isUserOnline,
  onAudioCall
}) => {
  const [showMembersModal, setShowMembersModal] = useState(false);
  const { user } = useAuth();
  const currentUserId = user?.user_id || user?.userId;

  const getOtherParticipant = () => {
    if (conversation.type !== 'direct') return null;
    return conversation.participants?.find(p => p.user_id !== currentUserId) || null;
  };

  const getConversationTitle = () => {
    if (conversation.title) return conversation.title;

    if (conversation.type === 'direct') {
      const other = getOtherParticipant();
      return other?.name || other?.email || 'Người dùng';
    }

    if (conversation.participants?.length > 0) {
      const names = conversation.participants
        .slice(0, 3)
        .map(p => p.name || p.email)
        .join(', ');
      return conversation.participants.length > 3
        ? `${names} và ${conversation.participants.length - 3} người khác`
        : names;
    }
    return 'Cuộc trò chuyện';
  };

  const getConversationSubtitle = () => {
    if (conversation.type === 'direct') {
      const participant = getOtherParticipant();
      const isOnline =
        isUserOnline && typeof isUserOnline === 'function'
          ? isUserOnline(participant?.user_id)
          : false;
      return isOnline ? 'Đang hoạt động' : 'Không hoạt động';
    }
    if (conversation.type === 'group') {
      const participantCount = conversation.participants?.length || 0;
      return `${participantCount} thành viên`;
    }
    return '';
  };

  const getConversationAvatar = () => {
    if (conversation.avatar) return conversation.avatar;
    return null; // fallback avatar có thể thêm sau
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <div className="chat-header">
        <div className="chat-header-content">
          {/* Back Button (Mobile) */}
          <button
            className="btn btn-link chat-back-btn d-md-none"
            onClick={onBack}
            title="Quay lại danh sách"
          >
            <i className="fas fa-arrow-left"></i>
          </button>

          {/* Menu Button (Mobile) */}
          <button
            className="btn btn-link chat-menu-btn d-md-none"
            onClick={onMenuClick}
            title="Menu"
          >
            <i className="fas fa-bars"></i>
          </button>

          {/* Avatar */}
          <div className="chat-avatar">
            {getConversationAvatar() ? (
              <img
                src={getConversationAvatar()}
                alt={getConversationTitle()}
                className="chat-avatar-img"
              />
            ) : conversation.type === 'group' ? (
              <div className="chat-avatar-group">
                <i className="fas fa-users"></i>
              </div>
            ) : (
              <div className="chat-avatar-initials">
                {getInitials(getConversationTitle())}
              </div>
            )}

            {/* Online Status for Direct Messages */}
            {conversation.type === 'direct' && (
              <div
                className={`chat-status ${
                  (() => {
                    const other = getOtherParticipant();
                    return isUserOnline && other
                      ? isUserOnline(other.user_id)
                        ? 'online'
                        : 'offline'
                      : 'offline';
                  })()
                }`}
              ></div>
            )}
          </div>

          {/* Conversation Info */}
          <div className="chat-info">
            <div className="chat-title">
              <h6 className="chat-title-text">{getConversationTitle()}</h6>
              {conversation.type === 'group' && (
                <span className="chat-type-badge">
                  <i className="fas fa-users"></i>
                </span>
              )}
            </div>
            <div className="chat-subtitle">
              <span className="chat-subtitle-text">{getConversationSubtitle()}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="chat-actions">
            <button
              className="btn btn-link chat-action-btn"
              onClick={onAudioCall}
              title="Bắt đầu cuộc gọi âm thanh"
            >
              <i className="fas fa-phone"></i>
            </button>
            {/* 
            <button
              className="btn btn-link chat-action-btn"
              onClick={() => handleCall('video')}
              title="Gọi video"
            >
              <i className="fas fa-video"></i>
            </button>
            */}
          </div>
        </div>
      </div>

      {/* Modal danh sách thành viên nhóm */}
      {showMembersModal && (
        <GroupMembersModal
          members={conversation.participants || []}
          onClose={() => setShowMembersModal(false)}
        />
      )}
    </>
  );
};

// Modal hiển thị danh sách thành viên nhóm
const GroupMembersModal = ({ members, onClose }) => {
  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Thành viên nhóm</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {members.length === 0 ? (
              <p>Không có thành viên nào.</p>
            ) : (
              <ul className="list-group">
                {members.map(member => (
                  <li key={member.user_id} className="list-group-item d-flex align-items-center">
                    <img
                      src={member.avatar || '/default-avatar.png'}
                      alt={member.name}
                      className="rounded-circle me-2"
                      style={{ width: 32, height: 32, objectFit: 'cover' }}
                    />
                    <div>
                      <div>
                        <strong>{member.name}</strong>{' '}
                        <span className="text-muted">({member.email})</span>
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.9em' }}>
                        {member.user_role ? `Vai trò: ${member.user_role}` : ''}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
