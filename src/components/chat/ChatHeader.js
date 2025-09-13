import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import './Chat.css';

const ChatHeader = ({
  conversation,
  onBack,
  onMenuClick,
  isUserOnline
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
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

  const formatLastSeen = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: vi
    });
  };

  // --- Dropdown handlers ---
  const handleDropdownToggle = () => setShowDropdown(!showDropdown);
  const handleDropdownClose = () => setShowDropdown(false);

  const handleCall = (type) => {
    console.log(`Starting ${type} call with conversation:`, conversation.conversation_id);
    handleDropdownClose();
  };

  const handleSearchMessages = () => {
    console.log('Search messages in conversation:', conversation.conversation_id);
    handleDropdownClose();
  };

  const handleViewProfile = () => {
    if (conversation.type === 'direct') {
      const other = getOtherParticipant();
      console.log('View profile:', other?.user_id);
    }
    handleDropdownClose();
  };

  const handleConversationInfo = () => {
    if (conversation.type === 'group') {
      setShowMembersModal(true);
    }
    handleDropdownClose();
  };

  const handleMuteConversation = () => {
    console.log('Mute conversation:', conversation.conversation_id);
    handleDropdownClose();
  };

  const handleArchiveConversation = () => {
    console.log('Archive conversation:', conversation.conversation_id);
    handleDropdownClose();
  };

  const handleDeleteConversation = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa cuộc trò chuyện này?')) {
      console.log('Delete conversation:', conversation.conversation_id);
    }
    handleDropdownClose();
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
              {conversation.type === 'direct' && (
                <span className="chat-last-seen">
                  {(() => {
                    const other = getOtherParticipant();
                    return !isUserOnline?.(other?.user_id)
                      ? `Hoạt động ${formatLastSeen(other?.last_seen)}`
                      : '';
                  })()}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="chat-actions">
            {/* Call Buttons */}
            <div className="chat-call-actions">
              <button
                className="btn btn-link chat-action-btn"
                onClick={() => handleCall('voice')}
                title="Gọi thoại"
              >
                <i className="fas fa-phone"></i>
              </button>
              <button
                className="btn btn-link chat-action-btn"
                onClick={() => handleCall('video')}
                title="Gọi video"
              >
                <i className="fas fa-video"></i>
              </button>
            </div>

            {/* More Actions Dropdown */}
            <div className="chat-more-actions">
              <button
                className="btn btn-link chat-action-btn"
                onClick={handleDropdownToggle}
                title="Thêm tùy chọn"
              >
                <i className="fas fa-ellipsis-v"></i>
              </button>

              {showDropdown && (
                <>
                  <div className="dropdown-backdrop" onClick={handleDropdownClose}></div>
                  <div className="dropdown-menu show chat-dropdown">
                    <button className="dropdown-item" onClick={handleSearchMessages}>
                      <i className="fas fa-search me-2"></i>
                      Tìm kiếm tin nhắn
                    </button>

                    {conversation.type === 'direct' && (
                      <button className="dropdown-item" onClick={handleViewProfile}>
                        <i className="fas fa-user me-2"></i>
                        Xem trang cá nhân
                      </button>
                    )}

                    <button className="dropdown-item" onClick={handleConversationInfo}>
                      <i className="fas fa-info-circle me-2"></i>
                      Thông tin cuộc trò chuyện
                    </button>

                    <div className="dropdown-divider"></div>

                    <button className="dropdown-item" onClick={handleMuteConversation}>
                      <i className="fas fa-bell-slash me-2"></i>
                      Tắt thông báo
                    </button>

                    <button className="dropdown-item" onClick={handleArchiveConversation}>
                      <i className="fas fa-archive me-2"></i>
                      Lưu trữ
                    </button>

                    <div className="dropdown-divider"></div>

                    <button
                      className="dropdown-item text-danger"
                      onClick={handleDeleteConversation}
                    >
                      <i className="fas fa-trash me-2"></i>
                      Xóa cuộc trò chuyện
                    </button>
                  </div>
                </>
              )}
            </div>
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
